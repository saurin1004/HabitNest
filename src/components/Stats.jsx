import { bestStreak, completionRate, currentStreak } from "../lib/streaks.js";

export default function Stats({ habits, today }) {
  const rate = Math.round(completionRate(habits, today, 7) * 100);
  const longestActive = Math.max(0, ...habits.map((h) => currentStreak(h.completions, today)));
  const allTimeBest = Math.max(0, ...habits.map((h) => bestStreak(h.completions)));
  const totalCheckIns = habits.reduce((n, h) => n + h.completions.length, 0);

  const items = [
    { value: `${rate}%`, label: "Completed, last 7 days" },
    { value: longestActive, label: "Longest active streak" },
    { value: allTimeBest, label: "Best streak ever" },
    { value: totalCheckIns, label: "Total check-ins" },
  ];

  return (
    <section className="stats" aria-label="Your stats">
      {items.map((s) => (
        <div className="stat" key={s.label}>
          <span className="stat-value">{s.value}</span>
          <span className="stat-label">{s.label}</span>
        </div>
      ))}
    </section>
  );
}
