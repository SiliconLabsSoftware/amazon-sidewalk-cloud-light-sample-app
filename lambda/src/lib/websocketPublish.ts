/***************************************************************************//**
 * @file
 * @brief Posts WebSocket messages to API Gateway connections and prunes stale IDs.
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
