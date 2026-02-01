/**
 * Simple logging utility for server-side operations
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatEntry(entry: LogEntry): string {
    const contextStr = entry.context ? ` | ${JSON.stringify(entry.context)}` : '';
    return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    const formatted = this.formatEntry(entry);

    // In production, you'd send to logging service (e.g., Sentry, LogRocket, Datadog)
    // For now, just console log
    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      default:
        console.log(formatted);
    }

    // In development, also log the raw context
    if (this.isDevelopment && context) {
      console.log('Context:', context);
    }
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>) {
    this.log('error', message, context);
  }

  // Specialized method for payment failures
  paymentFailure(reason: string, context?: Record<string, any>) {
    this.error(`Payment failure: ${reason}`, {
      ...context,
      category: 'payment',
      severity: 'high',
    });
  }

  // Specialized method for webhook failures
  webhookFailure(reason: string, context?: Record<string, any>) {
    this.error(`Webhook failure: ${reason}`, {
      ...context,
      category: 'webhook',
      severity: 'critical',
    });
  }
}

export const logger = new Logger();
