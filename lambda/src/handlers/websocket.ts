import type {
  APIGatewayProxyWebsocketEventV2,
  APIGatewayProxyEventHeaders,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { createConnection, deleteConnection } from "../database/connection.ts";
import { validatePassword } from "../lib/auth.ts";

// Extended type for $connect event which includes headers
interface WebSocketConnectEvent extends APIGatewayProxyWebsocketEventV2 {
  headers?: APIGatewayProxyEventHeaders;
}

const handleConnect = async (event: WebSocketConnectEvent): Promise<APIGatewayProxyResultV2> => {
  const connectionId = event.requestContext.connectionId;

  if (!validatePassword(event.headers?.authorization || event.headers?.Authorization)) {
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

  // TODO: Parse message and handle commands (e.g., send downlink to device)

  return { statusCode: 200, body: "Message received" };
};

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
