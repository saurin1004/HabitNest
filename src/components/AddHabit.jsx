import { useState } from "react";

export default function AddHabit({ onAdd }) {
  const [name, setName] = useState("");
  return (
    <form
      className="add"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onAdd(name);
        setName("");
      }}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add a habit, e.g. Read 10 pages"
        aria-label="New habit"
        maxLength={80}
      />
      <button type="submit" disabled={!name.trim()}>
        Add
      </button>
    </form>
  );
}
