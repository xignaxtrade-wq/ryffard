-- TA' DAO RD: comprobantes privados y tickets QR verificables.
-- Ejecutar una vez en Supabase > SQL Editor.

create extension if not exists pgcrypto;

alter table public.tickets add column if not exists ticket_code text;
alter table public.tickets add column if not exists receipt_uploaded_at timestamptz;

update public.tickets
set ticket_code = 'TDAO-' || upper(substring(md5(id::text), 1, 10))
where ticket_code is null;

alter table public.tickets alter column ticket_code set default
  ('TDAO-' || upper(substring(md5(gen_random_uuid()::text), 1, 10)));
alter table public.tickets alter column ticket_code set not null;
create unique index if not exists tickets_ticket_code_unique on public.tickets (ticket_code);

insert into storage.buckets (id, name, public)
values ('payment-receipts', 'payment-receipts', false)
on conflict (id) do nothing;

drop policy if exists "Participantes suben comprobantes válidos" on storage.objects;
create policy "Participantes suben comprobantes válidos"
on storage.objects for insert to anon, authenticated
with check (
  bucket_id = 'payment-receipts'
  and (storage.foldername(name))[1] = 'receipts'
  and exists (
    select 1 from public.tickets t
    where t.ticket_code = (storage.foldername(name))[2]
      and t.status = 'reserved'
      and t.expires_at > now()
  )
);

drop policy if exists "Organizadores ven sus comprobantes" on storage.objects;
create policy "Organizadores ven sus comprobantes"
on storage.objects for select to authenticated
using (
  bucket_id = 'payment-receipts'
  and exists (
    select 1
    from public.tickets t
    join public.rifas r on r.id = t.rifa_id
    where t.receipt_url = name and r.user_id = (select auth.uid())
  )
);

create or replace function public.attach_ticket_receipt(
  p_ticket_ids uuid[],
  p_ticket_code text,
  p_receipt_path text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(array_length(p_ticket_ids, 1), 0) = 0 then
    raise exception 'No hay tickets para asociar el comprobante';
  end if;
  if p_receipt_path !~ ('^receipts/' || p_ticket_code || '/') then
    raise exception 'Ruta de comprobante inválida';
  end if;
  if not exists (
    select 1 from public.tickets
    where id = any(p_ticket_ids)
      and ticket_code = p_ticket_code
      and status = 'reserved'
      and expires_at > now()
  ) then
    raise exception 'La reserva ya no está disponible';
  end if;

  update public.tickets
  set receipt_url = p_receipt_path, receipt_uploaded_at = now()
  where id = any(p_ticket_ids)
    and status = 'reserved'
    and expires_at > now();
end;
$$;

create or replace function public.public_ticket_details(p_ticket_code text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'ticket_code', t.ticket_code,
    'number', t.numero,
    'status', t.status,
    'receipt_uploaded', t.receipt_url is not null,
    'created_at', t.created_at,
    'rifa', jsonb_build_object(
      'name', r.name,
      'slug', r.slug,
      'prize1', r.prize1,
      'sorteo_date', r.sorteo_date,
      'status', r.status
    ),
    'organizer', jsonb_build_object(
      'brand_name', coalesce(p.brand_name, p.name),
      'brand_logo_url', coalesce(p.brand_logo_url, p.avatar_url)
    )
  )
  from public.tickets t
  join public.rifas r on r.id = t.rifa_id
  join public.profiles p on p.id = r.user_id
  where t.ticket_code = upper(trim(p_ticket_code))
  limit 1;
$$;

revoke all on function public.attach_ticket_receipt(uuid[], text, text) from public;
revoke all on function public.public_ticket_details(text) from public;
grant execute on function public.attach_ticket_receipt(uuid[], text, text) to anon, authenticated;
grant execute on function public.public_ticket_details(text) to anon, authenticated;
