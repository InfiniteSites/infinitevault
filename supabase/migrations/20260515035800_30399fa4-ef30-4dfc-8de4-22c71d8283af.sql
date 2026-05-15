
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS blockers text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS last_status text;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS last_checked timestamptz;

ALTER TABLE public.proxies ADD COLUMN IF NOT EXISTS blockers text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.proxies ADD COLUMN IF NOT EXISTS last_status text;
ALTER TABLE public.proxies ADD COLUMN IF NOT EXISTS last_checked timestamptz;
