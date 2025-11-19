export interface DecodedTelemetry {
  deviceSerialNumber: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number | null;
  altitude: number | null;
  ignition?: boolean;
  fuelLevel?: number | null;
  additionalData?: Record<string, any>;
}

