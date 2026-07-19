import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { IconPlus } from '../components/Icon';

export default function StaffPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user', department: '', phone: '' });
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const load = async () => {
    setLoading(true);
    const data = await api.listUsers();
    setUsers(data.users);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createStaff(form);
      setForm({ name: '', email: '', password: '', role: 'user', department: '', phone: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (u) => {
    setDeleteError('');
    if (!window.confirm(`Delete ${u.name}'s account (${u.email})? This cannot be undone.`)) return;
    try {
      await api.deleteUser(u.id);
      load();
    } catch (err) {
      setDeleteError(err.message);
    }
  };

  return (
    <Layout title="User Accounts">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          <IconPlus width={16} height={16} /> Add staff account
        </button>
      </div>

      {showForm && (
        <div className="panel" style={{ padding: 22, marginBottom: 20 }}>
          {error && <div className="form-error">{error}</div>}
          <form onSubmit={handleCreate}>
            <div className="field-row">
              <div className="field"><label>Name</label><input required value={form.name} onChange={update('name')} /></div>
              <div className="field"><label>Email</label><input type="email" required value={form.email} onChange={update('email')} /></div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Role</label>
                <select value={form.role} onChange={update('role')}>
                  <option value="user">Employee</option>
                  <option value="hod">HOD</option>
                  <option value="transporter">Transporter</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="field"><label>Department</label><input value={form.department} onChange={update('department')} /></div>
              <div className="field"><label>Password</label><input type="password" required minLength={6} value={form.password} onChange={update('password')} /></div>
            </div>
            <button className="btn btn-primary" type="submit">Create account</button>
          </form>
        </div>
      )}

      {deleteError && <div className="form-error">{deleteError}</div>}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading staff…</p>
      ) : (
        <div className="panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--paper)', textAlign: 'left' }}>
                {['Name', 'Email', 'Role', 'Department', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: '12px 16px' }}>{u.name}</td>
                  <td style={{ padding: '12px 16px' }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}><span className={`role-chip ${u.role}`}>{u.role}</span></td>
                  <td style={{ padding: '12px 16px' }}>{u.department || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {u.id !== currentUser.id ? (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u)}>Remove</button>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>You</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
