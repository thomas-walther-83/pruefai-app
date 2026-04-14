-- =============================================================
-- LernortAI – Datenbankschema
-- Berufsschulen Schweiz | Swiss Vocational Schools
-- =============================================================

-- Erweiterungen
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- TABELLEN
-- =============================================================

-- Lehrer-Profile (verknüpft mit auth.users)
CREATE TABLE IF NOT EXISTS lehrer (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT,
    schule      TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Klassen (Schulklassen)
CREATE TABLE IF NOT EXISTS klassen (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lehrer_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    beruf       TEXT NOT NULL,           -- Berufsbezeichnung
    lehrjahr    SMALLINT NOT NULL CHECK (lehrjahr BETWEEN 1 AND 4),
    schuljahr   TEXT NOT NULL,           -- z.B. "2024/2025"
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schüler
CREATE TABLE IF NOT EXISTS schueler (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    nummer      TEXT,                    -- Schülernummer / Lehrlingsnummer
    klasse_id   UUID NOT NULL REFERENCES klassen(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fächer
CREATE TABLE IF NOT EXISTS faecher (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lehrer_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    kuerzel     TEXT NOT NULL,           -- Kurzbezeichnung, z.B. "M", "D", "E"
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fach-Klassen (Many-to-Many: Fächer ↔ Klassen)
CREATE TABLE IF NOT EXISTS fach_klassen (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fach_id     UUID NOT NULL REFERENCES faecher(id) ON DELETE CASCADE,
    klasse_id   UUID NOT NULL REFERENCES klassen(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (fach_id, klasse_id)
);

-- Prüfungen
CREATE TABLE IF NOT EXISTS pruefungen (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lehrer_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    datum           DATE,
    max_punkte      NUMERIC(6,2) NOT NULL DEFAULT 100,
    -- Notenskala als JSON: {"1.0":0,"2.0":10,...,"6.0":100}
    notenskala      JSONB,
    -- Korrekturanweisungen / Aufgabenstellung für die KI
    anweisungen     TEXT,
    fach_id         UUID REFERENCES faecher(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prüfung-Klassen (Many-to-Many: Prüfungen ↔ Klassen)
CREATE TABLE IF NOT EXISTS pruefung_klassen (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pruefung_id UUID NOT NULL REFERENCES pruefungen(id) ON DELETE CASCADE,
    klasse_id   UUID NOT NULL REFERENCES klassen(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (pruefung_id, klasse_id)
);

-- Einträge (Prüfungsergebnisse pro Schüler)
CREATE TABLE IF NOT EXISTS eintraege (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schueler_id     UUID NOT NULL REFERENCES schueler(id) ON DELETE CASCADE,
    pruefung_id     UUID NOT NULL REFERENCES pruefungen(id) ON DELETE CASCADE,
    -- Status: 'offen' | 'hochgeladen' | 'korrigiert' | 'abgeschlossen'
    status          TEXT NOT NULL DEFAULT 'offen'
                        CHECK (status IN ('offen','hochgeladen','korrigiert','abgeschlossen')),
    punkte          NUMERIC(6,2),
    note            NUMERIC(3,2) CHECK (note BETWEEN 1.0 AND 6.0),
    -- Detaillierte Ergebnisse als JSON (Aufgaben, Teilpunkte, KI-Feedback)
    ergebnis        JSONB,
    -- Manuelle Übersteuerung der KI-Note
    note_manuell    NUMERIC(3,2) CHECK (note_manuell BETWEEN 1.0 AND 6.0),
    kommentar       TEXT,
    ki_bewertet_am  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (schueler_id, pruefung_id)
);

-- Seiten-Uploads (Scans / Fotos einer Prüfungsseite)
CREATE TABLE IF NOT EXISTS seiten_uploads (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    eintrag_id      UUID NOT NULL REFERENCES eintraege(id) ON DELETE CASCADE,
    seitennummer    SMALLINT NOT NULL DEFAULT 1,
    storage_pfad    TEXT NOT NULL,       -- Supabase Storage path
    dateiname       TEXT,
    mime_type       TEXT DEFAULT 'image/jpeg',
    groesse_bytes   BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (eintrag_id, seitennummer)
);

-- Lernmaterial (Musterlösungen, Aufgabenstellungen als Dokumente)
CREATE TABLE IF NOT EXISTS lernmaterial (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pruefung_id     UUID REFERENCES pruefungen(id) ON DELETE CASCADE,
    lehrer_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bezeichnung     TEXT NOT NULL,
    storage_pfad    TEXT NOT NULL,       -- Supabase Storage path (Bucket: lernmaterial)
    dateiname       TEXT,
    mime_type       TEXT,
    groesse_bytes   BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- AKTUALISIERUNGS-TRIGGER (updated_at)
-- =============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lehrer_updated_at
    BEFORE UPDATE ON lehrer
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_klassen_updated_at
    BEFORE UPDATE ON klassen
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_schueler_updated_at
    BEFORE UPDATE ON schueler
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_faecher_updated_at
    BEFORE UPDATE ON faecher
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_pruefungen_updated_at
    BEFORE UPDATE ON pruefungen
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_eintraege_updated_at
    BEFORE UPDATE ON eintraege
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: Lehrer-Profil automatisch bei Registrierung anlegen
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO lehrer (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================
-- INDIZES (Performance)
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_klassen_lehrer_id     ON klassen(lehrer_id);
CREATE INDEX IF NOT EXISTS idx_faecher_lehrer_id     ON faecher(lehrer_id);
CREATE INDEX IF NOT EXISTS idx_pruefungen_lehrer_id  ON pruefungen(lehrer_id);
CREATE INDEX IF NOT EXISTS idx_lernmaterial_lehrer   ON lernmaterial(lehrer_id);
CREATE INDEX IF NOT EXISTS idx_lernmaterial_pruefung ON lernmaterial(pruefung_id);
CREATE INDEX IF NOT EXISTS idx_schueler_klasse_id    ON schueler(klasse_id);
CREATE INDEX IF NOT EXISTS idx_fach_klassen_fach_id  ON fach_klassen(fach_id);
CREATE INDEX IF NOT EXISTS idx_fach_klassen_klasse   ON fach_klassen(klasse_id);
CREATE INDEX IF NOT EXISTS idx_pruefung_klassen_pid  ON pruefung_klassen(pruefung_id);
CREATE INDEX IF NOT EXISTS idx_pruefung_klassen_kid  ON pruefung_klassen(klasse_id);
CREATE INDEX IF NOT EXISTS idx_eintraege_schueler    ON eintraege(schueler_id);
CREATE INDEX IF NOT EXISTS idx_eintraege_pruefung    ON eintraege(pruefung_id);
CREATE INDEX IF NOT EXISTS idx_eintraege_status      ON eintraege(status);
CREATE INDEX IF NOT EXISTS idx_seiten_eintrag_id     ON seiten_uploads(eintrag_id);
CREATE INDEX IF NOT EXISTS idx_pruefungen_datum      ON pruefungen(datum);

-- =============================================================
-- ROW LEVEL SECURITY aktivieren
-- =============================================================

ALTER TABLE lehrer           ENABLE ROW LEVEL SECURITY;
ALTER TABLE klassen          ENABLE ROW LEVEL SECURITY;
ALTER TABLE schueler         ENABLE ROW LEVEL SECURITY;
ALTER TABLE faecher          ENABLE ROW LEVEL SECURITY;
ALTER TABLE fach_klassen     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pruefungen       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pruefung_klassen ENABLE ROW LEVEL SECURITY;
ALTER TABLE eintraege        ENABLE ROW LEVEL SECURITY;
ALTER TABLE seiten_uploads   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lernmaterial     ENABLE ROW LEVEL SECURITY;
