/***************************************************************************//**
 * @file
 * @brief DynamoDB helpers to create, delete, and list WebSocket connections.
 *******************************************************************************
 * # License
 * <b>Copyright 2026 Silicon Laboratories Inc. www.silabs.com</b>
 *******************************************************************************
 *
 * SPDX-License-Identifier: LicenseRef-MSLA
 *
 * The licensor of this software is Silicon Laboratories Inc. Your use of this
 * software is governed by the terms of the Silicon Labs Master Software License
 * Agreement (MSLA) available at
 * www.silabs.com/about-us/legal/master-software-license-agreement
 * By installing, copying or otherwise using this software, you agree to the
 * terms of the MSLA.
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
