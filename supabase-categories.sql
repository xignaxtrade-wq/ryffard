-- Categorías de rifas.
-- Ejecutar una vez en Supabase > SQL Editor.

alter table public.rifas
  add column if not exists category text not null default 'other';

update public.rifas set category = 'other' where category is null or trim(category) = '';

alter table public.rifas drop constraint if exists rifas_category_valid;
alter table public.rifas add constraint rifas_category_valid check (category in (
  'vehicles', 'motorcycles', 'technology', 'cash', 'home', 'real_estate',
  'travel', 'appliances', 'experiences', 'charity', 'other'
));
