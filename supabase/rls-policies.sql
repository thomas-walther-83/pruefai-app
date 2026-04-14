-- =============================================================
-- LernortAI – Row Level Security Policies
-- =============================================================
-- Alle Policies basieren auf Supabase Auth (auth.uid()).
-- Jeder Lehrer sieht und verwaltet nur seine eigenen Daten.
-- =============================================================

-- -------------------------------------------------------------
-- lehrer (eigenes Profil)
-- -------------------------------------------------------------
CREATE POLICY "lehrer_select_own"
    ON lehrer FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "lehrer_insert_own"
    ON lehrer FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

CREATE POLICY "lehrer_update_own"
    ON lehrer FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- -------------------------------------------------------------
-- klassen (direkte lehrer_id-Spalte)
-- -------------------------------------------------------------
CREATE POLICY "klassen_select_own"
    ON klassen FOR SELECT
    TO authenticated
    USING (lehrer_id = auth.uid());

CREATE POLICY "klassen_insert_own"
    ON klassen FOR INSERT
    TO authenticated
    WITH CHECK (lehrer_id = auth.uid());

CREATE POLICY "klassen_update_own"
    ON klassen FOR UPDATE
    TO authenticated
    USING (lehrer_id = auth.uid())
    WITH CHECK (lehrer_id = auth.uid());

CREATE POLICY "klassen_delete_own"
    ON klassen FOR DELETE
    TO authenticated
    USING (lehrer_id = auth.uid());

-- -------------------------------------------------------------
-- schueler (über klassen.lehrer_id)
-- -------------------------------------------------------------
CREATE POLICY "schueler_select_own"
    ON schueler FOR SELECT
    TO authenticated
    USING (klasse_id IN (SELECT id FROM klassen WHERE lehrer_id = auth.uid()));

CREATE POLICY "schueler_insert_own"
    ON schueler FOR INSERT
    TO authenticated
    WITH CHECK (klasse_id IN (SELECT id FROM klassen WHERE lehrer_id = auth.uid()));

CREATE POLICY "schueler_update_own"
    ON schueler FOR UPDATE
    TO authenticated
    USING (klasse_id IN (SELECT id FROM klassen WHERE lehrer_id = auth.uid()))
    WITH CHECK (klasse_id IN (SELECT id FROM klassen WHERE lehrer_id = auth.uid()));

CREATE POLICY "schueler_delete_own"
    ON schueler FOR DELETE
    TO authenticated
    USING (klasse_id IN (SELECT id FROM klassen WHERE lehrer_id = auth.uid()));

-- -------------------------------------------------------------
-- faecher (direkte lehrer_id-Spalte)
-- -------------------------------------------------------------
CREATE POLICY "faecher_select_own"
    ON faecher FOR SELECT
    TO authenticated
    USING (lehrer_id = auth.uid());

CREATE POLICY "faecher_insert_own"
    ON faecher FOR INSERT
    TO authenticated
    WITH CHECK (lehrer_id = auth.uid());

CREATE POLICY "faecher_update_own"
    ON faecher FOR UPDATE
    TO authenticated
    USING (lehrer_id = auth.uid())
    WITH CHECK (lehrer_id = auth.uid());

CREATE POLICY "faecher_delete_own"
    ON faecher FOR DELETE
    TO authenticated
    USING (lehrer_id = auth.uid());

-- -------------------------------------------------------------
-- fach_klassen (über klassen.lehrer_id)
-- -------------------------------------------------------------
CREATE POLICY "fach_klassen_select_own"
    ON fach_klassen FOR SELECT
    TO authenticated
    USING (klasse_id IN (SELECT id FROM klassen WHERE lehrer_id = auth.uid()));

CREATE POLICY "fach_klassen_insert_own"
    ON fach_klassen FOR INSERT
    TO authenticated
    WITH CHECK (klasse_id IN (SELECT id FROM klassen WHERE lehrer_id = auth.uid()));

CREATE POLICY "fach_klassen_update_own"
    ON fach_klassen FOR UPDATE
    TO authenticated
    USING (klasse_id IN (SELECT id FROM klassen WHERE lehrer_id = auth.uid()))
    WITH CHECK (klasse_id IN (SELECT id FROM klassen WHERE lehrer_id = auth.uid()));

CREATE POLICY "fach_klassen_delete_own"
    ON fach_klassen FOR DELETE
    TO authenticated
    USING (klasse_id IN (SELECT id FROM klassen WHERE lehrer_id = auth.uid()));

-- -------------------------------------------------------------
-- pruefungen (direkte lehrer_id-Spalte)
-- -------------------------------------------------------------
CREATE POLICY "pruefungen_select_own"
    ON pruefungen FOR SELECT
    TO authenticated
    USING (lehrer_id = auth.uid());

CREATE POLICY "pruefungen_insert_own"
    ON pruefungen FOR INSERT
    TO authenticated
    WITH CHECK (lehrer_id = auth.uid());

CREATE POLICY "pruefungen_update_own"
    ON pruefungen FOR UPDATE
    TO authenticated
    USING (lehrer_id = auth.uid())
    WITH CHECK (lehrer_id = auth.uid());

CREATE POLICY "pruefungen_delete_own"
    ON pruefungen FOR DELETE
    TO authenticated
    USING (lehrer_id = auth.uid());

-- -------------------------------------------------------------
-- pruefung_klassen (über pruefungen.lehrer_id)
-- -------------------------------------------------------------
CREATE POLICY "pruefung_klassen_select_own"
    ON pruefung_klassen FOR SELECT
    TO authenticated
    USING (pruefung_id IN (SELECT id FROM pruefungen WHERE lehrer_id = auth.uid()));

CREATE POLICY "pruefung_klassen_insert_own"
    ON pruefung_klassen FOR INSERT
    TO authenticated
    WITH CHECK (pruefung_id IN (SELECT id FROM pruefungen WHERE lehrer_id = auth.uid()));

CREATE POLICY "pruefung_klassen_update_own"
    ON pruefung_klassen FOR UPDATE
    TO authenticated
    USING (pruefung_id IN (SELECT id FROM pruefungen WHERE lehrer_id = auth.uid()))
    WITH CHECK (pruefung_id IN (SELECT id FROM pruefungen WHERE lehrer_id = auth.uid()));

CREATE POLICY "pruefung_klassen_delete_own"
    ON pruefung_klassen FOR DELETE
    TO authenticated
    USING (pruefung_id IN (SELECT id FROM pruefungen WHERE lehrer_id = auth.uid()));

-- -------------------------------------------------------------
-- eintraege (über pruefungen.lehrer_id)
-- -------------------------------------------------------------
CREATE POLICY "eintraege_select_own"
    ON eintraege FOR SELECT
    TO authenticated
    USING (pruefung_id IN (SELECT id FROM pruefungen WHERE lehrer_id = auth.uid()));

CREATE POLICY "eintraege_insert_own"
    ON eintraege FOR INSERT
    TO authenticated
    WITH CHECK (pruefung_id IN (SELECT id FROM pruefungen WHERE lehrer_id = auth.uid()));

CREATE POLICY "eintraege_update_own"
    ON eintraege FOR UPDATE
    TO authenticated
    USING (pruefung_id IN (SELECT id FROM pruefungen WHERE lehrer_id = auth.uid()))
    WITH CHECK (pruefung_id IN (SELECT id FROM pruefungen WHERE lehrer_id = auth.uid()));

CREATE POLICY "eintraege_delete_own"
    ON eintraege FOR DELETE
    TO authenticated
    USING (pruefung_id IN (SELECT id FROM pruefungen WHERE lehrer_id = auth.uid()));

-- -------------------------------------------------------------
-- seiten_uploads (über eintraege → pruefungen.lehrer_id)
-- -------------------------------------------------------------
CREATE POLICY "seiten_uploads_select_own"
    ON seiten_uploads FOR SELECT
    TO authenticated
    USING (eintrag_id IN (
        SELECT id FROM eintraege
        WHERE pruefung_id IN (SELECT id FROM pruefungen WHERE lehrer_id = auth.uid())
    ));

CREATE POLICY "seiten_uploads_insert_own"
    ON seiten_uploads FOR INSERT
    TO authenticated
    WITH CHECK (eintrag_id IN (
        SELECT id FROM eintraege
        WHERE pruefung_id IN (SELECT id FROM pruefungen WHERE lehrer_id = auth.uid())
    ));

CREATE POLICY "seiten_uploads_update_own"
    ON seiten_uploads FOR UPDATE
    TO authenticated
    USING (eintrag_id IN (
        SELECT id FROM eintraege
        WHERE pruefung_id IN (SELECT id FROM pruefungen WHERE lehrer_id = auth.uid())
    ))
    WITH CHECK (eintrag_id IN (
        SELECT id FROM eintraege
        WHERE pruefung_id IN (SELECT id FROM pruefungen WHERE lehrer_id = auth.uid())
    ));

CREATE POLICY "seiten_uploads_delete_own"
    ON seiten_uploads FOR DELETE
    TO authenticated
    USING (eintrag_id IN (
        SELECT id FROM eintraege
        WHERE pruefung_id IN (SELECT id FROM pruefungen WHERE lehrer_id = auth.uid())
    ));

-- -------------------------------------------------------------
-- lernmaterial (direkte lehrer_id-Spalte)
-- -------------------------------------------------------------
CREATE POLICY "lernmaterial_select_own"
    ON lernmaterial FOR SELECT
    TO authenticated
    USING (lehrer_id = auth.uid());

CREATE POLICY "lernmaterial_insert_own"
    ON lernmaterial FOR INSERT
    TO authenticated
    WITH CHECK (lehrer_id = auth.uid());

CREATE POLICY "lernmaterial_update_own"
    ON lernmaterial FOR UPDATE
    TO authenticated
    USING (lehrer_id = auth.uid())
    WITH CHECK (lehrer_id = auth.uid());

CREATE POLICY "lernmaterial_delete_own"
    ON lernmaterial FOR DELETE
    TO authenticated
    USING (lehrer_id = auth.uid());

-- =============================================================
-- Supabase Storage – Bucket Policies
-- =============================================================
-- Führe diese Befehle im Supabase Dashboard unter
-- Storage → Policies aus, NACHDEM du die Buckets erstellt hast.
--
-- Bucket "pruefungsfotos" (privat):
-- Jeder Lehrer hat einen eigenen Ordner: {user_id}/...
--
-- Bucket "lernmaterial" (privat):
-- Jeder Lehrer hat einen eigenen Ordner: {user_id}/...
-- =============================================================

-- Bucket: pruefungsfotos
-- INSERT
-- CREATE POLICY "storage_pruefungsfotos_insert_own"
--     ON storage.objects FOR INSERT
--     TO authenticated
--     WITH CHECK (
--         bucket_id = 'pruefungsfotos'
--         AND (storage.foldername(name))[1] = auth.uid()::text
--     );

-- SELECT
-- CREATE POLICY "storage_pruefungsfotos_select_own"
--     ON storage.objects FOR SELECT
--     TO authenticated
--     USING (
--         bucket_id = 'pruefungsfotos'
--         AND (storage.foldername(name))[1] = auth.uid()::text
--     );

-- DELETE
-- CREATE POLICY "storage_pruefungsfotos_delete_own"
--     ON storage.objects FOR DELETE
--     TO authenticated
--     USING (
--         bucket_id = 'pruefungsfotos'
--         AND (storage.foldername(name))[1] = auth.uid()::text
--     );

-- Bucket: lernmaterial
-- INSERT
-- CREATE POLICY "storage_lernmaterial_insert_own"
--     ON storage.objects FOR INSERT
--     TO authenticated
--     WITH CHECK (
--         bucket_id = 'lernmaterial'
--         AND (storage.foldername(name))[1] = auth.uid()::text
--     );

-- SELECT
-- CREATE POLICY "storage_lernmaterial_select_own"
--     ON storage.objects FOR SELECT
--     TO authenticated
--     USING (
--         bucket_id = 'lernmaterial'
--         AND (storage.foldername(name))[1] = auth.uid()::text
--     );

-- DELETE
-- CREATE POLICY "storage_lernmaterial_delete_own"
--     ON storage.objects FOR DELETE
--     TO authenticated
--     USING (
--         bucket_id = 'lernmaterial'
--         AND (storage.foldername(name))[1] = auth.uid()::text
--     );
