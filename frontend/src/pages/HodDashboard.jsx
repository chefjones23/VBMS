import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import BookingTicket from '../components/BookingTicket';
import { api } from '../api/client';
import { IconCheck, IconX } from '../components/Icon';
import { useAuth } from '../context/AuthContext';

export default function HodDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [rejectingId, setRejectingId] = useState(null);
  const [remarks, setRemarks] = useState('');

  const load = async () => {
    setLoading(true);
    const data = await api.listBookings();
    setBookings(data.bookings);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    await api.approveBooking(id);
    load();
  };

  const submitRejection = async (id) => {
    if (!remarks.trim()) return;
    await api.rejectBooking(id, remarks);
    setRejectingId(null);
    setRemarks('');
    load();
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);
  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <Layout title="Approval Queue">
      <p style={{ marginTop: -8, marginBottom: 16, color: 'var(--text-muted)' }}>
        Showing requests from your department{user?.department ? `: ${user.department}` : ''}
      </p>
      <div className="stat-grid">
        <div className="stat-card"><div className="num">{pendingCount}</div><div className="label">Awaiting your review</div></div>
        <div className="stat-card"><div className="num">{bookings.filter(b => b.status === 'approved').length}</div><div className="label">Approved · awaiting vehicle</div></div>
        <div className="stat-card"><div className="num">{bookings.filter(b => b.status === 'assigned' || b.status === 'completed').length}</div><div className="label">On the road / completed</div></div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading requests…</p>
      ) : filtered.length === 0 ? (
        <div className="panel empty-state">
          <h3>Nothing here</h3>
          <p>No {filter === 'all' ? '' : filter} requests right now.</p>
        </div>
      ) : (
        filtered.map(b => (
          <BookingTicket key={b.id} booking={b} showRequester>
            {b.status === 'pending' && (
              rejectingId === b.id ? (
                <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 260 }}>
                  <input
                    autoFocus
                    placeholder="Reason for rejection"
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)' }}
                  />
                  <button className="btn btn-danger btn-sm" onClick={() => submitRejection(b.id)}>Confirm</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setRejectingId(null); setRemarks(''); }}>Cancel</button>
                </div>
              ) : (
                <>
                  <button className="btn btn-success btn-sm" onClick={() => handleApprove(b.id)}>
                    <IconCheck width={15} height={15} /> Approve
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => setRejectingId(b.id)}>
                    <IconX width={15} height={15} /> Reject
                  </button>
                </>
              )
            )}
          </BookingTicket>
        ))
      )}
    </Layout>
  );
}
