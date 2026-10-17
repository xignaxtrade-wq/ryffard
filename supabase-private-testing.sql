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
