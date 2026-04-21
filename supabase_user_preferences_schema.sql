-- Table pour l'Espace Personnel B2C (Point Zéro, Kiosque, Tags)

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Localisation (Point Zéro)
  default_lat FLOAT,
  default_lon FLOAT,
  default_address TEXT,
  default_insee JSONB,
  
  -- Kiosque (Widgets persistants ouverts sur le Hub)
  active_widgets JSONB DEFAULT '["fuel"]'::jsonb,
  
  -- Veille (Tags suivis, ex: ["#ZFE", "#Subvention"])
  tags_suivis JSONB DEFAULT '[]'::jsonb
);

-- Sécurité Row Level Security (RLS)
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Politiques (Chaque utilisateur ne voit/modifie que SON espace personnel)
CREATE POLICY "Users can insert their own preferences" 
ON public.user_preferences FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own preferences" 
ON public.user_preferences FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can read their own preferences" 
ON public.user_preferences FOR SELECT 
USING (auth.uid() = id);
