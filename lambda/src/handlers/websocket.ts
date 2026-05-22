/***************************************************************************//**
 * @file
 * @brief WebSocket API Lambda: auth on connect, persistence, set_state and tink from clients.
 *******************************************************************************
 * # License
 * <b>Copyright 2026 Silicon Laboratories Inc. www.silabs.com</b>
 *******************************************************************************
 *
 * SPDX-License-Identifier: Zlib
 *
 * The licensor of this software is Silicon Laboratories Inc.
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 * 1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be
 *    misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
 *
 ******************************************************************************/
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
import type {
  WsMessage,
  WsDeviceUpdateMessage,
  WsErrorMessage,
  WsReportEventMessage,
} from "../lib/websocketTypes.ts";
import { broadcastToClients, sendToClient } from "../lib/websocketPublish.ts";

// Extended type for $connect event which includes headers
interface WebSocketConnectEvent extends APIGatewayProxyWebsocketEventV2 {
  headers?: APIGatewayProxyEventHeaders;
  queryStringParameters?: APIGatewayProxyEventQueryStringParameters;
}

export const handler = async (
  event: APIGatewayProxyWebsocketEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const routeKey = event.requestContext.routeKey;
  console.log(
    `[websocket] ← Received WebSocket event (route=${routeKey}):`,
    JSON.stringify(event, null, 2),
  );

  try {
    switch (routeKey) {
      case "$connect":
        return await handleConnect(event);
      case "$disconnect":
        return await handleDisconnect(event);
      case "$default":
        return await handleDefault(event);
      default:
        console.log(`[websocket] ✗ Unknown route: ${routeKey}`);
        return { statusCode: 400, body: "Unknown route" };
    }
  } catch (error) {
    console.error(`[websocket] ✗ Error handling ${routeKey}:`, error);
    return { statusCode: 500, body: "Internal server error" };
  }
};

const handleConnect = async (event: WebSocketConnectEvent): Promise<APIGatewayProxyResultV2> => {
  const connectionId = event.requestContext.connectionId;
  console.log(`[websocket/connect] New connection attempt: ${connectionId}`);

  if (
    !validatePassword(
      event.queryStringParameters?.authorization ||
        event.queryStringParameters?.Authorization ||
        event.headers?.authorization ||
        event.headers?.Authorization,
    )
  ) {
    console.log(`[websocket/connect] ✗ Connection rejected — invalid password`);
    return { statusCode: 401, body: "Unauthorized" };
  }

  await createConnection(connectionId);
  console.log(`[websocket/connect] ✓ Connection established and saved: ${connectionId}`);

  return { statusCode: 200, body: "Connected" };
};

const handleDisconnect = async (
  event: APIGatewayProxyWebsocketEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const connectionId = event.requestContext.connectionId;
  console.log(`[websocket/disconnect] Client disconnected: ${connectionId}`);

  await deleteConnection(connectionId);
  console.log(`[websocket/disconnect] Connection removed from DynamoDB: ${connectionId}`);

  return { statusCode: 200, body: "Disconnected" };
};

const handleDefault = async (
  event: APIGatewayProxyWebsocketEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const connectionId = event.requestContext.connectionId;
  console.log(`[websocket/message] ← Received message from client ${connectionId}: ${event.body}`);

  let message: WsMessage;
  try {
    message = JSON.parse(event.body ?? "");
  } catch {
    console.log(`[websocket/message] ✗ Failed to parse JSON from client ${connectionId}`);
    await sendError(connectionId, "Invalid JSON");
    return { statusCode: 400, body: "Invalid JSON" };
  }

  console.log(`[websocket/message] Parsed client command: type="${message.type}"`);

  try {
    switch (message.type) {
      case "set_state":
        console.log(
          `[websocket/message] Processing set_state for device ${message.deviceId}:`,
          JSON.stringify(message.entries),
        );
        await handleSetState(connectionId, message.deviceId, message.entries);
        break;
      case "tink":
        console.log(`[websocket/message] Processing tink for device ${message.deviceId}`);
        await handleTink(connectionId, message.deviceId, message.timestamp);
        break;
      case "keepalive":
        // No-op: receiving the message is enough to keep the connection alive.
        break;
      default:
        console.log(
          `[websocket/message] ✗ Unknown message type: ${(message as { type: string }).type}`,
        );
        await sendError(
          connectionId,
          `Unknown inbound message type: ${(message as { type: string }).type}`,
        );
        return { statusCode: 400, body: "Unknown message type" };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[websocket/message] ✗ Error handling ${message.type}:`, error);
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
    console.log(`[websocket/set_state] ✗ Device not found: ${deviceId}`);
    await sendError(connectionId, `Device not found: ${deviceId}`);
    return;
  }

  const actuatorKeys = new Set(device.capabilities.filter((c) => c.mode === "a").map((c) => c.key));
  const filtered = entries.filter((e) => actuatorKeys.has(e.key));

  if (filtered.length === 0) {
    console.log(`[websocket/set_state] ✗ No valid actuator keys in entries for device ${deviceId}`);
    await sendError(connectionId, "No valid actuator keys in entries");
    return;
  }

  const stateMsg = new StateMessage({ entries: filtered });
  const transport = transportForDevice(device.type);
  console.log(
    `[websocket/set_state] → Sending state command to device ${deviceId} via ${device.type}:`,
    JSON.stringify(filtered),
  );
  await transport.sendPacket(deviceId, stateMsg);

  console.log(`[websocket/set_state] Updating state in DynamoDB for device ${deviceId}`);
  const updated = await updateDeviceState(deviceId, filtered);
  console.log(`[websocket/set_state] → Broadcasting device_update to all WebSocket clients`);
  const wsMessage: WsDeviceUpdateMessage = {
    type: "device_update",
    device: updated,
    event: "downlink",
  };
  await broadcastToClients(wsMessage);
}

async function handleTink(
  connectionId: string,
  deviceId: string,
  timestamp: string,
): Promise<void> {
  const device = await getDevice(deviceId);
  if (!device) {
    console.log(`[websocket/tink] ✗ Device not found: ${deviceId}`);
    await sendError(connectionId, `Device not found: ${deviceId}`);
    return;
  }

  const tinkMsg = new TinkMessage({ timestamp });
  const transport = transportForDevice(device.type);
  console.log(
    `[websocket/tink] → Sending tink command to device ${deviceId} via ${device.type} (timestamp=${timestamp})`,
  );
  await transport.sendPacket(deviceId, tinkMsg);

  console.log(`[websocket/tink] → Broadcasting report_event to all WebSocket clients`);
  const reportEvent: WsReportEventMessage = {
    type: "report_event",
    deviceId,
    direction: "downlink",
  };
  await broadcastToClients(reportEvent);
}

async function sendError(connectionId: string, message: string): Promise<void> {
  console.log(`[websocket] → Sending error to client ${connectionId}: "${message}"`);
  const errorMsg: WsErrorMessage = { type: "error", message };
  try {
    await sendToClient(connectionId, errorMsg);
  } catch (error) {
    console.error(`[websocket] ✗ Failed to send error to ${connectionId}:`, error);
  }
}
