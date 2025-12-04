import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from "aws-lambda";

export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
): Promise<APIGatewayProxyResultV2> => {
  console.log(
    "HTTP handler event: ",
    JSON.stringify(event, null, 2),
    JSON.stringify(context, null, 2),
  );
  try {
    const region = process.env.REGION;
    if (!region) {
      throw new Error("REGION environment variable is not set");
    }
    return { statusCode: 200, body: JSON.stringify({ message: "Success" }) };
  } catch (error) {
    console.error(`Failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
  }
};
