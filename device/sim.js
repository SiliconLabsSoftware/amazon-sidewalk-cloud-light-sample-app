const awsIot = require("aws-iot-device-sdk");
const blessed = require("blessed");

const thing = process.argv[2];

if (!thing) {
  console.log("Provide device name as argument");
  process.exit(1);
}

const protocolVersion = (process.argv[3] || "v1").toLowerCase();
if (protocolVersion !== "v1" && protocolVersion !== "v2") {
  console.log("Usage: node device/sim.js <deviceName> [v1|v2]");
  process.exit(1);
}

const opts = require(`./certs/${thing}/device.js`);

let state = null;
let states = { ...opts.capabilities };
states.ping = {
  mode: "sensor",
  type: "integer",
  name: "Ping",
};

const stateKeys = Object.keys(states).sort();

let caps = [];

for (let key in states) {
  const { mode, type, name } = states[key];
  caps.push(`${key}+${mode.substring(0, 1)}${type.substring(0, 1)}+${name}`);
  states[key].key = key;
  states[key].value = null;
}
caps = caps.join("|");
let pingTimer = null;

// message id counter for v2 multi-fragment messages (0..255 rollover)
let v2MessageId = 0;
function nextV2MessageId() {
  v2MessageId = (v2MessageId + 1) & 0xff;
  return v2MessageId;
}


function quit() {
  send(`disconnect`);
  if (pingTimer) {
    clearTimeout(pingTimer);
  }
  // give websocket time to send
  setTimeout(() => {
    process.exit(0);
  }, 1000);
  device.end(true);
}

function parse(s) {
  let messages = [];
  while (s.length > 0) {
    if (s[0] === "$") {
      messages.push({ verb: "$" });
      s = s.substring(1);
      continue;
    }

    if (s[0] === "|") {
      for (const data of s.substring(1).split("|")) {
        messages.push({ verb: "|", data });
      }
      break;
    }

    if (s[0] === ":") {
      for (let data of s.substring(1).split(":")) {
        messages.push({ verb: ":", data });
      }
      break;
    }

    // long verbs only have verb + data
    let pos = s.indexOf(" ");
    let verb = pos < 0 ? s : s.substring(0, pos);
    let data = pos < 0 ? s : s.substring(pos + 1);
    messages.push({ verb, data });
    break;
  }
  return messages;
}

let screen = blessed.screen({
  smartCSR: true,
  autoPadding: false,
});

screen.key("f10", quit);
screen.key("f2", connection);
screen.key("f4", ping);

function trigger(i) {
  const cap = states[stateKeys[i]];
  let value = null;
  switch (cap.type) {
    case "boolean":
      value = Math.random() > 0.5 ? 1 : 0;
      break;
    case "integer":
      value = 1 + Math.floor(Math.random() * 100);
      break;
    case "temperature":
      value = 6 + Math.floor(Math.random() * 90);
      break;
    case "float":
      value = (Math.random() * 100).toFixed(2);
      break;
    case "text":
      value = "";
      while (value.length < 16) {
        value += String.fromCharCode(65 + Math.floor(Math.random() * 26));
      }
      break;
  }
  send(`:${stateKeys[i]}=${value}`);
}

for (const i in stateKeys) {
  if (states[stateKeys[i]].mode !== "sensor" || stateKeys[i] === "ping") {
    continue;
  }
  screen.key(String(i), trigger);
}

function makePanels() {
  let logger = blessed.log({
    parent: screen,
    top: "top",
    left: 0,
    width: "50%",
    height: "70%",
    border: "line",
    tags: true,
    keys: true,
    mouse: true,
    style: {
      bg: "black",
    },
  });

  let status = blessed.box({
    parent: screen,
    top: "top",
    right: 0,
    width: "50%",
    height: "70%",
    border: "line",
    tags: true,
    keys: true,
    mouse: true,
    style: {
      bg: "black",
      fg: "green",
    },
  });

  let terminal = blessed.log({
    parent: screen,
    left: 0,
    bottom: 1,
    top: "70%",
    width: "100%",
    border: "line",
    style: {
      bg: "black",
      fg: "white",
    },
    scrollable: true,
  });

  let tabs = blessed.text({
    parent: screen,
    left: 1,
    bottom: 0,
    right: 1,
    height: 1,
    style: {
      bg: "black",
      fg: "cyan",
    },
    content: "",
  });

  return {
    logger,
    status,
    terminal,
    tabs,
  };
}

const panels = makePanels();

function log() {
  let args = Array.prototype.slice.call(arguments);
  for (const i in args) {
    if (typeof args[i] === "object") {
      args[i] = JSON.stringify(args[i]);
    }
  }
  panels.logger.log(args.join(" "));
  screen.render();
}

function terminal(s) {
  panels.terminal.log(s);
  screen.render();
}

function render() {
  let s = [];
  s.push(`${state}`);
  s.push(``);
  s.push(`## mtd Title            Value`);
  for (const i in stateKeys) {
    const key = stateKeys[i];
    const cap = states[key];
    s.push(
      `${
        cap.mode === "sensor" && key !== "ping"
          ? String(i).padStart(2, " ")
          : "  "
      } ${cap.mode.substring(0, 1)}${cap.type.substring(0, 1)}${
        cap.display ? cap.display.substring(0, 1) : "v"
      } ${cap.name.padEnd(16)} ${cap.value}`
    );
  }
  panels.status.setContent(s.join("\n"));

  let fns = "";
  switch (state) {
    case "disconnected":
      fns = "[F2] Connect                  [F10] Quit";
      break;
    case "ready":
      fns = "[F2] Disconnect [F4] Ping     [F10] Quit";
      break;
    case "wait for pin":
      fns = "[F2] Restart                  [F10] Quit";
      break;
  }
  panels.tabs.setContent(fns);
  screen.render();
}

//

const topics = {
  in: `CloudLight/simulated/downlink`,
  out: `CloudLight/simulated/received`,
};

const device = awsIot.device(opts);
// const device = awsIot.device({
//   ...opts,
//   profile: "sidewalk-demo-dev",
//   debug: true,
// });

function publishData(dataString) {
  device.publish(topics.out, JSON.stringify({ data: dataString }));
}

function sendV1(s) {
  publishData(s);
}

function sendV2(s) {
  const asciiPayload = Buffer.from(s, "ascii");
  // Single-fragment if payload ≤ 18 bytes (header 1 byte + data ≤ 18 → total 19)
  if (asciiPayload.length <= 18) {
    const framed = Buffer.concat([Buffer.from([0x01]), asciiPayload]).toString("utf-8");
    publishData(framed);
    return;
  }

  // Multi-fragment: 3-byte header + up to 16 bytes data per fragment
  const totalFragments = Math.ceil(asciiPayload.length / 16);
  const messageId = nextV2MessageId();
  for (let i = 1; i <= totalFragments; i++) {
    const start = (i - 1) * 16;
    const end = start + 16;
    const chunk = asciiPayload.slice(start, end);
    const header = Buffer.from([totalFragments, messageId, i]);
    const framed = Buffer.concat([header, chunk]).toString("utf-8");
    publishData(framed);
  }
}

function send(s) {
  if (protocolVersion === "v2") {
    sendV2(s);
  } else {
    sendV1(s);
  }
  terminal(`< ${s}`);
}

function ping() {
  send(`ping ${Date.now()}`);
}

function pingTime() {
  ping();
  if (pingTimer) {
    clearTimeout(pingTimer);
  }
  pingTimer = setTimeout(pingTime, 30000);
}

function connection() {
  switch (state) {
    case "disconnected":
      send(`disconnect`);
      run("start");
      break;
    case "wait for pin":
      run("disconnect");
      run("start");
      break;
    case "ready":
      run("disconnect");
      break;
  }
}

render();

// state machine

function run(to) {
  if (to) {
    log(`# ${to}`);
  }

  switch (to) {
    case "start":
      device.subscribe(topics.in);
      if (protocolVersion === "v2") {
        // Version announce (v2) prior to pairing
        send(`::prot+v2`);
      }
      send(`$`);
      state = "wait for pin";
      break;
    case "ready":
      log("client connected and ready");
      // send capabilities
      for (let key in states) {
        let { mode, type, name, display } = states[key];
        display = display || "value";
        send(
          `|${key}+${mode.substring(0, 1)}${type.substring(
            0,
            1
          )}${display.substring(0, 1)}+${name}`
        );
      }
      pingTime();
      state = "ready";
      break;
    case "disconnected":
      log("client disconnected");
      device.unsubscribe(topics.in);
      state = "disconnected";
      if (pingTimer) {
        clearTimeout(pingTimer);
      }
      break;
    case "disconnect":
      log("device disconnecting");
      send("disconnect");
      device.unsubscribe(topics.in);
      state = "disconnected";
      if (pingTimer) {
        clearTimeout(pingTimer);
      }
      break;
    default:
      break;
  }
  render();
}

function recv(verb, data) {
  switch (verb) {
    case "pin":
      log(`PIN: ${data}`);
      break;
    case "web":
      log(`Web: ${data}`);
      break;
    case "url":
      log(`URL: ${data}`);
      break;
    case "caps":
      log(`CAPS: ${data}`);
      pingTime();
      break;
    case "pong":
      // ping response from server
      states.ping.value = Date.now() - Number(data);
      send(`:ping=${states.ping.value}`);
      break;
    case "tink":
      // roundtrip timing test from web client
      send(`tonk ${data}`);
      break;
    case "ready":
      run("ready");
      break;
    case "disconnected":
      run("disconnected");
      break;
    case ":":
      let y = data.split("=");
      const key = y[0].trim();
      const val = y[1].trim();
      states[key].value = val;
      break;
  }
  render();
}

log("starting...");

device.on("connect", function () {
  log("CONNECT");
  run("start");
});

device.on("error", function (e) {
  log("error", e.message);
});

const fragBuffer = {};

device.on("message", function (topic, payload) {
  const s = payload.toString().trim();

  
  let messages = [];
  if (protocolVersion === "v1") {
    // v1 behavior
    terminal(`> ${s}`);
    messages = parse(s);
  } else if (protocolVersion === "v2") {
    // v2 receive-side defragmentation
    terminal(`  (fragment: > ${s})`);
    if (s.charCodeAt(0) === 0x01) {
      // single-fragment: strip header and parse
      terminal(`> ${s.substring(1)}`);
      messages = parse(s.substring(1));
    } else {
      if (s.length < 3) {
        terminal(`invalid v2 message: > ${s}`);
        return;
      }
      const totalFragments = s.charCodeAt(0);
      const messageID = s.charCodeAt(1);
      const fragmentNumber = s.charCodeAt(2); // zero-based from cloud
      const fragmentPayload = s.substring(3);

      if (fragmentNumber >= totalFragments) {
        terminal(`invalid fragment number: ${fragmentNumber} (out of ${totalFragments}) in message: ${s}`);
        return;
      }

      if (!fragBuffer[messageID]) {
        fragBuffer[messageID] = { total: totalFragments, received: 0, fragments: [] };
      }
      const buf = fragBuffer[messageID];
      // store if not already set
      if (typeof buf.fragments[fragmentNumber] !== "string") {
        buf.fragments[fragmentNumber] = fragmentPayload;
        buf.received++;
      }
      // if complete, join and parse
      if (
        buf.received === buf.total &&
        buf.fragments.length === buf.total &&
        buf.fragments.every((x) => typeof x === "string")
      ) {
        const orderedFragments = [];
        for (let i = 0; i < totalFragments; i++) {
          orderedFragments.push(buf.fragments[i] || "");
        }
        const fullMsg = buf.fragments.join("");
        delete fragBuffer[messageID];
        terminal(`> ${fullMsg}`);
        messages = parse(fullMsg);
      } else {
        messages = [];
      }
    }
  } else {
    // unknown protocol version
  }

  for (const { verb, data } of messages) {
    recv(verb, data);
  }
  render();
});
