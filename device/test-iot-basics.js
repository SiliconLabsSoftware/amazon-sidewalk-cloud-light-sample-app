/***************************************************************************//**
 * @file
 * @brief Minimal AWS IoT Core publish/subscribe smoke test for a device certificate.
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
