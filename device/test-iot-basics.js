const awsIot = require("aws-iot-device-sdk");

const thing = process.argv[2];
const opts = require(`./certs/${thing}/device.js`);

const topics = {
  in: `device/${opts.clientId}/control`,
  out: `device/${opts.clientId}/state`,
};

const device = awsIot.device(opts);

device.on("connect", function () {
  console.log("connect");
  device.subscribe(topics.in);
  send();
});

device.on("reconnect", function () {
  console.log("reconnect");
});

device.on("offline", function () {
  console.log("offline");
});

device.on("close", function () {
  console.log("end");
});

device.on("end", function () {
  console.log("end");
});

device.on("error", function (e) {
  console.log("error", e.message);
});

device.on("message", function (topic, payload) {
  const s = payload.toString();
  console.log("RECV", topic, s);
});

function send() {
  // const s = JSON.stringify({ at: Date.now() });
  const s = `{"data": "ping ${Date.now()}"}`;

  console.log("send", topics.out, s);
  device.publish(topics.out, s);
  setTimeout(send, 10000);
}
