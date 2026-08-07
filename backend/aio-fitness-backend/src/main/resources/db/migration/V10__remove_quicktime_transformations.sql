-- Remove any transformation entries whose media field is a video/quicktime data URL.
-- These were uploaded as .mov files and won't play inline in browsers.
-- Uses Postgres JSON array filtering to keep all other entries intact.
UPDATE site_content
SET value = (
  SELECT COALESCE(
    json_agg(elem ORDER BY ordinality)::text,
    '[]'
  )
  FROM jsonb_array_elements(value::jsonb) WITH ORDINALITY AS t(elem, ordinality)
  WHERE NOT (
    elem->>'mediaType' = 'video'
    AND (elem->>'media') LIKE 'data:video/quicktime%'
  )
)
WHERE key = 'home.transformations'
  AND value IS NOT NULL
  AND value != ''
  AND value::jsonb @> '[]'::jsonb;
