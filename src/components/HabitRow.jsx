import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { lastNDays, weekdayShort, longDate } from "../lib/dates.js";
import { bestStreak, currentStreak } from "../lib/streaks.js";

export default function HabitRow({ habit, today, onToggle, onRename, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(habit.name);
  const doneToday = habit.completions.includes(today);
  const streak = currentStreak(habit.completions, today);
  const best = bestStreak(habit.completions);
  const week = lastNDays(today, 7);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: habit.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const save = () => {
    if (draft.trim()) onRename(habit.id, draft);
    else setDraft(habit.name);
    setEditing(false);
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`habit ${doneToday ? "is-done" : ""} ${isDragging ? "is-dragging" : ""}`}
    >
      <button
        type="button"
        className="handle"
        ref={setActivatorNodeRef}
        aria-label={`Reorder "${habit.name}"`}
        title="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <button
        type="button"
        className="check"
        aria-pressed={doneToday}
        aria-label={`Mark "${habit.name}" ${doneToday ? "not done" : "done"} today`}
        onClick={() => onToggle(habit.id, today)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </button>

      <div className="habit-main">
        {editing ? (
          <input
            className="habit-edit"
            value={draft}
            autoFocus
            aria-label="Habit name"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") {
                setDraft(habit.name);
                setEditing(false);
              }
            }}
          />
        ) : (
          <span className="habit-name">{habit.name}</span>
        )}
        <span className="habit-meta">
          {streak > 0 ? (
            <span className="streak" title="Current streak">
              🔥 {streak} day{streak === 1 ? "" : "s"}
            </span>
          ) : (
            <span className="streak muted">No streak yet</span>
          )}
          {best > 0 && <span className="muted">Best {best}</span>}
        </span>
      </div>

      <div className="week" aria-label="Last 7 days">
        {week.map((day) => {
          const done = habit.completions.includes(day);
          return (
            <button
              key={day}
              type="button"
              className={`day ${done ? "on" : ""} ${day === today ? "is-today" : ""}`}
              aria-pressed={done}
              aria-label={`${habit.name}, ${longDate(day)}: ${done ? "done" : "not done"}`}
              title={longDate(day)}
              onClick={() => onToggle(habit.id, day)}
            >
              {weekdayShort(day)}
            </button>
          );
        })}
      </div>

      <div className="actions">
        <button
          type="button"
          className="icon"
          aria-label={`Rename "${habit.name}"`}
          onClick={() => {
            setDraft(habit.name);
            setEditing(true);
          }}
        >
          ✎
        </button>
        <button
          type="button"
          className="icon danger"
          aria-label={`Delete "${habit.name}"`}
          onClick={() => {
            if (window.confirm(`Delete "${habit.name}" and its history?`)) onRemove(habit.id);
          }}
        >
          ✕
        </button>
      </div>
    </li>
  );
}
