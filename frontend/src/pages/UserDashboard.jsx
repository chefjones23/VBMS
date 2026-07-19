import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import BookingTicket from '../components/BookingTicket';
import { api } from '../api/client';
import { IconTruck } from '../components/Icon';

export default function UserDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const data = await api.listBookings();
    setBookings(data.bookings);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (id) => {
    await api.cancelBooking(id);
    load();
  };

  const counts = bookings.reduce((acc, b) => { acc[b.status] = (acc[b.status] || 0) + 1; return acc; }, {});

  return (
    <Layout title="My Requests">
      <div className="stat-grid">
        <div className="stat-card"><div className="num">{bookings.length}</div><div className="label">Total requests</div></div>
        <div className="stat-card"><div className="num">{counts.pending || 0}</div><div className="label">Awaiting HOD</div></div>
        <div className="stat-card"><div className="num">{counts.approved || 0}</div><div className="label">Awaiting vehicle</div></div>
        <div className="stat-card"><div className="num">{counts.assigned || 0}</div><div className="label">Ready to travel</div></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => navigate('/new')}>
          <IconTruck width={16} height={16} /> Book a vehicle
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading your requests…</p>
      ) : bookings.length === 0 ? (
        <div className="panel empty-state">
          <h3>No travel requests yet</h3>
          <p>Book a vehicle to get started — your HOD will review it right away.</p>
        </div>
      ) : (
        bookings.map(b => (
          <BookingTicket key={b.id} booking={b}>
            {['pending', 'approved'].includes(b.status) && (
              <button className="btn btn-danger btn-sm" onClick={() => handleCancel(b.id)}>Cancel request</button>
            )}
          </BookingTicket>
        ))
      )}
    </Layout>
  );
}
