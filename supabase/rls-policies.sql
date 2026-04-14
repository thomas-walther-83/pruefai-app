-- =============================================================
-- LernortAI – Row Level Security Policies
-- =============================================================
-- Die App verwendet localStorage für die Authentifizierung.
-- Für den öffentlichen Zugriff (anon key) sind alle Operationen
-- erlaubt. In einer produktiven Umgebung sollten diese Policies
-- durch benutzerbasierte Policies ersetzt werden.
-- =============================================================

-- -------------------------------------------------------------
-- klassen
-- -------------------------------------------------------------
CREATE POLICY "klassen_select_public"
    ON klassen FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "klassen_insert_public"
    ON klassen FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "klassen_update_public"
    ON klassen FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "klassen_delete_public"
    ON klassen FOR DELETE
    TO anon, authenticated
    USING (true);

-- -------------------------------------------------------------
-- schueler
-- -------------------------------------------------------------
CREATE POLICY "schueler_select_public"
    ON schueler FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "schueler_insert_public"
    ON schueler FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "schueler_update_public"
    ON schueler FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "schueler_delete_public"
    ON schueler FOR DELETE
    TO anon, authenticated
    USING (true);

-- -------------------------------------------------------------
-- faecher
-- -------------------------------------------------------------
CREATE POLICY "faecher_select_public"
    ON faecher FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "faecher_insert_public"
    ON faecher FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "faecher_update_public"
    ON faecher FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "faecher_delete_public"
    ON faecher FOR DELETE
    TO anon, authenticated
    USING (true);

-- -------------------------------------------------------------
-- fach_klassen
-- -------------------------------------------------------------
CREATE POLICY "fach_klassen_select_public"
    ON fach_klassen FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "fach_klassen_insert_public"
    ON fach_klassen FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "fach_klassen_update_public"
    ON fach_klassen FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "fach_klassen_delete_public"
    ON fach_klassen FOR DELETE
    TO anon, authenticated
    USING (true);

-- -------------------------------------------------------------
-- pruefungen
-- -------------------------------------------------------------
CREATE POLICY "pruefungen_select_public"
    ON pruefungen FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "pruefungen_insert_public"
    ON pruefungen FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "pruefungen_update_public"
    ON pruefungen FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "pruefungen_delete_public"
    ON pruefungen FOR DELETE
    TO anon, authenticated
    USING (true);

-- -------------------------------------------------------------
-- pruefung_klassen
-- -------------------------------------------------------------
CREATE POLICY "pruefung_klassen_select_public"
    ON pruefung_klassen FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "pruefung_klassen_insert_public"
    ON pruefung_klassen FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "pruefung_klassen_update_public"
    ON pruefung_klassen FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "pruefung_klassen_delete_public"
    ON pruefung_klassen FOR DELETE
    TO anon, authenticated
    USING (true);

-- -------------------------------------------------------------
-- eintraege
-- -------------------------------------------------------------
CREATE POLICY "eintraege_select_public"
    ON eintraege FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "eintraege_insert_public"
    ON eintraege FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "eintraege_update_public"
    ON eintraege FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "eintraege_delete_public"
    ON eintraege FOR DELETE
    TO anon, authenticated
    USING (true);

-- -------------------------------------------------------------
-- seiten_uploads
-- -------------------------------------------------------------
CREATE POLICY "seiten_uploads_select_public"
    ON seiten_uploads FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "seiten_uploads_insert_public"
    ON seiten_uploads FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "seiten_uploads_update_public"
    ON seiten_uploads FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "seiten_uploads_delete_public"
    ON seiten_uploads FOR DELETE
    TO anon, authenticated
    USING (true);

-- =============================================================
-- Supabase Storage – Bucket Policies
-- =============================================================
-- Führe diese Befehle im Supabase Dashboard unter
-- Storage → Policies aus, NACHDEM du den Bucket erstellt hast.
-- Bucket-Name: pruefungsfotos (privat)
-- =============================================================

-- INSERT (Upload)
-- CREATE POLICY "storage_insert_public"
--     ON storage.objects FOR INSERT
--     TO anon, authenticated
--     WITH CHECK (bucket_id = 'pruefungsfotos');

-- SELECT (Download)
-- CREATE POLICY "storage_select_public"
--     ON storage.objects FOR SELECT
--     TO anon, authenticated
--     USING (bucket_id = 'pruefungsfotos');

-- DELETE
-- CREATE POLICY "storage_delete_public"
--     ON storage.objects FOR DELETE
--     TO anon, authenticated
--     USING (bucket_id = 'pruefungsfotos');
