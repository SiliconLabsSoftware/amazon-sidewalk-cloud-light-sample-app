const REST_URL = import.meta.env.VITE_REST_URL as string;

/* Types */

export interface Device {
  deviceId: string;
  type: "sidewalk" | "mqtt";
  capabilities: string[];
  seq: number;
  expires: number;
}

export interface DevicesResponse {
  devices: Device[];
}

export interface DeviceResponse extends Device {}

export interface ApiError {
  error: string;
}

/* Helpers */

function getAuthHeader(password: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${password}`,
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = (await response.json()) as ApiError;
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
    headers: getAuthHeader(password),
  });

  const data = await handleResponse<DevicesResponse>(response);
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
    headers: getAuthHeader(password),
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
