/**
 * Environment variable validation utility
 * Validates required environment variables at startup
 */

type EnvConfig = {
  name: string;
  required: boolean;
  description: string;
};

const ENV_VARS: EnvConfig[] = [
  // Critical - Application won't function without these
  {
    name: 'PARCEL_LAYER_URL',
    required: true,
    description: 'ArcGIS parcel layer URL for address geocoding',
  },
  {
    name: 'STRIPE_SECRET_KEY',
    required: true,
    description: 'Stripe secret key for payment processing',
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: true,
    description: 'Stripe webhook signature verification secret',
  },
  {
    name: 'NEXT_PUBLIC_SITE_URL',
    required: true,
    description: 'Public site URL for Stripe redirects',
  },
  {
    name: 'RESEND_API_KEY',
    required: true,
    description: 'Resend API key for email delivery',
  },
  {
    name: 'RESEND_FROM',
    required: true,
    description: 'Verified sender email address for Resend',
  },
  {
    name: 'RESEND_TO',
    required: true,
    description: 'Owner email address for notifications',
  },
  
  // Optional but recommended
  {
    name: 'KV_REST_API_URL',
    required: false,
    description: 'Vercel KV URL for discount tracking (recommended)',
  },
  {
    name: 'KV_REST_API_TOKEN',
    required: false,
    description: 'Vercel KV token for discount tracking (recommended)',
  },
  {
    name: 'ORS_API_KEY',
    required: false,
    description: 'OpenRouteService API key for drive distance (recommended, falls back to OSRM)',
  },
];

export class EnvValidationError extends Error {
  constructor(public missingVars: string[]) {
    super(`Missing required environment variables: ${missingVars.join(', ')}`);
    this.name = 'EnvValidationError';
  }
}

/**
 * Validates all required environment variables
 * Throws EnvValidationError if any required variables are missing
 */
export function validateEnvironment(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const config of ENV_VARS) {
    const value = process.env[config.name];
    
    if (!value || value.trim() === '') {
      if (config.required) {
        missing.push(`${config.name} (${config.description})`);
      } else {
        warnings.push(`${config.name} (${config.description})`);
      }
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    throw new EnvValidationError(missing.map(v => v.split(' ')[0]));
  }

  if (warnings.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  Optional environment variables not set:');
    warnings.forEach(v => console.warn(`   - ${v}`));
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ All required environment variables are set');
  }
}

/**
 * Checks if a specific environment variable is configured
 */
export function isEnvConfigured(name: string): boolean {
  const value = process.env[name];
  return Boolean(value && value.trim() !== '');
}
