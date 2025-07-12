import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://cvfjzmcthrtwblqapjed.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2Zmp6bWN0aHJ0d2JscWFwamVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMTQ5ODIsImV4cCI6MjA2NTY5MDk4Mn0.mIW8cYx_avtEAIveQg4PK1HUo_feXg7B-eiNo3XPQrE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    // Create dungeons table
    const { data: createTableData, error: createTableError } = await supabase.rpc('create_dungeons_table');
    
    if (createTableError) {
      console.error('Error creating dungeons table:', createTableError);
      return;
    }

    console.log('✅ Database tables created successfully!');
    
    // Create some initial dungeons if the table is empty
    await createInitialDungeons();
    
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

async function createInitialDungeons() {
  const { data: existingDungeons, error: fetchError } = await supabase
    .from('dungeons')
    .select('*');
    
  if (fetchError) {
    console.error('Error fetching existing dungeons:', fetchError);
    return;
  }
  
  if (existingDungeons && existingDungeons.length === 0) {
    console.log('Creating initial dungeons...');
    
    const initialDungeons = [
      {
        name: 'The Ember Caves',
        level: 1,
        description: 'Face off against fire wraiths in scorching tunnels.',
        image_url: 'fire',
        rewards: [{ type: 'Gold', value: 100 }],
        difficulty_modifier: 1.0,
      },
      {
        name: 'Whispering Mire',
        level: 2,
        description: 'Navigate treacherous bogs guarded by ancient spirits.',
        image_url: 'vine',
        rewards: [{ type: 'Gear', value: 'Common' }],
        difficulty_modifier: 1.2,
      },
      {
        name: 'Frostbite Peak',
        level: 3,
        description: 'Scale icy cliffs and battle frozen giants.',
        image_url: 'ice',
        rewards: [{ type: 'XP', value: 50 }, { type: 'Gold', value: 150 }],
        difficulty_modifier: 1.5,
      },
      {
        name: 'Shadowfell Crypt',
        level: 4,
        description: 'Delve into the abyss, where dark entities lurk.',
        image_url: 'shadow',
        rewards: [{ type: 'Gold', value: 200 }, { type: 'XP', value: 100 }],
        difficulty_modifier: 2.0,
      },
    ];
    
    const { data: insertedDungeons, error: insertError } = await supabase
      .from('dungeons')
      .insert(initialDungeons);
      
    if (insertError) {
      console.error('Error creating initial dungeons:', insertError);
    } else {
      console.log('✅ Created initial dungeons!');
    }
  } else {
    console.log('Dungeons already exist, skipping creation.');
  }
}

// Run the setup
setupDatabase();
