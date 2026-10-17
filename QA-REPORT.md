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

`npm run check`: lint, twenty-one unit tests and production build pass.
`scripts/workflow-regression.sql`: 52 database assertions pass after applied
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

## Registration, recovery and transfer follow-up

Public Auth settings were read without secrets: email sign-in and public signup
are enabled, and email confirmation is required. Site URL is the Railway origin;
the exact /reset-password redirect is allowed. Custom SMTP is disabled. The
connected Resend service has no domains or inboxes available for controlled tests.
Ronny's successful email confirmation is user-reported evidence, not a new
end-to-end delivery test performed by this audit. No test email was sent.

Registration and recovery now share an eight-character minimum. Manual bank
configuration preserves leading zeroes, requires account and holder, and rejects
ambiguous duplicate method names in the UI. Load/delete errors are shown instead
of silently hiding failed operations. No real bank method was created: the owner
must supply bank, account type, holder and actual account number. Public email
delivery remains pending a controlled inbox and production-ready SMTP setup.

The transfer selector now includes Banco BHD (one entry with its legacy alias),
Banco Popular Dominicano, Scotiabank Republica Dominicana and Asociacion Duarte,
alongside previously available institutions. Otro banco requires a name.
Official naming sources and legacy compatibility are documented in BANKS.md.

## Bitcoin and USDT BEP20 reception

Added crypto methods with public receiving address and locally generated QR:
Bitcoin mainnet (legacy, SegWit and Taproot) and USDT on BNB Smart Chain (BEP20).
Bitcoin QR uses a bitcoin: URI without amount. USDT QR contains the public EVM
address, with the BEP20 network explicitly displayed next to it. No automatic
RD$ conversion, payment initiation, signing, private keys or chain monitoring.
The organizer must agree the crypto amount and manually review the receipt.

Bitcoin checksum/network parsing uses bitcoinjs-lib 7.0.4; EVM validation uses
ethers 6.17.0 and rejects malformed checksums and the zero address. Tests decode
both QR payloads using jsQR. RPC regression fixtures exercise crypto method
storage/public details and reservation without automatic payment, then roll back.
Format validation cannot prove wallet ownership or which networks an exchange
supports. No real receiving address was supplied or substituted by this audit.

Dependency installation and clean npm ci succeeded. npm audit still reports
existing dependency alerts, including tar 6.2.1, node-pre-gyp 1.0.11 and router
6.30.4; these versions match the pre-change lockfile. No force-upgrade of unrelated
dependencies was performed. They remain a separate dependency-remediation task.
