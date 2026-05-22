/***************************************************************************//**
 * @file
 * @brief Encodes cloud-to-device protocol strings (URL, ready, state, pong, tink).
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
export abstract class ProtocolMessage {
  readonly encoded: string;

  constructor(encoded: string) {
    this.encoded = encoded;
  }

  toString(): string {
    return this.encoded;
  }
}

// --- url <magic_url> --- Setup URL ---

export interface MagicUrlMessageInput {
  baseUrl: string;
  password: string;
  deviceId: string;
}

export class MagicUrlMessage extends ProtocolMessage {
  constructor(input: MagicUrlMessageInput) {
    super(`url ${input.baseUrl}/devices/${input.deviceId}?token=${input.password}`);
  }
}

// --- ready --- Setup complete signal ---

export class ReadyMessage extends ProtocolMessage {
  constructor() {
    super("ready");
  }
}

// --- :key=value --- Actuator command ---

export interface StateMessageInput {
  entries: { key: string; value: string }[];
}

export class StateMessage extends ProtocolMessage {
  constructor(input: StateMessageInput) {
    super(input.entries.map((e) => `:${e.key}=${e.value}`).join(""));
  }
}

// --- !pong=<timestamp> --- Ping response ---

export interface PongMessageInput {
  timestamp: string;
}

export class PongMessage extends ProtocolMessage {
  constructor(input: PongMessageInput) {
    super(`!pong=${input.timestamp}`);
  }
}

// --- !tink=<timestamp> --- Latency request from cloud ---

export interface TinkMessageInput {
  timestamp: string;
}

export class TinkMessage extends ProtocolMessage {
  constructor(input: TinkMessageInput) {
    super(`!tink=${input.timestamp}`);
  }
}
