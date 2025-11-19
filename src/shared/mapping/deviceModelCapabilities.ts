export enum ConnectivityType {
  GSM = 'GSM',
  LORA = 'LORA',
  BOTH = 'BOTH',
}

export enum SensorType {
  GPS = 'GPS',
  ACCELEROMETER = 'ACCELEROMETER',
  TEMPERATURE = 'TEMPERATURE',
  FUEL = 'FUEL',
  DOOR = 'DOOR',
  IGNITION = 'IGNITION',
}

export interface DeviceModelCapabilities {
  modelId: string;
  name: string;
  connectivity: ConnectivityType;
  sensors: SensorType[];
  decoder: string; // Nome do decoder a ser usado
}

export const DEVICE_MODEL_CAPABILITIES: Record<string, DeviceModelCapabilities> = {
  'MODEL_A': {
    modelId: 'MODEL_A',
    name: 'Model A (GSM)',
    connectivity: ConnectivityType.GSM,
    sensors: [SensorType.GPS, SensorType.IGNITION, SensorType.DOOR],
    decoder: 'ModelA',
  },
  'MODEL_B': {
    modelId: 'MODEL_B',
    name: 'Model B (GSM)',
    connectivity: ConnectivityType.GSM,
    sensors: [SensorType.GPS, SensorType.IGNITION, SensorType.FUEL],
    decoder: 'ModelB',
  },
  'LORA_MODEL_1': {
    modelId: 'LORA_MODEL_1',
    name: 'LoRa Model 1',
    connectivity: ConnectivityType.LORA,
    sensors: [SensorType.GPS, SensorType.TEMPERATURE],
    decoder: 'Everynet',
  },
  'ISCAFK': {
    modelId: 'ISCAFK',
    name: 'IscaFK LoRaWAN',
    connectivity: ConnectivityType.LORA,
    sensors: [SensorType.GPS, SensorType.TEMPERATURE],
    decoder: 'IscaFK',
  },
  'ISCAFK_GSM': {
    modelId: 'ISCAFK_GSM',
    name: 'IscaFK GSM',
    connectivity: ConnectivityType.GSM,
    sensors: [SensorType.GPS, SensorType.TEMPERATURE],
    decoder: 'IscaFK',
  },
};

