/**
 * OpenTelemetry Instrumentation
 * 
 * Must be imported BEFORE express and other libraries.
 * Sets up NodeSDK with http + express auto-instrumentation.
 * Propagates trace context (traceparent) via W3C format.
 * 
 * Excludes health endpoints from tracing to avoid noise.
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import pkg from '@opentelemetry/resources';
const { Resource } = pkg;
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

const OTEL_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || 'kavanahub-api';

// Only initialize if endpoint is configured
let sdk = null;

export function initTelemetry() {
  if (!OTEL_ENDPOINT) {
    console.log('ℹ️  OpenTelemetry: No OTEL_EXPORTER_OTLP_ENDPOINT set, tracing disabled');
    return;
  }

  try {
    const exporter = new OTLPTraceExporter({
      url: `${OTEL_ENDPOINT}/v1/traces`,
    });

    sdk = new NodeSDK({
      resource: new Resource({
        [ATTR_SERVICE_NAME]: SERVICE_NAME,
        [ATTR_SERVICE_VERSION]: '1.0.0',
      }),
      traceExporter: exporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-http': {
            ignoreIncomingPaths: ['/ping', '/health', '/ready'],
          },
          '@opentelemetry/instrumentation-express': {
            enabled: true,
          },
          // Disable instrumentations we don't need
          '@opentelemetry/instrumentation-fs': { enabled: false },
        }),
      ],
    });

    sdk.start();
    console.log('✅ OpenTelemetry tracing started →', OTEL_ENDPOINT);

    // Graceful shutdown
    process.on('SIGTERM', () => {
      sdk.shutdown()
        .then(() => console.log('OpenTelemetry shut down'))
        .catch(console.error);
    });
  } catch (err) {
    console.warn('⚠️  OpenTelemetry init failed:', err.message);
  }
}

/**
 * Middleware to propagate trace context in response headers
 */
export function traceContextMiddleware(req, res, next) {
  // Forward traceparent if received
  const traceparent = req.headers['traceparent'];
  if (traceparent) {
    res.setHeader('traceparent', traceparent);
  }
  next();
}
