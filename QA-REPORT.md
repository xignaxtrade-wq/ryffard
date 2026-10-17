# Workflow verification - 2026-10-17

Target: https://ryffard-production.up.railway.app
Database: npqmxtkyhkcochaydknu

## Verified through the published browser UI

- A new synthetic account was provisioned through Supabase Auth administration
  with a reserved example.invalid address; no confirmation email was sent.
  Normal password login succeeded. This does not test public signup email delivery.
- Enabled the private test environment and created PRUEBA - Recorrido funcional
  17 octubre, ten numbers, one fictional prize with no real value.
- Reserved numbers 1 and 2 as PRUEBA Franklin ficticio, with a nonexistent phone
  and the virtual PRUEBA - Sin cobro method. No real bank details were configured.
- Both ticket links and QR images were generated.
- Uploaded an actual PNG test screenshot through the browser file chooser.
  The receipt was linked to both tickets in private Storage.
- Reproduced Object not found when the owner opened the receipt. Fixed the
  Storage SELECT policy to qualify storage.objects.name instead of resolving
  the unqualified name against rifas.name. Reopened the actual signed image.
- Marked only number 1 paid. Ticket and raffle counters updated to one / RD$100
  fictional revenue. No external transaction took place.
- Ran only this private fictional draw through the wheel. Number 1 won; a
  result fingerprint was stored. Unpaid number 2 was cancelled at closure.
- Ticket verification showed payment confirmed. Fixed contradictory receipt
  copy that still said pending review after payment confirmation.
- Disabled the test environment: normal revenue, sold tickets and active
  raffle counts remained zero. Anonymous raffle RPC returned null for its slug.

## Automated checks

`npm run check`: lint, four unit assertions and production build pass.
`scripts/workflow-regression.sql`: 49 database assertions pass after applied
corrections, including actual anon INSERT and owner/other-account SELECT Storage
RLS, reservation validation/expiry, plan caps, payment permissions/idempotency,
draw timing/paid-only eligibility and private-data isolation. Fixtures roll back.

## Retained fictional records

One QA Auth/profile identity: d6d36b20-4a5d-41c8-8f3e-b4967a588183.
One private completed raffle: recorrido-funcional-17-octubre-1792212151209.
Two tickets (one paid, one cancelled), one uploaded PNG and one draw result.
These are clearly named PRUEBA and retained for inspection, not real business.
No prior records were removed. No password, session token or signed URL is stored
in this report or committed files. Ronny's Chrome session was not replaced.

## Limits

The private test environment shares the same project with ownership checks; it
is not separate hosting or a separate database. Database tests exercise time
boundaries without waiting 24 hours in the browser. This is not load/concurrency
testing or independent certification of randomness. Real bank settlement,
public signup/recovery email delivery, historical-data recovery, optional AI
credentials, physical tombola result entry and prize delivery remain separate
verification or implementation tasks. No claim of 100 percent completion.
