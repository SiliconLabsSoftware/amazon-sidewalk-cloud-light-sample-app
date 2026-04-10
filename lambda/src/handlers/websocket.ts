import type {
  APIGatewayProxyWebsocketEventV2,
  APIGatewayProxyEventHeaders,
  APIGatewayProxyResultV2,
  APIGatewayProxyEventQueryStringParameters,
} from "aws-lambda";
import { createConnection, deleteConnection } from "../database/connection.ts";
import { getDevice, updateDeviceState } from "../database/device.ts";
import { validatePassword } from "../lib/auth.ts";
import { StateMessage, TinkMessage } from "../lib/deviceProtocolBuilder.ts";
import { transportForDevice } from "../lib/deviceTransport.ts";
import type { WsMessage, WsDeviceUpdateMessage, WsErrorMessage } from "../lib/websocketTypes.ts";
import { broadcastToClients, sendToClient } from "../lib/websocketPublish.ts";

// Extended type for $connect event which includes headers
interface WebSocketConnectEvent extends APIGatewayProxyWebsocketEventV2 {
  headers?: APIGatewayProxyEventHeaders;
  queryStringParameters?: APIGatewayProxyEventQueryStringParameters;
}

export const handler = async (
  event: APIGatewayProxyWebsocketEventV2,
): Promise<APIGatewayProxyResultV2> => {
  console.log("WebSocket event:", JSON.stringify(event, null, 2));

  const routeKey = event.requestContext.routeKey;

  try {
    switch (routeKey) {
      case "$connect":
        return await handleConnect(event);
      case "$disconnect":
        return await handleDisconnect(event);
      case "$default":
        return await handleDefault(event);
      default:
        console.log(`Unknown route: ${routeKey}`);
        return { statusCode: 400, body: "Unknown route" };
    }
  } catch (error) {
    console.error(`Error handling ${routeKey}:`, error);
    return { statusCode: 500, body: "Internal server error" };
  }
};

const handleConnect = async (event: WebSocketConnectEvent): Promise<APIGatewayProxyResultV2> => {
  const connectionId = event.requestContext.connectionId;

  if (
    !validatePassword(
      event.queryStringParameters?.authorization ||
        event.queryStringParameters?.Authorization ||
        event.headers?.authorization ||
        event.headers?.Authorization,
    )
  ) {
    console.log(`Connection rejected - invalid password`);
    return { statusCode: 401, body: "Unauthorized" };
  }

  await createConnection(connectionId);
  console.log(`Connection established: ${connectionId}`);

  return { statusCode: 200, body: "Connected" };
};

const handleDisconnect = async (
  event: APIGatewayProxyWebsocketEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const connectionId = event.requestContext.connectionId;

  await deleteConnection(connectionId);
  console.log(`Connection closed: ${connectionId}`);

  return { statusCode: 200, body: "Disconnected" };
};

const handleDefault = async (
  event: APIGatewayProxyWebsocketEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const connectionId = event.requestContext.connectionId;
  console.log(`Message from ${connectionId}: ${event.body}`);

  let message: WsMessage;
  try {
    message = JSON.parse(event.body ?? "");
  } catch {
    await sendError(connectionId, "Invalid JSON");
    return { statusCode: 400, body: "Invalid JSON" };
  }

  try {
    switch (message.type) {
      case "set_state":
        await handleSetState(connectionId, message.deviceId, message.entries);
        break;
      case "tink":
        await handleTink(connectionId, message.deviceId);
        break;
      default:
        await sendError(
          connectionId,
          `Unknown inbound message type: ${(message as { type: string }).type}`,
        );
        return { statusCode: 400, body: "Unknown message type" };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Error handling ${message.type}:`, error);
    await sendError(connectionId, errorMessage);
    return { statusCode: 500, body: "Error processing command" };
  }

  return { statusCode: 200, body: "OK" };
};

async function handleSetState(
  connectionId: string,
  deviceId: string,
  entries: { key: string; value: string }[],
): Promise<void> {
  const device = await getDevice(deviceId);
  if (!device) {
    await sendError(connectionId, `Device not found: ${deviceId}`);
    return;
  }

  const actuatorKeys = new Set(device.capabilities.filter((c) => c.mode === "a").map((c) => c.key));
  const filtered = entries.filter((e) => actuatorKeys.has(e.key));

  if (filtered.length === 0) {
    await sendError(connectionId, "No valid actuator keys in entries");
    return;
  }

  const stateMsg = new StateMessage({ entries: filtered });
  const transport = transportForDevice(device.type);
  await transport.sendPacket(deviceId, stateMsg.toString());

  const updated = await updateDeviceState(deviceId, filtered);
  const wsMessage: WsDeviceUpdateMessage = { type: "device_update", device: updated };
  await broadcastToClients(wsMessage);
}

async function handleTink(connectionId: string, deviceId: string): Promise<void> {
  const device = await getDevice(deviceId);
  if (!device) {
    await sendError(connectionId, `Device not found: ${deviceId}`);
    return;
  }

  const tinkMsg = new TinkMessage({ timestamp: String(Date.now()) });
  const transport = transportForDevice(device.type);
  await transport.sendPacket(deviceId, tinkMsg.toString());
}

async function sendError(connectionId: string, message: string): Promise<void> {
  const errorMsg: WsErrorMessage = { type: "error", message };
  try {
    await sendToClient(connectionId, errorMsg);
  } catch (error) {
    console.error(`Failed to send error to ${connectionId}:`, error);
  }
}
