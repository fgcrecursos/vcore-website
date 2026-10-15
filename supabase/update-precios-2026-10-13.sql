-- ============================================================================
-- Vcore — Listas "MINORISTA 13-10" y "MAYORISTA 13.10" (15/10/2026)
-- ----------------------------------------------------------------------------
-- 1) Precios: 50 variantes en 29 productos (price = minorista,
--    priceMayorista = mayorista). Casi todo sube ~4-5%. BAJA el Bicarbonato:
--      500 g  6.000 / 4.200 -> 3200 / 2200
--      1 kg  12.000 / 8.400 -> 6300 / 4400
-- 2) Altas (estaban en la lista y no en la tienda), sin foto:
--      Pre-Entreno Remolacha 200 g   25000 / 17500
--      DuplaCore                     38000 / 26600
-- Palo Negro no está en la lista: queda como está.
--
-- Cada producto se actualiza solo si sus variantes están como al generar el
-- script (o ya con los precios nuevos); si alguien lo editó desde el panel,
-- se corta sin cambiar nada y dice cuál. Las altas usan "on conflict do
-- nothing" y frenan si ya hay un producto parecido. Idempotente.
-- Correr en el proyecto tojwsfhjvfglutyudspj (el de public/config.js).
-- ============================================================================

begin;

create temp table _cambios (id text, viejo jsonb, nuevo jsonb) on commit drop;

insert into _cambios values
  ('vitamina-c',
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 11400, "priceMayorista": 7980}]'::jsonb,
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 11900, "priceMayorista": 8300}]'::jsonb),
  ('magnesio',
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 14800, "priceMayorista": 10360}]'::jsonb,
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 15500, "priceMayorista": 10800}]'::jsonb),
  ('glicinato-magnesio',
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 16800, "priceMayorista": 11760}]'::jsonb,
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 17600, "priceMayorista": 12300}]'::jsonb),
  ('malato-magnesio',
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 15860, "priceMayorista": 11102}]'::jsonb,
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 16600, "priceMayorista": 11600}]'::jsonb),
  ('citrato-magnesio-polvo',
   '[{"label": "50 g", "pesoG": 80, "price": 7000, "priceMayorista": 4900}, {"label": "100 g", "pesoG": 130, "price": 11600, "priceMayorista": 8120}, {"label": "500 g", "pesoG": 600, "price": 22500, "priceMayorista": 15500}, {"label": "1 kg", "pesoG": 1150, "price": 35000, "priceMayorista": 24500}]'::jsonb,
   '[{"label": "50 g", "pesoG": 80, "price": 7300, "priceMayorista": 5100}, {"label": "100 g", "pesoG": 130, "price": 12200, "priceMayorista": 8500}, {"label": "500 g", "pesoG": 600, "price": 23200, "priceMayorista": 16200}, {"label": "1 kg", "pesoG": 1150, "price": 36500, "priceMayorista": 25500}]'::jsonb),
  ('glicinato-magnesio-polvo',
   '[{"label": "50 g", "pesoG": 80, "price": 12700, "priceMayorista": 8890}, {"label": "100 g", "pesoG": 130, "price": 21700, "priceMayorista": 15500}, {"label": "500 g", "pesoG": 600, "price": 62000, "priceMayorista": 43400}, {"label": "1 kg", "pesoG": 1150, "price": 121000, "priceMayorista": 84700}]'::jsonb,
   '[{"label": "50 g", "pesoG": 80, "price": 13300, "priceMayorista": 9300}, {"label": "100 g", "pesoG": 130, "price": 23200, "priceMayorista": 16200}, {"label": "500 g", "pesoG": 600, "price": 64700, "priceMayorista": 45200}, {"label": "1 kg", "pesoG": 1150, "price": 126000, "priceMayorista": 88100}]'::jsonb),
  ('curcuma',
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 10500, "priceMayorista": 7350}]'::jsonb,
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 11100, "priceMayorista": 7700}]'::jsonb),
  ('magnesio-potasio',
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 13000, "priceMayorista": 9100}]'::jsonb,
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 13600, "priceMayorista": 9500}]'::jsonb),
  ('triple-mag',
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 16500, "priceMayorista": 11550}]'::jsonb,
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 17400, "priceMayorista": 12100}]'::jsonb),
  ('triple-mag-polvo',
   '[{"label": "50 g", "pesoG": 80, "price": 15000, "priceMayorista": 10500}, {"label": "100 g", "pesoG": 130, "price": 24000, "priceMayorista": 17000}]'::jsonb,
   '[{"label": "50 g", "pesoG": 80, "price": 15800, "priceMayorista": 11000}, {"label": "100 g", "pesoG": 130, "price": 25400, "priceMayorista": 17700}]'::jsonb),
  ('espirulina',
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 12700, "priceMayorista": 8890}]'::jsonb,
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 13300, "priceMayorista": 9300}]'::jsonb),
  ('colageno-plus',
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 27000, "priceMayorista": 18900}]'::jsonb,
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 28200, "priceMayorista": 19700}]'::jsonb),
  ('hibiscus',
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 13500, "priceMayorista": 9450}]'::jsonb,
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 14200, "priceMayorista": 9900}]'::jsonb),
  ('vitamina-c-polvo',
   '[{"label": "50 g", "pesoG": 80, "price": 7300, "priceMayorista": 5110}, {"label": "500 g", "pesoG": 600, "price": 11000, "priceMayorista": 7700}, {"label": "1 kg", "pesoG": 1150, "price": 19000, "priceMayorista": 13300}]'::jsonb,
   '[{"label": "50 g", "pesoG": 80, "price": 7800, "priceMayorista": 5400}, {"label": "500 g", "pesoG": 600, "price": 11600, "priceMayorista": 8100}, {"label": "1 kg", "pesoG": 1150, "price": 19900, "priceMayorista": 13900}]'::jsonb),
  ('creatina',
   '[{"label": "150 g", "pesoG": 180, "price": 15000, "priceMayorista": 10500}, {"label": "300 g", "pesoG": 400, "price": 23000, "priceMayorista": 16100}, {"label": "500 g", "pesoG": 600, "price": 32000, "priceMayorista": 22400}, {"label": "1 kg", "pesoG": 1150, "price": 43000, "priceMayorista": 30100}]'::jsonb,
   '[{"label": "150 g", "pesoG": 180, "price": 15800, "priceMayorista": 11000}, {"label": "300 g", "pesoG": 400, "price": 24100, "priceMayorista": 16800}, {"label": "500 g", "pesoG": 600, "price": 33400, "priceMayorista": 23300}, {"label": "1 kg", "pesoG": 1150, "price": 45000, "priceMayorista": 31400}]'::jsonb),
  ('cardo-mariano',
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 13000, "priceMayorista": 9100}]'::jsonb,
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 13600, "priceMayorista": 9500}]'::jsonb),
  ('maca',
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 12900, "priceMayorista": 9030}]'::jsonb,
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 13500, "priceMayorista": 9400}]'::jsonb),
  ('citrato-potasio-polvo',
   '[{"label": "50 g", "pesoG": 80, "price": 6200, "priceMayorista": 4340}, {"label": "100 g", "pesoG": 130, "price": 11400, "priceMayorista": 7980}, {"label": "500 g", "pesoG": 600, "price": 20300, "priceMayorista": 14210}, {"label": "1 kg", "pesoG": 1150, "price": 33000, "priceMayorista": 23100}]'::jsonb,
   '[{"label": "50 g", "pesoG": 80, "price": 6600, "priceMayorista": 4600}, {"label": "100 g", "pesoG": 130, "price": 11900, "priceMayorista": 8300}, {"label": "500 g", "pesoG": 600, "price": 21200, "priceMayorista": 14800}, {"label": "1 kg", "pesoG": 1150, "price": 34500, "priceMayorista": 24100}]'::jsonb),
  ('zeolita',
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 13950, "priceMayorista": 9765}]'::jsonb,
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 14600, "priceMayorista": 10200}]'::jsonb),
  ('citrato-potasio',
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 13500, "priceMayorista": 9450}]'::jsonb,
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 14200, "priceMayorista": 9900}]'::jsonb),
  ('curcuma-jengibre',
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 12700, "priceMayorista": 8890}]'::jsonb,
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 13300, "priceMayorista": 9300}]'::jsonb),
  ('ajo-vitamina-c',
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 9300, "priceMayorista": 6510}]'::jsonb,
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 9800, "priceMayorista": 6800}]'::jsonb),
  ('cartilago-tiburon',
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 15500, "priceMayorista": 10850}]'::jsonb,
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 16200, "priceMayorista": 11300}]'::jsonb),
  ('remolacha-polvo',
   '[{"label": "500 g", "pesoG": 600, "price": 17000, "priceMayorista": 11900}, {"label": "1 kg", "pesoG": 1150, "price": 29000, "priceMayorista": 20300}]'::jsonb,
   '[{"label": "500 g", "pesoG": 600, "price": 17800, "priceMayorista": 12400}, {"label": "1 kg", "pesoG": 1150, "price": 30400, "priceMayorista": 21200}]'::jsonb),
  ('malato-magnesio-polvo',
   '[{"label": "50 g", "pesoG": 80, "price": 12000, "priceMayorista": 8400}, {"label": "100 g", "pesoG": 130, "price": 19300, "priceMayorista": 13700}, {"label": "500 g", "pesoG": 600, "price": 58000, "priceMayorista": 40600}, {"label": "1 kg", "pesoG": 1150, "price": 103000, "priceMayorista": 72100}]'::jsonb,
   '[{"label": "50 g", "pesoG": 80, "price": 12600, "priceMayorista": 8800}, {"label": "100 g", "pesoG": 130, "price": 20500, "priceMayorista": 14300}, {"label": "500 g", "pesoG": 600, "price": 60500, "priceMayorista": 42300}, {"label": "1 kg", "pesoG": 1150, "price": 107300, "priceMayorista": 75000}]'::jsonb),
  ('bicarbonato-sodio',
   '[{"label": "500 g", "pesoG": 600, "price": 6000, "priceMayorista": 4200}, {"label": "1 kg", "pesoG": 1150, "price": 12000, "priceMayorista": 8400}]'::jsonb,
   '[{"label": "500 g", "pesoG": 600, "price": 3200, "priceMayorista": 2200}, {"label": "1 kg", "pesoG": 1150, "price": 6300, "priceMayorista": 4400}]'::jsonb),
  ('colageno',
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 12700, "priceMayorista": 8890}]'::jsonb,
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 13300, "priceMayorista": 9300}]'::jsonb),
  ('citrato-magnesio',
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 14000, "priceMayorista": 9800}]'::jsonb,
   '[{"label": "60 cápsulas × 500 mg", "pesoG": 70, "price": 14600, "priceMayorista": 10200}]'::jsonb),
  ('citrato-mg-k-polvo',
   '[{"label": "50 g", "pesoG": 80, "price": 7200, "priceMayorista": 5040}, {"label": "100 g", "pesoG": 130, "price": 12500, "priceMayorista": 9000}]'::jsonb,
   '[{"label": "50 g", "pesoG": 80, "price": 7600, "priceMayorista": 5300}, {"label": "100 g", "pesoG": 130, "price": 13500, "priceMayorista": 9400}]'::jsonb);

do $$
declare faltan text; repetidos text;
begin
  select string_agg(c.id, ', ') into faltan
  from _cambios c
  where not exists (select 1 from public.products p
                    where p.id = c.id and p.variants::jsonb in (c.viejo, c.nuevo));
  if faltan is not null then
    raise exception 'Estos productos cambiaron desde el 15/10 o no existen, revisarlos antes de correr: %', faltan;
  end if;

  select string_agg(id || ' (' || name || ')', ', ') into repetidos
  from public.products
  where id not in ('pre-entreno-remolacha', 'duplacore')
    and (lower(name) like '%pre%entreno%' or lower(name) like '%dupla%');
  if repetidos is not null then
    raise exception 'Ya hay un producto parecido a una de las altas, revisarlo antes de correr: %', repetidos;
  end if;
end $$;

update public.products p
   set variants = c.nuevo,
       price = (c.nuevo->0->>'price')::numeric
  from _cambios c
 where p.id = c.id;

insert into public.products (id, name, sub, category, badge, blurb, tone, photo, variants, price, rating, reviews, visible, featured, sort)
values
  ('pre-entreno-remolacha', 'Pre-Entreno Remolacha', 'Pre-entreno a base de remolacha', 'Rendimiento', '', 'Energía natural antes de entrenar.', 'green', '', '[{"label": "200 g", "pesoG": 250, "price": 25000, "priceMayorista": 17500}]'::jsonb, 25000, 4.8, 0, true, false, 31),
  ('duplacore', 'DuplaCore', 'Creatina 150 g + Pre-Entreno 200 g', 'Rendimiento', '', 'La dupla para entrenar y recuperar: creatina y pre-entreno en un solo pedido.', 'green', '', '[{"label": "Creatina 150 g + Pre-Entreno 200 g", "pesoG": 430, "price": 38000, "priceMayorista": 26600}]'::jsonb, 38000, 4.8, 0, true, false, 32)
on conflict (id) do nothing;

commit;

-- Verificación:
--   select id, name, price, variants from public.products order by sort;
