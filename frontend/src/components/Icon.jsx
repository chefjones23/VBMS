// Small hand-rolled icon set (stroke-based, matches the industrial/dispatch theme)
const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

export function IconTruck(props) {
  return (
    <svg {...common} {...props}>
      <rect x="1" y="7" width="14" height="10" rx="1" />
      <path d="M15 10h4l3 3v4h-7z" />
      <circle cx="6" cy="19" r="2" />
      <circle cx="17" cy="19" r="2" />
    </svg>
  );
}
export function IconClipboard(props) {
  return (
    <svg {...common} {...props}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M9 11h6M9 15h6" />
    </svg>
  );
}
export function IconCheck(props) {
  return (
    <svg {...common} {...props}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
export function IconX(props) {
  return (
    <svg {...common} {...props}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
export function IconBell(props) {
  return (
    <svg {...common} {...props}>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
export function IconUsers(props) {
  return (
    <svg {...common} {...props}>
      <circle cx="9" cy="7" r="4" />
      <path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" />
      <circle cx="18" cy="8" r="2.5" />
      <path d="M17.5 14.5a4.5 4.5 0 0 1 4.5 4.5v2" />
    </svg>
  );
}
export function IconPlus(props) {
  return (
    <svg {...common} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
export function IconLogout(props) {
  return (
    <svg {...common} {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}
export function IconGauge(props) {
  return (
    <svg {...common} {...props}>
      <path d="M12 20a8 8 0 1 0-8-8" />
      <path d="M12 20a8 8 0 0 0 8-8" />
      <path d="M12 12l4-3" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}
export function IconSun(props) {
  return (
    <svg {...common} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
export function IconMoon(props) {
  return (
    <svg {...common} {...props}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}
export function IconLock(props) {
  return (
    <svg {...common} {...props}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
