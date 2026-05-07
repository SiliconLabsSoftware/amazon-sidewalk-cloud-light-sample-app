/***************************************************************************//**
 * @file
 * @brief HTTP API Lambda handler for authenticated GET /devices routes and CORS.
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
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { getDevice, listDevices } from "../database/device.ts";
import { validatePassword } from "../lib/auth.ts";

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

const handleGetDevices: RouteHandler = async (event) => {
  if (!validatePassword(event.headers.authorization)) {
    console.log("[http] ✗ GET /devices — unauthorized request");
    return jsonResponse(401, { error: "Unauthorized" });
  }

  console.log("[http] Fetching all devices from DynamoDB");
  const devices = await listDevices();
  console.log(`[http] → Returning ${devices.length} device(s)`);
  return jsonResponse(200, { devices });
};

const handleGetDevice = async (
  event: APIGatewayProxyEventV2,
  deviceId: string,
): Promise<APIGatewayProxyResultV2> => {
  if (!validatePassword(event.headers.authorization)) {
    console.log(`[http] ✗ GET /devices/${deviceId} — unauthorized request`);
    return jsonResponse(401, { error: "Unauthorized" });
  }

  console.log(`[http] Fetching device ${deviceId} from DynamoDB`);
  const device = await getDevice(deviceId);
  if (!device) {
    console.log(`[http] ✗ Device not found: ${deviceId}`);
    return jsonResponse(404, { error: "Device not found" });
  }
  console.log(`[http] → Returning device ${deviceId}`);
  return jsonResponse(200, device);
};

const handleOptions: RouteHandler = async () => ({
  statusCode: 204,
  headers: corsHeaders,
  body: "",
});

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const method = event.requestContext.http.method;
  const stage = event.requestContext.stage;
  const path = event.rawPath.replace(`/${stage}`, "");

  console.log(`[http] ← ${method} ${path}`, JSON.stringify(event, null, 2));

  try {
    if (method === "OPTIONS") {
      console.log("[http] Handling CORS preflight");
      return handleOptions(event);
    }

    if (method === "GET" && (path === "/devices" || path === "/devices/")) {
      return handleGetDevices(event);
    }

    const deviceMatch = path.match(/^\/devices\/([^/]+)$/);
    if (method === "GET" && deviceMatch) {
      return handleGetDevice(event, deviceMatch[1]);
    }

    console.log(`[http] ✗ No matching route for ${method} ${path}`);
    return jsonResponse(404, { error: "Not found" });
  } catch (error) {
    console.error("[http] ✗ Unhandled error:", error);
    return jsonResponse(500, { error: "Internal server error" });
  }
};
