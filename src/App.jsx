import Header from "./components/Header.jsx";
import HabitRow from "./components/HabitRow.jsx";
import AddHabit from "./components/AddHabit.jsx";
import Stats from "./components/Stats.jsx";
import { useHabits, useToday } from "./hooks/useHabits.js";

export default function App() {
  const today = useToday();
  const { habits, addHabit, renameHabit, removeHabit, toggleDay } = useHabits();
  const doneToday = habits.filter((h) => h.completions.includes(today)).length;

  return (
    <div className="app">
      <Header today={today} doneToday={doneToday} total={habits.length} />

      <main>
        <section className="card">
          <div className="card-head">
            <h2>Morning routine</h2>
            <span className="hint">Tap a day to fill in past check-ins</span>
          </div>

          {habits.length === 0 ? (
            <p className="empty">No habits yet. Add your first one below.</p>
          ) : (
            <ul className="habits">
              {habits.map((h) => (
                <HabitRow
                  key={h.id}
                  habit={h}
                  today={today}
                  onToggle={toggleDay}
                  onRename={renameHabit}
                  onRemove={removeHabit}
                />
              ))}
            </ul>
          )}

          <AddHabit onAdd={addHabit} />
        </section>

        <Stats habits={habits} today={today} />
      </main>

      <footer className="footer">
        Your progress is saved in this browser. Built by{" "}
        <a href="https://saurin1004.github.io" target="_blank" rel="noreferrer">
          Saurin Prajapati
        </a>
        .
      </footer>
    </div>
  );
}
