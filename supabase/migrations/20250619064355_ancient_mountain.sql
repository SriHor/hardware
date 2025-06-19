/*
  # Fix inventory policies and service calls relationship

  1. Security Updates
    - Add missing RLS policies for inventory table
    - Ensure proper access control for all user roles

  2. Policy Changes
    - Add SELECT policy for inventory table to allow authenticated users to read data
    - Update existing policies to ensure consistency
*/

-- Add SELECT policy for inventory table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'inventory' 
    AND policyname = 'Authenticated users can read inventory'
  ) THEN
    CREATE POLICY "Authenticated users can read inventory"
      ON inventory
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Ensure RLS is enabled on inventory table
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Add policy for anon users to read inventory if needed for public access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'inventory' 
    AND policyname = 'Public can read inventory'
  ) THEN
    CREATE POLICY "Public can read inventory"
      ON inventory
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;