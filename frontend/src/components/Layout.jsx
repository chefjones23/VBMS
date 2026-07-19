import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import { IconClipboard, IconTruck, IconUsers, IconLogout, IconGauge, IconLock } from './Icon';

const NAV_BY_ROLE = {
  user: [
    { to: '/', label: 'My Requests', icon: IconClipboard, end: true },
    { to: '/new', label: 'Book a Vehicle', icon: IconTruck }
  ],
  hod: [
    { to: '/', label: 'Approval Queue', icon: IconClipboard, end: true }
  ],
  transporter: [
    { to: '/', label: 'Assignments', icon: IconClipboard, end: true },
    { to: '/fleet', label: 'Fleet', icon: IconTruck }
  ],
  admin: [
    { to: '/', label: 'Overview', icon: IconGauge, end: true },
    { to: '/fleet', label: 'Fleet', icon: IconTruck },
    { to: '/staff', label: 'User Accounts', icon: IconUsers }
  ]
};

const ROLE_LABEL = { user: 'Employee', hod: 'HOD', transporter: 'Transporter', admin: 'Admin' };

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = NAV_BY_ROLE[user.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="mark">VBMS</div>
          <div className="sub">Vehicle Booking</div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              <item.icon width={17} height={17} />
              {item.label}
            </NavLink>
          ))}
          <NavLink to="/change-password" className={({ isActive }) => (isActive ? 'active' : '')} style={{ marginTop: 'auto' }}>
            <IconLock width={17} height={17} />
            Change Password
          </NavLink>
          <button className="navlike" onClick={handleLogout}>
            <IconLogout width={17} height={17} />
            Sign out
          </button>
        </nav>
        <div className="sidebar-footer">
          Signed in as<br /><strong style={{ color: '#E8ECF2' }}>{user.name}</strong>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <h1>{title}</h1>
          <div className="topbar-right">
            <span className={`role-chip ${user.role}`}>{ROLE_LABEL[user.role]}</span>
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
