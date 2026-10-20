-- Custom migration (drizzle-kit can't declare functions/triggers) — wear logging moves into the
-- database so concurrent writes can't overwrite each other. The client used to read
-- wear_history, modify it in the browser and write the whole array back, so two writes close
-- together (or an edit-form save holding a stale copy) silently dropped wears.

-- wear_count is always initial_wear_count + number of logged wears. Derived here on every write
-- so no caller can store a stale or inconsistent count.
CREATE OR REPLACE FUNCTION public.sync_wear_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.wear_count := coalesce(NEW.initial_wear_count, 0) + coalesce(cardinality(NEW.wear_history), 0);
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER wardrobe_items_sync_wear_count
  BEFORE INSERT OR UPDATE ON public.wardrobe_items
  FOR EACH ROW EXECUTE FUNCTION public.sync_wear_count();
--> statement-breakpoint

-- Appends one wear (history kept sorted ascending) and returns the new wear_count, or NULL if
-- the item doesn't exist / isn't the caller's. SECURITY INVOKER: RLS still applies.
CREATE OR REPLACE FUNCTION public.add_wear(p_item_id text, p_worn_at timestamptz)
RETURNS integer
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  UPDATE public.wardrobe_items
  SET wear_history = (
        SELECT array_agg(d ORDER BY d)
        FROM unnest(array_append(coalesce(wear_history, '{}'), p_worn_at)) AS d
      ),
      updated_at = now()
  WHERE id = p_item_id
  RETURNING wear_count;
$$;
--> statement-breakpoint

-- Removes one wear logged at p_worn_at (millisecond precision — what the JS client sends) and
-- returns the new wear_count, or NULL if no such wear/item exists for the caller.
CREATE OR REPLACE FUNCTION public.remove_wear(p_item_id text, p_worn_at timestamptz)
RETURNS integer
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  UPDATE public.wardrobe_items
  SET wear_history = coalesce((
        SELECT array_agg(h.d ORDER BY h.ord)
        FROM unnest(wear_history) WITH ORDINALITY AS h(d, ord)
        WHERE h.ord <> (
          SELECT max(m.ord)
          FROM unnest(wear_history) WITH ORDINALITY AS m(d, ord)
          WHERE date_trunc('milliseconds', m.d) = date_trunc('milliseconds', p_worn_at)
        )
      ), '{}'),
      updated_at = now()
  WHERE id = p_item_id
    AND EXISTS (
      SELECT 1 FROM unnest(wear_history) AS e(d)
      WHERE date_trunc('milliseconds', e.d) = date_trunc('milliseconds', p_worn_at)
    )
  RETURNING wear_count;
$$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION public.add_wear(text, timestamptz) FROM PUBLIC, anon;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.remove_wear(text, timestamptz) FROM PUBLIC, anon;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.add_wear(text, timestamptz) TO authenticated;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.remove_wear(text, timestamptz) TO authenticated;
