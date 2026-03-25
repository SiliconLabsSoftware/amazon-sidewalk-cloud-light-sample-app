module.exports = {
  host: `__aws_iot_endpoint__`,
  region: "us-east-1",
  enableMetrics: false,
  port: 443,
  protocol: "wss",
  clientId: `__thing_name__`,
  debug: false,
  capabilities: {
    button: {
      mode: "sensor",
      type: "boolean",
      name: "Button",
    },
    led0: {
      mode: "actuator",
      type: "boolean",
      name: "WSTK LED",
    },
    temperature: {
      mode: "sensor",
      type: "temperature",
      display: "chart",
      name: "Temperature",
    },
    display: {
      mode: "actuator",
      type: "text",
      name: "Display",
    },
    message: {
      mode: "sensor",
      type: "text",
      name: "Message",
    },
  },
};
