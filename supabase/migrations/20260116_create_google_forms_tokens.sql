-- Migration: Create google_forms_tokens table for storing Google Forms OAuth tokens
-- Run this migration in your Supabase SQL Editor or via CLI

-- Create the table
CREATE TABLE IF NOT EXISTS public.google_forms_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expiry_date TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_google_forms_tokens_user_id ON public.google_forms_tokens(user_id);

-- Enable Row Level Security
ALTER TABLE public.google_forms_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own tokens
CREATE POLICY "Users can view their own tokens" 
  ON public.google_forms_tokens
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own tokens
CREATE POLICY "Users can insert their own tokens" 
  ON public.google_forms_tokens
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tokens
CREATE POLICY "Users can update their own tokens" 
  ON public.google_forms_tokens
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own tokens
CREATE POLICY "Users can delete their own tokens" 
  ON public.google_forms_tokens
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_google_forms_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_update_google_forms_tokens_updated_at ON public.google_forms_tokens;
CREATE TRIGGER trigger_update_google_forms_tokens_updated_at
  BEFORE UPDATE ON public.google_forms_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_google_forms_tokens_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.google_forms_tokens TO authenticated;
GRANT ALL ON public.google_forms_tokens TO service_role;
