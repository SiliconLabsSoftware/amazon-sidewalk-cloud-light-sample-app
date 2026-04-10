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

export interface DeviceRecord extends DatabaseEntry {
  type: "sidewalk" | "mqtt";
  protocolVersion: string;
  smsn?: string;
  capabilities: Record<string, Capability>;
  state: Record<string, string>;
  seq: number;
}

export interface Device extends Omit<DeviceRecord, "capabilities"> {
  deviceId: string;
  capabilities: Capability[];
}

export interface Connection extends DatabaseEntry {
  id: string;
}
