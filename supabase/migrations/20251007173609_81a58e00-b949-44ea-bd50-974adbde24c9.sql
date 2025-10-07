-- Add wallet_address to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE;

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create files table
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  categories TEXT[],
  thumbnail_url TEXT,
  ipfs_cid TEXT NOT NULL,
  cdn_url TEXT,
  blockchain_tx_id TEXT,
  license TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_files_user_id ON public.files(user_id);
CREATE INDEX idx_files_tags ON public.files USING GIN(tags);
CREATE INDEX idx_files_categories ON public.files USING GIN(categories);
CREATE INDEX idx_files_ipfs_cid ON public.files(ipfs_cid);
CREATE INDEX idx_files_created_at ON public.files(created_at DESC);

-- Create file_ratings table
CREATE TABLE public.file_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (file_id, user_id)
);

ALTER TABLE public.file_ratings ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_file_ratings_file_id ON public.file_ratings(file_id);
CREATE INDEX idx_file_ratings_user_id ON public.file_ratings(user_id);

-- Create file_comments table
CREATE TABLE public.file_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_comment_id UUID REFERENCES public.file_comments(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.file_comments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_file_comments_file_id ON public.file_comments(file_id);
CREATE INDEX idx_file_comments_user_id ON public.file_comments(user_id);
CREATE INDEX idx_file_comments_parent_id ON public.file_comments(parent_comment_id);

-- Create file_favorites table
CREATE TABLE public.file_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (file_id, user_id)
);

ALTER TABLE public.file_favorites ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_file_favorites_file_id ON public.file_favorites(file_id);
CREATE INDEX idx_file_favorites_user_id ON public.file_favorites(user_id);

-- Create file_downloads table
CREATE TABLE public.file_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.file_downloads ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_file_downloads_file_id ON public.file_downloads(file_id);
CREATE INDEX idx_file_downloads_user_id ON public.file_downloads(user_id);
CREATE INDEX idx_file_downloads_created_at ON public.file_downloads(created_at DESC);

-- Create user_followers table
CREATE TABLE public.user_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.user_followers ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_user_followers_follower_id ON public.user_followers(follower_id);
CREATE INDEX idx_user_followers_following_id ON public.user_followers(following_id);

-- Create file_analytics table
CREATE TABLE public.file_analytics (
  file_id UUID PRIMARY KEY REFERENCES public.files(id) ON DELETE CASCADE,
  view_count BIGINT DEFAULT 0,
  download_count BIGINT DEFAULT 0,
  favorite_count BIGINT DEFAULT 0,
  comment_count BIGINT DEFAULT 0,
  average_rating DECIMAL(3,2),
  rating_count BIGINT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.file_analytics ENABLE ROW LEVEL SECURITY;

-- Create file_moderation table
CREATE TABLE public.file_moderation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  reporter_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  moderator_notes TEXT,
  moderator_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.file_moderation ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_file_moderation_file_id ON public.file_moderation(file_id);
CREATE INDEX idx_file_moderation_status ON public.file_moderation(status);

-- Create file_seeders table (for P2P)
CREATE TABLE public.file_seeders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  peer_id TEXT NOT NULL,
  ip_address TEXT,
  port INTEGER,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  bytes_uploaded BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.file_seeders ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_file_seeders_file_id ON public.file_seeders(file_id);
CREATE INDEX idx_file_seeders_last_seen ON public.file_seeders(last_seen DESC);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for files
CREATE POLICY "Public files are viewable by everyone"
  ON public.files FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own files"
  ON public.files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files"
  ON public.files FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
  ON public.files FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all files"
  ON public.files FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for file_ratings
CREATE POLICY "Ratings are viewable by everyone"
  ON public.file_ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own ratings"
  ON public.file_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
  ON public.file_ratings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
  ON public.file_ratings FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for file_comments
CREATE POLICY "Comments are viewable by everyone"
  ON public.file_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own comments"
  ON public.file_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.file_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.file_comments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for file_favorites
CREATE POLICY "Users can view their own favorites"
  ON public.file_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON public.file_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON public.file_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for file_downloads
CREATE POLICY "Users can view their own downloads"
  ON public.file_downloads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can log downloads"
  ON public.file_downloads FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all downloads"
  ON public.file_downloads FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_followers
CREATE POLICY "Users can view all follower relationships"
  ON public.user_followers FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own follows"
  ON public.user_followers FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows"
  ON public.user_followers FOR DELETE
  USING (auth.uid() = follower_id);

-- RLS Policies for file_analytics
CREATE POLICY "Analytics are viewable by everyone"
  ON public.file_analytics FOR SELECT
  USING (true);

CREATE POLICY "System can update analytics"
  ON public.file_analytics FOR ALL
  USING (true);

-- RLS Policies for file_moderation
CREATE POLICY "Users can view their own reports"
  ON public.file_moderation FOR SELECT
  USING (auth.uid() = reporter_user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Users can create reports"
  ON public.file_moderation FOR INSERT
  WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY "Moderators can update reports"
  ON public.file_moderation FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- RLS Policies for file_seeders
CREATE POLICY "Seeders are viewable by everyone"
  ON public.file_seeders FOR SELECT
  USING (true);

CREATE POLICY "System can manage seeders"
  ON public.file_seeders FOR ALL
  USING (true);

-- Triggers for updated_at columns
CREATE TRIGGER update_files_updated_at
  BEFORE UPDATE ON public.files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_file_ratings_updated_at
  BEFORE UPDATE ON public.file_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_file_comments_updated_at
  BEFORE UPDATE ON public.file_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_file_moderation_updated_at
  BEFORE UPDATE ON public.file_moderation
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to initialize file analytics
CREATE OR REPLACE FUNCTION public.initialize_file_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.file_analytics (file_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER initialize_file_analytics_trigger
  AFTER INSERT ON public.files
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_file_analytics();

-- Function to update analytics on rating
CREATE OR REPLACE FUNCTION public.update_file_analytics_on_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.file_analytics
  SET 
    average_rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM public.file_ratings
      WHERE file_id = COALESCE(NEW.file_id, OLD.file_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.file_ratings
      WHERE file_id = COALESCE(NEW.file_id, OLD.file_id)
    ),
    updated_at = now()
  WHERE file_id = COALESCE(NEW.file_id, OLD.file_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_analytics_on_rating_insert
  AFTER INSERT ON public.file_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_file_analytics_on_rating();

CREATE TRIGGER update_analytics_on_rating_update
  AFTER UPDATE ON public.file_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_file_analytics_on_rating();

CREATE TRIGGER update_analytics_on_rating_delete
  AFTER DELETE ON public.file_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_file_analytics_on_rating();

-- Function to update favorite count
CREATE OR REPLACE FUNCTION public.update_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.file_analytics
  SET 
    favorite_count = (
      SELECT COUNT(*)
      FROM public.file_favorites
      WHERE file_id = COALESCE(NEW.file_id, OLD.file_id)
    ),
    updated_at = now()
  WHERE file_id = COALESCE(NEW.file_id, OLD.file_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_favorite_count_insert
  AFTER INSERT ON public.file_favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_favorite_count();

CREATE TRIGGER update_favorite_count_delete
  AFTER DELETE ON public.file_favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_favorite_count();

-- Function to update download count
CREATE OR REPLACE FUNCTION public.update_download_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.file_analytics
  SET 
    download_count = download_count + 1,
    updated_at = now()
  WHERE file_id = NEW.file_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_download_count_trigger
  AFTER INSERT ON public.file_downloads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_download_count();

-- Function to update comment count
CREATE OR REPLACE FUNCTION public.update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.file_analytics
  SET 
    comment_count = (
      SELECT COUNT(*)
      FROM public.file_comments
      WHERE file_id = COALESCE(NEW.file_id, OLD.file_id)
    ),
    updated_at = now()
  WHERE file_id = COALESCE(NEW.file_id, OLD.file_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_comment_count_insert
  AFTER INSERT ON public.file_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comment_count();

CREATE TRIGGER update_comment_count_delete
  AFTER DELETE ON public.file_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comment_count();