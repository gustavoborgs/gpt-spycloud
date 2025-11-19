import { z } from 'zod';
import { DeviceStatus, DeviceType } from '../../domain/enums';

export const CreateDeviceSchema = z.object({
  serialNumber: z.string().min(1),
  modelId: z.string().min(1),
  tenantId: z.string().uuid(),
  assetId: z.string().uuid().optional(),
  status: z.nativeEnum(DeviceStatus).default(DeviceStatus.INACTIVE),
  type: z.nativeEnum(DeviceType),
  metadata: z.record(z.any()).optional(),
});

export type CreateDeviceDTO = z.infer<typeof CreateDeviceSchema>;

