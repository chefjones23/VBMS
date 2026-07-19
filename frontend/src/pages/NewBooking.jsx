import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api/client';

export default function NewBooking() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    purpose: '', destination: '', travel_date: '', travel_time: '', return_date: '', passengers: 1
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.createBooking({ ...form, passengers: Number(form.passengers) || 1 });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout title="Book a Vehicle">
      <div className="panel" style={{ maxWidth: 640, padding: 28 }}>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="purpose">Purpose of travel</label>
            <input id="purpose" required value={form.purpose} onChange={update('purpose')} placeholder="Client site visit" />
          </div>
          <div className="field">
            <label htmlFor="destination">Destination</label>
            <input id="destination" required value={form.destination} onChange={update('destination')} placeholder="Chennai Plant" />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="travel_date">Travel date</label>
              <input id="travel_date" type="date" required value={form.travel_date} onChange={update('travel_date')} />
            </div>
            <div className="field">
              <label htmlFor="travel_time">Departure time</label>
              <input id="travel_time" type="time" value={form.travel_time} onChange={update('travel_time')} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="return_date">Return date (optional)</label>
              <input id="return_date" type="date" value={form.return_date} onChange={update('return_date')} />
            </div>
            <div className="field">
              <label htmlFor="passengers">Passengers</label>
              <input id="passengers" type="number" min="1" value={form.passengers} onChange={update('passengers')} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? 'Submitting…' : 'Submit for HOD approval'}
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => navigate('/')}>Cancel</button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
