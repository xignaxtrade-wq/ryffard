-- Paleta predeterminada de TA' DAO RD.
-- Ejecutar una vez en Supabase > SQL Editor.

alter table public.profiles
  alter column brand_primary_color set default '#006B3C',
  alter column brand_secondary_color set default '#FFB300';

update public.profiles
set
  brand_primary_color = case
    when brand_primary_color is null or lower(brand_primary_color) in ('#6c63ff', '#1647a8') then '#006B3C'
    else brand_primary_color
  end,
  brand_secondary_color = case
    when brand_secondary_color is null or lower(brand_secondary_color) in ('#00d2ff', '#f4b942') then '#FFB300'
    else brand_secondary_color
  end
where
  brand_primary_color is null
  or brand_secondary_color is null
  or lower(brand_primary_color) in ('#6c63ff', '#1647a8')
  or lower(brand_secondary_color) in ('#00d2ff', '#f4b942');
