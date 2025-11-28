import type { Context, IoTEvent } from "aws-lambda";
import { DynamoDB } from "@aws-sdk/client-dynamodb";

const dynamoDb = new DynamoDB({
  region: process.env.REGION,
});
console.log("DOWNLINK LAMBDA");
export const handler = async (event: IoTEvent<unknown>, context: Context): Promise<string> => {
  try {
    // Access environment variables
    const region = process.env.REGION;
    if (!region) {
      throw new Error("REGION environment variable is not set");
    }
    console.log(`Received event: ${JSON.stringify(event)}`);
    console.log(`Context: ${JSON.stringify(context)}`);

    return "Success";
  } catch (error) {
    console.error(`Failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    throw error;
  }
};
