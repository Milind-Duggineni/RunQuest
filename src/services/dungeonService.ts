import { supabase } from '../lib/supabase';

// Define the Dungeon interface
export interface Dungeon {
  id: string;
  name: string;
  level: number;
  description: string;
  image_url: string;
  rewards: { type: string; value?: number | string }[];
  difficulty_modifier: number;
  created_at: string;
}

// Fetch all dungeons from Supabase
export const fetchDungeons = async (): Promise<Dungeon[]> => {
  try {
    const { data, error } = await supabase
      .from('dungeons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching dungeons:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchDungeons:', error);
    return [];
  }
};

// Create a new dungeon in Supabase
export const createDungeon = async (dungeon: Omit<Dungeon, 'id' | 'created_at'>): Promise<Dungeon | null> => {
  try {
    const { data, error } = await supabase
      .from('dungeons')
      .insert([dungeon])
      .select()
      .single();

    if (error) {
      console.error('Error creating dungeon:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createDungeon:', error);
    return null;
  }
};

// Delete a dungeon from Supabase
export const deleteDungeon = async (dungeonId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('dungeons')
      .delete()
      .eq('id', dungeonId);

    if (error) {
      console.error('Error deleting dungeon:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteDungeon:', error);
    return false;
  }
};
