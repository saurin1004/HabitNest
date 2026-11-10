import { longDate } from "../lib/dates.js";

function ProgressRing({ done, total }) {
  const pct = total === 0 ? 0 : done / total;
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" role="img" aria-label={`${done} of ${total} habits done today`}>
      <svg viewBox="0 0 64 64" width="64" height="64">
        <circle cx="32" cy="32" r={r} className="ring-track" />
        <circle
          cx="32"
          cy="32"
          r={r}
          className="ring-fill"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <span className="ring-label">
        {done}/{total}
      </span>
    </div>
  );
}

export default function Header({ today, doneToday, total, accountSlot }) {
  const allDone = total > 0 && doneToday === total;
  return (
    <header className="header">
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">🪺</span>
          <span>HabitNest</span>
        </div>
        {accountSlot}
      </div>
      <div className="today">
        <div>
          <p className="today-label">Today</p>
          <h1 className="today-date">{longDate(today)}</h1>
          <p className="today-sub">
            {total === 0
              ? "Add a habit to get started."
              : allDone
              ? "Every habit done. Great start to the day."
              : `${total - doneToday} to go. Small steps, every day.`}
          </p>
        </div>
        <ProgressRing done={doneToday} total={total} />
      </div>
    </header>
  );
}
