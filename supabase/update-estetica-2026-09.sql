-- Vcore — rediseño estético 2026-09
-- Actualiza SOLO tone (paleta multi-línea por categoría) y photo (fotos reales
-- de packaging tomadas del catálogo oficial de la marca). No toca precios,
-- variants ni ningún otro campo.
--
-- Paleta por línea:
--   green = Rendimiento y Fuerza (Creatina)
--   navy  = Salud y Recuperación / Vitaminas (Magnesios, Potasio, Vitamina C)
--   coral = Recuperación muscular / Colágeno / Articulaciones
--   sage  = Bienestar (herbales / naturales)
--
-- Los productos que todavía no existan como fila en esta base simplemente no
-- se actualizan (0 filas afectadas, sin error).

UPDATE products SET tone = 'green', photo = '/assets/vcore-pack-creatina-monohidrato.jpg' WHERE id = 'creatina';
UPDATE products SET tone = 'coral' WHERE id = 'proteina';
UPDATE products SET tone = 'coral' WHERE id = 'magnesio';
UPDATE products SET tone = 'navy'  WHERE id = 'vitamina-c';
UPDATE products SET tone = 'navy'  WHERE id = 'vitamina-c-polvo';
UPDATE products SET tone = 'navy', photo = '/assets/vcore-pack-triple-magnesio.jpg' WHERE id = 'triple-mag';
UPDATE products SET tone = 'navy', photo = '/assets/vcore-pack-triple-magnesio.jpg' WHERE id = 'triple-mag-polvo';
UPDATE products SET tone = 'navy', photo = '/assets/vcore-pack-citrato-magnesio.jpg' WHERE id = 'citrato-magnesio';
UPDATE products SET tone = 'navy', photo = '/assets/vcore-pack-citrato-magnesio.jpg' WHERE id = 'citrato-magnesio-polvo';
UPDATE products SET tone = 'navy', photo = '/assets/vcore-pack-glicinato-magnesio.jpg' WHERE id = 'glicinato-magnesio';
UPDATE products SET tone = 'navy', photo = '/assets/vcore-pack-glicinato-magnesio.jpg' WHERE id = 'glicinato-magnesio-polvo';
UPDATE products SET tone = 'navy', photo = '/assets/vcore-pack-malato-magnesio.jpg' WHERE id = 'malato-magnesio';
UPDATE products SET tone = 'navy', photo = '/assets/vcore-pack-malato-magnesio.jpg' WHERE id = 'malato-magnesio-polvo';
UPDATE products SET tone = 'navy', photo = '/assets/vcore-pack-citrato-potasio.jpg' WHERE id = 'citrato-potasio';
UPDATE products SET tone = 'navy', photo = '/assets/vcore-pack-citrato-potasio.jpg' WHERE id = 'citrato-potasio-polvo';
UPDATE products SET tone = 'navy', photo = '/assets/vcore-pack-magnesio-potasio.jpg' WHERE id = 'citrato-mg-k-polvo';
UPDATE products SET tone = 'navy', photo = '/assets/vcore-pack-magnesio-potasio.jpg' WHERE id = 'magnesio-potasio';
UPDATE products SET tone = 'coral' WHERE id = 'colageno';
UPDATE products SET tone = 'coral' WHERE id = 'colageno-plus';
UPDATE products SET tone = 'sage'  WHERE id = 'espirulina';
UPDATE products SET tone = 'sage'  WHERE id = 'curcuma';
UPDATE products SET tone = 'sage'  WHERE id = 'maca';
UPDATE products SET tone = 'sage'  WHERE id = 'ajo-vitamina-c';
UPDATE products SET tone = 'sage'  WHERE id = 'cardo-mariano';
UPDATE products SET tone = 'coral' WHERE id = 'cartilago-tiburon';
UPDATE products SET tone = 'sage'  WHERE id = 'zeolita';
