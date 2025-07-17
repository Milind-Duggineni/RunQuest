export default {
  expo: {
    name: 'RunQuest',
    slug: 'runquest',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0a0f1c'
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#0a0f1c'
      }
    },
    web: {
      favicon: './assets/images/favicon.png'
    },
    extra: {
      SUPABASE_URL: 'https://cvfjzmcthrtwblqapjed.supabase.co',
      SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2Zmp6bWN0aHJ0d2JscWFwamVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMTQ5ODIsImV4cCI6MjA2NTY5MDk4Mn0.mIW8cYx_avtEAIveQg4PK1HUo_feXg7B-eiNo3XPQrE'
    }
  }
};
