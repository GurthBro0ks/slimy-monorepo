"use strict";
/**
 * Monitoring and observability setup
 * Provides Sentry integration and basic in-memory metrics collection
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sentry = void 0;
exports.setupSentry = setupSentry;
exports.collectMetrics = collectMetrics;
exports.incrementRequests = incrementRequests;
exports.incrementErrors = incrementErrors;
exports.resetMetrics = resetMetrics;
exports.getStartTime = getStartTime;
const Sentry = __importStar(require("@sentry/node"));
exports.Sentry = Sentry;
const metrics = {
    requests: 0,
    errors: 0,
    startTime: new Date(),
};
/**
 * Initialize Sentry for error tracking and monitoring
 * @param dsn - Sentry DSN from environment variable
 */
function setupSentry(dsn) {
    if (!dsn) {
        console.warn('[Monitoring] No Sentry DSN provided - Sentry disabled');
        return;
    }
    try {
        Sentry.init({
            dsn,
            environment: process.env.NODE_ENV || 'development',
            tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
            beforeSend(event, hint) {
                // Filter out certain errors or add additional context
                const error = hint.originalException;
                // Don't send validation errors to Sentry
                if (error && typeof error === 'object' && 'name' in error) {
                    if (error.name === 'ValidationError' || error.name === 'ZodError') {
                        return null;
                    }
                }
                return event;
            },
        });
        console.log('[Monitoring] Sentry initialized successfully');
    }
    catch (error) {
        console.error('[Monitoring] Failed to initialize Sentry:', error);
    }
}
/**
 * Collect and return current metrics
 * Returns basic counters for requests and errors
 */
function collectMetrics() {
    const uptime = Math.floor((Date.now() - metrics.startTime.getTime()) / 1000);
    const errorRate = metrics.requests > 0 ? (metrics.errors / metrics.requests) * 100 : 0;
    return {
        requests: metrics.requests,
        errors: metrics.errors,
        uptime,
        errorRate: parseFloat(errorRate.toFixed(2)),
    };
}
/**
 * Increment request counter
 */
function incrementRequests() {
    metrics.requests++;
}
/**
 * Increment error counter
 */
function incrementErrors() {
    metrics.errors++;
}
/**
 * Reset all metrics counters
 */
function resetMetrics() {
    metrics.requests = 0;
    metrics.errors = 0;
    metrics.startTime = new Date();
}
/**
 * Get the metrics start time
 */
function getStartTime() {
    return metrics.startTime;
}
