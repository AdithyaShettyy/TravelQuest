// Mappls API Configuration
// Get your free API key at: https://www.mappls.com/api/

export const MAPPLS_CONFIG = {
  API_KEY: process.env.EXPO_PUBLIC_MAPPLS_API_KEY || 'YOUR_MAPPLS_API_KEY',
  BASE_URL: 'https://apis.mappls.com/advancedmaps/v1',
};

// Instructions:
// 1. Sign up at https://www.mappls.com/api/
// 2. Get your free API key
// 3. Add to your .env file:
//    EXPO_PUBLIC_MAPPLS_API_KEY=your_actual_api_key_here
// 4. Restart the app