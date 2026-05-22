/***************************************************************************//**
 * @file
 * @brief DynamoDB helpers to create, delete, and list WebSocket connections.
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
import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import client from "./client.ts";
import { newExpiresTimestamp } from "./utils.ts";

const CONNECTIONS_PK = "connections";

export const createConnection = async (connectionId: string): Promise<void> => {
  const command = new PutCommand({
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      PK: CONNECTIONS_PK,
      SK: connectionId,
      expires: newExpiresTimestamp(),
    },
  });
  await client.send(command);
};

export const deleteConnection = async (connectionId: string): Promise<void> => {
  const command = new DeleteCommand({
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: CONNECTIONS_PK,
      SK: connectionId,
    },
  });
  await client.send(command);
};

export const listConnections = async (): Promise<string[]> => {
  const command = new QueryCommand({
    TableName: process.env.DYNAMODB_TABLE,
    KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: {
      ":pk": CONNECTIONS_PK,
    },
  });
  const response = await client.send(command);
  return (response.Items || []).map((item) => item.SK as string);
};
