-- ==============================================================================
-- REDRIDE: Schema Inicial do Banco de Dados (Supabase / PostgreSQL)
-- Fase 2: Backend, Autenticação, Carteira e Corridas
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABELAS DE DOMÍNIO
-- ==============================================================================

-- 2.1 Perfil de Colono (vinculado a auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT,
  avatar_color TEXT DEFAULT '#e2602c',
  occupation TEXT DEFAULT 'Colono Pioneiro',
  home_location_id TEXT DEFAULT 'loc-residential',
  preferences JSONB DEFAULT '{
    "preferredCategory": "go",
    "conversationLevel": "balanced",
    "cabinTemperature": 21,
    "music": "ambient",
    "accessibleBoarding": false
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.2 Carteira do Usuário (Martian Credits - MCR)
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(12, 2) NOT NULL DEFAULT 1000.00 CHECK (balance >= 0),
  currency TEXT NOT NULL DEFAULT 'MCR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.3 Transações e Extrato de Créditos
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  ride_id UUID,
  type TEXT NOT NULL CHECK (type IN ('initial_credit', 'ride_debit', 'promo_credit', 'refund', 'topup')),
  amount NUMERIC(12, 2) NOT NULL,
  balance_after NUMERIC(12, 2) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.4 Localidades e Pontos de Interesse (POIs) de Marte
CREATE TABLE IF NOT EXISTS public.locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  type TEXT NOT NULL,
  district TEXT NOT NULL DEFAULT 'Acidália',
  description TEXT NOT NULL,
  map_x NUMERIC(10, 2) NOT NULL,
  map_z NUMERIC(10, 2) NOT NULL,
  position_y NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  highlights TEXT[] DEFAULT '{}',
  facts TEXT[] DEFAULT '{}',
  open_hours TEXT DEFAULT '24 sols por sol',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.5 Veículos e Frota de Rovers
CREATE TABLE IF NOT EXISTS public.vehicles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  plate TEXT NOT NULL,
  model TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('go', 'prime')),
  capacity INTEGER NOT NULL DEFAULT 4,
  paint_color TEXT NOT NULL,
  accent_color TEXT NOT NULL,
  fleet_status TEXT NOT NULL DEFAULT 'active' CHECK (fleet_status IN ('active', 'busy', 'maintenance')),
  battery_level INTEGER NOT NULL DEFAULT 100 CHECK (battery_level BETWEEN 0 AND 100),
  features TEXT[] DEFAULT '{}',
  current_node_id TEXT NOT NULL,
  map_x NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  map_z NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.6 Motoristas de IA da Colônia
CREATE TABLE IF NOT EXISTS public.drivers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  personality_summary TEXT NOT NULL,
  traits TEXT[] NOT NULL DEFAULT '{}',
  bio TEXT NOT NULL,
  specialty TEXT NOT NULL,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
  completed_trips INTEGER NOT NULL DEFAULT 0,
  sols_on_mars INTEGER NOT NULL DEFAULT 100,
  avatar_url TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.7 Corridas e Solicitações de Deslocamento
CREATE TABLE IF NOT EXISTS public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id TEXT REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id TEXT REFERENCES public.drivers(id) ON DELETE SET NULL,
  origin_id TEXT NOT NULL REFERENCES public.locations(id),
  destination_id TEXT NOT NULL REFERENCES public.locations(id),
  category TEXT NOT NULL CHECK (category IN ('go', 'prime')),
  status TEXT NOT NULL DEFAULT 'searching_driver' CHECK (status IN (
    'searching_driver',
    'awaiting_approval',
    'approaching_pickup',
    'boarding',
    'in_progress',
    'completed',
    'cancelled',
    'no_driver_available'
  )),
  estimated_price NUMERIC(10, 2) NOT NULL,
  final_price NUMERIC(10, 2),
  estimated_duration_min INTEGER NOT NULL,
  distance_km NUMERIC(10, 2) NOT NULL,
  approach_route JSONB,
  trip_route JSONB NOT NULL,
  scenario_seed INTEGER NOT NULL DEFAULT 0,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  approved_at TIMESTAMPTZ,
  pickup_eta TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.8 Tentativas e Apresentação de Candidatos de Corrida
CREATE TABLE IF NOT EXISTS public.ride_candidate_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  driver_id TEXT NOT NULL REFERENCES public.drivers(id),
  vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id),
  status TEXT NOT NULL DEFAULT 'presented' CHECK (status IN ('presented', 'approved', 'declined')),
  presented_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  responded_at TIMESTAMPTZ
);

-- 2.9 Registro de Eventos e Telemetria da Corrida
CREATE TABLE IF NOT EXISTS public.ride_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.10 Mensagens do Chat da Corrida
CREATE TABLE IF NOT EXISTS public.ride_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('passenger', 'driver', 'system')),
  content TEXT NOT NULL,
  attachment JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.11 Paradas Adicionais Propostas pela IA (Fase 2 / Preparação Fase 3)
CREATE TABLE IF NOT EXISTS public.ride_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL REFERENCES public.locations(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  extra_duration_min INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. TRIGGERS AUTOMÁTICOS & FUNÇÕES
-- ==============================================================================

-- Função para atualizar coluna updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trigger_wallets_updated_at ON public.wallets;
CREATE TRIGGER trigger_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trigger_rides_updated_at ON public.rides;
CREATE TRIGGER trigger_rides_updated_at
  BEFORE UPDATE ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Trigger de Boas-Vindas: cria perfil, carteira e crédito inicial de 1000 MCR quando novo usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
  v_username TEXT;
  v_wallet_id UUID;
BEGIN
  -- Extrai nome e username dos metadados do auth ou gera fallback
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  v_username := COALESCE(NEW.raw_user_meta_data->>'username', lower(regexp_replace(v_name, '[^a-zA-Z0-9]', '', 'g')));

  -- 1. Cria Perfil
  INSERT INTO public.profiles (id, name, username, email)
  VALUES (NEW.id, v_name, v_username, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  -- 2. Cria Carteira com 1000 MCR
  INSERT INTO public.wallets (user_id, balance, currency)
  VALUES (NEW.id, 1000.00, 'MCR')
  RETURNING id INTO v_wallet_id;

  -- 3. Registra Transação de Boas-Vindas no Extrato
  IF v_wallet_id IS NOT NULL THEN
    INSERT INTO public.wallet_transactions (wallet_id, type, amount, balance_after, description)
    VALUES (
      v_wallet_id,
      'initial_credit',
      1000.00,
      1000.00,
      'Créditos de boas-vindas à colônia Nova Acidália'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_candidate_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_stops ENABLE ROW LEVEL SECURITY;

-- 4.1 Locais, Veículos e Motoristas: Leitura pública para autenticados e anônimos
CREATE POLICY "Leitura pública de localidades" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Leitura pública de veículos" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Leitura pública de motoristas" ON public.drivers FOR SELECT USING (true);

-- 4.2 Profiles: Leitura e Edição apenas do próprio usuário
CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4.3 Wallets & Transações: Leitura apenas do dono da carteira
CREATE POLICY "Usuários podem ver sua própria carteira" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem ver suas próprias transações" ON public.wallet_transactions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.wallets w WHERE w.id = wallet_transactions.wallet_id AND w.user_id = auth.uid()));

-- 4.4 Rides & Relacionados: Dono da corrida pode ver e criar
CREATE POLICY "Usuários podem ver suas próprias corridas" ON public.rides FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar corridas" ON public.rides FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar suas corridas" ON public.rides FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver tentativas de suas corridas" ON public.ride_candidate_attempts FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.rides r WHERE r.id = ride_candidate_attempts.ride_id AND r.user_id = auth.uid()));

CREATE POLICY "Usuários podem ver eventos de suas corridas" ON public.ride_events FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.rides r WHERE r.id = ride_events.ride_id AND r.user_id = auth.uid()));

CREATE POLICY "Usuários podem ver mensagens de suas corridas" ON public.ride_messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.rides r WHERE r.id = ride_messages.ride_id AND r.user_id = auth.uid()));
CREATE POLICY "Usuários podem enviar mensagens em suas corridas" ON public.ride_messages FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.rides r WHERE r.id = ride_messages.ride_id AND r.user_id = auth.uid()));

CREATE POLICY "Usuários podem ver paradas de suas corridas" ON public.ride_stops FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.rides r WHERE r.id = ride_stops.ride_id AND r.user_id = auth.uid()));

