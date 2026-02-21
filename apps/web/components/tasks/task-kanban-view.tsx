'use client';

import { useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useQueryClient } from '@tanstack/react-query';
import type { Task } from '@repo/supabase';
import { TaskCard } from './task-card';
import { useTasks, useUpdateTask } from '@/hooks/use-tasks';
import type { AssigneeLabels } from '@/app/dashboard/tasks/page';

const COLUMNS: { id: Task['status']; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'To do' },
  { id: 'in_progress', title: 'In progress' },
  { id: 'done', title: 'Done' },
];

function tasksByStatus(tasks: Task[]) {
  const map: Record<string, Task[]> = { backlog: [], todo: [], in_progress: [], done: [], skipped: [] };
  for (const t of tasks) {
    if (map[t.status]) map[t.status].push(t);
  }
  return map;
}

function DraggableTaskCard({
  task,
  showCheckbox,
  onToggleComplete,
  onTaskClick,
  assigneeLabels,
}: {
  task: Task;
  showCheckbox: boolean;
  onToggleComplete: (id: string) => void;
  onTaskClick?: (task: Task) => void;
  assigneeLabels?: AssigneeLabels;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} onClick={() => onTaskClick?.(task)}>
      <TaskCard
        task={task}
        showCheckbox={showCheckbox}
        onToggleComplete={onToggleComplete}
        isDragging={isDragging}
        assigneeLabels={assigneeLabels}
      />
    </div>
  );
}

function DroppableColumn({
  columnId,
  title,
  tasks,
  showCheckbox,
  onToggleComplete,
  onTaskClick,
  assigneeLabels,
}: {
  columnId: string;
  title: string;
  tasks: Task[];
  showCheckbox: boolean;
  onToggleComplete: (id: string) => void;
  onTaskClick?: (task: Task) => void;
  assigneeLabels?: AssigneeLabels;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border p-3 transition ${isOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'}`}
    >
      <h3 className="mb-3 font-heading text-xs uppercase tracking-wider text-muted-foreground">{title}</h3>
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li key={task.id}>
            <DraggableTaskCard
              task={task}
              showCheckbox={showCheckbox}
              onToggleComplete={onToggleComplete}
              onTaskClick={onTaskClick}
              assigneeLabels={assigneeLabels}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TaskKanbanView({
  onTaskClick,
  assigneeLabels,
}: { onTaskClick?: (task: Task) => void; assigneeLabels?: AssigneeLabels } = {}) {
  const { data: tasks = [] } = useTasks();
  const updateTask = useUpdateTask();
  const queryClient = useQueryClient();
  const byStatus = tasksByStatus(tasks);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over?.id) return;
      const taskId = String(active.id);
      const newStatus = String(over.id) as Task['status'];
      if (!COLUMNS.some((c) => c.id === newStatus)) return;
      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.status === newStatus) return;
      updateTask.mutate(
        { id: taskId, status: newStatus },
        {
          onSuccess: () => {
            queryClient.setQueryData<Task[]>(['tasks'], (old) =>
              old?.map((t) =>
                t.id === taskId ? { ...t, status: newStatus, completed_at: newStatus === 'done' ? new Date().toISOString() : null } : t
              ) ?? []
            );
          },
        }
      );
    },
    [tasks, updateTask, queryClient]
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((col) => (
          <DroppableColumn
            key={col.id}
            columnId={col.id}
            title={col.title}
            tasks={byStatus[col.id] ?? []}
            showCheckbox={col.id !== 'done'}
            onToggleComplete={(id) => updateTask.mutate({ id, status: 'done' })}
            onTaskClick={onTaskClick}
            assigneeLabels={assigneeLabels}
          />
        ))}
      </div>
      {tasks.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">No tasks yet. Add one to get started.</p>
      )}
    </DndContext>
  );
}
