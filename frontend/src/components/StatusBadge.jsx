// src/components/StatusBadge.jsx
// Colored pill badge for equipment status.

export default function StatusBadge({ status }) {
  const cls = {
    Working:     'badge-working',
    Maintenance: 'badge-maintenance',
    Faulty:      'badge-faulty',
  }[status] ?? 'badge-working';

  const dot = {
    Working:     'bg-emerald-400',
    Maintenance: 'bg-amber-400',
    Faulty:      'bg-red-400',
  }[status] ?? 'bg-emerald-400';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}
