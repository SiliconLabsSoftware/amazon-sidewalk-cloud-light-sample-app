interface DatabaseEntry {
  expires: number;
}

export interface Device extends DatabaseEntry {
  type: "sidewalk" | "mqtt";
  capabilities: string[];
  seq: number;
}

export interface Connection extends DatabaseEntry {
  id: string;
}
