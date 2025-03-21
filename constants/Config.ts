// Config.ts - Application configuration

/**
 * API key configuration with validation
 * In production, use environment variables rather than hardcoded keys
 */

// OpenAI API Configuration
export const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || "";

// App Configuration
export const APP_CONFIG = {
  // App version
  VERSION: "1.0.0",

  // Default calorie goal if not set by user
  DEFAULT_CALORIE_GOAL: 2000,

  // OpenAI model configuration
  OPENAI: {
    DEFAULT_MODEL: "gpt-4o-mini",
    API_TIMEOUT_MS: 30000, // 30 seconds API timeout
  },

  // Storage keys
  STORAGE_KEYS: {
    USER_SETTINGS: "@calorietracker:settings",
    FOOD_ENTRIES: "@calorietracker:foodentries",
    CALORIE_GOAL: "@calorietracker:caloriegoal",
  },

  // Feature flags
  FEATURES: {
    ENABLE_FOOD_LOGGING: true,
    ENABLE_NUTRITION_ANALYSIS: true,
    ENABLE_DAILY_ADVICE: true,
  },
};

// Environment mode
export const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Helper to check API key configuration
export const hasValidApiKey = (): boolean => {
  return Boolean(OPENAI_API_KEY && OPENAI_API_KEY.length > 10);
};
