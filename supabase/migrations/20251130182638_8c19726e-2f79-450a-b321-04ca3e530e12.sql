-- Create file_access table to track granular access control
CREATE TABLE IF NOT EXISTS public.file_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  user_address TEXT NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('authorized', 'blacklisted', 'whitelisted')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(file_id, user_address, access_type)
);

-- Create index for faster lookups
CREATE INDEX idx_file_access_file_id ON public.file_access(file_id);
CREATE INDEX idx_file_access_user_address ON public.file_access(user_address);
CREATE INDEX idx_file_access_active ON public.file_access(file_id, user_address) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.file_access ENABLE ROW LEVEL SECURITY;

-- Users can view access records for their own files
CREATE POLICY "Users can view access for their files"
ON public.file_access
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.files
    WHERE files.id = file_access.file_id
    AND files.user_id = auth.uid()
  )
);

-- Users can view their own access grants
CREATE POLICY "Users can view their own access grants"
ON public.file_access
FOR SELECT
USING (user_address IN (
  SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid()
));

-- Users can manage access for their own files
CREATE POLICY "Users can manage access for their files"
ON public.file_access
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.files
    WHERE files.id = file_access.file_id
    AND files.user_id = auth.uid()
  )
);

-- Create file_access_history table to track who accessed files
CREATE TABLE IF NOT EXISTS public.file_access_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  user_address TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download')),
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Create index for history lookups
CREATE INDEX idx_file_access_history_file_id ON public.file_access_history(file_id);
CREATE INDEX idx_file_access_history_user ON public.file_access_history(user_address);

-- Enable RLS
ALTER TABLE public.file_access_history ENABLE ROW LEVEL SECURITY;

-- Users can view access history for their own files
CREATE POLICY "Users can view access history for their files"
ON public.file_access_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.files
    WHERE files.id = file_access_history.file_id
    AND files.user_id = auth.uid()
  )
);

-- Anyone can log access (for tracking)
CREATE POLICY "Anyone can log access"
ON public.file_access_history
FOR INSERT
WITH CHECK (true);