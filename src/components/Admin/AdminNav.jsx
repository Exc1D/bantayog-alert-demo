import { NavLink } from 'react-router-dom';

const TABS = [
  { label: 'Queue', href: '/admin' },
  { label: 'Live Map', href: '/admin/map' },
  { label: 'All Reports', href: '/admin/reports' },
];

export default function AdminNav() {
  return (
    <nav
      aria-label="Admin navigation"
      className="bg-shell border-b border-white/10 grid grid-cols-3"
    >
      {TABS.map(({ label, href }) => (
        <NavLink
          key={href}
          to={href}
          end={href === '/admin'}
          className={({ isActive }) =>
            `py-3 text-center text-xs font-semibold transition-colors
             ${isActive ? 'text-white border-b-2 border-urgent' : 'text-white/50'}`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
