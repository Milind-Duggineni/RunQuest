-- Phase 1: Schema modifications in a single transaction
BEGIN;

-- Create the table if it doesn't exist (minimal schema)
CREATE TABLE IF NOT EXISTS public.dungeons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
);

-- Add name column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'dungeons' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE public.dungeons ADD COLUMN name TEXT;
        UPDATE public.dungeons SET name = 'Adventure Awaits' WHERE name IS NULL;
        ALTER TABLE public.dungeons ALTER COLUMN name SET NOT NULL;
    END IF;
END
$$;

-- Add level column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'dungeons' 
        AND column_name = 'level'
    ) THEN
        ALTER TABLE public.dungeons ADD COLUMN INTEGER NOT NULL DEFAULT 1;
    END IF;
END
$$;

-- Add image_url column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'dungeons' 
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE public.dungeons ADD COLUMN image_url TEXT NOT NULL DEFAULT 'default.png';
    END IF;
END
$$;

-- Add description column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'dungeons' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE public.dungeons ADD COLUMN description TEXT;
    END IF;
END
$$;

-- Add rewards column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'dungeons' 
        AND column_name = 'rewards'
    ) THEN
        ALTER TABLE public.dungeons ADD COLUMN rewards JSONB NOT NULL DEFAULT '[]'::jsonb;
    END IF;
END
$$;

-- Add difficulty_modifier column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'dungeons' 
        AND column_name = 'difficulty_modifier'
    ) THEN
        ALTER TABLE public.dungeons ADD COLUMN difficulty_modifier FLOAT NOT NULL DEFAULT 1.0;
    END IF;
END
$$;

-- Add created_at column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'dungeons' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.dungeons ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END
$$;

-- Add updated_at column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'dungeons' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.dungeons ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        -- Backfill updated_at for existing rows
        UPDATE public.dungeons SET updated_at = COALESCE(created_at, NOW()) WHERE updated_at IS NULL;
    END IF;
END
$$;

-- Commit all schema modifications
COMMIT;

-- Phase 2: Functions and triggers in a new transaction
BEGIN;

-- Create or replace the function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the function has the correct owner and permissions
ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated, anon, service_role;

-- Commit the function creation
COMMIT;

-- Start a new transaction for the trigger
BEGIN;

-- Create the trigger for updating timestamps
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_dungeons_updated_at'
  ) THEN
    CREATE TRIGGER update_dungeons_updated_at
    BEFORE UPDATE ON public.dungeons
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

-- Commit the trigger creation
COMMIT;

-- Start a new transaction for indexes
BEGIN;

-- Create indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE tablename = 'dungeons' AND indexname = 'idx_dungeons_level'
  ) THEN
    CREATE INDEX idx_dungeons_level ON public.dungeons(level);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE tablename = 'dungeons' AND indexname = 'idx_dungeons_created_at'
  ) THEN
    CREATE INDEX idx_dungeons_created_at ON public.dungeons(created_at);
  END IF;
END
$$;

-- Commit the indexes
COMMIT;

-- Start a new transaction for RLS
BEGIN;

-- Enable Row Level Security if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public' 
    AND tablename = 'dungeons' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.dungeons ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Commit the RLS changes
COMMIT;

-- Start a new transaction for policies
BEGIN;

-- Create read access policy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'dungeons' AND policyname = 'Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" 
    ON public.dungeons 
    FOR SELECT 
    TO authenticated, anon 
    USING (true);
  END IF;
END
$$;

-- Commit the policy changes
COMMIT;

-- Start a new transaction for the random dungeon function
BEGIN;

-- Create or replace the function to generate a random dungeon
CREATE OR REPLACE FUNCTION public.generate_random_dungeon()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  dungeon_types TEXT[] := ARRAY['fire', 'ice', 'shadow', 'vine'];
  reward_types TEXT[] := ARRAY['Gold', 'XP', 'Gear'];
  dungeon_type TEXT;
  dungeon_name TEXT;
  dungeon_description TEXT;
  dungeon_level INTEGER;
  difficulty_modifier FLOAT;
  rewards JSONB;
  new_dungeon JSONB;
BEGIN
  -- Randomly select a dungeon type
  dungeon_type := dungeon_types[1 + floor(random() * array_length(dungeon_types, 1))];
  
  -- Generate a random level between 1 and 100
  dungeon_level := 1 + floor(random() * 100)::integer;
  
  -- Set difficulty based on level
  difficulty_modifier := 1.0 + (dungeon_level * 0.1);
  
  -- Generate appropriate name and description based on type
  CASE dungeon_type
    WHEN 'fire' THEN
      dungeon_name := 'The Ember Caves - Level ' || dungeon_level;
      dungeon_description := 'Face off against fire wraiths in scorching tunnels.';
    WHEN 'ice' THEN
      dungeon_name := 'Frostbite Peak - Level ' || dungeon_level;
      dungeon_description := 'Scale icy cliffs and battle frozen giants.';
    WHEN 'shadow' THEN
      dungeon_name := 'Shadowfell Crypt - Level ' || dungeon_level;
      dungeon_description := 'Delve into the abyss, where dark entities lurk.';
    WHEN 'vine' THEN
      dungeon_name := 'Whispering Mire - Level ' || dungeon_level;
      dungeon_description := 'Navigate treacherous bogs guarded by ancient spirits.';
  END CASE;
  
  -- Generate random rewards
  rewards := (
    SELECT jsonb_agg(
      jsonb_build_object(
        'type', reward_types[1 + floor(random() * array_length(reward_types, 1))],
        'value', CASE 
          WHEN random() > 0.7 THEN 'Rare'
          WHEN random() > 0.4 THEN 'Uncommon'
          ELSE 'Common'
        END
      )
    )
    FROM generate_series(1, 1 + floor(random() * 3)::integer)
  );
  
  -- Insert the new dungeon
  INSERT INTO public.dungeons (
    name, 
    level, 
    description, 
    image_url, 
    rewards, 
    difficulty_modifier
  ) VALUES (
    dungeon_name,
    dungeon_level,
    dungeon_description,
    dungeon_type,
    rewards,
    difficulty_modifier
  )
  RETURNING to_jsonb(public.dungeons.*) INTO new_dungeon;
  
  RETURN new_dungeon;
END;
$$;
