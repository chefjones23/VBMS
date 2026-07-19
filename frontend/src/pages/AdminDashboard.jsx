import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import BookingTicket from '../components/BookingTicket';
import { api } from '../api/client';

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await api.listBookings();
      setBookings(data.bookings);
      setLoading(false);
    })();
  }, []);

  const counts = bookings.reduce((acc, b) => { acc[b.status] = (acc[b.status] || 0) + 1; return acc; }, {});

  return (
    <Layout title="Overview">
      <div className="stat-grid">
        <div className="stat-card"><div className="num">{bookings.length}</div><div className="label">Total requests</div></div>
        <div className="stat-card"><div className="num">{counts.pending || 0}</div><div className="label">Pending HOD review</div></div>
        <div className="stat-card"><div className="num">{counts.approved || 0}</div><div className="label">Awaiting vehicle</div></div>
        <div className="stat-card"><div className="num">{counts.assigned || 0}</div><div className="label">On the road</div></div>
        <div className="stat-card"><div className="num">{counts.completed || 0}</div><div className="label">Completed</div></div>
        <div className="stat-card"><div className="num">{counts.rejected || 0}</div><div className="label">Rejected</div></div>
      </div>

      <h3 style={{ marginBottom: 14 }}>Recent requests</h3>
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
      ) : (
        bookings.slice(0, 10).map(b => <BookingTicket key={b.id} booking={b} showRequester />)
      )}
    </Layout>
  );
}
