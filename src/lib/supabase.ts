// src/lib/supabase.ts

// src/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cvfjzmcthrtwblqapjed.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2Zmp6bWN0aHJ0d2JscWFwamVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMTQ5ODIsImV4cCI6MjA2NTY5MDk4Mn0.mIW8cYx_avtEAIveQg4PK1HUo_feXg7B-eiNo3XPQrE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});