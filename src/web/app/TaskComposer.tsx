'use client';

import { useState } from 'react';
import { createTask } from './actions';

export default function TaskComposer() {
  const [title, setTitle] = useState('');

  const handleSubmit = async (formData: FormData) => {
    await createTask(formData);
    setTitle('');
  };

  return (
    <form action={handleSubmit} className="mb-8">
      <div className="flex gap-2">
        <input
          name="title"
          type="text"
          required
          placeholder="Add a new task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 dark:bg-zinc-50 px-5 py-2 font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
        >
          Add
        </button>
      </div>
      <p className="mt-1 text-xs text-zinc-400">
        {title.length} characters
      </p>
    </form>
  );
}
