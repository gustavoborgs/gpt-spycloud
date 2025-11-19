export interface PaginationParams {
  page?: number;
  limit?: number;
}

export function normalizePagination(params: PaginationParams): { page: number; limit: number; skip: number } {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 10));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

