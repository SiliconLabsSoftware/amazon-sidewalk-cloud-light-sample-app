/***************************************************************************//**
 * @file
 * @brief Jest tests for device uplink text parsing (pairing, capabilities, state, ping).
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
import { parseMessage } from "./deviceProtocolParser.ts";

describe("pairing ($)", () => {
  it("parses a full pairing message with version, appId, and SMSN", () => {
    expect(parseMessage("$v1+cloud_light#50D141AA10EE03D533AF80F96F5ED5FA")).toEqual({
      verb: "pairing",
      version: "v1",
      appId: "cloud_light",
      smsn: "50D141AA10EE03D533AF80F96F5ED5FA",
    });
  });

  it("parses pairing without SMSN", () => {
    expect(parseMessage("$v1+cloud_light")).toEqual({
      verb: "pairing",
      version: "v1",
      appId: "cloud_light",
    });
  });

  it("does not include smsn key when SMSN is absent", () => {
    const result = parseMessage("$v1+cloud_light");
    expect(result).not.toHaveProperty("smsn");
  });

  it("preserves SMSN containing # characters", () => {
    expect(parseMessage("$v1+cloud_light#ABC#DEF")).toEqual({
      verb: "pairing",
      version: "v1",
      appId: "cloud_light",
      smsn: "ABC#DEF",
    });
  });

  it("preserves appId containing + characters", () => {
    expect(parseMessage("$v1+my+complex+app#SMSN")).toEqual({
      verb: "pairing",
      version: "v1",
      appId: "my+complex+app",
      smsn: "SMSN",
    });
  });

  it("handles empty SMSN (trailing #)", () => {
    const result = parseMessage("$v1+cloud_light#");
    expect(result).toEqual({
      verb: "pairing",
      version: "v1",
      appId: "cloud_light",
      smsn: "",
    });
  });

  it("handles missing appId", () => {
    expect(parseMessage("$v1")).toEqual({
      verb: "pairing",
      version: "v1",
      appId: "",
    });
  });

  it("handles empty version with valid appId", () => {
    expect(parseMessage("$+cloud_light")).toEqual({
      verb: "pairing",
      version: "",
      appId: "cloud_light",
    });
  });

  it("handles bare $ with no body", () => {
    expect(parseMessage("$")).toEqual({
      verb: "pairing",
      version: "",
      appId: "",
    });
  });

  it("trims surrounding whitespace before parsing", () => {
    expect(parseMessage("  $v1+cloud_light#SMSN  ")).toEqual({
      verb: "pairing",
      version: "v1",
      appId: "cloud_light",
      smsn: "SMSN",
    });
  });
});

describe("capability (|)", () => {
  it("parses a single capability", () => {
    expect(parseMessage("|b0+sb+Button 0")).toEqual({
      verb: "capability",
      capabilities: [{ key: "b0", mode: "s", type: "b", display: "v", name: "Button 0" }],
    });
  });

  it("parses batched capabilities", () => {
    expect(parseMessage("|b0+sb+Button 0|temp+sic+Temperature")).toEqual({
      verb: "capability",
      capabilities: [
        { key: "b0", mode: "s", type: "b", display: "v", name: "Button 0" },
        { key: "temp", mode: "s", type: "i", display: "c", name: "Temperature" },
      ],
    });
  });

  it("parses capability with explicit display flag", () => {
    expect(parseMessage("|hum+sfc+Humidity")).toEqual({
      verb: "capability",
      capabilities: [{ key: "hum", mode: "s", type: "f", display: "c", name: "Humidity" }],
    });
  });

  it("skips malformed capability segments", () => {
    expect(parseMessage("|good+sb+OK|bad")).toEqual({
      verb: "capability",
      capabilities: [{ key: "good", mode: "s", type: "b", display: "v", name: "OK" }],
    });
  });
});

describe("state (:)", () => {
  it("parses a single state entry", () => {
    expect(parseMessage(":temp=23")).toEqual({
      verb: "state",
      entries: [{ key: "temp", value: "23" }],
    });
  });

  it("parses batched state entries", () => {
    expect(parseMessage(":temp=23:b0=1")).toEqual({
      verb: "state",
      entries: [
        { key: "temp", value: "23" },
        { key: "b0", value: "1" },
      ],
    });
  });

  it("handles values containing =", () => {
    expect(parseMessage(":key=a=b")).toEqual({
      verb: "state",
      entries: [{ key: "key", value: "a=b" }],
    });
  });

  it("skips entries without =", () => {
    expect(parseMessage(":good=1:bad:ok=2")).toEqual({
      verb: "state",
      entries: [
        { key: "good", value: "1" },
        { key: "ok", value: "2" },
      ],
    });
  });
});

describe("ping", () => {
  it("parses ping with timestamp", () => {
    expect(parseMessage("!ping=1711500000000")).toEqual({
      verb: "ping",
      timestamp: "1711500000000",
    });
  });
});

describe("tonk", () => {
  it("parses tonk with timestamp", () => {
    expect(parseMessage("!tonk=1711500000000")).toEqual({
      verb: "tonk",
      timestamp: "1711500000000",
    });
  });
});

describe("unknown / edge cases", () => {
  it("returns unknown for unrecognized verb", () => {
    expect(parseMessage("hello world")).toEqual({ verb: "unknown", raw: "hello world" });
  });

  it("returns unknown for empty string", () => {
    expect(parseMessage("")).toEqual({ verb: "unknown", raw: "" });
  });

  it("returns unknown for whitespace-only", () => {
    expect(parseMessage("   ")).toEqual({ verb: "unknown", raw: "   " });
  });

  it("returns unknown for bare !", () => {
    expect(parseMessage("!other=123")).toEqual({ verb: "unknown", raw: "!other=123" });
  });
});
