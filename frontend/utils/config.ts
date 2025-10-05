/**
 * Application configuration
 * Centralizes environment variables and app settings
 */

/**
 * Get the backend API base URL
 * @returns API URL from environment or defaults to localhost:8000
 */
export const getApiUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};

/**
 * API endpoints configuration
 */
export const API_ENDPOINTS = {
  analyze: `${getApiUrl()}/analyze/`,
  ttsGenerate: `${getApiUrl()}/tts/generate`,
  modelStatus: (modelId: string) => `${getApiUrl()}/models/status/${modelId}`,
  modelDownload: (filename: string) => `${getApiUrl()}/models/${filename}`,
} as const;
