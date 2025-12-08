-- Create function to increment view count
CREATE OR REPLACE FUNCTION public.increment_view_count(p_file_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.file_analytics
  SET 
    view_count = COALESCE(view_count, 0) + 1,
    updated_at = now()
  WHERE file_id = p_file_id;
END;
$$;