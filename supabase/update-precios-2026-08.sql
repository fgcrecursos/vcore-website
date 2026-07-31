-- Vcore — precios lista 01-08-2026
-- price = columna SUGERIDO/MENOR (minorista, lo que ve la tienda)
-- priceMayorista = columna MAYORISTA (lo aplica la remitera con la lista "Precio mayorista")
-- Solo los productos que figuran en la lista; el resto queda sin tocar.
--
-- OJO: cada UPDATE pisa el array completo de variants. Antes de correrlo conviene
-- chequear que las presentaciones cargadas en la base sean las mismas:
--   select id, variants from products order by id;

UPDATE products SET variants = '[{"label":"300 gr","price":23000,"priceMayorista":16100},{"label":"500 gr","price":32000,"priceMayorista":22400}]'::jsonb, price = 23000 WHERE id = 'creatina';
UPDATE products SET variants = '[{"label":"120 caps","price":14800,"priceMayorista":10360}]'::jsonb, price = 14800 WHERE id = 'magnesio';
UPDATE products SET variants = '[{"label":"60 caps","price":11400,"priceMayorista":7980},{"label":"120 caps","price":11400,"priceMayorista":7980}]'::jsonb, price = 11400 WHERE id = 'vitamina-c';
UPDATE products SET variants = '[{"label":"90 caps","price":16500,"priceMayorista":11550},{"label":"180 caps","price":16500,"priceMayorista":11550}]'::jsonb, price = 16500 WHERE id = 'triple-mag';
UPDATE products SET variants = '[{"label":"60 caps","price":14000,"priceMayorista":9800},{"label":"120 caps","price":14000,"priceMayorista":9800}]'::jsonb, price = 14000 WHERE id = 'citrato-magnesio';
UPDATE products SET variants = '[{"label":"60 caps","price":16800,"priceMayorista":11760},{"label":"120 caps","price":16800,"priceMayorista":11760}]'::jsonb, price = 16800 WHERE id = 'glicinato-magnesio';
UPDATE products SET variants = '[{"label":"60 caps","price":15860,"priceMayorista":11102},{"label":"120 caps","price":15860,"priceMayorista":11102}]'::jsonb, price = 15860 WHERE id = 'malato-magnesio';
UPDATE products SET variants = '[{"label":"60 caps","price":13500,"priceMayorista":9450},{"label":"120 caps","price":13500,"priceMayorista":9450}]'::jsonb, price = 13500 WHERE id = 'citrato-potasio';
UPDATE products SET variants = '[{"label":"60 caps","price":13000,"priceMayorista":9100},{"label":"120 caps","price":13000,"priceMayorista":9100}]'::jsonb, price = 13000 WHERE id = 'magnesio-potasio';
UPDATE products SET variants = '[{"label":"60 caps","price":12700,"priceMayorista":8890},{"label":"120 caps","price":12700,"priceMayorista":8890}]'::jsonb, price = 12700 WHERE id = 'espirulina';
UPDATE products SET variants = '[{"label":"60 caps","price":10500,"priceMayorista":7350},{"label":"120 caps","price":10500,"priceMayorista":7350}]'::jsonb, price = 10500 WHERE id = 'curcuma';
UPDATE products SET variants = '[{"label":"60 caps","price":12900,"priceMayorista":9030},{"label":"120 caps","price":12900,"priceMayorista":9030}]'::jsonb, price = 12900 WHERE id = 'maca';
UPDATE products SET variants = '[{"label":"60 caps","price":9300,"priceMayorista":6510},{"label":"120 caps","price":9300,"priceMayorista":6510}]'::jsonb, price = 9300 WHERE id = 'ajo-vitamina-c';
UPDATE products SET variants = '[{"label":"60 caps","price":13000,"priceMayorista":9100},{"label":"120 caps","price":13000,"priceMayorista":9100}]'::jsonb, price = 13000 WHERE id = 'cardo-mariano';
UPDATE products SET variants = '[{"label":"60 caps","price":15500,"priceMayorista":10850},{"label":"120 caps","price":15500,"priceMayorista":10850}]'::jsonb, price = 15500 WHERE id = 'cartilago-tiburon';
UPDATE products SET variants = '[{"label":"60 caps","price":13950,"priceMayorista":9765},{"label":"120 caps","price":13950,"priceMayorista":9765}]'::jsonb, price = 13950 WHERE id = 'zeolita';
