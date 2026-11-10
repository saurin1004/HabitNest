import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import Header from "./components/Header.jsx";
import HabitRow from "./components/HabitRow.jsx";
import AddHabit from "./components/AddHabit.jsx";
import Stats from "./components/Stats.jsx";
import Account, { SignedOutBanner, VerifyBanner } from "./components/Account.jsx";
import { useHabits, useToday } from "./hooks/useHabits.js";
import { useAccount } from "./hooks/useAccount.js";

export default function App() {
  const today = useToday();
  const account = useAccount();
  const uid = account.status === "signed-in" ? account.user.uid : null;
  const { habits, sync, addHabit, renameHabit, removeHabit, toggleDay, moveHabit } = useHabits(uid);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const nameOf = (id) => habits.find((h) => h.id === id)?.name ?? "habit";
  const position = (id) => habits.findIndex((h) => h.id === id) + 1;
  const announcements = {
    onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}. Use the arrow keys to move it, space to drop.`,
    onDragOver: ({ active, over }) => (over ? `${nameOf(active.id)} is now at position ${position(over.id)} of ${habits.length}.` : undefined),
    onDragEnd: ({ active, over }) => (over ? `Dropped ${nameOf(active.id)} at position ${position(over.id)}.` : `Dropped ${nameOf(active.id)}.`),
    onDragCancel: ({ active }) => `Cancelled. ${nameOf(active.id)} went back to where it was.`,
  };
  const doneToday = habits.filter((h) => h.completions.includes(today)).length;

  return (
    <div className="app">
      <Header
        today={today}
        doneToday={doneToday}
        total={habits.length}
        accountSlot={<Account account={account} sync={sync} />}
      />
      <VerifyBanner account={account} />
      <SignedOutBanner account={account} />

      <main>
        <section className="card">
          <div className="card-head">
            <h2>Daily routine</h2>
            <span className="hint">Drag ⠿ to reorder · tap a day to fill in past check-ins</span>
          </div>

          {habits.length === 0 ? (
            <p className="empty">No habits yet. Add your first one below.</p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              accessibility={{ announcements }}
              onDragEnd={({ active, over }) => over && moveHabit(active.id, over.id)}
            >
              <SortableContext items={habits.map((h) => h.id)} strategy={verticalListSortingStrategy}>
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
              </SortableContext>
            </DndContext>
          )}

          <AddHabit onAdd={addHabit} />
        </section>

        <Stats habits={habits} today={today} />
      </main>

      <footer className="footer">
        {uid
          ? "Your habits are saved to your account and sync across devices."
          : account.status === "disabled"
          ? "Your progress is saved in this browser."
          : "Your progress is saved in this browser. Sign in to sync it across devices."}{" "}
        Built by{" "}
        <a href="https://saurin1004.github.io" target="_blank" rel="noreferrer">
          Saurin Prajapati
        </a>
        .
      </footer>
    </div>
  );
}
