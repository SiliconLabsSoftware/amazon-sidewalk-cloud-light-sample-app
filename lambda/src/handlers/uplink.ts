import type { Context, IoTEvent } from "aws-lambda";

export const handler = async (event: IoTEvent<unknown>, context: Context): Promise<string> => {
  console.log(
    "Uplink handler event: ",
    JSON.stringify(event, null, 2),
    JSON.stringify(context, null, 2),
  );
  try {
    // Access environment variables
    const region = process.env.REGION;
    if (!region) {
      throw new Error("REGION environment variable is not set");
    }
    return "Success";
  } catch (error) {
    console.error(`Failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    throw error;
  }
};
