-- Vcore usa los mismos datos de contacto que Somos Setas (16/10/2026).
-- Proyecto: tojwsfhjvfglutyudspj. Valor anterior del WhatsApp: 5492615031430.
update public.config
   set whatsapp = '5492615509004',
       address  = 'Marcos Sastre 985, Godoy Cruz – Mendoza, Argentina'
 where id = 1;

select id, whatsapp, address from public.config where id = 1;
