-- ============================================================
-- SISTEMA PDL — Schema de base de datos
-- Ejecuta este SQL en Supabase > SQL Editor
-- ============================================================

-- Tabla principal de solicitudes
CREATE TABLE requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT UNIQUE NOT NULL,
  exec_name     TEXT NOT NULL,
  exec_email    TEXT NOT NULL,
  store_name    TEXT NOT NULL,
  address       TEXT,
  pdl_count     INT NOT NULL DEFAULT 1,
  priority      TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('alta','media','baja')),
  required_date DATE,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                  'pending','visit-prog','visit-done','quote','svc-prog','svc-done'
                )),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Historial de cambios de estado
CREATE TABLE request_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  status      TEXT NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Archivos adjuntos
CREATE TABLE request_files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  size        BIGINT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX ON requests(status);
CREATE INDEX ON requests(created_at DESC);
CREATE INDEX ON request_history(request_id);
CREATE INDEX ON request_files(request_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Storage: crear bucket (también puedes hacerlo desde la UI)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdl-files', 'pdl-files', true)
ON CONFLICT DO NOTHING;

-- Política: cualquiera puede subir (lo controla el server con service_role)
CREATE POLICY "Uploads via server" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'pdl-files');

-- Política: cualquiera puede leer (archivos públicos)
CREATE POLICY "Public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'pdl-files');

-- RLS: habilitar en tablas
ALTER TABLE requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_files   ENABLE ROW LEVEL SECURITY;

-- Política: el servidor (service_role) puede hacer todo
-- El cliente anon solo puede leer (para la página de seguimiento)
CREATE POLICY "Anon read requests"  ON requests        FOR SELECT USING (true);
CREATE POLICY "Anon read history"   ON request_history FOR SELECT USING (true);
CREATE POLICY "Anon read files"     ON request_files   FOR SELECT USING (true);
