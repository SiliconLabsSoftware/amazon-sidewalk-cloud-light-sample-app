export interface SidewalkUplinkMessage {
  PayloadData: string;
  WirelessDeviceId: string;
  WirelessMetadata: {
    Sidewalk: {
      CmdExStatus: string;
      SidewalkId: string;
      Seq: number;
      MessageType: string;
      Timestamp: string;
    };
  };
}

export interface SimulatedDeviceUplinkMessage {
  clientId: string;
  data: string;
}
