import { useState } from "react";

export default function Main() {
    const [habits, setHabits] = useState([
        { id: 1, text: 'Wake up at 5 am', completed: false },
        { id: 2, text: 'Meditate for 15 minutes', completed: false },
        { id: 3, text: 'Workout', completed: false },
        { id: 4, text: 'Have a healthy breakfast', completed: false },
        { id: 5, text: 'Plan the day', completed: false }
      ]);
    
      const toggleHabit = (id) => {
        const updatedHabits = habits.map(habit => 
          habit.id === id ? { ...habit, completed: !habit.completed } : habit
        );
        setHabits(updatedHabits);
      };
    return (
        <main>
            <h1>Morning Habit Builder</h1>
            <ul className="habit-list">
          {habits.map(habit => (
            <li key={habit.id} className="habit-item">
              <label className="habit-label">
                <input
                  type="checkbox"
                  checked={habit.completed}
                  onChange={() => toggleHabit(habit.id)}
                  className="habit-checkbox"
                />
                <span className={habit.completed ? "completed" : ""}>
                  {habit.text}
                </span>
              </label>
            </li>
          ))}
        </ul>
        </main>

    )
}