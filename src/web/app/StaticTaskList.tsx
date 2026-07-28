'use client';

import { useState, useCallback, useSyncExternalStore } from 'react';

export type Task = {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
};

const STORAGE_KEY = 'todo-tasks';

function getDefaultTasks(): Task[] {
  return [
    { id: 1, title: 'Try out the demo', completed: false, created_at: new Date().toISOString() },
    { id: 2, title: 'Check out the source code', completed: false, created_at: new Date().toISOString() },
    { id: 3, title: 'Deploy your own version', completed: false, created_at: new Date().toISOString() },
  ];
}

// Custom hook to sync with localStorage using useSyncExternalStore
function useLocalStorageTasks() {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener('storage', callback);
    return () => window.removeEventListener('storage', callback);
  }, []);

  const getSnapshot = useCallback((): Task[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return getDefaultTasks();
      }
    }
    return getDefaultTasks();
  }, []);

  const getServerSnapshot = useCallback((): Task[] => {
    return getDefaultTasks();
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  // Dispatch storage event for same-window updates
  window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
}

export default function StaticTaskList() {
  const tasks = useLocalStorageTasks();
  const [inputValue, setInputValue] = useState('');

  const handleCreateTask = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const title = inputValue.trim();
    if (!title) return;
    
    const newTask: Task = {
      id: Date.now(),
      title,
      completed: false,
      created_at: new Date().toISOString(),
    };
    saveTasks([...tasks, newTask]);
    setInputValue('');
  }, [inputValue, tasks]);

  const handleToggleTask = useCallback((id: number, completed: boolean) => {
    const updatedTasks = tasks.map((task) => 
      task.id === id ? { ...task, completed } : task
    );
    saveTasks(updatedTasks);
  }, [tasks]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-16 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">
          To-Do List
        </h1>

        {/* Demo notice */}
        <div className="mb-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            📝 This is a static demo. Tasks are saved in your browser&apos;s local storage.
          </p>
        </div>

        {/* Add task form */}
        <form
          onSubmit={handleCreateTask}
          className="flex gap-2 mb-8"
        >
          <input
            name="title"
            type="text"
            required
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
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
                type="button"
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
              <span
                className={`flex-1 text-sm ${
                  task.completed
                    ? 'line-through text-zinc-400'
                    : 'text-zinc-800 dark:text-zinc-100'
                }`}
              >
                {task.title}
              </span>
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
