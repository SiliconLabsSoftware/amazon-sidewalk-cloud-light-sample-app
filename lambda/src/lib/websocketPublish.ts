import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
  GoneException,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { listConnections, deleteConnection } from "../database/connection.ts";
import type { WsMessage } from "./websocketTypes.ts";

const apiClient = new ApiGatewayManagementApiClient({
  region: process.env.REGION,
  endpoint: process.env.WEBSOCKET_ENDPOINT,
});

export const broadcastToClients = async (message: WsMessage): Promise<void> => {
  const connections = await listConnections();
  console.log(
    `[ws-publish] Broadcasting "${message.type}" to ${connections.length} connected client(s)`,
  );
  const sendPromises = connections.map(async (connectionId) => {
    try {
      await sendToClient(connectionId, message);
    } catch (error) {
      if (error instanceof GoneException) {
        console.log(`[ws-publish] Removing stale connection: ${connectionId}`);
        await deleteConnection(connectionId);
      } else {
        console.error(`[ws-publish] ✗ Failed to send to connection ${connectionId}:`, error);
      }
    }
  });
  await Promise.all(sendPromises);
};

export const sendToClient = async (connectionId: string, message: WsMessage): Promise<void> => {
  console.log(`[ws-publish] → Sending "${message.type}" to client ${connectionId}`);
  const command = new PostToConnectionCommand({
    ConnectionId: connectionId,
    Data: JSON.stringify(message),
  });
  await apiClient.send(command);
};
