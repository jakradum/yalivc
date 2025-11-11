/**
 * Feature Flags Configuration
 * Controls which features are enabled based on environment
 * 
 * Vercel provides NEXT_PUBLIC_VERCEL_ENV automatically:
 * - 'production' = production deployment (yali.vc)
 * - 'preview' = preview deployments (PR previews, branch deploys)
 * - 'development' = local development
 */

const ENV = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development';

// Helper to check if we're in production
export const isProduction = ENV === 'production';

// Helper to check if we're in staging/preview
export const isStaging = ENV === 'preview';

// Helper to check if we're in development
export const isDevelopment = ENV === 'development';

/**
 * Feature Flags
 * Set to true to enable the feature in that environment
 */
export const features = {
  // Application form - enable only on staging and dev initially
  applicationForm: {
    enabled: !isProduction, // true for staging/dev, false for production
  },

  // Resources section (blog posts, newsletter)
  resources: {
    enabled: !isProduction,
  },

  // Quarterly reports section
  quarterlyReports: {
    enabled: false, // disabled everywhere until content is ready
  },

  // Debug/dev tools
  debugPanel: {
    enabled: isDevelopment,
  },

  // Application CSV export
  csvExport: {
    enabled: !isProduction,
  },
};

/**
 * Check if a feature is enabled
 * @param {string} featureName - Name of the feature (e.g., 'applicationForm')
 * @returns {boolean}
 */
export const isFeatureEnabled = (featureName) => {
  return features[featureName]?.enabled || false;
};

/**
 * Get environment info (useful for debugging)
 */
export const getEnvInfo = () => ({
  env: ENV,
  isProduction,
  isStaging,
  isDevelopment,
});

