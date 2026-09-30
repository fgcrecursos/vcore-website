-- Pesos ESTIMADOS de cada presentación, para despachar con Andreani (30/09/2026).
-- No son pesos de balanza: contenido neto + envase estimado por tipo, siempre
-- redondeado hacia arriba para no declarar de menos:
--   gotero 60 ml → 150 g · gotero 30 ml → 100 g · gotero 10 ml → 50 g
--   60 cápsulas × 500 mg → 70 g · 90 × 150 mg → 60 g · polvo 30 g → 60 g
--   hasta 150 g: contenido + 30 g · desde 300 g: contenido + 8 %, de a 50 g
--   doy pack: contenido + 25 g (los "Doy pack" sin gramos se asumieron de 75 g)
-- Solo completa las presentaciones que NO tienen peso: nunca pisa uno cargado
-- a mano desde el panel. Se puede correr más de una vez.
-- Corregir después con la balanza en Descuentos → Envíos → Peso y medidas.
-- Proyecto Supabase de Vcore (tojwsfhjvfglutyudspj). 51 presentaciones.

begin;

create temp table pesos_estimados (pid text, label text, peso int) on commit drop;
insert into pesos_estimados (pid, label, peso) values
  ('magnesio', '60 cápsulas × 500 mg', 70),
  ('vitamina-c', '60 cápsulas × 500 mg', 70),
  ('citrato-magnesio-polvo', '50 g', 80),
  ('citrato-magnesio-polvo', '100 g', 130),
  ('citrato-magnesio-polvo', '500 g', 600),
  ('citrato-magnesio-polvo', '1 kg', 1150),
  ('glicinato-magnesio', '60 cápsulas × 500 mg', 70),
  ('glicinato-magnesio-polvo', '50 g', 80),
  ('glicinato-magnesio-polvo', '100 g', 130),
  ('glicinato-magnesio-polvo', '500 g', 600),
  ('glicinato-magnesio-polvo', '1 kg', 1150),
  ('malato-magnesio', '60 cápsulas × 500 mg', 70),
  ('creatina', '150 g', 180),
  ('creatina', '300 g', 400),
  ('creatina', '500 g', 600),
  ('creatina', '1 kg', 1150),
  ('vitamina-c-polvo', '50 g', 80),
  ('vitamina-c-polvo', '500 g', 600),
  ('vitamina-c-polvo', '1 kg', 1150),
  ('triple-mag', '60 cápsulas × 500 mg', 70),
  ('triple-mag-polvo', '50 g', 80),
  ('triple-mag-polvo', '100 g', 130),
  ('citrato-magnesio', '60 cápsulas × 500 mg', 70),
  ('malato-magnesio-polvo', '50 g', 80),
  ('malato-magnesio-polvo', '100 g', 130),
  ('malato-magnesio-polvo', '500 g', 600),
  ('malato-magnesio-polvo', '1 kg', 1150),
  ('citrato-potasio', '60 cápsulas × 500 mg', 70),
  ('citrato-potasio-polvo', '50 g', 80),
  ('citrato-potasio-polvo', '100 g', 130),
  ('citrato-potasio-polvo', '500 g', 600),
  ('citrato-potasio-polvo', '1 kg', 1150),
  ('citrato-mg-k-polvo', '50 g', 80),
  ('citrato-mg-k-polvo', '100 g', 130),
  ('magnesio-potasio', '60 cápsulas × 500 mg', 70),
  ('colageno', '60 cápsulas × 500 mg', 70),
  ('colageno-plus', '60 cápsulas × 500 mg', 70),
  ('espirulina', '60 cápsulas × 500 mg', 70),
  ('curcuma', '60 cápsulas × 500 mg', 70),
  ('maca', '60 cápsulas × 500 mg', 70),
  ('cartilago-tiburon', '60 cápsulas × 500 mg', 70),
  ('zeolita', '60 cápsulas × 500 mg', 70),
  ('hibiscus', '60 cápsulas × 500 mg', 70),
  ('remolacha-polvo', '500 g', 600),
  ('remolacha-polvo', '1 kg', 1150),
  ('palo-negro', '90 cápsulas × 150 mg', 60),
  ('curcuma-jengibre', '60 cápsulas × 500 mg', 70),
  ('cardo-mariano', '60 cápsulas × 500 mg', 70),
  ('ajo-vitamina-c', '60 cápsulas × 500 mg', 70),
  ('bicarbonato-sodio', '500 g', 600),
  ('bicarbonato-sodio', '1 kg', 1150);

-- Cada presentación es un elemento de products.variants; se identifica por su label.
update public.products p
   set variants = (
         select coalesce(jsonb_agg(
                  case when coalesce(v->>'pesoG', '') = '' and w.peso is not null
                       then v || jsonb_build_object('pesoG', w.peso)
                       else v end
                  order by o), '[]'::jsonb)
           from jsonb_array_elements(p.variants) with ordinality as x(v, o)
           left join pesos_estimados w on w.pid = p.id and w.label = v->>'label'
       )
 where jsonb_typeof(p.variants) = 'array'
   and exists (select 1 from pesos_estimados w where w.pid = p.id);

-- Control: cuántas presentaciones quedaron con y sin peso.
select count(*) filter (where coalesce(v->>'pesoG', '') <> '') as con_peso,
       count(*) filter (where coalesce(v->>'pesoG', '') = '')  as sin_peso
  from public.products p, jsonb_array_elements(p.variants) v;

commit;
