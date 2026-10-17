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
