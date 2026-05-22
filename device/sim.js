/***************************************************************************//**
 * @file
 * @brief Terminal UI simulator that connects a fake device to AWS IoT for Cloud Light.
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
const awsIot = require("aws-iot-device-sdk");
const blessed = require("blessed");

// ---------------------------------------------------------------------------
// CLI & Configuration
// ---------------------------------------------------------------------------

const thing = process.argv[2];

if (!thing) {
  console.log("Usage: node device/sim.js <deviceName>");
  process.exit(1);
}

const opts = require(`./certs/${thing}/device.js`);

const APP_ID = "cloud_light";
const PROTOCOL_VERSION = "v1";
const PING_INTERVAL_MS = 30000;

const topics = {
  in: `CloudLight/simulated/${opts.clientId}/downlink`,
  out: `CloudLight/simulated/${opts.clientId}/received`,
};

// ---------------------------------------------------------------------------
// Capability State
// ---------------------------------------------------------------------------

const capabilities = { ...opts.capabilities };
capabilities.ping = { mode: "sensor", type: "integer", name: "Ping" };

const capabilityKeys = Object.keys(capabilities).sort();

for (const key of capabilityKeys) {
  capabilities[key].key = key;
  capabilities[key].value = null;
}

let connectionState = null;
let pingTimer = null;

// ---------------------------------------------------------------------------
// Protocol — Parsing & Messaging
// ---------------------------------------------------------------------------

function separateMessage(message, separator) {
  const pos = message.indexOf(separator);
  const verb = pos < 0 ? message : message.substring(0, pos);
  const data = pos < 0 ? null : message.substring(pos + 1);
  return { verb, data };
}

function parse(s) {
  const messages = [];

  if (s[0] === "|") {
    for (const data of s.substring(1).split("|")) {
      messages.push({ verb: "|", data });
    }
    return messages;
  }

  if (s[0] === ":") {
    for (const data of s.substring(1).split(":")) {
      messages.push({ verb: ":", data });
    }
    return messages;
  }

  if (s[0] === "!") {
    messages.push(separateMessage(s, "="));
    return messages;
  }

  messages.push(separateMessage(s, " "));
  return messages;
}

function send(s) {
  device.publish(topics.out, JSON.stringify({ data: s }));
  terminal(`< ${s}`);
}

function handleMessage(verb, data) {
  switch (verb) {
    case "url":
      log(`URL: ${data}`);
      break;
    case "ready":
      transition("ready");
      break;
    case "!pong":
      capabilities.ping.value = Date.now() - Number(data);
      break;
    case "!tink":
      send(`!tonk=${data}`);
      break;
    case ":":
      const [key, val] = data.split("=").map((s) => s.trim());
      if (capabilities[key]) capabilities[key].value = val;
      break;
  }
  render();
}

// ---------------------------------------------------------------------------
// UI — Panels & Rendering
// ---------------------------------------------------------------------------

const screen = blessed.screen({ smartCSR: true, autoPadding: false });

const panels = createPanels();

function createPanels() {
  const logger = blessed.log({
    parent: screen,
    top: "top",
    left: 0,
    width: "50%",
    height: "70%",
    border: "line",
    tags: true,
    keys: true,
    mouse: true,
  });

  const status = blessed.box({
    parent: screen,
    top: "top",
    right: 0,
    width: "50%",
    height: "70%",
    border: "line",
    tags: true,
    keys: true,
    mouse: true,
    style: { fg: "green" },
  });

  const terminal = blessed.log({
    parent: screen,
    left: 0,
    bottom: 1,
    top: "70%",
    width: "100%",
    border: "line",
    scrollable: true,
  });

  const tabs = blessed.text({
    parent: screen,
    left: 1,
    bottom: 0,
    right: 1,
    height: 1,
    style: { fg: "blue" },
    content: "",
  });

  return { logger, status, terminal, tabs };
}

function log() {
  const args = Array.from(arguments).map((a) =>
    typeof a === "object" ? JSON.stringify(a) : a
  );
  panels.logger.log(args.join(" "));
  screen.render();
}

function terminal(s) {
  panels.terminal.log(s);
  screen.render();
}

function render() {
  const lines = [
    `${connectionState}`,
    "",
    "## mtd Title            Value",
  ];

  for (const i in capabilityKeys) {
    const key = capabilityKeys[i];
    const cap = capabilities[key];
    const isSensor = cap.mode === "sensor" && key !== "ping";
    const hotkey = isSensor ? String(i).padStart(2, " ") : "  ";
    const modeChar = cap.mode.substring(0, 1);
    const typeChar = cap.type.substring(0, 1);
    const displayChar = cap.display ? cap.display.substring(0, 1) : "v";
    lines.push(`${hotkey} ${modeChar}${typeChar}${displayChar} ${cap.name.padEnd(16)} ${cap.value}`);
  }

  panels.status.setContent(lines.join("\n"));

  const tabContent = {
    disconnected: "[F2] Connect                  [F10] Quit",
    ready:        "[F2] Disconnect [F4] Ping     [F10] Quit",
    pairing:      "[F2] Restart                  [F10] Quit",
  };
  panels.tabs.setContent(tabContent[connectionState] || "");
  screen.render();
}

// ---------------------------------------------------------------------------
// State Machine & Actions
// ---------------------------------------------------------------------------

function transition(to) {
  if (to) log(`# ${to}`);

  switch (to) {
    case "start":
      device.subscribe(topics.in);
      send(`$${PROTOCOL_VERSION}+${APP_ID}`); 
      connectionState = "pairing";
      break;

    case "ready":
      log("device paired and ready");
      for (const key in capabilities) {
        let { mode, type, name, display } = capabilities[key];
        display = display || "value";
        send(
          `|${key}+${mode.substring(0, 1)}${type.substring(0, 1)}${display.substring(0, 1)}+${name}`
        );
      }
      startPingTimer();
      connectionState = "ready";
      break;

    case "disconnect":
      log("device disconnected");
      device.unsubscribe(topics.in);
      connectionState = "disconnected";
      stopPingTimer();
      break;

    default:
      break;
  }

  render();
}

function toggleConnection() {
  switch (connectionState) {
    case "disconnected":
      transition("start");
      break;
    case "pairing":
    case "ready":
      transition("disconnect");
      break;
  }
}

function ping() {
  send(`!ping=${Date.now()}`);
}

function startPingTimer() {
  stopPingTimer();
  pingTimer = setTimeout(function tick() {
    ping();
    pingTimer = setTimeout(tick, PING_INTERVAL_MS);
  }, PING_INTERVAL_MS);
  ping();
}

function stopPingTimer() {
  if (pingTimer) {
    clearTimeout(pingTimer);
    pingTimer = null;
  }
}

function generateRandomValue(type) {
  switch (type) {
    case "boolean":
      return Math.random() > 0.5 ? 1 : 0;
    case "integer":
      return 1 + Math.floor(Math.random() * 100);
    case "temperature":
      return 6 + Math.floor(Math.random() * 90);
    case "float":
      return (Math.random() * 100).toFixed(2);
    case "text": {
      let value = "";
      while (value.length < 16) {
        value += String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
      return value;
    }
  }
  return null;
}

function triggerSensor(i) {
  const key = capabilityKeys[i];
  const value = generateRandomValue(capabilities[key].type);
  send(`:${key}=${value}`);
}

function quit() {
  stopPingTimer();
  setTimeout(() => process.exit(0), 500);
  device.end(true);
}

// ---------------------------------------------------------------------------
// MQTT Device & Event Handlers
// ---------------------------------------------------------------------------

const device = awsIot.device(opts);

device.on("connect", function () {
  log("CONNECT");
  transition("start");
});

device.on("error", function (e) {
  log("error", e.message);
});

device.on("message", function (topic, payload) {
  const s = payload.toString().trim();
  terminal(`> ${s}`);
  for (const { verb, data } of parse(s)) {
    handleMessage(verb, data);
  }
  render();
});

// ---------------------------------------------------------------------------
// Key Bindings & Boot
// ---------------------------------------------------------------------------

screen.key("f10", quit);
screen.key("f2", toggleConnection);
screen.key("f4", ping);

for (const i in capabilityKeys) {
  const key = capabilityKeys[i];
  if (capabilities[key].mode === "sensor" && key !== "ping") {
    screen.key(String(i), triggerSensor);
  }
}

log("starting...");
render();
