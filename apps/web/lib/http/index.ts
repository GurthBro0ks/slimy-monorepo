/**
 * HTTP Client Module
 *
 * Exports the typed HTTP client and related utilities
 */

export {
  // Classes
  HttpClient,
  HttpError,

  // Functions
  createHttpClient,
  getHttpClient,
  httpGet,
  httpPost,
  httpPut,
  httpPatch,
  httpDelete,
  httpStream,

  // Types
  type HttpClientConfig,
  type HttpRequestOptions,
  type HttpResult,
  type HttpSuccess,
  type HttpFailure,
} from './client';
