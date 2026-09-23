-- ============================================================================
-- Vcore — catálogo alineado con los suplementos de Somos Setas (23/09/2026)
-- ----------------------------------------------------------------------------
-- 1) Actualiza presentaciones y precios (minorista + mayorista) de los 25
--    productos de Vcore que también vende Somos Setas, con la lista vigente
--    allá. No toca nombre, foto, categoría, destacados ni visibilidad.
-- 2) Da de alta los 5 suplementos que Vcore no tenía. Si ya existe un
--    producto con ese id, NO lo pisa (on conflict do nothing).
--
-- Cada actualización verifica que el producto esté exactamente como estaba
-- al generar este script (23/09/2026). Si alguien lo editó desde el panel
-- entremedio, el script se corta sin cambiar nada y avisa cuál fue.
-- Correr en el proyecto tojwsfhjvfglutyudspj (el de public/config.js).
-- ============================================================================

begin;

do $$
declare n int;
begin
  -- Magnesio (Bisglicinato) <- Bisglicinato de magnesio
  update public.products
     set variants = '[{"label": "60 cápsulas × 500 mg", "price": 14800, "priceMayorista": 10360}]'::jsonb, price = 14800
   where id = 'magnesio' and variants::jsonb = '[{"label": "120 caps", "price": 11990}]'::jsonb and price = 11990;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'magnesio'; end if;

  -- Vitamina C (Ácido Ascorbato puro — Cápsulas) <- Vitamina C
  update public.products
     set variants = '[{"label": "60 cápsulas × 500 mg", "price": 11400, "priceMayorista": 7980}]'::jsonb, price = 11400
   where id = 'vitamina-c' and variants::jsonb = '[{"label": "60 caps", "price": 11400, "priceMayorista": 0}, {"label": "120 caps", "price": 11400, "priceMayorista": 0}]'::jsonb and price = 11400;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'vitamina-c'; end if;

  -- Citrato de Magnesio (Polvo) <- Citrato de Magnesio — Polvo
  update public.products
     set variants = '[{"label": "50 g", "price": 7000, "priceMayorista": 4900}, {"label": "100 g", "price": 11600, "priceMayorista": 8120}, {"label": "500 g", "price": 22500, "priceMayorista": 15500}, {"label": "1 kg", "price": 35000, "priceMayorista": 24500}]'::jsonb, price = 7000
   where id = 'citrato-magnesio-polvo' and variants::jsonb = '[{"label": "150 gr", "price": 7000, "priceMayorista": 0}, {"label": "300 gr", "price": 7000, "priceMayorista": 0}]'::jsonb and price = 7000;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'citrato-magnesio-polvo'; end if;

  -- Glicinato de Magnesio (Cápsulas) <- Glicinato de Magnesio
  update public.products
     set variants = '[{"label": "60 cápsulas × 500 mg", "price": 16800, "priceMayorista": 11760}]'::jsonb, price = 16800
   where id = 'glicinato-magnesio' and variants::jsonb = '[{"label": "60 caps", "price": 16800, "priceMayorista": 0}, {"label": "120 caps", "price": 16800, "priceMayorista": 0}]'::jsonb and price = 16800;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'glicinato-magnesio'; end if;

  -- Glicinato de Magnesio (Polvo) <- Glicinato de Magnesio — Polvo
  update public.products
     set variants = '[{"label": "50 g", "price": 12700, "priceMayorista": 8890}, {"label": "100 g", "price": 21700, "priceMayorista": 15500}, {"label": "500 g", "price": 62000, "priceMayorista": 43400}, {"label": "1 kg", "price": 121000, "priceMayorista": 84700}]'::jsonb, price = 12700
   where id = 'glicinato-magnesio-polvo' and variants::jsonb = '[{"label": "150 gr", "price": 12700}, {"label": "300 gr", "price": 12700}]'::jsonb and price = 12700;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'glicinato-magnesio-polvo'; end if;

  -- Malato de Magnesio (Cápsulas) <- Malato de Magnesio
  update public.products
     set variants = '[{"label": "60 cápsulas × 500 mg", "price": 15860, "priceMayorista": 11102}]'::jsonb, price = 15860
   where id = 'malato-magnesio' and variants::jsonb = '[{"label": "60 caps", "price": 18600, "priceMayorista": 0}, {"label": "120 caps", "price": 18600, "priceMayorista": 0}]'::jsonb and price = 18600;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'malato-magnesio'; end if;

  -- Creatina (Monohidrato) <- Creatina Monohidrato (alta pureza 99,58%)
  update public.products
     set variants = '[{"label": "150 g", "price": 15000, "priceMayorista": 10500}, {"label": "300 g", "price": 23000, "priceMayorista": 16100}, {"label": "500 g", "price": 32000, "priceMayorista": 22400}, {"label": "1 kg", "price": 43000, "priceMayorista": 30100}]'::jsonb, price = 15000
   where id = 'creatina' and variants::jsonb = '[{"label": "150gr", "price": 17000, "priceMayorista": 0}, {"label": "300", "price": 26000, "priceMayorista": 0}]'::jsonb and price = 17000;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'creatina'; end if;

  -- Vitamina C (Ácido Ascorbato puro — Polvo) <- Vitamina C — Polvo
  update public.products
     set variants = '[{"label": "50 g", "price": 7300, "priceMayorista": 5110}, {"label": "500 g", "price": 11000, "priceMayorista": 7700}, {"label": "1 kg", "price": 19000, "priceMayorista": 13300}]'::jsonb, price = 7300
   where id = 'vitamina-c-polvo' and variants::jsonb = '[{"label": "100 gr", "price": 7300}, {"label": "250 gr", "price": 7300}]'::jsonb and price = 7300;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'vitamina-c-polvo'; end if;

  -- Triple Magnesio (Citrato · Glicinato · Malato — Cápsulas) <- Triple Magnesio
  update public.products
     set variants = '[{"label": "60 cápsulas × 500 mg", "price": 16500, "priceMayorista": 11550}]'::jsonb, price = 16500
   where id = 'triple-mag' and variants::jsonb = '[{"label": "90 caps", "price": 16500, "priceMayorista": 0}, {"label": "180 caps", "price": 16500, "priceMayorista": 0}]'::jsonb and price = 16500;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'triple-mag'; end if;

  -- Triple Magnesio (Citrato · Glicinato · Malato — Polvo) <- Triple Magnesio — Polvo
  update public.products
     set variants = '[{"label": "50 g", "price": 15000, "priceMayorista": 10500}, {"label": "100 g", "price": 24000, "priceMayorista": 17000}]'::jsonb, price = 15000
   where id = 'triple-mag-polvo' and variants::jsonb = '[{"label": "150 gr", "price": 15000}, {"label": "300 gr", "price": 15000}]'::jsonb and price = 15000;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'triple-mag-polvo'; end if;

  -- Citrato de Magnesio (Cápsulas) <- Citrato de Magnesio
  update public.products
     set variants = '[{"label": "60 cápsulas × 500 mg", "price": 14000, "priceMayorista": 9800}]'::jsonb, price = 14000
   where id = 'citrato-magnesio' and variants::jsonb = '[{"label": "60 caps", "price": 14000, "priceMayorista": 0}, {"label": "120 caps", "price": 14000, "priceMayorista": 0}]'::jsonb and price = 14000;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'citrato-magnesio'; end if;

  -- Malato de Magnesio (Polvo) <- Malato de Magnesio — Polvo
  update public.products
     set variants = '[{"label": "50 g", "price": 12000, "priceMayorista": 8400}, {"label": "100 g", "price": 19300, "priceMayorista": 13700}, {"label": "500 g", "price": 58000, "priceMayorista": 40600}, {"label": "1 kg", "price": 103000, "priceMayorista": 72100}]'::jsonb, price = 12000
   where id = 'malato-magnesio-polvo' and variants::jsonb = '[{"label": "150 gr", "price": 12000}, {"label": "300 gr", "price": 12000}]'::jsonb and price = 12000;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'malato-magnesio-polvo'; end if;

  -- Citrato de Potasio (Cápsulas) <- Citrato de Potasio
  update public.products
     set variants = '[{"label": "60 cápsulas × 500 mg", "price": 13500, "priceMayorista": 9450}]'::jsonb, price = 13500
   where id = 'citrato-potasio' and variants::jsonb = '[{"label": "60 caps", "price": 13500}, {"label": "120 caps", "price": 13500}]'::jsonb and price = 13500;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'citrato-potasio'; end if;

  -- Citrato de Potasio (Polvo) <- Citrato de Potasio — Polvo
  update public.products
     set variants = '[{"label": "50 g", "price": 6200, "priceMayorista": 4340}, {"label": "100 g", "price": 11400, "priceMayorista": 7980}, {"label": "500 g", "price": 20300, "priceMayorista": 14210}, {"label": "1 kg", "price": 33000, "priceMayorista": 23100}]'::jsonb, price = 6200
   where id = 'citrato-potasio-polvo' and variants::jsonb = '[{"label": "150 gr", "price": 6200}, {"label": "300 gr", "price": 6200}]'::jsonb and price = 6200;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'citrato-potasio-polvo'; end if;

  -- Citrato Mg + K (Magnesio + Potasio — Polvo) <- Citrato de Magnesio + Potasio — Polvo
  update public.products
     set variants = '[{"label": "50 g", "price": 7200, "priceMayorista": 5040}, {"label": "100 g", "price": 12500, "priceMayorista": 9000}]'::jsonb, price = 7200
   where id = 'citrato-mg-k-polvo' and variants::jsonb = '[{"label": "150 gr", "price": 7200}, {"label": "300 gr", "price": 7200}]'::jsonb and price = 7200;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'citrato-mg-k-polvo'; end if;

  -- Magnesio + Potasio (Cápsulas) <- Magnesio + Potasio
  update public.products
     set variants = '[{"label": "60 cápsulas × 500 mg", "price": 13000, "priceMayorista": 9100}]'::jsonb, price = 13000
   where id = 'magnesio-potasio' and variants::jsonb = '[{"label": "60 caps", "price": 14800, "priceMayorista": 0}, {"label": "120 caps", "price": 14800, "priceMayorista": 0}]'::jsonb and price = 14800;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'magnesio-potasio'; end if;

  -- Colágeno (Hidrolizado Tipo I & III) <- Colágeno Hidrolizado
  update public.products
     set variants = '[{"label": "60 cápsulas × 500 mg", "price": 12700, "priceMayorista": 8890}]'::jsonb, price = 12700
   where id = 'colageno' and variants::jsonb = '[{"label": "300 gr", "price": 12700}, {"label": "500 gr", "price": 12700}]'::jsonb and price = 12700;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'colageno'; end if;

  -- Colágeno Plus (Con Vitamina C y Ácido Hialurónico) <- Colágeno Plus
  update public.products
     set variants = '[{"label": "60 cápsulas × 500 mg", "price": 27000, "priceMayorista": 18900}]'::jsonb, price = 27000
   where id = 'colageno-plus' and variants::jsonb = '[{"label": "300 gr", "price": 27000}, {"label": "500 gr", "price": 27000}]'::jsonb and price = 27000;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'colageno-plus'; end if;

  -- Espirulina (Spirulina platensis) <- Espirulina
  update public.products
     set variants = '[{"label": "60 cápsulas × 500 mg", "price": 12700, "priceMayorista": 8890}]'::jsonb, price = 12700
   where id = 'espirulina' and variants::jsonb = '[{"label": "60 caps", "price": 12699}, {"label": "120 caps", "price": 12699}]'::jsonb and price = 12699;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'espirulina'; end if;

  -- Cúrcuma (Curcumina + Piperina) <- Cúrcuma + Pimienta Negra
  update public.products
     set variants = '[{"label": "60 cápsulas × 500 mg", "price": 10500, "priceMayorista": 7350}]'::jsonb, price = 10500
   where id = 'curcuma' and variants::jsonb = '[{"label": "60 caps", "price": 10500}, {"label": "120 caps", "price": 10500}]'::jsonb and price = 10500;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'curcuma'; end if;

  -- Maca (Lepidium meyenii) <- Maca
  update public.products
     set variants = '[{"label": "60 cápsulas × 500 mg", "price": 12900, "priceMayorista": 9030}]'::jsonb, price = 12900
   where id = 'maca' and variants::jsonb = '[{"label": "60 caps", "price": 12900}, {"label": "120 caps", "price": 12900}]'::jsonb and price = 12900;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'maca'; end if;

  -- Ajo + Vitamina C (Extracto de ajo + ácido ascorbato) <- Ajo + Vitamina C
  update public.products
     set variants = '[{"label": "60 cápsulas × 500 mg", "price": 9300, "priceMayorista": 6510}]'::jsonb, price = 9300
   where id = 'ajo-vitamina-c' and variants::jsonb = '[{"label": "60 caps", "price": 9300}, {"label": "120 caps", "price": 9300}]'::jsonb and price = 9300;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'ajo-vitamina-c'; end if;

  -- Cardo Mariano (Silimarina 80%) <- Cardo Mariano
  update public.products
     set variants = '[{"label": "60 cápsulas × 500 mg", "price": 13000, "priceMayorista": 9100}]'::jsonb, price = 13000
   where id = 'cardo-mariano' and variants::jsonb = '[{"label": "60 caps", "price": 13000}, {"label": "120 caps", "price": 13000}]'::jsonb and price = 13000;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'cardo-mariano'; end if;

  -- Cartílago de Tiburón (Condroitina natural) <- Cartílago de Tiburón
  update public.products
     set variants = '[{"label": "60 cápsulas × 500 mg", "price": 15500, "priceMayorista": 10850}]'::jsonb, price = 15500
   where id = 'cartilago-tiburon' and variants::jsonb = '[{"label": "60 caps", "price": 15500}, {"label": "120 caps", "price": 15500}]'::jsonb and price = 15500;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'cartilago-tiburon'; end if;

  -- Zeolita (Clinoptilolita activada) <- Zeolita
  update public.products
     set variants = '[{"label": "60 cápsulas × 500 mg", "price": 13950, "priceMayorista": 9765}]'::jsonb, price = 13950
   where id = 'zeolita' and variants::jsonb = '[{"label": "60 caps", "price": 13950}, {"label": "120 caps", "price": 13950}]'::jsonb and price = 13950;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'El producto % cambió desde el 23/09 o no existe: revisarlo antes de correr', 'zeolita'; end if;

end $$;

insert into public.products (id, name, sub, category, badge, blurb, tone, photo, variants, price, rating, reviews, visible, featured, sort) values
  ('curcuma-jengibre', 'Cúrcuma + Jengibre', 'Con Pimienta Negra — Cápsulas', 'Bienestar', '', 'Sinergia herbal de triple acción.', 'sage', '', '[{"label": "60 cápsulas × 500 mg", "price": 12700, "priceMayorista": 8890}]'::jsonb, 12700, 4.8, 0, true, false, 26),
  ('hibiscus', 'Hibiscus', 'Hibiscus rosa-sinensis — Cápsulas', 'Bienestar', '', 'Presión arterial y antioxidante.', 'sage', '', '[{"label": "60 cápsulas × 500 mg", "price": 13500, "priceMayorista": 9450}]'::jsonb, 13500, 4.8, 0, true, false, 27),
  ('remolacha-polvo', 'Remolacha', '100% remolacha — Polvo', 'Rendimiento', '', 'Óxido nítrico natural para el rendimiento.', 'green', '', '[{"label": "500 g", "price": 17000, "priceMayorista": 11900}, {"label": "1 kg", "price": 29000, "priceMayorista": 20300}]'::jsonb, 17000, 4.8, 0, true, false, 28),
  ('bicarbonato-sodio', 'Bicarbonato de Sodio', 'Uso alimentario — Polvo', 'Rendimiento', '', 'Equilibrio ácido-base natural.', 'green', '', '[{"label": "500 g", "price": 9500, "priceMayorista": 6650}, {"label": "1 kg", "price": 18000, "priceMayorista": 12600}]'::jsonb, 9500, 4.8, 0, true, false, 29),
  ('palo-negro', 'Palo Negro Chileno', 'Leptocarpha rivularis — Cápsulas', 'Bienestar', '', 'Equilibrio digestivo, tradición del sur.', 'sage', '', '[{"label": "90 cápsulas × 150 mg", "price": 24000, "priceMayorista": 16800}]'::jsonb, 24000, 4.8, 0, false, false, 30)
on conflict (id) do nothing;

commit;

-- Control: tiene que devolver 31 filas, con los precios nuevos.
select id, name, sub, category, price, visible, variants
  from public.products order by sort;
