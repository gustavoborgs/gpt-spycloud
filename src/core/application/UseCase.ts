import { Result } from '../utils/Result';

export interface UseCase<IRequest, IResponse> {
  execute(request: IRequest): Promise<Result<IResponse>>;
}

