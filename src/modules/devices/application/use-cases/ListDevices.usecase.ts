import { UseCase } from '../../../../core/application/UseCase';
import { Result, ok, fail } from '../../../../core/utils/Result';
import { PaginationDTO, PaginatedResponseDTO } from '../../../../core/application/dto';
import { DeviceRepository } from '../../infra/repositories/DeviceRepository';
import { DeviceViewModel, toDeviceViewModel } from '../dtos/DeviceViewModel';

export interface ListDevicesRequest extends PaginationDTO {
  tenantId?: string;
  assetId?: string;
  status?: string;
}

export class ListDevicesUseCase implements UseCase<ListDevicesRequest, PaginatedResponseDTO<DeviceViewModel>> {
  constructor(private deviceRepository: DeviceRepository) {}

  async execute(request: ListDevicesRequest): Promise<Result<PaginatedResponseDTO<DeviceViewModel>>> {
    try {
      const { data, total } = await this.deviceRepository.findMany({
        tenantId: request.tenantId,
        assetId: request.assetId,
        status: request.status as any,
        page: request.page,
        limit: request.limit,
      });

      const viewModels = data.map(toDeviceViewModel);

      return ok({
        data: viewModels,
        pagination: {
          page: request.page || 1,
          limit: request.limit || 10,
          total,
          totalPages: Math.ceil(total / (request.limit || 10)),
        },
      });
    } catch (error: any) {
      return fail(error.message || 'Failed to list devices', 500);
    }
  }
}

