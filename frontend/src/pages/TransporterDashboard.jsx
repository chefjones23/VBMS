import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import BookingTicket from '../components/BookingTicket';
import { api } from '../api/client';
import { IconTruck } from '../components/Icon';

function AssignForm({ booking, fleet, onDone }) {
  const [mode, setMode] = useState('fleet'); // 'fleet' | 'manual'
  const [vehicleId, setVehicleId] = useState('');
  const [manualNumber, setManualNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const availableFleet = fleet.filter(v => v.status === 'available');

  const handleAssign = async () => {
    setError('');
    setBusy(true);
    try {
      const payload = mode === 'fleet'
        ? { vehicle_id: vehicleId }
        : { vehicle_number: manualNumber, driver_name: driverName, driver_phone: driverPhone };
      if (mode === 'fleet' && !vehicleId) throw new Error('Select a vehicle from the fleet list.');
      if (mode === 'manual' && !manualNumber.trim()) throw new Error('Enter a vehicle number.');
      await api.assignVehicle(booking.id, payload);
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 280 }}>
      {error && <div className="form-error" style={{ marginBottom: 0 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className={`btn btn-sm ${mode === 'fleet' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('fleet')}>From fleet list</button>
        <button className={`btn btn-sm ${mode === 'manual' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('manual')}>Enter manually</button>
      </div>

      {mode === 'fleet' ? (
        <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid var(--line)' }}>
          <option value="">Select an available vehicle…</option>
          {availableFleet.map(v => (
            <option key={v.id} value={v.id}>{v.vehicle_number} — {v.vehicle_type} ({v.capacity} seats){v.driver_name ? ` · ${v.driver_name}` : ''}</option>
          ))}
        </select>
      ) : (
        <div className="field-row" style={{ margin: 0 }}>
          <input placeholder="Vehicle number" value={manualNumber} onChange={e => setManualNumber(e.target.value)} style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid var(--line)', flex: 1 }} />
          <input placeholder="Driver name" value={driverName} onChange={e => setDriverName(e.target.value)} style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid var(--line)', flex: 1 }} />
          <input placeholder="Driver phone" value={driverPhone} onChange={e => setDriverPhone(e.target.value)} style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid var(--line)', flex: 1 }} />
        </div>
      )}

      <button className="btn btn-primary btn-sm" onClick={handleAssign} disabled={busy} style={{ alignSelf: 'flex-start' }}>
        <IconTruck width={15} height={15} /> {busy ? 'Assigning…' : 'Assign vehicle'}
      </button>
    </div>
  );
}

export default function TransporterDashboard() {
  const [bookings, setBookings] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('approved');

  const load = async () => {
    setLoading(true);
    const [b, f] = await Promise.all([api.listBookings(), api.listFleet()]);
    setBookings(b.bookings);
    setFleet(f.vehicles);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleComplete = async (id) => {
    await api.completeBooking(id);
    load();
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <Layout title="Assignments">
      <div className="stat-grid">
        <div className="stat-card"><div className="num">{bookings.filter(b => b.status === 'approved').length}</div><div className="label">Need a vehicle</div></div>
        <div className="stat-card"><div className="num">{bookings.filter(b => b.status === 'assigned').length}</div><div className="label">On the road</div></div>
        <div className="stat-card"><div className="num">{fleet.filter(v => v.status === 'available').length}</div><div className="label">Vehicles available</div></div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['approved', 'assigned', 'completed', 'all'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading assignments…</p>
      ) : filtered.length === 0 ? (
        <div className="panel empty-state">
          <h3>Nothing here</h3>
          <p>No {filter === 'all' ? '' : filter} trips right now.</p>
        </div>
      ) : (
        filtered.map(b => (
          <BookingTicket key={b.id} booking={b} showRequester>
            {b.status === 'approved' && <AssignForm booking={b} fleet={fleet} onDone={load} />}
            {b.status === 'assigned' && (
              <button className="btn btn-success btn-sm" onClick={() => handleComplete(b.id)}>Mark trip completed</button>
            )}
          </BookingTicket>
        ))
      )}
    </Layout>
  );
}
