-- Disposable fixtures: this entire verification rolls back, including auth users.
begin;
create temporary table qa_results (check_name text);
create or replace function pg_temp.check_true(ok boolean, label text)
returns void language plpgsql as $$
begin
  if ok is distinct from true then raise exception 'QA failed: %', label; end if;
  insert into qa_results values (label);
end;
$$;
create or replace function pg_temp.expect_error(statement text, fragment text, label text)
returns void language plpgsql as $$
declare failed boolean := false;
begin
  begin
    execute statement;
  exception when others then
    if position(fragment in sqlerrm) = 0 then raise; end if;
    failed := true;
  end;
  perform pg_temp.check_true(failed, label);
end;
$$;

do $$
declare
  owner_id uuid := gen_random_uuid(); other_id uuid := gen_random_uuid();
  r uuid; future_r uuid; unpaid_r uuid; high_r uuid; multi_r uuid; trial_r uuid; t public.tickets; t2 public.tickets;
  order_ids uuid[]; result public.sorteos; code text; path text; visible_test boolean; visible_result boolean;
begin
  insert into auth.users(id, email, raw_user_meta_data)
    values (owner_id, 'qa-' || owner_id || '@example.invalid', '{"name":"Franklin QA"}'),
           (other_id, 'qa-' || other_id || '@example.invalid', '{"name":"Other QA"}');
  perform pg_temp.check_true(exists(select 1 from public.profiles where id=owner_id and name='Franklin QA' and plan='demo'), 'Registration creates demo profile');
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', owner_id, 'role', 'authenticated')::text, true);
  perform pg_temp.expect_error(format('insert into public.rifas(user_id,name,prize1,total,price) values (%L,''QA limit'',''QA'',51,100)', owner_id), 'plan', 'Demo ticket limit enforced');
  insert into public.rifas(user_id,name,prize1,total,price) values (owner_id,'QA trial','QA',50,100) returning id into trial_r;
  perform pg_temp.expect_error(format('insert into public.rifas(user_id,name,prize1,total,price) values (%L,''QA second'',''QA'',50,100)',owner_id),'Limite','Active raffle plan limit enforced');
  update public.profiles set created_at=now()-interval '8 days' where id=other_id;
  perform pg_temp.expect_error(format('insert into public.rifas(user_id,name,prize1,total,price) values (%L,''QA expired'',''QA'',50,100)',other_id),'vencido','Expired demo cannot create raffles');
  update public.profiles set plan='pro' where id in (owner_id, other_id);
  insert into public.payment_methods(user_id,name,type) values (owner_id,'Banco QA','bank');
  insert into public.rifas(user_id,name,prize1,total,price,slug)
    values (owner_id,'QA single prize','QA prize',50,100,'qa-'||gen_random_uuid()) returning id into r;
  insert into public.rifas(user_id,name,prize1,total,price,sorteo_date)
    values (owner_id,'QA future','QA prize',50,100,now()+interval '2 days') returning id into future_r;
  insert into public.rifas(user_id,name,prize1,total,price)
    values (owner_id,'QA no payments','QA prize',50,100) returning id into unpaid_r;

  perform pg_temp.expect_error(format('select public.reserve_tickets(%L,array[1,1],''Buyer'',''000'',null,''Banco QA'')',r),'invalida','Duplicate numbers rejected');
  perform pg_temp.expect_error(format('select public.reserve_tickets(%L,array[null::int],''Buyer'',''000'',null,''Banco QA'')',r),'invalida','Null numbers rejected');
  perform pg_temp.expect_error(format('select public.reserve_tickets(%L,array[51],''Buyer'',''000'',null,''Banco QA'')',r),'invalida','Out of range rejected');
  perform pg_temp.expect_error(format('select public.reserve_tickets(%L,array[1],''Buyer'',''000'',null,''Fake Bank'')',r),'metodo','Unconfigured payment rejected');

  select array_agg(id) into order_ids from public.reserve_tickets(r,array[1,2],'Buyer QA','000',null,'Banco QA');
  select * into t from public.tickets where id=order_ids[1];
  perform pg_temp.check_true((select count(distinct reservation_id)=1 and count(*)=2 from public.tickets where id=any(order_ids)), 'Tickets share one reservation');
  perform pg_temp.check_true(t.status='reserved' and t.expires_at=now()+interval '24 hours','Reservations expire in 24 hours');
  perform pg_temp.expect_error(format('select public.reserve_tickets(%L,array[1],''Another'',''000'',null,''Banco QA'')',r),'tomados','Occupied number rejected');
  select * into t2 from public.reserve_tickets(r,array[3],'Other Buyer','000',null,'Banco QA');
  path := 'receipts/'||t.ticket_code||'/qa.pdf';
  perform pg_temp.check_true(public.can_upload_payment_receipt(path),'Valid anonymous receipt path accepted');
  perform pg_temp.check_true(not public.can_upload_payment_receipt('receipts/unknown/qa.pdf'),'Unknown receipt code rejected');
  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claims','{"role":"anon"}',true);
  set local role anon;
  insert into storage.objects(bucket_id,name) values ('payment-receipts',path);
  reset role;
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
  perform pg_temp.check_true(exists(select 1 from storage.objects where bucket_id='payment-receipts' and name=path),'Anonymous Storage insertion passes actual RLS');
  perform pg_temp.expect_error(format('select public.attach_ticket_receipt(array[%L::uuid,%L::uuid],%L,%L)',t.id,t2.id,t.ticket_code,path),'misma reserva','Mixed-order receipt rejected');
  perform public.attach_ticket_receipt(order_ids,t.ticket_code,path);
  perform pg_temp.check_true((select count(*)=2 from public.tickets where id=any(order_ids) and receipt_url=path),'Receipt linked to the complete order');
  set local role authenticated;
  select exists(select 1 from storage.objects where bucket_id='payment-receipts' and name=path) into visible_test;
  reset role;
  perform pg_temp.check_true(visible_test,'Owner can SELECT receipt through actual Storage RLS');
  perform set_config('request.jwt.claim.sub', other_id::text, true);
  set local role authenticated;
  select exists(select 1 from storage.objects where bucket_id='payment-receipts' and name=path) into visible_test;
  reset role;
  perform pg_temp.check_true(not visible_test,'Other organizer cannot SELECT private receipt');
  perform set_config('request.jwt.claim.sub', owner_id::text, true);

  perform set_config('request.jwt.claim.sub', other_id::text,true);
  perform pg_temp.expect_error(format('select public.set_ticket_status(%L,''paid'')',t.id),'permiso','Other organizer cannot confirm payment');
  perform set_config('request.jwt.claim.sub', owner_id::text,true);
  perform public.set_ticket_status(t.id,'paid');
  perform public.set_ticket_status(t.id,'paid');
  perform pg_temp.check_true((select sold=1 from public.rifas where id=r),'Idempotent payment confirmation counter');
  perform pg_temp.check_true(not public.can_upload_payment_receipt(path),'Paid ticket cannot receive anonymous uploads');
  perform pg_temp.check_true((public.public_ticket_details(t.ticket_code)->>'status')='paid' and not (public.public_ticket_details(t.ticket_code) ? 'buyer_name'),'QR verification reflects payment without buyer data');
  update public.tickets set expires_at=now()-interval '1 second' where id=t2.id;
  perform pg_temp.expect_error(format('select public.set_ticket_status(%L,''paid'')',t2.id),'vencido','Expired payment rejected');
  perform public.release_expired_tickets();
  perform pg_temp.check_true((select status='cancelled' from public.tickets where id=t2.id),'Expired reservation released');
  perform pg_temp.expect_error(format('select public.set_ticket_status(%L,''paid'')',t2.id),'cancelado','Cancelled ticket cannot be revived');
  perform pg_temp.expect_error(format('select public.draw_rifa(%L)',future_r),'fecha','Early draw rejected');
  perform pg_temp.expect_error(format('select public.draw_rifa(%L)',unpaid_r),'suficientes','Draw without paid tickets rejected');
  update public.rifas set sorteo_date=now()-interval '1 second' where id=future_r;
  perform pg_temp.expect_error(format('select public.reserve_tickets(%L,array[1],''Buyer'',''000'',null,''Banco QA'')',future_r),'cerradas','Late reservation rejected');
  perform pg_temp.expect_error(format('select public.admin_block_ticket(%L,1,''Manual QA'')',future_r),'cerradas','Late manual sale rejected');

  select * into result from public.draw_rifa(r);
  perform pg_temp.check_true(result.winner like '#0001%' and result.prize2 is null and result.prize3 is null,'Only paid ticket wins; no unadvertised prizes');
  perform pg_temp.check_true(length(result.draw_hash)=64 and (select status='completed' from public.rifas where id=r),'Result fingerprint and completed state');
  perform pg_temp.expect_error(format('select public.draw_rifa(%L)',r),'finalizada','Duplicate draw rejected');
  perform pg_temp.expect_error(format('select public.set_ticket_status(%L,''paid'')',order_ids[2]),'cerrada','Participants frozen after draw');
  perform pg_temp.check_true((select status='cancelled' from public.tickets where id=order_ids[2]),'Unpaid reservations cancelled at closure');

  insert into public.rifas(user_id,name,prize1,total,price) values (owner_id,'QA high number','QA',1000000,100) returning id into high_r;
  select * into t from public.admin_block_ticket(high_r,1000000,'Manual QA');
  select * into result from public.draw_rifa(high_r);
  perform pg_temp.check_true(result.winner like '#1000000 -%','Seven-digit ticket number preserved');
  insert into public.rifas(user_id,name,prize1,prize2,prize3,total,price)
    values (owner_id,'QA three prizes','QA1','QA2','QA3',50,100) returning id into multi_r;
  perform public.admin_block_ticket(multi_r,1,'QA buyer1');
  perform public.admin_block_ticket(multi_r,2,'QA buyer2');
  perform pg_temp.expect_error(format('select public.draw_rifa(%L)',multi_r),'suficientes','All advertised prizes require enough paid tickets');
  perform public.admin_block_ticket(multi_r,3,'QA buyer3');
  select * into result from public.draw_rifa(multi_r);
  perform pg_temp.check_true(result.prize2 is not null and result.prize3 is not null and jsonb_array_length(result.draw_payload)=3,'Three advertised prizes get three winners');
  perform pg_temp.check_true((select count(distinct e->>'numero')=3 from jsonb_array_elements(result.draw_payload) e),'No duplicate winning ticket across prizes');
  perform pg_temp.check_true(not has_table_privilege('authenticated','public.tickets','UPDATE'),'Direct ticket edits denied');
  perform pg_temp.check_true(not has_table_privilege('authenticated','public.profiles','INSERT'),'Direct profile insertion denied');
  perform pg_temp.check_true(not has_table_privilege('authenticated','public.rifas','UPDATE'),'Direct raffle rule changes denied');
  insert into public.rifas(user_id,name,prize1,total,price,slug,is_test)
    values (owner_id,'PRUEBA privada','Sin premio real',10,100,'qa-private-'||owner_id,true) returning id into trial_r;
  perform pg_temp.check_true(public.public_rifa_details('qa-private-'||owner_id) is not null,'Owner can open private test raffle');
  perform public.reserve_tickets(trial_r,array[1],'PRUEBA comprador','000',null,'PRUEBA - Sin cobro');
  perform public.admin_block_ticket(trial_r,2,'PRUEBA pagada');
  select ticket_code into code from public.tickets where rifa_id=trial_r and numero=1;
  result := public.draw_rifa(trial_r);
  perform pg_temp.check_true(public.can_view_raffle_result(trial_r),'Owner can view private test result');
  perform set_config('request.jwt.claim.sub', other_id::text, true);
  perform pg_temp.check_true(public.public_ticket_details(code) is null,'Other account cannot read private test QR');
  perform pg_temp.check_true(not public.can_view_raffle_result(trial_r),'Other account cannot read private test result');
  insert into public.rifas(user_id,name,prize1,total,price,slug,is_test)
    values (owner_id,'PRUEBA activa','Sin premio real',10,100,'qa-active-'||owner_id,true) returning id into trial_r;
  perform pg_temp.check_true(public.public_rifa_details('qa-active-'||owner_id) is null,'Other account cannot open private test raffle');
  perform pg_temp.expect_error(format('select public.reserve_tickets(%L,array[1],''PRUEBA'',''000'',null,''PRUEBA - Sin cobro'')',trial_r),'privada','Other account cannot reserve private test tickets');
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{}', true);
  set local role anon;
  select exists(select 1 from public.rifas where is_test) into visible_test;
  select exists(select 1 from public.sorteos where rifa_name='PRUEBA privada') into visible_result;
  reset role;
  perform pg_temp.check_true(not visible_test,'Anonymous listing excludes private test raffles');
  perform pg_temp.check_true(not visible_result,'Anonymous history excludes private test results');
end;
$$;
select count(*) as checks_passed, json_agg(check_name) as checks from qa_results;
rollback;
