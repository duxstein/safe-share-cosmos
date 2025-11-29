-- Create organization_members table
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  department TEXT,
  email TEXT,
  wallet_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, employee_id)
);

-- Enable Row Level Security
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Create policies for organization_members
CREATE POLICY "Users can view their own organization members"
ON public.organization_members
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own organization members"
ON public.organization_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own organization members"
ON public.organization_members
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own organization members"
ON public.organization_members
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_organization_members_updated_at
BEFORE UPDATE ON public.organization_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();