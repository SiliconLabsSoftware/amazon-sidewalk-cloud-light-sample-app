const REST_URL = import.meta.env.VITE_REST_URL as string;

/* Types */

import type { Device } from "./apiTypes.ts";

interface HttpDevicesResponse {
  devices: Device[];
}

interface HttpApiError {
  error: string;
}

/* Helpers */

function makeHeaders(password: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${password}`,
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = (await response.json()) as HttpApiError;
    throw new Error(errorData.error || `HTTP error: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

/* API Functions */

/**
 * Fetch all devices from the backend
 * @param password - The authorization password
 * @returns Promise resolving to an array of devices
 */
export async function getDevices(password: string): Promise<Device[]> {
  const response = await fetch(`${REST_URL}/devices`, {
    method: "GET",
    headers: makeHeaders(password),
  });

  const data = await handleResponse<HttpDevicesResponse>(response);
  return data.devices;
}

/**
 * Fetch a single device by ID
 * @param password - The authorization password
 * @param deviceId - The ID of the device to fetch
 * @returns Promise resolving to the device data
 */
export async function getDevice(password: string, deviceId: string): Promise<Device> {
  const response = await fetch(`${REST_URL}/devices/${encodeURIComponent(deviceId)}`, {
    method: "GET",
    headers: makeHeaders(password),
  });

  return handleResponse<Device>(response);
}

export class HttpApi {
  private password: string;

  constructor(password: string) {
    this.password = password;
  }

  /**
   * Fetch all devices
   */
  async getDevices(): Promise<Device[]> {
    return getDevices(this.password);
  }

  /**
   * Fetch a single device by ID
   */
  async getDevice(deviceId: string): Promise<Device> {
    return getDevice(this.password, deviceId);
  }
}

/**
 * Create an HTTP API instance with stored password
 */
export function createHttpApi(password: string): HttpApi {
  return new HttpApi(password);
}
