# RyffasRD deployment

Destination repository: https://github.com/xignaxtrade-wq/ryffard

Railway site: https://ryffard-production.up.railway.app

Railway project: f34dc19e-b0e3-4e47-b638-521e025135ca

Railway service: c217e18d-543a-48a7-8dfe-68e7d136d47a

Supabase project: npqmxtkyhkcochaydknu

The complete `supabase-schema.sql` was applied to the new, initially empty
database on 2026-10-16. Verification found five application tables, both
Storage buckets, and the reservation, draw and public ticket RPCs. Public
raffle and draw reads returned HTTP 200.

Historical users, raffle data and uploaded files from the previous Supabase
project have not been recovered. The old project was unreachable. No synthetic
activity was loaded into the new database.

Railway configuration is in `railway.json`. The Node server serves the compiled
frontend, SPA routes, `/healthz` and `/api/cuadre` on the supplied `PORT`.

Required service variables:

- `VITE_SUPABASE_URL` and `SUPABASE_URL`: new Supabase API URL.
- `VITE_SUPABASE_ANON_KEY` and `SUPABASE_ANON_KEY`: new publishable key.
- `VITE_APP_URL`: public HTTPS Railway domain.
- `VITE_SUPPORT_WHATSAPP`: 18099074452.
- `ANTHROPIC_API_KEY`: required only for the AI reconciliation endpoint.

Set the Supabase Auth Site URL to the public Railway URL and allow its
`/reset-password` redirect. Never commit `.env.local` or server secrets.
Both production authentication URLs were configured and verified on 2026-10-16.

Source snapshot includes the RyffasRD name, official logo, red/blue/gold palette,
QR ticket verification and private payment receipts. Local-only caches,
credentials, archived ZIP sources and synthetic activity scripts are excluded.
