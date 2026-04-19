-- Déploiement Babbage : Création du Schéma de séries temporelles pour les Carburants

-- 1. Table dimensionnelle des stations
CREATE TABLE IF NOT EXISTS dim_stations (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('thermique', 'ev')),
    nom TEXT,
    adresse TEXT,
    ville TEXT,
    lat NUMERIC,
    lon NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des faits (Historique des prix)
CREATE TABLE IF NOT EXISTS fact_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id TEXT REFERENCES dim_stations(id) ON DELETE CASCADE,
    carburant TEXT NOT NULL,
    prix NUMERIC,
    date_releve DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(station_id, carburant, date_releve) -- Empêche les doublons pour le même jour
);

-- 3. Indexation pour performances Time-Series
CREATE INDEX IF NOT EXISTS idx_fact_prices_station_date ON fact_prices(station_id, date_releve DESC);
CREATE INDEX IF NOT EXISTS idx_dim_stations_geo ON dim_stations(lat, lon);

-- 4. RLS (Row Level Security) - Optionnel mais recommandé
ALTER TABLE dim_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_prices ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique (L'API lira via Service Role Key, mais au cas où on passe en anonyme)
CREATE POLICY "Lecture publique des stations" ON dim_stations FOR SELECT USING (true);
CREATE POLICY "Lecture publique des prix" ON fact_prices FOR SELECT USING (true);
