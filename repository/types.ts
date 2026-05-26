import type { IAPIError, IAPIResponse } from '@/types/api';

export { IAPIError as IApiError, IAPIResponse as IApiResponse };

export enum ApiState {
  IDLE = 'idle',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export type ApiRequestData = {
  body?: Record<string, unknown> | FormData | Array<Record<string, unknown>>;
  query?: Record<string, string | number | boolean>;
  urlHash?: Record<string, string | number>;
  headers?: Record<string, string>;
};
