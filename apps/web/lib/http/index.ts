/**
 * HTTP Client Module
 *
 * Centralized HTTP utilities for the application
 */

export {
  HttpClient,
  HttpError,
  httpClient,
  httpGet,
  httpPost,
  httpPut,
  httpPatch,
  httpDelete,
  isHttpSuccess,
  isHttpError,
  unwrapHttp,
  type HttpRequestOptions,
  type HttpResponse,
  type HttpErrorResponse,
  type HttpResult,
} from './client';
