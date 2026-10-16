-- Marca blanca por organizador.
-- Ejecutar una vez en Supabase > SQL Editor.

alter table public.profiles add column if not exists brand_name text;
alter table public.profiles add column if not exists brand_logo_url text;
alter table public.profiles add column if not exists brand_cover_url text;
alter table public.profiles add column if not exists brand_primary_color text default '#006B3C';
alter table public.profiles add column if not exists brand_secondary_color text default '#FFB300';

grant update (
  name, phone, avatar_url, brand_name, brand_logo_url, brand_cover_url,
  brand_primary_color, brand_secondary_color
) on public.profiles to authenticated;

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
