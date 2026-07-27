/* Vcore — Admin: usuarios del panel, roles y permisos.
   Registra window.VcoreAdminSections.usuarios. */
const React = window.React;
const { useState, useEffect } = React;
const K = window.VcoreAdminKit;
const { IcoClose, IcoPlus, IcoEdit, IcoTrash, IcoShield, Switch } = K;

/* Los permisos del ROL vienen fijos (checkbox marcado y bloqueado). Encima se
   pueden sumar permisos sueltos. Para sacar uno que da el rol hay que pasar el
   usuario a "Personalizado", que no aporta ninguno de base. */
function PermisosPicker({ rol, permisos, onChange }) {
  const base = window.vcRolePerms(rol);
  const esTotal = rol === 'superadmin';
  const toggle = (id) => {
    const set = new Set(permisos || []);
    if (set.has(id)) set.delete(id); else set.add(id);
    onChange(Array.from(set));
  };
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {window.VC_PERM_GROUPS.map(g => (
        <div key={g.id}>
          <div className="adm-ccstat__l" style={{ marginBottom: 6 }}>{g.label}</div>
          <div style={{ display: 'grid', gap: 6 }}>
            {g.perms.map(p => {
              const delRol = esTotal || base.includes(p.id);
              const checked = delRol || (permisos || []).includes(p.id);
              return (
                <label key={p.id} title={p.desc}
                  className={`adm-perm${checked ? ' on' : ''}${delRol ? ' locked' : ''}`}>
                  <input type="checkbox" checked={checked} disabled={delRol}
                    onChange={() => toggle(p.id)} style={{ marginTop: 3 }} />
                  <span>
                    <span className="adm-perm__l">{p.label}</span>
                    {delRol && <span style={{ fontSize: 10.5, color: 'var(--ink-400)', marginLeft: 6 }}>(incluido en el rol)</span>}
                    <div className="adm-perm__d">{p.desc}</div>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function UserEditor({ store, user, onClose }) {
  const esNuevo = !user;
  const [email, setEmail]       = useState((user && user.email) || '');
  const [nombre, setNombre]     = useState((user && user.nombre) || '');
  const [password, setPassword] = useState('');
  const [rol, setRol]           = useState((user && user.rol) || 'ventas');
  const [permisos, setPermisos] = useState(() => Array.isArray(user && user.permisos) ? user.permisos : []);
  const [notas, setNotas]       = useState((user && user.notas) || '');
  const [err, setErr]           = useState('');
  const [msg, setMsg]           = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const rolInfo = window.VC_ROLE_INFO[rol];
  /* Un acceso total no puede ser degradado por otro: solo se ve. */
  const esSuperadminAjeno = !esNuevo && user.rol === 'superadmin' &&
    user.email !== (store.userEmail || '').toLowerCase();

  async function guardar() {
    setErr(''); setMsg(''); setSaving(true);
    const res = esNuevo
      ? await store.createUser({ email, password, nombre, rol, permisos })
      : await store.updateUser(user.email, { nombre, rol, permisos, notas });
    setSaving(false);
    if (res && res.error) { setErr(res.error); return; }
    if (res && res.warning) { setMsg(res.warning); setTimeout(onClose, 2600); return; }
    onClose();
  }

  return (
    <div className="adm-modal-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal">
        <div className="adm-modal__hd">
          <h3>{esNuevo ? 'Nuevo usuario' : `Editar — ${user.nombre || user.email}`}</h3>
          <button className="adm-close" onClick={onClose}><IcoClose size={15} /></button>
        </div>
        <div className="adm-modal__body">
          {err && <div className="adm-box" style={{ background: '#FFEBEE', color: '#B71C1C', fontSize: 12.5, fontWeight: 700 }}>{err}</div>}
          {msg && <div className="adm-box adm-box--warn" style={{ fontSize: 12.5, color: '#8A5A2B' }}>{msg}</div>}
          {esSuperadminAjeno && (
            <div className="adm-box adm-box--warn" style={{ fontSize: 12.5, color: '#8A5A2B' }}>
              🔒 Es otro usuario con acceso total: podés ver sus datos pero no cambiar su rol ni sus permisos.
            </div>
          )}

          <div className="adm-field-row">
            <div className="adm-field"><label>Nombre</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Ej. María González" disabled={esSuperadminAjeno} />
            </div>
            <div className="adm-field"><label>Email {esNuevo ? '' : '(no se puede cambiar)'}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="persona@vcore.com.ar" disabled={!esNuevo} autoComplete="off" />
            </div>
          </div>

          {esNuevo && (
            <div className="adm-field"><label>Contraseña inicial (mínimo 6 caracteres)</label>
              <input type="text" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="La persona podrá cambiarla después" autoComplete="new-password" />
              <span className="adm-field__hint">
                Se crea la cuenta de acceso y se le asignan estos permisos. Pasale el email y la
                contraseña por un canal privado.
              </span>
            </div>
          )}

          <div className="adm-field"><label>Rol</label>
            <select value={rol} onChange={e => setRol(e.target.value)} disabled={esSuperadminAjeno}>
              {window.VC_ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
            {rolInfo && <span className="adm-field__hint">{rolInfo.desc}</span>}
          </div>

          {!esSuperadminAjeno && (
            <div className="adm-field"><label>Permisos</label>
              <PermisosPicker rol={rol} permisos={permisos} onChange={setPermisos} />
            </div>
          )}

          {!esNuevo && (
            <div className="adm-field"><label>Notas internas</label>
              <textarea rows={2} value={notas} onChange={e => setNotas(e.target.value)}
                placeholder="Ej. Encargada de depósito, turno mañana." disabled={esSuperadminAjeno} />
            </div>
          )}
        </div>
        <div className="adm-modal__ft">
          <button className="adm-btn adm-btn--outline" onClick={onClose}>Cancelar</button>
          {!esSuperadminAjeno && (
            <button className="adm-btn adm-btn--primary" onClick={guardar} disabled={saving}>
              {saving ? 'Guardando…' : esNuevo ? 'Crear usuario' : 'Guardar cambios'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminUsuarios({ store }) {
  const [editing, setEditing] = useState(null);   // "__new" | email
  const [aviso, setAviso] = useState('');

  const users = store.users || [];
  const miEmail = (store.userEmail || '').toLowerCase();
  const soySuperadmin = store.me && store.me.rol === 'superadmin';
  const editUser = editing && editing !== '__new' ? users.find(u => u.email === editing) : null;

  const flash = (t) => { setAviso(t); setTimeout(() => setAviso(''), 3500); };

  async function toggleActivo(u) {
    if (u.rol === 'superadmin') { flash('Los usuarios con acceso total no se pueden desactivar.'); return; }
    const res = await store.updateUser(u.email, { activo: !u.activo });
    if (res && res.error) flash(res.error);
  }

  async function remove(u) {
    if (u.rol === 'superadmin') { flash('Los usuarios con acceso total no se pueden eliminar entre sí.'); return; }
    if (u.email === miEmail) { flash('No podés eliminar tu propio usuario.'); return; }
    if (!confirm(`¿Eliminar a ${u.nombre || u.email}? Perderá el acceso al panel de inmediato.`)) return;
    const res = await store.deleteUser(u.email);
    if (res && res.error) flash(res.error);
  }

  const rolLabel = (id) => (window.VC_ROLE_INFO[id] || {}).label || id;
  /* Cantidad de permisos efectivos, para dar idea del alcance de cada usuario. */
  const permCount = (u) => window.vcEffectivePerms(u).length;

  return (
    <div>
      <div className="adm-head">
        <div className="adm-head__row">
          <div>
            <div className="adm-eye">Sistema</div>
            <h1>Usuarios</h1>
            <div className="adm-head__sub">
              {users.length} usuario{users.length !== 1 ? 's' : ''} con acceso al panel.
            </div>
          </div>
          <button className="adm-btn adm-btn--primary" onClick={() => setEditing('__new')}>
            <IcoPlus size={14} /> Nuevo usuario
          </button>
        </div>
      </div>

      {aviso && (
        <div className="adm-box adm-box--warn" style={{ marginBottom: 14, fontSize: 13, color: '#8A5A2B' }}>
          {aviso}
        </div>
      )}

      {!soySuperadmin && (
        <div className="adm-box" style={{ marginBottom: 14, fontSize: 12.5, color: 'var(--ink-500)' }}>
          Solo los usuarios con acceso total pueden guardar cambios acá. Vos podés consultar la lista.
        </div>
      )}

      <div className="adm-panel">
        {users.length === 0 ? (
          <div className="adm-empty">
            <IcoShield size={32} />
            <div>
              Todavía no hay usuarios cargados. Creá el primero o ejecutá{' '}
              <code>supabase/schema-v3.sql</code> en Supabase.
            </div>
          </div>
        ) : (
          <div className="adm-tblwrap">
            <table className="adm-tbl">
              <thead><tr>
                <th>Usuario</th><th>Email</th><th>Rol</th><th>Permisos</th><th>Activo</th><th></th>
              </tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.email}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                        {u.nombre || '—'}
                        {u.email === miEmail && (
                          <span className="adm-badge adm-badge--habitual" style={{ marginLeft: 8 }}>VOS</span>
                        )}
                      </div>
                      {u.notas && <div style={{ fontSize: 11.5, color: 'var(--ink-500)' }}>{u.notas}</div>}
                    </td>
                    <td style={{ fontSize: 12.5 }}>{u.email}</td>
                    <td>
                      <span className={`adm-chip ${u.rol === 'superadmin' ? 'adm-chip--confirmado' : 'adm-chip--nuevo'}`}>
                        {rolLabel(u.rol)}
                      </span>
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--ink-500)' }}>
                      {permCount(u)} de {window.VC_ALL_PERMS.length}
                    </td>
                    <td><Switch on={u.activo !== false} onChange={() => soySuperadmin && toggleActivo(u)} /></td>
                    <td>
                      <div className="adm-actions">
                        <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setEditing(u.email)}>
                          <IcoEdit size={13} />
                        </button>
                        {soySuperadmin && (
                          <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => remove(u)}>
                            <IcoTrash size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <UserEditor store={store} user={editing === '__new' ? null : editUser}
          onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

window.VcoreAdminSections = window.VcoreAdminSections || {};
window.VcoreAdminSections.usuarios = AdminUsuarios;

export default null;
