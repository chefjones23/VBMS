const STATUS_LABEL = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  assigned: 'Assigned',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function BookingTicket({ booking, children, showRequester = false }) {
  return (
    <div className="ticket">
      <div className="ticket-main">
        <div className="ticket-head">
          <span className="ticket-code mono">{booking.booking_code}</span>
        </div>
        <div className="ticket-purpose">{booking.purpose}</div>
        <div className="ticket-meta">
          <span><strong>To:</strong> {booking.destination}</span>
          <span><strong>Date:</strong> {formatDate(booking.travel_date)}{booking.travel_time ? ` · ${booking.travel_time}` : ''}</span>
          <span><strong>Passengers:</strong> {booking.passengers}</span>
          {showRequester && <span><strong>Requested by:</strong> {booking.user_name}{booking.user_department ? ` (${booking.user_department})` : ''}</span>}
        </div>

        {booking.hod_remarks && (
          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text)' }}>HOD note:</strong> {booking.hod_remarks}
          </div>
        )}

        {booking.vehicle_number && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="plate">{booking.vehicle_number}</span>
            {booking.driver_name && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Driver: {booking.driver_name}{booking.driver_phone ? ` · ${booking.driver_phone}` : ''}</span>}
          </div>
        )}
      </div>

      <div className="ticket-stamp">
        <span className={`stamp-badge ${booking.status}`}>{STATUS_LABEL[booking.status]}</span>
        {(booking.hod_name && ['approved','assigned','completed'].includes(booking.status)) && (
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>by {booking.hod_name}</span>
        )}
      </div>

      {children && <div className="ticket-actions">{children}</div>}
    </div>
  );
}
