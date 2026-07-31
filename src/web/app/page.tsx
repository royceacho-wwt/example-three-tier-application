'use client';

import { getTasks, createTask, toggleTask, renameTask } from './actions';
import { useState, useEffect } from 'react';

export default function Home() {
  const [tasks, setTasks] = useState<Awaited<ReturnType<typeof getTasks>>>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    getTasks().then(setTasks);
  }, []);

  const handleCreateTask = async (formData: FormData) => {
    await createTask(formData);
    const updatedTasks = await getTasks();
    setTasks(updatedTasks);
  };

  const handleToggleTask = async (id: number, completed: boolean) => {
    await toggleTask(id, completed);
    const updatedTasks = await getTasks();
    setTasks(updatedTasks);
  };

  const startEditing = (id: number, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const saveRename = async (id: number) => {
    if (editTitle.trim()) {
      await renameTask(id, editTitle.trim());
      const updatedTasks = await getTasks();
      setTasks(updatedTasks);
    }
    setEditingId(null);
    setEditTitle('');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-16 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">
          To-Do List
        </h1>

        {/* Add task form */}
        <form action={handleCreateTask} className="flex gap-2 mb-8">
          <input
            name="title"
            type="text"
            required
            placeholder="Add a new task..."
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 dark:bg-zinc-50 px-5 py-2 font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
          >
            Add
          </button>
        </form>

        {/* Task list */}
        <ul className="space-y-2">
          {tasks.length === 0 && (
            <li className="text-zinc-400 text-center py-8">No tasks yet. Add one above!</li>
          )}
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3"
            >
              <button
                onClick={() => handleToggleTask(task.id, !task.completed)}
                className={`h-5 w-5 rounded border-2 flex-shrink-0 transition-colors ${
                  task.completed
                    ? 'bg-zinc-900 dark:bg-zinc-50 border-zinc-900 dark:border-zinc-50'
                    : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-500'
                }`}
                aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {task.completed && (
                  <svg viewBox="0 0 12 12" className="text-white dark:text-zinc-900 w-full h-full p-0.5">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              {editingId === task.id ? (
                <>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveRename(task.id);
                      } else if (e.key === 'Escape') {
                        cancelEditing();
                      }
                    }}
                    className="flex-1 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    autoFocus
                  />
                  <button
                    onClick={() => saveRename(task.id)}
                    className="px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                    aria-label="Save"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="px-2 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                    aria-label="Cancel"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span
                    className={`flex-1 text-sm ${
                      task.completed
                        ? 'line-through text-zinc-400'
                        : 'text-zinc-800 dark:text-zinc-100'
                    }`}
                  >
                    {task.title}
                  </span>
                  <button
                    onClick={() => startEditing(task.id, task.title)}
                    className="px-2 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                    aria-label="Rename task"
                  >
                    Rename
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>

        {tasks.length > 0 && (
          <p className="mt-4 text-xs text-zinc-400 text-right">
            {tasks.filter((t) => t.completed).length} / {tasks.length} completed
          </p>
        )}
      </div>
    </div>
  );
}
