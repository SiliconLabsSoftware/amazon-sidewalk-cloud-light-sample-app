interface DatabaseEntry {
  expires: number;
}

export interface Device extends DatabaseEntry {
  type: "sidewalk" | "mqtt";
  capabilities: string[];
  seq: number;
  fragSeq: number;
}

export interface FragmentedMessage extends DatabaseEntry {
  id: string;
  total: number;
  received: number;
  fragments: Map<number, string>;
}

export interface TemperatureMeasurement extends DatabaseEntry {
  timestamp: number;
  temperature: number;
}

export interface Connection extends DatabaseEntry {
  id: string;
}
