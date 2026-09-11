import type { ApplicationInput, Category, PartnerSearchResponse } from '../types';

export class ApiError extends Error {
  readonly field?: string;
  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ApiError';
    this.field = field;
  }
}

async function readError(res: Response): Promise<never> {
  let message = 'Something went wrong. Please try again.';
  let field: string | undefined;
  try {
    const body = (await res.json()) as { error?: string; field?: string };
    if (body.error) message = body.error;
    field = body.field;
  } catch {
    // Non-JSON error body (proxy down, HTML error page) — keep the default.
  }
  throw new ApiError(message, field);
}

/**
 * Search the directory. Pass a single category plus an offset to page one
 * column further ("load more"); pass every selected category with offset 0 for
 * a fresh search.
 */
export async function searchPartners(params: {
  zip: string;
  categories: Category[];
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
}): Promise<PartnerSearchResponse> {
  const query = new URLSearchParams({
    zip: params.zip,
    categories: params.categories.join(','),
    limit: String(params.limit ?? 5),
    offset: String(params.offset ?? 0),
  });

  const res = await fetch(`/api/partners?${query}`, { signal: params.signal });
  if (!res.ok) await readError(res);
  return (await res.json()) as PartnerSearchResponse;
}

export async function submitApplication(input: ApplicationInput): Promise<void> {
  const res = await fetch('/api/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) await readError(res);
}
