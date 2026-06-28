// src/components/StatsBar.jsx
// Dashboard stats row showing equipment counts by status.

export default function StatsBar({ equipment }) {
  const total       = equipment.length;
  const working     = equipment.filter((e) => e.status === 'Working').length;
  const maintenance = equipment.filter((e) => e.status === 'Maintenance').length;
  const faulty      = equipment.filter((e) => e.status === 'Faulty').length;

  const stats = [
    {
      label: 'Total Assets',
      value: total,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color:  'text-slate-300',
      bg:     'bg-slate-500/10',
      border: 'border-slate-500/20',
      glow:   '',
    },
    {
      label: 'Working',
      value: working,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color:  'text-emerald-400',
      bg:     'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      glow:   'shadow-emerald-500/10',
    },
    {
      label: 'Maintenance',
      value: maintenance,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color:  'text-amber-400',
      bg:     'bg-amber-500/10',
      border: 'border-amber-500/20',
      glow:   'shadow-amber-500/10',
    },
    {
      label: 'Faulty',
      value: faulty,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      color:  'text-red-400',
      bg:     'bg-red-500/10',
      border: 'border-red-500/20',
      glow:   'shadow-red-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`glass-card border ${s.border} p-4 flex items-center gap-4 shadow-lg ${s.glow} animate-fade-in`}
        >
          <div className={`p-2.5 rounded-xl ${s.bg} ${s.color}`}>
            {s.icon}
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
