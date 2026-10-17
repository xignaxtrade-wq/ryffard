# Safe workflow verification

Run `npm run check` for lint, unit tests and the production build.

## Database regression suite

After applying `supabase-workflow-hardening.sql` and `supabase-private-testing.sql`, run the complete contents of
`scripts/workflow-regression.sql` in the SQL editor of the intended project.
Never run selected fragments: the enclosing transaction is the isolation boundary.
The suite creates disposable QA identities, payment instructions, raffles, tickets,
receipt metadata and draw results. It ends with `ROLLBACK`, including Auth rows.
No email is sent, no money moves and no raffle appears to other sessions.
The expected result is 49 passing assertions; any failed assertion aborts the run.
If an error interrupts the transaction, issue `ROLLBACK` before running it again.

This verifies database behavior and an anonymous Storage INSERT policy, not actual
binary uploads or email delivery.

## Private browser test environment

Sign in normally and enable `Entorno de prueba privado` in the dashboard.
Create the test raffle there; its name is prefixed PRUEBA. Open its talonario,
reserve fictional numbers with `PRUEBA - Sin cobro`, upload a clearly fictional
receipt, then confirm it from Ver tickets and run the test draw. Do not use real
personal information or send WhatsApp messages. The test method is virtual and
does not create or modify the owner's real payment methods.

This uses the same Supabase project and login, not separate infrastructure.
RLS and RPC ownership checks hide test raffles, QR data and results from visitors
and other accounts. The dashboard separates test raffles from normal KPIs and
plan limits. Retained browser fixtures must be reported as private test records.

## Production checks

Verify `/healthz`, the deployed Git commit, authenticated navigation, plan labels,
form validation and date/time entry. Keep real sales and draws untouched.
Historical recovery and optional AI credentials are separate deployment tasks.
