/* Vcore — Backend integration (Supabase data/auth + Cloudinary images).
   Real ES module: imported by main.jsx. Assigns window.VcoreBackend.
   When config is empty, isOn() === false and the app stays in demo mode. */
import { createClient } from '@supabase/supabase-js';

const CFG = (typeof window !== 'undefined' && window.__VCORE_CONFIG__) || {};

let _sb = null;
function sb() {
  if (_sb) return _sb;
  if (!CFG.supabaseUrl || !CFG.supabaseAnonKey) return null;
  _sb = createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return _sb;
}

const Backend = {
  /* ── status ─────────────────────────────────────────── */
  isOn() { return !!(CFG.supabaseUrl && CFG.supabaseAnonKey); },
  cloudinaryOn() { return !!(CFG.cloudinaryCloudName && CFG.cloudinaryUploadPreset); },

  /* ── auth ───────────────────────────────────────────── */
  async login(email, password) {
    const c = sb(); if (!c) throw new Error('Backend no configurado');
    const { data, error } = await c.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },
  async logout() { const c = sb(); if (c) await c.auth.signOut(); },
  async currentUser() {
    const c = sb(); if (!c) return null;
    const { data } = await c.auth.getUser();
    return data ? data.user : null;
  },
  onAuthChange(cb) {
    const c = sb(); if (!c) return () => {};
    const { data } = c.auth.onAuthStateChange((_e, session) => cb(session ? session.user : null));
    return () => data.subscription.unsubscribe();
  },

  /* ── products ───────────────────────────────────────── */
  async fetchProducts() {
    const c = sb(); if (!c) return null;
    const { data, error } = await c.from('products').select('*').order('sort', { ascending: true });
    if (error) { console.error('[Vcore] fetchProducts', error.message); return null; }
    return data;
  },
  async saveProduct(p) {
    const c = sb(); if (!c) throw new Error('Backend no configurado');
    const row = {
      id: p.id, name: p.name, sub: p.sub || '', category: p.category || 'Bienestar',
      badge: p.badge || '', blurb: p.blurb || '', tone: p.tone || 'green', photo: p.photo || '',
      variants: p.variants || [], price: p.price || 0,
      rating: p.rating ?? 4.8, reviews: p.reviews ?? 0,
      visible: p.visible !== false, featured: !!p.featured, sort: p.sort ?? 0,
    };
    const { error } = await c.from('products').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  },
  async deleteProduct(id) {
    const c = sb(); if (!c) throw new Error('Backend no configurado');
    const { error } = await c.from('products').delete().eq('id', id);
    if (error) throw error;
  },
  async importProducts(list) {
    const c = sb(); if (!c) throw new Error('Backend no configurado');
    const rows = list.map((p, i) => ({
      id: p.id, name: p.name, sub: p.sub || '', category: p.category || 'Bienestar',
      badge: p.badge || '', blurb: p.blurb || '', tone: p.tone || 'green', photo: p.photo || '',
      variants: p.variants || (p.sizes || []).map(s => ({ label: s, price: p.price || 0 })),
      price: p.price || 0, rating: p.rating ?? 4.8, reviews: p.reviews ?? 0,
      visible: p.visible !== false, featured: !!p.featured, sort: p.sort ?? i,
    }));
    const { error } = await c.from('products').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
  },

  /* ── codes ──────────────────────────────────────────── */
  async fetchCodes() {
    const c = sb(); if (!c) return null;
    const { data, error } = await c.from('codes').select('*');
    if (error) { console.error('[Vcore] fetchCodes', error.message); return null; }
    return data;
  },
  async saveCode(code) {
    const c = sb(); if (!c) throw new Error('Backend no configurado');
    const row = { id: code.id, code: code.code, value: code.value, active: !!code.active, note: code.note || '' };
    const { error } = await c.from('codes').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  },
  async deleteCode(id) {
    const c = sb(); if (!c) throw new Error('Backend no configurado');
    const { error } = await c.from('codes').delete().eq('id', id);
    if (error) throw error;
  },

  /* ── config ─────────────────────────────────────────── */
  async fetchConfig() {
    const c = sb(); if (!c) return null;
    const { data, error } = await c.from('config').select('*').eq('id', 1).single();
    if (error) { console.error('[Vcore] fetchConfig', error.message); return null; }
    return data;
  },
  async saveConfig(cfg) {
    const c = sb(); if (!c) throw new Error('Backend no configurado');
    const row = { id: 1, whatsapp: cfg.whatsapp || '', address: cfg.address || '',
      instagram: cfg.instagram || '', email: cfg.email || '' };
    const { error } = await c.from('config').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  },

  /* ── orders ─────────────────────────────────────────── */
  async createOrder(o) {
    const c = sb(); if (!c) return false;
    const row = {
      id: o.id, customer_name: o.customer_name || '', customer_phone: o.customer_phone || '',
      summary: o.summary || '', items: o.items || [], subtotal: o.subtotal || 0,
      tier_name: o.tierName || '', tier_disc: o.tierDiscAmt || 0,
      coupon_code: o.couponCode || '', coupon_disc: o.couponDiscAmt || 0,
      shipping_label: o.shippingLabel || '', shipping_cost: o.shippingCost || 0,
      total: o.total || 0, status: o.status || 'nuevo',
    };
    const { error } = await c.from('orders').insert(row);
    if (error) { console.error('[Vcore] createOrder', error.message); return false; }
    return true;
  },
  async listOrders() {
    const c = sb(); if (!c) return [];
    const { data, error } = await c.from('orders').select('*').order('created_at', { ascending: false });
    if (error) { console.error('[Vcore] listOrders', error.message); return []; }
    // map snake_case → the shape the admin UI expects
    return (data || []).map(r => ({
      id: r.id, date: r.created_at, ts: new Date(r.created_at).getTime(),
      summary: r.summary, items: r.items || [], subtotal: r.subtotal,
      tierName: r.tier_name, tierDiscAmt: r.tier_disc,
      couponCode: r.coupon_code, couponDiscAmt: r.coupon_disc,
      shippingLabel: r.shipping_label, shippingCost: r.shipping_cost,
      total: r.total, status: r.status,
      customerName: r.customer_name, customerPhone: r.customer_phone,
    }));
  },
  async updateOrderStatus(id, status) {
    const c = sb(); if (!c) throw new Error('Backend no configurado');
    const { error } = await c.from('orders').update({ status }).eq('id', id);
    if (error) throw error;
  },
  async deleteOrder(id) {
    const c = sb(); if (!c) throw new Error('Backend no configurado');
    const { error } = await c.from('orders').delete().eq('id', id);
    if (error) throw error;
  },

  /* ── Cloudinary image upload (unsigned) ─────────────── */
  async uploadImage(file) {
    if (!this.cloudinaryOn()) throw new Error('Cloudinary no configurado');
    const url = `https://api.cloudinary.com/v1_1/${CFG.cloudinaryCloudName}/image/upload`;
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', CFG.cloudinaryUploadPreset);
    const res = await fetch(url, { method: 'POST', body: form });
    if (!res.ok) {
      let msg = 'Error al subir la imagen';
      try { const j = await res.json(); msg = (j.error && j.error.message) || msg; } catch {}
      throw new Error(msg);
    }
    const data = await res.json();
    return data.secure_url;
  },
};

window.VcoreBackend = Backend;
export default Backend;
