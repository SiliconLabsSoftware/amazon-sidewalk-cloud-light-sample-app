import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { getDevice, listDevices } from "../database/device.ts";

type RouteHandler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
};

const jsonResponse = (statusCode: number, body: object): APIGatewayProxyResultV2 => ({
  statusCode,
  headers: { "Content-Type": "application/json", ...corsHeaders },
  body: JSON.stringify(body),
});

const validatePassword = (authHeader: string | undefined): boolean => {
  if (!authHeader) return false;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  return match[1] === process.env.FRONTEND_PASSWORD;
};

const handleGetDevices: RouteHandler = async (event) => {
  if (!validatePassword(event.headers.authorization)) {
    return jsonResponse(401, { error: "Unauthorized" });
  }

  const devices = await listDevices();
  return jsonResponse(200, { devices });
};

const handleGetDevice = async (
  event: APIGatewayProxyEventV2,
  deviceId: string,
): Promise<APIGatewayProxyResultV2> => {
  if (!validatePassword(event.headers.authorization)) {
    return jsonResponse(401, { error: "Unauthorized" });
  }

  const device = await getDevice(deviceId);
  if (!device) {
    return jsonResponse(404, { error: "Device not found" });
  }

  return jsonResponse(200, { deviceId, ...device });
};

const handleOptions: RouteHandler = async () => ({
  statusCode: 204,
  headers: corsHeaders,
  body: "",
});

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  console.log("HTTP event: ", JSON.stringify(event, null, 2));

  const method = event.requestContext.http.method;
  const stage = event.requestContext.stage;
  const path = event.rawPath.replace(`/${stage}`, "");

  try {
    // Handle CORS preflight
    if (method === "OPTIONS") {
      return handleOptions(event);
    }

    // GET /devices - List all devices
    if (method === "GET" && (path === "/devices" || path === "/devices/")) {
      return handleGetDevices(event);
    }

    // GET /devices/{deviceId} - Get specific device
    const deviceMatch = path.match(/^\/devices\/([^/]+)$/);
    if (method === "GET" && deviceMatch) {
      return handleGetDevice(event, deviceMatch[1]);
    }

    return jsonResponse(404, { error: "Not found" });
  } catch (error) {
    console.error(error);
    return jsonResponse(500, { error: "Internal server error" });
  }
};
