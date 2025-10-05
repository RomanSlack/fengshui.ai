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
 * Check if the API URL is an ngrok URL
 * @returns true if using ngrok, false otherwise
 */
export const isNgrokUrl = (): boolean => {
  const url = getApiUrl();
  return url.includes('ngrok');
};

/**
 * Get default headers for API requests
 * Includes ngrok-skip-browser-warning for ngrok URLs
 */
export const getApiHeaders = (): HeadersInit => {
  const headers: HeadersInit = {};

  // ngrok requires this header to skip the browser warning interstitial
  if (isNgrokUrl()) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  return headers;
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
