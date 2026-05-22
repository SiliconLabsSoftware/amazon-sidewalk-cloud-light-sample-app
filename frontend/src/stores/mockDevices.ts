/***************************************************************************//**
 * @file
 * @brief Static mock Device fixtures for local UI development.
 *******************************************************************************
 * # License
 * <b>Copyright 2026 Silicon Laboratories Inc. www.silabs.com</b>
 *******************************************************************************
 *
 * SPDX-License-Identifier: Zlib
 *
 * The licensor of this software is Silicon Laboratories Inc.
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 * 1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be
 *    misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
 *
 ******************************************************************************/
import type { Device } from "@/api/apiTypes.ts";

const mockDevices: Device[] = [
  {
    type: "mqtt",
    protocolVersion: "1.0",
    state: {
      temperature: "22.5",
      humidity: "45",
      led0: "false",
      message: "Hello, from device!",
      integerActuator: "10",
      button0: "true",
      displayText: "Hey there",
    },
    seq: 0,
    deviceId: "dev-001",
    expires: Date.now() + 3600_000,
    capabilities: [
      {
        key: "temperature",
        mode: "s",
        type: "f",
        display: "c",
        name: "Temperature",
      },
      {
        key: "displayText",
        mode: "a",
        type: "t",
        display: "v",
        name: "Display Text",
      },
      {
        key: "integerActuator",
        mode: "a",
        type: "i",
        display: "v",
        name: "Integer Actuator",
      },
      {
        key: "humidity",
        mode: "s",
        type: "i",
        display: "v",
        name: "Humidity",
      },
      {
        key: "message",
        mode: "s",
        type: "t",
        display: "v",
        name: "Message",
      },
      {
        key: "message2",
        mode: "s",
        type: "t",
        display: "v",
        name: "Message 2",
      },
      {
        key: "button0",
        mode: "s",
        type: "b",
        display: "v",
        name: "Button 0",
      },
      {
        key: "led0",
        mode: "a",
        type: "b",
        display: "v",
        name: "LED 0",
      },
    ],
  },
  {
    type: "sidewalk",
    protocolVersion: "1.0",
    smsn: "SMSN-002",
    state: {
      button: "true",
      counter: "3",
      displayText: "Hello",
    },
    seq: 42,
    deviceId: "dev-002",
    expires: Date.now() + 7200_000,
    capabilities: [
      {
        key: "button",
        mode: "s",
        type: "b",
        display: "v",
        name: "Button",
      },
      {
        key: "counter",
        mode: "s",
        type: "i",
        display: "c",
        name: "Press Counter",
      },
      {
        key: "displayText",
        mode: "a",
        type: "t",
        display: "v",
        name: "Display Text",
      },
    ],
  },
  {
    type: "mqtt",
    protocolVersion: "1.0",
    state: {
      pressure: "1013.2",
      led0: "true",
      led1: "false",
    },
    seq: 0,
    deviceId: "dev-003",
    expires: Date.now() + 1800_000,
    capabilities: [
      {
        key: "pressure",
        mode: "s",
        type: "f",
        display: "c",
        name: "Pressure",
      },
      {
        key: "led0",
        mode: "a",
        type: "b",
        display: "v",
        name: "LED 0",
      },
      {
        key: "led1",
        mode: "a",
        type: "b",
        display: "v",
        name: "LED 1",
      },
    ],
  },
  {
    type: "sidewalk",
    protocolVersion: "1.0",
    smsn: "SMSN-004",
    state: {
      light: "300",
      motion: "false",
      displayText: "Idle",
    },
    seq: 15,
    deviceId: "dev-004",
    expires: Date.now() + 5400_000,
    capabilities: [
      {
        key: "light",
        mode: "s",
        type: "i",
        display: "c",
        name: "Light Level",
      },
      {
        key: "motion",
        mode: "s",
        type: "b",
        display: "v",
        name: "Motion Sensor",
      },
      {
        key: "displayText",
        mode: "a",
        type: "t",
        display: "v",
        name: "Display Text",
      },
    ],
  },
  {
    type: "sidewalk",
    protocolVersion: "1.0",
    state: {
      voltage: "3.7",
      current: "0.5",
      button: "false",
    },
    seq: 99,
    deviceId: "dev-005",
    expires: Date.now() + 6000_000,
    capabilities: [
      {
        key: "voltage",
        mode: "s",
        type: "f",
        display: "c",
        name: "Voltage",
      },
      {
        key: "current",
        mode: "s",
        type: "f",
        display: "v",
        name: "Current",
      },
      {
        key: "button",
        mode: "s",
        type: "b",
        display: "v",
        name: "Button",
      },
    ],
  },
];

export default mockDevices;
