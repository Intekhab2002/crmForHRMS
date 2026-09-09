CREATE INDEX IF NOT EXISTS tickets_export_created_at_id_idx
    ON public.tickets USING btree (created_at ASC, id ASC);
