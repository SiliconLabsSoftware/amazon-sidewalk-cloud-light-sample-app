/***************************************************************************//**
 * @file
 * @brief Parses device uplink text into pairing, capability, state, ping, or tonk verbs.
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
import type { Capability } from "../database/databaseTypes.ts";

export type ParsedMessage =
  | { verb: "pairing"; version: string; appId: string; smsn?: string }
  | { verb: "capability"; capabilities: Capability[] }
  | { verb: "state"; entries: { key: string; value: string }[] }
  | { verb: "ping"; timestamp: string }
  | { verb: "tonk"; timestamp: string }
  | { verb: "unknown"; raw: string };

export function parseMessage(raw: string): ParsedMessage {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { verb: "unknown", raw };
  }

  const first = trimmed[0];

  if (first === "$") {
    return parsePairing(trimmed);
  }
  if (first === "|") {
    return parseCapability(trimmed);
  }
  if (first === ":") {
    return parseState(trimmed);
  }
  if (trimmed.startsWith("!ping=")) {
    return { verb: "ping", timestamp: trimmed.slice(6) };
  }
  if (trimmed.startsWith("!tonk=")) {
    return { verb: "tonk", timestamp: trimmed.slice(6) };
  }

  return { verb: "unknown", raw };
}

function parsePairing(msg: string): ParsedMessage {
  // $<ver>+<app_id>#<smsn>
  const body = msg.slice(1);
  const [versionApp, ...smsnParts] = body.split("#");
  const smsn = smsnParts.length > 0 ? smsnParts.join("#") : undefined;

  const parts = versionApp.split("+");
  const version = parts[0] ?? "";
  const appId = parts.slice(1).join("+");

  return { verb: "pairing", version, appId, ...(smsn !== undefined && { smsn }) };
}

function parseCapability(msg: string): ParsedMessage {
  const segments = msg.split("|").filter((s) => s.length > 0);
  const capabilities: Capability[] = [];

  for (const seg of segments) {
    const parts = seg.split("+");
    if (parts.length < 3) continue;

    const key = parts[0];
    const capCode = parts[1];
    const name = parts.slice(2).join("+");

    if (capCode.length < 2) continue;

    const mode = capCode[0] as "s" | "a";
    const type = capCode[1] as "b" | "i" | "f" | "t";
    const display = (capCode.length >= 3 ? capCode[2] : "v") as "v" | "c";

    capabilities.push({ key, mode, type, display, name });
  }

  return { verb: "capability", capabilities };
}

function parseState(msg: string): ParsedMessage {
  const segments = msg.split(":").filter((s) => s.length > 0);
  const entries: { key: string; value: string }[] = [];

  for (const seg of segments) {
    const eqIdx = seg.indexOf("=");
    if (eqIdx <= 0) continue;
    entries.push({ key: seg.slice(0, eqIdx), value: seg.slice(eqIdx + 1) });
  }

  return { verb: "state", entries };
}
