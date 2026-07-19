import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../api/client';
import { IconPlus } from '../components/Icon';

const STATUS_STYLE = {
  available: { bg: 'var(--success-bg)', color: 'var(--success)' },
  assigned: { bg: 'var(--info-bg)', color: 'var(--info)' },
  maintenance: { bg: 'var(--warn-bg)', color: 'var(--accent-dark)' }
};

export default function FleetPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vehicle_number: '', vehicle_type: '', capacity: '', driver_name: '', driver_phone: '' });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    const data = await api.listFleet();
    setVehicles(data.vehicles);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.addVehicle({ ...form, capacity: Number(form.capacity) || null });
      setForm({ vehicle_number: '', vehicle_type: '', capacity: '', driver_name: '', driver_phone: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const setStatus = async (id, status) => {
    await api.updateVehicle(id, { status });
    load();
  };

  const remove = async (id) => {
    try {
      await api.deleteVehicle(id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <Layout title="Fleet">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          <IconPlus width={16} height={16} /> Add vehicle
        </button>
      </div>

      {showForm && (
        <div className="panel" style={{ padding: 22, marginBottom: 20 }}>
          {error && <div className="form-error">{error}</div>}
          <form onSubmit={handleAdd}>
            <div className="field-row">
              <div className="field"><label>Vehicle number</label><input required value={form.vehicle_number} onChange={update('vehicle_number')} placeholder="TN 45 AB 1234" /></div>
              <div className="field"><label>Type</label><input value={form.vehicle_type} onChange={update('vehicle_type')} placeholder="Sedan / SUV / Mini Bus" /></div>
              <div className="field"><label>Capacity</label><input type="number" min="1" value={form.capacity} onChange={update('capacity')} placeholder="4" /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Driver name</label><input value={form.driver_name} onChange={update('driver_name')} /></div>
              <div className="field"><label>Driver phone</label><input value={form.driver_phone} onChange={update('driver_phone')} /></div>
            </div>
            <button className="btn btn-primary" type="submit">Save vehicle</button>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading fleet…</p>
      ) : vehicles.length === 0 ? (
        <div className="panel empty-state">
          <h3>No vehicles yet</h3>
          <p>Add your first vehicle to start assigning trips.</p>
        </div>
      ) : (
        <div className="panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--paper)', textAlign: 'left' }}>
                {['Vehicle', 'Type', 'Capacity', 'Driver', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: '12px 16px' }}><span className="plate">{v.vehicle_number}</span></td>
                  <td style={{ padding: '12px 16px' }}>{v.vehicle_type || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>{v.capacity || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>{v.driver_name || '—'}{v.driver_phone ? ` · ${v.driver_phone}` : ''}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <select
                      value={v.status}
                      onChange={e => setStatus(v.id, e.target.value)}
                      style={{
                        padding: '5px 8px', borderRadius: 6, border: 'none', fontWeight: 600, fontSize: 12.5,
                        background: STATUS_STYLE[v.status]?.bg, color: STATUS_STYLE[v.status]?.color
                      }}
                    >
                      <option value="available">Available</option>
                      <option value="assigned">Assigned</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => remove(v.id)}>Remove</button>
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
