/**
 * @slimy/error-catalog
 *
 * Centralized error code catalog for Slimy.ai services
 * @module error-catalog
 */

export {
  // Types
  ErrorCodeInfo,
  ErrorDomain,
  ErrorCode,
  // Catalog
  ERROR_CATALOG,
  // Helper functions
  getErrorInfo,
  getErrorsByDomain,
  getErrorsByHttpStatus,
  isValidErrorCode,
  formatErrorMessage,
  createErrorResponse,
  getAllErrorCodes,
  getCatalogStats,
} from './codes';
