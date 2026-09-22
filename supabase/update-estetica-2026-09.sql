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
--
-- OJO: creatina ya tiene una foto real subida por el panel admin (Cloudinary).
-- Este script NO la pisa — solo actualiza su tone. Si preferís reemplazarla por
-- la foto de packaging del catálogo oficial, descomentá la línea de abajo.

UPDATE public.products SET tone = 'green' WHERE id = 'creatina';
-- UPDATE public.products SET photo = '/assets/vcore-pack-creatina-monohidrato.jpg' WHERE id = 'creatina';
UPDATE public.products SET tone = 'coral' WHERE id = 'proteina';
UPDATE public.products SET tone = 'coral' WHERE id = 'magnesio';
UPDATE public.products SET tone = 'navy'  WHERE id = 'vitamina-c';
UPDATE public.products SET tone = 'navy'  WHERE id = 'vitamina-c-polvo';
UPDATE public.products SET tone = 'navy', photo = '/assets/vcore-pack-triple-magnesio.jpg' WHERE id = 'triple-mag';
UPDATE public.products SET tone = 'navy', photo = '/assets/vcore-pack-triple-magnesio.jpg' WHERE id = 'triple-mag-polvo';
UPDATE public.products SET tone = 'navy', photo = '/assets/vcore-pack-citrato-magnesio.jpg' WHERE id = 'citrato-magnesio';
UPDATE public.products SET tone = 'navy', photo = '/assets/vcore-pack-citrato-magnesio.jpg' WHERE id = 'citrato-magnesio-polvo';
UPDATE public.products SET tone = 'navy', photo = '/assets/vcore-pack-glicinato-magnesio.jpg' WHERE id = 'glicinato-magnesio';
UPDATE public.products SET tone = 'navy', photo = '/assets/vcore-pack-glicinato-magnesio.jpg' WHERE id = 'glicinato-magnesio-polvo';
UPDATE public.products SET tone = 'navy', photo = '/assets/vcore-pack-malato-magnesio.jpg' WHERE id = 'malato-magnesio';
UPDATE public.products SET tone = 'navy', photo = '/assets/vcore-pack-malato-magnesio.jpg' WHERE id = 'malato-magnesio-polvo';
UPDATE public.products SET tone = 'navy', photo = '/assets/vcore-pack-citrato-potasio.jpg' WHERE id = 'citrato-potasio';
UPDATE public.products SET tone = 'navy', photo = '/assets/vcore-pack-citrato-potasio.jpg' WHERE id = 'citrato-potasio-polvo';
UPDATE public.products SET tone = 'navy', photo = '/assets/vcore-pack-magnesio-potasio.jpg' WHERE id = 'citrato-mg-k-polvo';
UPDATE public.products SET tone = 'navy', photo = '/assets/vcore-pack-magnesio-potasio.jpg' WHERE id = 'magnesio-potasio';
UPDATE public.products SET tone = 'coral' WHERE id = 'colageno';
UPDATE public.products SET tone = 'coral' WHERE id = 'colageno-plus';
UPDATE public.products SET tone = 'sage'  WHERE id = 'espirulina';
UPDATE public.products SET tone = 'sage'  WHERE id = 'curcuma';
UPDATE public.products SET tone = 'sage'  WHERE id = 'maca';
UPDATE public.products SET tone = 'sage'  WHERE id = 'ajo-vitamina-c';
UPDATE public.products SET tone = 'sage'  WHERE id = 'cardo-mariano';
UPDATE public.products SET tone = 'coral' WHERE id = 'cartilago-tiburon';
UPDATE public.products SET tone = 'sage'  WHERE id = 'zeolita';
