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
  smsn: string;
}

export class MagicUrlMessage extends ProtocolMessage {
  constructor(input: MagicUrlMessageInput) {
    super(`url ${input.baseUrl}?token=${input.password}&smsn=${input.smsn}`);
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
