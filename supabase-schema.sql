-- =============================================
-- RyffasRD - Schema completo para Supabase
-- Ejecutar en: Supabase > SQL Editor > New Query
-- Seguro de re-ejecutar (IF NOT EXISTS + OR REPLACE)
-- =============================================

-- 1. PROFILES
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null,
  avatar_url  text,
  plan        text not null default 'demo',
  ref_code      text unique default substring(md5(random()::text), 1, 8),
  is_superadmin boolean default false,
  created_at    timestamptz default now()
);

alter table public.profiles enable row level security;
drop policy if exists "Users see own profile"    on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users see own profile"    on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

-- Función para verificar si un usuario es super admin
create or replace function public.is_superadmin()
returns boolean language sql security definer as $$
  select is_superadmin from public.profiles where id = auth.uid();
$$;

drop policy if exists "Superadmins ven perfiles" on public.profiles;
drop policy if exists "Superadmins actualizan perfiles" on public.profiles;
create policy "Superadmins ven perfiles" on public.profiles for select using ( public.is_superadmin() );
create policy "Superadmins actualizan perfiles" on public.profiles for update using ( public.is_superadmin() );

-- 2. RIFAS
create table if not exists public.rifas (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  description  text,
  category     text not null default 'other',
  prize1       text not null,
  prize2       text,
  prize3       text,
  total        int not null default 100,
  price        numeric(10,2) not null default 150,
  sold         int not null default 0,
  status       text not null default 'active',
  sorteo_date  timestamptz,
  slug         text unique,
  image_url    text,
  gallery_urls text[] default '{}',
  created_at   timestamptz default now()
);

alter table public.rifas add column if not exists category text not null default 'other';
alter table public.rifas drop constraint if exists rifas_category_valid;
alter table public.rifas add constraint rifas_category_valid check (category in (
  'vehicles', 'motorcycles', 'technology', 'cash', 'home', 'real_estate',
  'travel', 'appliances', 'experiences', 'charity', 'other'
));

alter table public.rifas add column if not exists is_test boolean not null default false;
alter table public.rifas enable row level security;
drop policy if exists "Owners manage rifas" on public.rifas;
drop policy if exists "Public view active"  on public.rifas;
create policy "Owners manage rifas" on public.rifas for all    using (auth.uid() = user_id);
create policy "Public view active"  on public.rifas for select using (status = 'active');

-- 3. TICKETS
create table if not exists public.tickets (
  id           uuid primary key default gen_random_uuid(),
  rifa_id      uuid not null references public.rifas(id) on delete cascade,
  numero       int not null,
  buyer_name   text not null,
  buyer_phone  text not null,
  buyer_email  text,
  status       text not null default 'reserved',
  ref_code     text,
  receipt_url  text,
  expires_at   timestamptz default (now() + interval '24 hours'),
  created_at   timestamptz default now(),
  unique (rifa_id, numero)
);

alter table public.tickets enable row level security;
drop policy if exists "Owners see tickets"   on public.tickets;
drop policy if exists "Public insert tickets" on public.tickets;
create policy "Owners see tickets" on public.tickets for select
  using (exists (select 1 from public.rifas where rifas.id = tickets.rifa_id and rifas.user_id = auth.uid()));
create policy "Public insert tickets" on public.tickets for insert with check (true);

-- 4. SORTEOS (historial público)
create table if not exists public.sorteos (
  id            uuid primary key default gen_random_uuid(),
  rifa_id       uuid references public.rifas(id),
  rifa_name     text not null,
  winner        text not null,
  prize2        text,
  prize3        text,
  total_tickets int,
  drawn_at      timestamptz default now()
);

alter table public.sorteos enable row level security;
drop policy if exists "Public view sorteos" on public.sorteos;
create policy "Public view sorteos" on public.sorteos for select using (true);

-- 5. FUNCIÓN: auto-crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. PAYMENT METHODS (métodos de pago por organizador)
create table if not exists public.payment_methods (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  type       text not null default 'custom',   -- 'bank' | 'paypal' | 'custom'
  details    jsonb,                             -- { account_type, account_number, holder } | { email }
  created_at timestamptz default now()
);

alter table public.payment_methods enable row level security;
drop policy if exists "Owners manage payment methods" on public.payment_methods;
drop policy if exists "Public view payment methods"  on public.payment_methods;
create policy "Owners manage payment methods" on public.payment_methods for all    using (auth.uid() = user_id);
create policy "Public view payment methods"  on public.payment_methods for select using (true);

-- Columnas adicionales si se ejecuta sobre schema existente
alter table public.payment_methods add column if not exists type    text not null default 'custom';
alter table public.payment_methods add column if not exists details jsonb;

-- Agregar columna payment_method a tickets (si no existe)
alter table public.tickets add column if not exists payment_method text;
alter table public.tickets add column if not exists ticket_code text;
alter table public.tickets add column if not exists receipt_uploaded_at timestamptz;

-- Cada ticket tiene un código público que permite validar su autenticidad sin
-- exponer información privada del comprador.
update public.tickets
set ticket_code = 'TDAO-' || upper(substring(md5(id::text), 1, 10))
where ticket_code is null;

alter table public.tickets alter column ticket_code set default
  ('TDAO-' || upper(substring(md5(gen_random_uuid()::text), 1, 10)));
alter table public.tickets alter column ticket_code set not null;
create unique index if not exists tickets_ticket_code_unique on public.tickets (ticket_code);

-- Agregar columna phone a profiles (si no existe)
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists brand_name text;
alter table public.profiles add column if not exists brand_logo_url text;
alter table public.profiles add column if not exists brand_cover_url text;
alter table public.profiles add column if not exists brand_primary_color text default '#D90B24';
alter table public.profiles add column if not exists brand_secondary_color text default '#FFC400';

-- Columna referred_by en profiles (si no existe)
alter table public.profiles add column if not exists referred_by text;

-- 7. FUNCIÓN: liberar tickets expirados (cron job)
create or replace function public.release_expired_tickets()
returns void language sql security definer as $$
  update public.tickets
  set status = 'cancelled'
  where status = 'reserved' and expires_at < now();
$$;

-- 8. CRON: ejecutar liberación de tickets cada 30 minutos
-- Requiere extensión pg_cron habilitada en Supabase
-- Ejecutar manualmente en SQL Editor si aún no está activo:
--
-- select cron.schedule(
--   'release-expired-tickets',
--   '*/30 * * * *',
--   'select public.release_expired_tickets()'
-- );

-- 9. STORAGE: Bucket para imágenes de las rifas
insert into storage.buckets (id, name, public) 
values ('rifa-images', 'rifa-images', true)
on conflict (id) do nothing;

-- Políticas de Storage
drop policy if exists "Imágenes públicas" on storage.objects;
create policy "Imágenes públicas" 
on storage.objects for select 
using ( bucket_id = 'rifa-images' );

drop policy if exists "Usuarios autenticados pueden subir imágenes" on storage.objects;
create policy "Usuarios autenticados pueden subir imágenes" 
on storage.objects for insert 
with check ( bucket_id = 'rifa-images' and auth.role() = 'authenticated' );

drop policy if exists "Usuarios pueden editar sus propias imágenes" on storage.objects;
create policy "Usuarios pueden editar sus propias imágenes" 
on storage.objects for update 
using ( bucket_id = 'rifa-images' and auth.uid() = owner );

-- 10. ENDURECIMIENTO Y API TRANSACCIONAL
create extension if not exists pgcrypto;

-- Normalizar instalaciones anteriores y limitar los valores válidos.
update public.profiles set plan = 'demo' where plan not in ('demo', 'basic', 'pro');
alter table public.profiles alter column plan set default 'demo';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_plan_valid') then
    alter table public.profiles add constraint profiles_plan_valid check (plan in ('demo', 'basic', 'pro'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'rifas_values_valid') then
    alter table public.rifas add constraint rifas_values_valid
      check (total between 1 and 1000000 and price > 0 and sold between 0 and total);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'rifas_status_valid') then
    alter table public.rifas add constraint rifas_status_valid check (status in ('draft', 'active', 'completed', 'cancelled'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'tickets_status_valid') then
    alter table public.tickets add constraint tickets_status_valid check (status in ('reserved', 'paid', 'cancelled'));
  end if;
end $$;

alter table public.sorteos add column if not exists draw_hash text;
alter table public.sorteos add column if not exists drawn_by uuid references public.profiles(id);
alter table public.sorteos add column if not exists draw_payload jsonb;

-- Permitir reutilizar números cancelados conservando su historial.
alter table public.tickets drop constraint if exists tickets_rifa_id_numero_key;
create unique index if not exists tickets_active_number_unique
  on public.tickets (rifa_id, numero) where status in ('reserved', 'paid');

-- Un usuario solo puede editar campos de presentación. Plan y rol se cambian por RPC.
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);
revoke update on public.profiles from authenticated;
grant update (
  name, phone, avatar_url, brand_name, brand_logo_url, brand_cover_url,
  brand_primary_color, brand_secondary_color
) on public.profiles to authenticated;

drop policy if exists "Owners manage rifas" on public.rifas;
create policy "Owners manage rifas" on public.rifas for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Se elimina la inserción pública directa: las reservas pasan por reserve_tickets.
drop policy if exists "Public insert tickets" on public.tickets;
drop policy if exists "Owners update tickets" on public.tickets;
create policy "Owners update tickets" on public.tickets for update
  using (exists (
    select 1 from public.rifas
    where rifas.id = tickets.rifa_id and rifas.user_id = auth.uid()
  ));

-- El historial se escribe exclusivamente desde draw_rifa.
revoke insert, update, delete on public.sorteos from anon, authenticated;

-- Evitar que un usuario suba archivos al espacio de otro usuario.
drop policy if exists "Usuarios autenticados pueden subir imágenes" on storage.objects;
create policy "Usuarios autenticados pueden subir imágenes"
on storage.objects for insert
with check (
  bucket_id = 'rifa-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "Usuarios pueden borrar sus propias imágenes" on storage.objects;
create policy "Usuarios pueden borrar sus propias imágenes"
on storage.objects for delete
using (bucket_id = 'rifa-images' and auth.uid() = owner);

-- Comprobantes privados: el jugador puede cargarlo usando el código que acaba
-- de recibir y únicamente el organizador de la rifa puede abrirlo.
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
    where t.receipt_url = storage.objects.name and r.user_id = (select auth.uid())
  )
);

create or replace function public.public_rifa_details(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'rifa', to_jsonb(r),
    'organizer', jsonb_build_object(
      'name', p.name,
      'phone', p.phone,
      'avatar_url', p.avatar_url,
      'brand_name', p.brand_name,
      'brand_logo_url', p.brand_logo_url,
      'brand_cover_url', p.brand_cover_url,
      'brand_primary_color', p.brand_primary_color,
      'brand_secondary_color', p.brand_secondary_color
    ),
    'payment_methods', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pm.id, 'name', pm.name, 'type', pm.type, 'details', pm.details
      ) order by pm.created_at)
      from public.payment_methods pm where pm.user_id = r.user_id
    ), '[]'::jsonb),
    'tickets', coalesce((
      select jsonb_agg(jsonb_build_object('numero', t.numero, 'status', t.status))
      from public.tickets t
      where t.rifa_id = r.id
        and t.status in ('reserved', 'paid')
        and (t.status = 'paid' or t.expires_at > now())
    ), '[]'::jsonb)
  )
  from public.rifas r
  join public.profiles p on p.id = r.user_id
  where r.slug = p_slug and r.status = 'active'
  limit 1;
$$;

create or replace function public.reserve_tickets(
  p_rifa_id uuid,
  p_numbers int[],
  p_buyer_name text,
  p_buyer_phone text,
  p_buyer_email text default null,
  p_payment_method text default null
)
returns setof public.tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rifa public.rifas;
begin
  select * into v_rifa from public.rifas where id = p_rifa_id and status = 'active' for update;
  if not found then raise exception 'La rifa no está activa'; end if;
  if coalesce(array_length(p_numbers, 1), 0) = 0 then raise exception 'Selecciona al menos un número'; end if;
  if array_length(p_numbers, 1) > 100 then raise exception 'Solo puedes reservar hasta 100 números a la vez'; end if;
  if nullif(trim(p_buyer_name), '') is null or nullif(trim(p_buyer_phone), '') is null then
    raise exception 'Nombre y teléfono son requeridos';
  end if;
  if exists (select 1 from unnest(p_numbers) n where n < 1 or n > v_rifa.total) then
    raise exception 'Hay números fuera del rango de la rifa';
  end if;
  if (select count(*) from unnest(p_numbers)) <> (select count(distinct n) from unnest(p_numbers) n) then
    raise exception 'La selección contiene números repetidos';
  end if;

  -- Las reservas vencidas dejan de bloquear el número.
  update public.tickets
  set status = 'cancelled'
  where rifa_id = p_rifa_id and status = 'reserved' and expires_at <= now();

  return query
  insert into public.tickets (
    rifa_id, numero, buyer_name, buyer_phone, buyer_email,
    payment_method, status, expires_at
  )
  select p_rifa_id, n, trim(p_buyer_name), trim(p_buyer_phone),
    nullif(trim(p_buyer_email), ''), nullif(trim(p_payment_method), ''),
    'reserved', now() + interval '24 hours'
  from unnest(p_numbers) n
  returning *;
exception
  when unique_violation then
    raise exception 'Uno o más números ya fueron tomados';
end;
$$;

create or replace function public.set_ticket_status(p_ticket_id uuid, p_status text)
returns public.tickets
language plpgsql
security definer
set search_path = public
as $$
declare v_ticket public.tickets;
begin
  if p_status not in ('paid', 'cancelled') then raise exception 'Estado no permitido'; end if;
  update public.tickets t set status = p_status
  where t.id = p_ticket_id
    and exists (select 1 from public.rifas r where r.id = t.rifa_id and r.user_id = auth.uid())
  returning t.* into v_ticket;
  if v_ticket.id is null then raise exception 'Ticket no encontrado o sin permiso'; end if;
  update public.rifas r set sold = (
    select count(*) from public.tickets t where t.rifa_id = r.id and t.status = 'paid'
  ) where r.id = v_ticket.rifa_id;
  return v_ticket;
end;
$$;

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
      'is_test', r.is_test,
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
    and (not r.is_test or r.user_id = auth.uid())
  limit 1;
$$;

create or replace function public.admin_block_ticket(
  p_rifa_id uuid, p_number int, p_buyer_name text
)
returns public.tickets
language plpgsql
security definer
set search_path = public
as $$
declare v_ticket public.tickets; v_total int;
begin
  select total into v_total from public.rifas where id = p_rifa_id and user_id = auth.uid() and status = 'active' for update;
  if v_total is null then raise exception 'Rifa no encontrada o sin permiso'; end if;
  if p_number < 1 or p_number > v_total then raise exception 'Número fuera de rango'; end if;
  update public.tickets set status = 'cancelled'
    where rifa_id = p_rifa_id and numero = p_number and status = 'reserved' and expires_at <= now();
  insert into public.tickets (rifa_id, numero, buyer_name, buyer_phone, payment_method, status)
  values (p_rifa_id, p_number, trim(p_buyer_name), 'N/A', 'Manual/Admin', 'paid')
  returning * into v_ticket;
  update public.rifas set sold = (
    select count(*) from public.tickets where rifa_id = p_rifa_id and status = 'paid'
  ) where id = p_rifa_id;
  return v_ticket;
exception when unique_violation then raise exception 'El número ya está ocupado';
end;
$$;

create or replace function public.draw_rifa(p_rifa_id uuid)
returns public.sorteos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rifa public.rifas;
  v_winners jsonb;
  v_result public.sorteos;
  v_hash text;
begin
  select * into v_rifa from public.rifas
  where id = p_rifa_id and user_id = auth.uid() and status = 'active'
  for update;
  if not found then raise exception 'Rifa no encontrada, finalizada o sin permiso'; end if;
  if exists (select 1 from public.sorteos where rifa_id = p_rifa_id) then
    raise exception 'Esta rifa ya fue sorteada';
  end if;

  select jsonb_agg(jsonb_build_object('numero', numero, 'buyer_name', buyer_name) order by pos)
  into v_winners
  from (
    select numero, buyer_name, row_number() over () pos
    from public.tickets
    where rifa_id = p_rifa_id and status = 'paid'
    order by encode(gen_random_bytes(16), 'hex')
    limit 3
  ) winners;
  if jsonb_array_length(coalesce(v_winners, '[]'::jsonb)) = 0 then
    raise exception 'No hay tickets pagados para sortear';
  end if;

  v_hash := encode(digest(p_rifa_id::text || v_winners::text || clock_timestamp()::text, 'sha256'), 'hex');
  insert into public.sorteos (
    rifa_id, rifa_name, winner, prize2, prize3, total_tickets,
    draw_hash, drawn_by, draw_payload
  ) values (
    p_rifa_id,
    v_rifa.name,
    format('#%s - %s', lpad((v_winners->0->>'numero'), 4, '0'), v_winners->0->>'buyer_name'),
    case when jsonb_array_length(v_winners) > 1 then format('#%s - %s', lpad((v_winners->1->>'numero'), 4, '0'), v_winners->1->>'buyer_name') end,
    case when jsonb_array_length(v_winners) > 2 then format('#%s - %s', lpad((v_winners->2->>'numero'), 4, '0'), v_winners->2->>'buyer_name') end,
    (select count(*) from public.tickets where rifa_id = p_rifa_id and status = 'paid'),
    v_hash, auth.uid(), v_winners
  ) returning * into v_result;
  update public.rifas set status = 'completed' where id = p_rifa_id;
  return v_result;
end;
$$;

create or replace function public.list_my_referrals()
returns table (id uuid, name text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select child.id, child.name, child.created_at
  from public.profiles owner
  join public.profiles child on child.referred_by = owner.ref_code
  where owner.id = auth.uid()
  order by child.created_at desc;
$$;

create or replace function public.admin_change_plan(p_user_id uuid, p_plan text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then raise exception 'Acceso denegado'; end if;
  if p_plan not in ('demo', 'basic', 'pro') then raise exception 'Plan no válido'; end if;
  update public.profiles set plan = p_plan where id = p_user_id and not is_superadmin;
end;
$$;

revoke all on function public.public_rifa_details(text) from public;
revoke all on function public.reserve_tickets(uuid, int[], text, text, text, text) from public;
revoke all on function public.set_ticket_status(uuid, text) from public;
revoke all on function public.attach_ticket_receipt(uuid[], text, text) from public;
revoke all on function public.public_ticket_details(text) from public;
revoke all on function public.admin_block_ticket(uuid, int, text) from public;
revoke all on function public.draw_rifa(uuid) from public;
revoke all on function public.list_my_referrals() from public;
revoke all on function public.admin_change_plan(uuid, text) from public;
grant execute on function public.public_rifa_details(text) to anon, authenticated;
grant execute on function public.reserve_tickets(uuid, int[], text, text, text, text) to anon, authenticated;
grant execute on function public.set_ticket_status(uuid, text) to authenticated;
grant execute on function public.attach_ticket_receipt(uuid[], text, text) to anon, authenticated;
grant execute on function public.public_ticket_details(text) to anon, authenticated;
grant execute on function public.admin_block_ticket(uuid, int, text) to authenticated;
grant execute on function public.draw_rifa(uuid) to authenticated;
grant execute on function public.list_my_referrals() to authenticated;
grant execute on function public.admin_change_plan(uuid, text) to authenticated;

-- Activar pg_cron en Supabase y ejecutar una sola vez:
-- select cron.schedule(
--   'release-expired-tickets',
--   '*/30 * * * *',
--   $$select public.release_expired_tickets()$$
-- );

-- Apply after supabase-schema.sql. No historical rows are deleted.
begin;

alter table public.tickets add column if not exists reservation_id uuid default gen_random_uuid();
revoke insert, update, delete on public.tickets from anon, authenticated;
revoke insert, delete on public.profiles from anon, authenticated;
revoke update, delete on public.rifas from anon, authenticated;

-- Anonymous buyers cannot SELECT private tickets inside a Storage policy.
-- Expose only this boolean predicate, never buyer details or ticket UUIDs.
create or replace function public.can_upload_payment_receipt(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select split_part(p_name, '/', 1) = 'receipts' and exists (
    select 1 from public.tickets t join public.rifas r on r.id = t.rifa_id
    where t.ticket_code = split_part(p_name, '/', 2) and t.status = 'reserved'
      and t.expires_at > now() and r.status = 'active'
      and (r.sorteo_date is null or r.sorteo_date > now())
  );
$$;
revoke all on function public.can_upload_payment_receipt(text) from public;
grant execute on function public.can_upload_payment_receipt(text) to anon, authenticated;
drop policy if exists "Participantes suben comprobantes validos" on storage.objects;
drop policy if exists "Participantes suben comprobantes válidos" on storage.objects;
create policy "Participantes suben comprobantes validos" on storage.objects
for insert to anon, authenticated with check (
  bucket_id = 'payment-receipts' and public.can_upload_payment_receipt(name)
);
update storage.buckets set file_size_limit = 8388608,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','application/pdf']
where id = 'payment-receipts';
drop policy if exists "Organizadores ven sus comprobantes" on storage.objects;
create policy "Organizadores ven sus comprobantes" on storage.objects
for select to authenticated using (
  bucket_id = 'payment-receipts' and exists (
    select 1 from public.tickets t join public.rifas r on r.id = t.rifa_id
    where t.receipt_url = storage.objects.name and r.user_id = (select auth.uid())
  )
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, referred_by)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1)), new.email,
    (select ref_code from public.profiles where ref_code = new.raw_user_meta_data->>'referred_by' limit 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.guard_rifa_creation()
returns trigger language plpgsql security definer set search_path = public as $$
declare p public.profiles; v_limit int; v_max int;
begin
  select * into p from public.profiles where id = new.user_id for update;
  if not found then raise exception 'Perfil no encontrado'; end if;
  v_limit := case p.plan when 'pro' then 999999 else 1 end;
  v_max := case p.plan when 'pro' then 1000000 when 'basic' then 1000 else 50 end;
  if p.plan = 'demo' and p.created_at + interval '7 days' <= now() then
    raise exception 'El periodo de prueba ha vencido';
  end if;
  if new.total > v_max then raise exception 'Cantidad de tickets no permitida por tu plan'; end if;
  if new.status not in ('active', 'draft') or new.sold <> 0 then
    raise exception 'Una rifa nueva debe comenzar sin ventas';
  end if;
  if new.sorteo_date is not null and new.sorteo_date <= now() then
    raise exception 'La fecha del sorteo debe ser futura';
  end if;
  if new.status = 'active' and (select count(*) from public.rifas where user_id = new.user_id and status = 'active') >= v_limit then
    raise exception 'Limite de rifas activas alcanzado';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_rifa_creation on public.rifas;
create trigger guard_rifa_creation before insert on public.rifas
for each row execute function public.guard_rifa_creation();

create or replace function public.reserve_tickets(
  p_rifa_id uuid, p_numbers int[], p_buyer_name text, p_buyer_phone text,
  p_buyer_email text default null, p_payment_method text default null
) returns setof public.tickets language plpgsql security definer set search_path = public as $$
declare r public.rifas; v_reservation uuid := gen_random_uuid();
begin
  select * into r from public.rifas where id = p_rifa_id and status = 'active' for update;
  if not found then raise exception 'La rifa no esta activa'; end if;
  if r.sorteo_date is not null and r.sorteo_date <= now() then raise exception 'Las reservas estan cerradas'; end if;
  if coalesce(cardinality(p_numbers), 0) not between 1 and 100 then raise exception 'Selecciona entre 1 y 100 numeros'; end if;
  if nullif(trim(p_buyer_name), '') is null or nullif(trim(p_buyer_phone), '') is null then raise exception 'Nombre y telefono son requeridos'; end if;
  if exists (select 1 from unnest(p_numbers) n where n is null or n < 1 or n > r.total)
    or cardinality(p_numbers) <> (select count(distinct n) from unnest(p_numbers) n) then
    raise exception 'Seleccion de numeros invalida';
  end if;
  if not exists (select 1 from public.payment_methods where user_id = r.user_id and name = p_payment_method) then
    raise exception 'Selecciona un metodo de pago del organizador';
  end if;
  update public.tickets set status = 'cancelled' where rifa_id = r.id and status = 'reserved' and expires_at <= now();
  return query insert into public.tickets (rifa_id, numero, buyer_name, buyer_phone, buyer_email, payment_method, status, expires_at, reservation_id)
  select r.id, n, trim(p_buyer_name), trim(p_buyer_phone), nullif(trim(p_buyer_email), ''), p_payment_method,
    'reserved', least(now() + interval '24 hours', coalesce(r.sorteo_date, now() + interval '24 hours')), v_reservation
  from unnest(p_numbers) n returning *;
exception when unique_violation then raise exception 'Uno o mas numeros ya fueron tomados';
end;
$$;

create or replace function public.set_ticket_status(p_ticket_id uuid, p_status text)
returns public.tickets language plpgsql security definer set search_path = public as $$
declare r public.rifas; t public.tickets;
begin
  if p_status is null or p_status not in ('paid', 'cancelled') then raise exception 'Estado no permitido'; end if;
  select rifa.* into r from public.rifas rifa join public.tickets ticket on ticket.rifa_id = rifa.id
    where ticket.id = p_ticket_id and rifa.user_id = auth.uid() for update of rifa;
  if not found then raise exception 'Ticket no encontrado o sin permiso'; end if;
  if r.status <> 'active' then raise exception 'La rifa ya esta cerrada'; end if;
  select * into t from public.tickets where id = p_ticket_id for update;
  if t.status = p_status then return t; end if;
  if t.status = 'cancelled' then raise exception 'No se puede reactivar un ticket cancelado'; end if;
  if p_status = 'paid' and (t.expires_at <= now() or (r.sorteo_date is not null and r.sorteo_date <= now())) then
    raise exception 'La reserva ha vencido o las ventas estan cerradas';
  end if;
  update public.tickets set status = p_status where id = p_ticket_id returning * into t;
  update public.rifas set sold = (select count(*) from public.tickets where rifa_id = r.id and status = 'paid') where id = r.id;
  return t;
end;
$$;

create or replace function public.attach_ticket_receipt(p_ticket_ids uuid[], p_ticket_code text, p_receipt_path text)
returns void language plpgsql security definer set search_path = public as $$
declare t public.tickets; r public.rifas;
begin
  if coalesce(cardinality(p_ticket_ids), 0) not between 1 and 100
    or cardinality(p_ticket_ids) <> (select count(distinct id) from unnest(p_ticket_ids) id) then
    raise exception 'Seleccion de tickets invalida';
  end if;
  select * into t from public.tickets where ticket_code = p_ticket_code and id = any(p_ticket_ids);
  if not found then raise exception 'Reserva no encontrada'; end if;
  select * into r from public.rifas where id = t.rifa_id for update;
  if r.status <> 'active' or (r.sorteo_date is not null and r.sorteo_date <= now()) then raise exception 'La rifa esta cerrada'; end if;
  if t.reservation_id is null or (select count(*) from public.tickets
    where id = any(p_ticket_ids) and reservation_id = t.reservation_id and rifa_id = t.rifa_id
    and status = 'reserved' and expires_at > now()) <> cardinality(p_ticket_ids) then
    raise exception 'Todos los tickets deben pertenecer a la misma reserva vigente';
  end if;
  if p_receipt_path is null or left(p_receipt_path, length('receipts/' || p_ticket_code || '/')) <> 'receipts/' || p_ticket_code || '/'
    or not exists (select 1 from storage.objects where bucket_id = 'payment-receipts' and name = p_receipt_path) then
    raise exception 'Comprobante no encontrado o ruta invalida';
  end if;
  update public.tickets set receipt_url = p_receipt_path, receipt_uploaded_at = now() where id = any(p_ticket_ids);
end;
$$;

create or replace function public.draw_rifa(p_rifa_id uuid)
returns public.sorteos language plpgsql security definer set search_path = public, extensions as $$
declare r public.rifas; v_winners jsonb; v_result public.sorteos; v_prizes int;
begin
  select * into r from public.rifas where id = p_rifa_id and user_id = auth.uid() and status = 'active' for update;
  if not found then raise exception 'Rifa no encontrada, finalizada o sin permiso'; end if;
  if r.sorteo_date is not null and r.sorteo_date > now() then raise exception 'Aun no llega la fecha del sorteo'; end if;
  if exists (select 1 from public.sorteos where rifa_id = r.id) then raise exception 'Esta rifa ya fue sorteada'; end if;
  v_prizes := 1 + case when nullif(trim(r.prize2), '') is not null then 1 else 0 end
    + case when nullif(trim(r.prize3), '') is not null then 1 else 0 end;
  if (select count(*) from public.tickets where rifa_id = r.id and status = 'paid') < v_prizes then
    raise exception 'No hay suficientes tickets pagados para los premios';
  end if;
  update public.tickets set status = 'cancelled' where rifa_id = r.id and status = 'reserved';
  -- Rank the random keys, rather than reordering winners by their physical row order.
  select jsonb_agg(jsonb_build_object('numero', numero, 'buyer_name', buyer_name) order by random_key)
    into v_winners from (
      select numero, buyer_name, gen_random_bytes(32) as random_key from public.tickets
      where rifa_id = r.id and status = 'paid' order by random_key limit v_prizes
    ) entries;
  insert into public.sorteos (rifa_id, rifa_name, winner, prize2, prize3, total_tickets, draw_hash, drawn_by, draw_payload)
  values (r.id, r.name,
    '#' || lpad(v_winners->0->>'numero', greatest(4, length(v_winners->0->>'numero')), '0') || ' - ' || (v_winners->0->>'buyer_name'),
    case when nullif(trim(r.prize2), '') is not null then '#' || lpad(v_winners->1->>'numero', greatest(4, length(v_winners->1->>'numero')), '0') || ' - ' || (v_winners->1->>'buyer_name') end,
    case when nullif(trim(r.prize3), '') is not null then '#' || lpad(v_winners->(v_prizes - 1)->>'numero', greatest(4, length(v_winners->(v_prizes - 1)->>'numero')), '0') || ' - ' || (v_winners->(v_prizes - 1)->>'buyer_name') end,
    (select count(*) from public.tickets where rifa_id = r.id and status = 'paid'),
    encode(digest(r.id::text || v_winners::text || clock_timestamp()::text, 'sha256'), 'hex'), auth.uid(), v_winners)
  returning * into v_result;
  update public.rifas set status = 'completed' where id = r.id;
  return v_result;
end;
$$;

revoke all on function public.guard_rifa_creation() from public;
revoke all on function public.handle_new_user() from public;

create or replace function public.admin_block_ticket(p_rifa_id uuid, p_number int, p_buyer_name text)
returns public.tickets language plpgsql security definer set search_path = public as $$
declare r public.rifas; t public.tickets;
begin
  select * into r from public.rifas where id = p_rifa_id and user_id = auth.uid() and status = 'active' for update;
  if not found then raise exception 'Rifa no encontrada o sin permiso'; end if;
  if r.sorteo_date is not null and r.sorteo_date <= now() then raise exception 'Las ventas estan cerradas'; end if;
  if p_number is null or p_number < 1 or p_number > r.total or nullif(trim(p_buyer_name), '') is null then
    raise exception 'Numero o comprador invalido';
  end if;
  update public.tickets set status = 'cancelled' where rifa_id = r.id and numero = p_number and status = 'reserved' and expires_at <= now();
  insert into public.tickets (rifa_id, numero, buyer_name, buyer_phone, payment_method, status)
    values (r.id, p_number, trim(p_buyer_name), 'N/A', 'Manual/Admin', 'paid') returning * into t;
  update public.rifas set sold = (select count(*) from public.tickets where rifa_id = r.id and status = 'paid') where id = r.id;
  return t;
exception when unique_violation then raise exception 'El numero ya esta ocupado';
end;
$$;
commit;
-- Private test data uses the same owner identity, never public raffle permissions.
begin;
alter table public.rifas add column if not exists is_test boolean not null default false;
drop policy if exists "Public view active" on public.rifas;
create policy "Public view active" on public.rifas for select
  using (status = 'active' and not is_test);
create or replace function public.can_view_raffle_result(p_rifa_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.rifas r where r.id = p_rifa_id
    and (not r.is_test or r.user_id = auth.uid()));
$$;
revoke all on function public.can_view_raffle_result(uuid) from public;
grant execute on function public.can_view_raffle_result(uuid) to anon, authenticated;
drop policy if exists "Public view sorteos" on public.sorteos;
create policy "Public view sorteos" on public.sorteos for select
  using (public.can_view_raffle_result(rifa_id));
create or replace function public.guard_rifa_creation()
returns trigger language plpgsql security definer set search_path = public as $$
declare p public.profiles; v_limit int; v_max int;
begin
  select * into p from public.profiles where id = new.user_id for update;
  if not found then raise exception 'Perfil no encontrado'; end if;
  v_limit := case p.plan when 'pro' then 999999 else 1 end;
  v_max := case when new.is_test then 50 else case p.plan when 'pro' then 1000000 when 'basic' then 1000 else 50 end end;
  if not new.is_test and p.plan = 'demo' and p.created_at + interval '7 days' <= now() then
    raise exception 'El periodo de prueba ha vencido';
  end if;
  if new.total > v_max then raise exception 'Cantidad de tickets no permitida por tu plan'; end if;
  if new.status not in ('active', 'draft') or new.sold <> 0 then
    raise exception 'Una rifa nueva debe comenzar sin ventas';
  end if;
  if new.sorteo_date is not null and new.sorteo_date <= now() then
    raise exception 'La fecha del sorteo debe ser futura';
  end if;
  if new.status = 'active' and (select count(*) from public.rifas where user_id = new.user_id and status = 'active' and is_test = new.is_test) >= v_limit then
    raise exception 'Limite de rifas activas alcanzado';
  end if;
  return new;
end;
$$;

create or replace function public.public_rifa_details(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'rifa', to_jsonb(r),
    'organizer', jsonb_build_object(
      'name', p.name,
      'phone', p.phone,
      'avatar_url', p.avatar_url,
      'brand_name', p.brand_name,
      'brand_logo_url', p.brand_logo_url,
      'brand_cover_url', p.brand_cover_url,
      'brand_primary_color', p.brand_primary_color,
      'brand_secondary_color', p.brand_secondary_color
    ),
    'payment_methods', case when r.is_test then '[{"id":"test","name":"PRUEBA - Sin cobro","type":"other","details":{}}]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pm.id, 'name', pm.name, 'type', pm.type, 'details', pm.details
      ) order by pm.created_at)
      from public.payment_methods pm where pm.user_id = r.user_id
    ), '[]'::jsonb) end,
    'tickets', coalesce((
      select jsonb_agg(jsonb_build_object('numero', t.numero, 'status', t.status))
      from public.tickets t
      where t.rifa_id = r.id
        and t.status in ('reserved', 'paid')
        and (t.status = 'paid' or t.expires_at > now())
    ), '[]'::jsonb)
  )
  from public.rifas r
  join public.profiles p on p.id = r.user_id
  where r.slug = p_slug and r.status = 'active'
    and (not r.is_test or r.user_id = auth.uid())
  limit 1;
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
      'is_test', r.is_test,
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
    and (not r.is_test or r.user_id = auth.uid())
  limit 1;
$$;

create or replace function public.reserve_tickets(
  p_rifa_id uuid, p_numbers int[], p_buyer_name text, p_buyer_phone text,
  p_buyer_email text default null, p_payment_method text default null
) returns setof public.tickets language plpgsql security definer set search_path = public as $$
declare r public.rifas; v_reservation uuid := gen_random_uuid();
begin
  select * into r from public.rifas where id = p_rifa_id and status = 'active' for update;
  if not found then raise exception 'La rifa no esta activa'; end if;
  if r.is_test and r.user_id is distinct from auth.uid() then raise exception 'Prueba privada'; end if;
  if r.sorteo_date is not null and r.sorteo_date <= now() then raise exception 'Las reservas estan cerradas'; end if;
  if coalesce(cardinality(p_numbers), 0) not between 1 and 100 then raise exception 'Selecciona entre 1 y 100 numeros'; end if;
  if nullif(trim(p_buyer_name), '') is null or nullif(trim(p_buyer_phone), '') is null then raise exception 'Nombre y telefono son requeridos'; end if;
  if exists (select 1 from unnest(p_numbers) n where n is null or n < 1 or n > r.total)
    or cardinality(p_numbers) <> (select count(distinct n) from unnest(p_numbers) n) then
    raise exception 'Seleccion de numeros invalida';
  end if;
  if (r.is_test and p_payment_method is distinct from 'PRUEBA - Sin cobro')
    or (not r.is_test and not exists (select 1 from public.payment_methods where user_id = r.user_id and name = p_payment_method)) then
    raise exception 'Selecciona un metodo de pago del organizador';
  end if;
  update public.tickets set status = 'cancelled' where rifa_id = r.id and status = 'reserved' and expires_at <= now();
  return query insert into public.tickets (rifa_id, numero, buyer_name, buyer_phone, buyer_email, payment_method, status, expires_at, reservation_id)
  select r.id, n, trim(p_buyer_name), trim(p_buyer_phone), nullif(trim(p_buyer_email), ''), p_payment_method,
    'reserved', least(now() + interval '24 hours', coalesce(r.sorteo_date, now() + interval '24 hours')), v_reservation
  from unnest(p_numbers) n returning *;
exception when unique_violation then raise exception 'Uno o mas numeros ya fueron tomados';
end;
$$;

create or replace function public.can_upload_payment_receipt(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select split_part(p_name, '/', 1) = 'receipts' and exists (
    select 1 from public.tickets t join public.rifas r on r.id = t.rifa_id
    where t.ticket_code = split_part(p_name, '/', 2) and t.status = 'reserved'
      and (not r.is_test or r.user_id = auth.uid())
      and t.expires_at > now() and r.status = 'active'
      and (r.sorteo_date is null or r.sorteo_date > now())
  );
$$;

create or replace function public.attach_ticket_receipt(p_ticket_ids uuid[], p_ticket_code text, p_receipt_path text)
returns void language plpgsql security definer set search_path = public as $$
declare t public.tickets; r public.rifas;
begin
  if coalesce(cardinality(p_ticket_ids), 0) not between 1 and 100
    or cardinality(p_ticket_ids) <> (select count(distinct id) from unnest(p_ticket_ids) id) then
    raise exception 'Seleccion de tickets invalida';
  end if;
  select * into t from public.tickets where ticket_code = p_ticket_code and id = any(p_ticket_ids);
  if not found then raise exception 'Reserva no encontrada'; end if;
  select * into r from public.rifas where id = t.rifa_id for update;
  if r.is_test and r.user_id is distinct from auth.uid() then raise exception 'Prueba privada'; end if;
  if r.status <> 'active' or (r.sorteo_date is not null and r.sorteo_date <= now()) then raise exception 'La rifa esta cerrada'; end if;
  if t.reservation_id is null or (select count(*) from public.tickets
    where id = any(p_ticket_ids) and reservation_id = t.reservation_id and rifa_id = t.rifa_id
    and status = 'reserved' and expires_at > now()) <> cardinality(p_ticket_ids) then
    raise exception 'Todos los tickets deben pertenecer a la misma reserva vigente';
  end if;
  if p_receipt_path is null or left(p_receipt_path, length('receipts/' || p_ticket_code || '/')) <> 'receipts/' || p_ticket_code || '/'
    or not exists (select 1 from storage.objects where bucket_id = 'payment-receipts' and name = p_receipt_path) then
    raise exception 'Comprobante no encontrado o ruta invalida';
  end if;
  update public.tickets set receipt_url = p_receipt_path, receipt_uploaded_at = now() where id = any(p_ticket_ids);
end;
$$;
commit;
