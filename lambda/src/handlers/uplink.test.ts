/***************************************************************************//**
 * @file
 * @brief Jest tests for the uplink Lambda handler (pairing, state, ping, errors).
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
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import type { Device } from "../database/databaseTypes.ts";
import type { SidewalkUplinkMessage, SimulatedDeviceUplinkMessage } from "./types.ts";

const mockDevice: Device = {
  deviceId: "cl1",
  type: "mqtt",
  protocolVersion: "v1",
  smsn: "TESTSMSN",
  capabilities: [{ key: "temp", mode: "s", type: "i", display: "c", name: "Temperature" }],
  state: { temp: "20" },
  seq: 0,
  expires: 9999999999,
};

const mockSend = jest.fn<() => Promise<Record<string, unknown>>>().mockResolvedValue({});

jest.unstable_mockModule("@aws-sdk/client-iot-data-plane", () => ({
  IoTDataPlaneClient: jest.fn().mockImplementation(() => ({ send: mockSend })),
  PublishCommand: jest
    .fn()
    .mockImplementation((args: unknown) => ({ ...(args as object), _type: "publish" })),
}));

jest.unstable_mockModule("@aws-sdk/client-iot-wireless", () => ({
  IoTWirelessClient: jest.fn().mockImplementation(() => ({ send: mockSend })),
  SendDataToWirelessDeviceCommand: jest
    .fn()
    .mockImplementation((args: unknown) => ({ ...(args as object), _type: "sidewalk" })),
}));

jest.unstable_mockModule("@aws-sdk/client-apigatewaymanagementapi", () => ({
  ApiGatewayManagementApiClient: jest.fn().mockImplementation(() => ({ send: mockSend })),
  PostToConnectionCommand: jest.fn().mockImplementation((args: unknown) => args),
  GoneException: class GoneException extends Error {
    override name = "GoneException";
  },
}));

const mockGetDevice = jest.fn<(id: string) => Promise<Device | undefined>>();
const mockCreateDevice =
  jest.fn<(id: string, d: Pick<Device, "type" | "protocolVersion" | "smsn">) => Promise<Device>>();
const mockRefreshDeviceTtl = jest.fn<(id: string) => Promise<void>>();
const mockUpdateDeviceCapabilities =
  jest.fn<(id: string, caps: Device["capabilities"]) => Promise<Device>>();
const mockUpdateDeviceState =
  jest.fn<(id: string, entries: { key: string; value: string }[]) => Promise<Device>>();
const mockNextDeviceSeq = jest.fn<(id: string) => Promise<number>>().mockResolvedValue(1);

jest.unstable_mockModule("../database/device.ts", () => ({
  getDevice: mockGetDevice,
  createDevice: mockCreateDevice,
  refreshDeviceTtl: mockRefreshDeviceTtl,
  updateDeviceCapabilities: mockUpdateDeviceCapabilities,
  updateDeviceState: mockUpdateDeviceState,
  nextDeviceSeq: mockNextDeviceSeq,
}));

jest.unstable_mockModule("../database/connection.ts", () => ({
  listConnections: jest.fn<() => Promise<string[]>>().mockResolvedValue([]),
  deleteConnection: jest.fn<(id: string) => Promise<void>>().mockResolvedValue(undefined),
}));

const { handler } = await import("./uplink.ts");

/** MQTT rule: `SELECT data, clientId()` — `data` is the JSON string field (plain text). */
function mqttEvent(data: string, clientId = "cl1"): SimulatedDeviceUplinkMessage {
  return { clientId, data };
}

/**
 * Sidewalk uplink: base64(hex(utf8(payload))); see WirelessDeviceTransport.decodeMessage
 */
function sidewalkEvent(message: string, deviceId = "sw-1234"): SidewalkUplinkMessage {
  const hex = Buffer.from(message, "utf8").toString("hex");
  return {
    PayloadData: Buffer.from(hex, "utf8").toString("base64"),
    WirelessDeviceId: deviceId,
    WirelessMetadata: {
      Sidewalk: {
        CmdExStatus: "OK",
        SidewalkId: "sid-1",
        Seq: 1,
        MessageType: "DATA",
        Timestamp: "2026-03-27T00:00:00Z",
      },
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.BASE_URL = "https://example.cloudfront.net";
  process.env.FRONTEND_PASSWORD = "testpass";
  process.env.IOT_ENDPOINT = "https://iot.us-east-1.amazonaws.com";
  process.env.REGION = "us-east-1";
  process.env.DYNAMODB_TABLE = "CloudLight";
  process.env.WEBSOCKET_ENDPOINT = "https://ws.execute-api.us-east-1.amazonaws.com/prod";
});

describe("uplink handler", () => {
  describe("pairing (MQTT)", () => {
    it("creates device and sends downlink url + ready", async () => {
      mockCreateDevice.mockResolvedValueOnce({
        deviceId: "cl1",
        type: "mqtt",
        protocolVersion: "v1",
        smsn: "TESTSMSN",
        capabilities: [],
        state: {},
        seq: 0,
        expires: 9999999999,
      });

      const result = await handler(mqttEvent("$v1+cloud_light#TESTSMSN"));

      expect(result).toBe("Success");
      expect(mockCreateDevice).toHaveBeenCalledWith(
        "cl1",
        expect.objectContaining({
          type: "mqtt",
          protocolVersion: "v1",
          smsn: "TESTSMSN",
        }),
      );
      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe("pairing (Sidewalk)", () => {
    it("decodes base64 and creates device", async () => {
      mockCreateDevice.mockResolvedValueOnce({
        deviceId: "sw-1234",
        type: "sidewalk",
        protocolVersion: "v1",
        smsn: "SW_SMSN",
        capabilities: [],
        state: {},
        seq: 0,
        expires: 9999999999,
      });

      const result = await handler(sidewalkEvent("$v1+cloud_light#SW_SMSN"));

      expect(result).toBe("Success");
      expect(mockCreateDevice).toHaveBeenCalledWith(
        "sw-1234",
        expect.objectContaining({
          type: "sidewalk",
          protocolVersion: "v1",
          smsn: "SW_SMSN",
        }),
      );
      expect(mockNextDeviceSeq).toHaveBeenCalledWith("sw-1234");
    });
  });

  describe("capability", () => {
    it("updates device capabilities and broadcasts", async () => {
      mockGetDevice.mockResolvedValueOnce(mockDevice);
      mockRefreshDeviceTtl.mockResolvedValueOnce(undefined);
      mockUpdateDeviceCapabilities.mockResolvedValueOnce(mockDevice);

      const result = await handler(mqttEvent("|temp+sic+Temperature"));

      expect(result).toBe("Success");
      expect(mockUpdateDeviceCapabilities).toHaveBeenCalledWith("cl1", [
        { key: "temp", mode: "s", type: "i", display: "c", name: "Temperature" },
      ]);
    });

    it("stores only incoming capabilities (merge handled by DynamoDB map)", async () => {
      const withButton: Device = {
        ...mockDevice,
        capabilities: [{ key: "button", mode: "s", type: "b", display: "v", name: "Button" }],
      };
      const afterUpdate: Device = {
        ...mockDevice,
        capabilities: [
          { key: "button", mode: "s", type: "b", display: "v", name: "Button" },
          { key: "led0", mode: "a", type: "b", display: "v", name: "WSTK LED" },
        ],
      };
      mockGetDevice.mockResolvedValueOnce(withButton);
      mockUpdateDeviceCapabilities.mockResolvedValueOnce(afterUpdate);

      const result = await handler(mqttEvent("|led0+abv+WSTK LED"));

      expect(result).toBe("Success");
      expect(mockUpdateDeviceCapabilities).toHaveBeenCalledWith("cl1", [
        { key: "led0", mode: "a", type: "b", display: "v", name: "WSTK LED" },
      ]);
    });
  });

  describe("state", () => {
    it("updates state for registered capability keys only", async () => {
      mockGetDevice.mockResolvedValueOnce(mockDevice);
      mockRefreshDeviceTtl.mockResolvedValueOnce(undefined);
      mockUpdateDeviceState.mockResolvedValueOnce({ ...mockDevice, state: { temp: "23" } });

      const result = await handler(mqttEvent(":temp=23:unknown=99"));

      expect(result).toBe("Success");
      expect(mockUpdateDeviceState).toHaveBeenCalledWith("cl1", [{ key: "temp", value: "23" }]);
    });

    it("skips state update when no keys match capabilities", async () => {
      mockGetDevice.mockResolvedValueOnce(mockDevice);
      mockRefreshDeviceTtl.mockResolvedValueOnce(undefined);

      const result = await handler(mqttEvent(":nope=1"));

      expect(result).toBe("Success");
      expect(mockUpdateDeviceState).not.toHaveBeenCalled();
    });
  });

  describe("ping", () => {
    it("sends pong downlink and refreshes device TTL", async () => {
      mockGetDevice.mockResolvedValueOnce(mockDevice);
      mockRefreshDeviceTtl.mockResolvedValueOnce(undefined);

      const result = await handler(mqttEvent("!ping=1711500000000"));

      expect(result).toBe("Success");
      expect(mockRefreshDeviceTtl).toHaveBeenCalledWith("cl1");
      expect(mockUpdateDeviceState).not.toHaveBeenCalled();
      expect(mockUpdateDeviceCapabilities).not.toHaveBeenCalled();
    });
  });

  describe("tonk", () => {
    it("broadcasts tonk and refreshes TTL without state/capability updates", async () => {
      mockGetDevice.mockResolvedValueOnce(mockDevice);
      mockRefreshDeviceTtl.mockResolvedValueOnce(undefined);

      const result = await handler(mqttEvent("!tonk=1711500000000"));

      expect(result).toBe("Success");
      expect(mockRefreshDeviceTtl).toHaveBeenCalledWith("cl1");
      expect(mockUpdateDeviceState).not.toHaveBeenCalled();
      expect(mockCreateDevice).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("returns gracefully for empty message", async () => {
      const result = await handler(mqttEvent(""));
      expect(result).toBe("Empty message");
      expect(mockGetDevice).not.toHaveBeenCalled();
    });

    it("returns gracefully for whitespace-only message", async () => {
      const result = await handler(mqttEvent("   "));
      expect(result).toBe("Empty message");
    });

    it("logs and returns for unknown verb", async () => {
      mockGetDevice.mockResolvedValueOnce(mockDevice);
      mockRefreshDeviceTtl.mockResolvedValueOnce(undefined);

      const result = await handler(mqttEvent("hello"));

      expect(result).toBe("Success");
    });

    it("skips non-pairing message from unknown device", async () => {
      mockGetDevice.mockResolvedValueOnce(undefined);

      const result = await handler(mqttEvent(":temp=23"));

      expect(result).toBe("Unknown device");
      expect(mockUpdateDeviceState).not.toHaveBeenCalled();
    });

    it("propagates DB errors for IoT rule retry", async () => {
      mockGetDevice.mockRejectedValueOnce(new Error("DynamoDB timeout"));

      await expect(handler(mqttEvent(":temp=23"))).rejects.toThrow("DynamoDB timeout");
    });
  });
});
