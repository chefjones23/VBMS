import { useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../api/client';

export default function ChangePassword() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.new_password !== form.confirm_password) {
      setError('New password and confirmation do not match.');
      return;
    }

    setBusy(true);
    try {
      await api.changePassword(form.current_password, form.new_password);
      setSuccess('Your password has been updated.');
      setForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout title="Change Password">
      <div className="panel" style={{ maxWidth: 440, padding: 28 }}>
        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="current_password">Current password</label>
            <input id="current_password" type="password" required value={form.current_password} onChange={update('current_password')} />
          </div>
          <div className="field">
            <label htmlFor="new_password">New password</label>
            <input id="new_password" type="password" required minLength={6} value={form.new_password} onChange={update('new_password')} />
          </div>
          <div className="field">
            <label htmlFor="confirm_password">Confirm new password</label>
            <input id="confirm_password" type="password" required minLength={6} value={form.confirm_password} onChange={update('confirm_password')} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
