// src/app/components/goals/TaskForm.tsx
import { useState } from 'react';
import { Task, defaultActivityCategories } from '@/lib/timer';
import { useData } from '@/providers/DataProvider';

interface TaskFormProps {
  goalId?: string;
  onAdd: () => void;
  activity?: string;
  onAddImmediate?: (task: Task) => void;
}

export default function TaskForm({
  goalId,
  onAdd,
  activity: defaultActivity,
  onAddImmediate,
}: TaskFormProps) {
  const [text, setText] = useState('');
  const [activity, setActivity] = useState(defaultActivity || '');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState<string>('');
  const [showActivitySelector, setShowActivitySelector] = useState(false);

  const { saveTask } = useData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (text.trim()) {
      try {
        // Create task object
        const newTask: Task = {
          id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
          goalId,
          text: text.trim(),
          activity: activity || undefined,
          completed: false,
          createdAt: new Date().toISOString(),
          priority: priority,
          dueDate: dueDate || undefined,
        };

        // Update UI immediately
        if (onAddImmediate) {
          onAddImmediate(newTask);
        }

        console.log('Saving task:', newTask);
        // Save to database
        const savedId = await saveTask(newTask);
        console.log('Task saved with ID:', savedId);

        // Reset form
        setText('');
        setActivity(defaultActivity || '');
        setPriority('medium');
        setDueDate('');
        setShowActivitySelector(false);

        // Refresh the full task list (this will now get tasks from Supabase)
        onAdd();
      } catch (error) {
        console.error('Error saving task:', error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card card--compact">
      <div className="form-group">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a new task..."
          className="form-input"
        />

        <div className="task-meta">
          {/* Activity selector */}
          {activity ? (
            <div
              className="activity-tag hover-lift transition-all"
              onClick={() => setShowActivitySelector(!showActivitySelector)}
              style={{ cursor: 'pointer' }}
            >
              {activity}{' '}
              <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>✎</span>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setShowActivitySelector(!showActivitySelector)}
            >
              Select Activity
            </button>
          )}

          {/* Due date selector */}
          <div>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="form-input"
              min={new Date().toISOString().split('T')[0]}
              title="Due date (optional)"
              style={{ fontSize: '0.85rem', padding: '0.4rem' }}
            />
          </div>

          {/* Priority selector */}
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            <button
              type="button"
              className={`priority-tag priority-high ${
                priority === 'high' ? 'btn--primary' : 'btn--ghost'
              } btn--compact`}
              onClick={() => setPriority('high')}
              title="High Priority"
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.75rem',
                fontWeight: priority === 'high' ? '600' : '500',
              }}
            >
              High
            </button>
            <button
              type="button"
              className={`priority-tag priority-medium ${
                priority === 'medium' ? 'btn--primary' : 'btn--ghost'
              } btn--compact`}
              onClick={() => setPriority('medium')}
              title="Medium Priority"
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.75rem',
                fontWeight: priority === 'medium' ? '600' : '500',
              }}
            >
              Medium
            </button>
            <button
              type="button"
              className={`priority-tag priority-low ${
                priority === 'low' ? 'btn--primary' : 'btn--ghost'
              } btn--compact`}
              onClick={() => setPriority('low')}
              title="Low Priority"
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.75rem',
                fontWeight: priority === 'low' ? '600' : '500',
              }}
            >
              Low
            </button>
          </div>
        </div>
      </div>

      {/* Activity dropdown */}
      {showActivitySelector && (
        <div
          className="card card--surface"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginTop: '0.5rem',
            padding: '0.75rem',
            boxShadow: '0 2px 8px rgba(var(--gray-rgb), 0.1)',
          }}
        >
          {defaultActivityCategories.map((activityOption) => (
            <button
              key={activityOption}
              type="button"
              className={`filter-button ${
                activity === activityOption ? 'filter-button--active' : ''
              }`}
              onClick={() => {
                setActivity(activityOption);
                setShowActivitySelector(false);
              }}
            >
              {activityOption}
            </button>
          ))}
          <button
            type="button"
            className="filter-button"
            onClick={() => {
              setActivity('');
              setShowActivitySelector(false);
            }}
          >
            None
          </button>
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn--primary">
          Add Task
        </button>
      </div>
    </form>
  );
}
