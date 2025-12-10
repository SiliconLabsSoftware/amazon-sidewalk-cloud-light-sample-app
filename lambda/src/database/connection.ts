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
