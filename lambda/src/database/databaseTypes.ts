interface DatabaseEntry {
  expires: number;
}

export interface Capability {
  key: string;
  mode: "s" | "a";
  type: "b" | "i" | "f" | "t";
  display: "v" | "c";
  name: string;
}

export interface Device extends DatabaseEntry {
  type: "sidewalk" | "mqtt";
  protocolVersion: string;
  smsn?: string;
  capabilities: Capability[];
  state: Record<string, string>;
  seq: number;
}

export interface DeviceWithId extends Device {
  deviceId: string;
}

export interface Connection extends DatabaseEntry {
  id: string;
}
