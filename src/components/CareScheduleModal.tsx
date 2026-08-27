import React, { useState } from 'react';
import { CareTask } from '../types';
import { X, Droplets, Sprout, Scissors, Sparkles, Plus, CheckCircle2, Calendar } from 'lucide-react';

interface CareScheduleModalProps {
  tasks: CareTask[];
  onToggleTask: (id: string) => void;
  onAddTask: (plantName: string, taskType: 'Water' | 'Fertilize' | 'Prune' | 'Mist') => void;
  onClose: () => void;
}

export const CareScheduleModal: React.FC<CareScheduleModalProps> = ({
  tasks,
  onToggleTask,
  onAddTask,
  onClose,
}) => {
  const [newPlantName, setNewPlantName] = useState('');
  const [newTaskType, setNewTaskType] = useState<'Water' | 'Fertilize' | 'Prune' | 'Mist'>('Water');
  const [showAddForm, setShowAddForm] = useState(false);

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'Water':
        return <Droplets className="w-5 h-5 text-[#4c6635]" />;
      case 'Fertilize':
        return <Sprout className="w-5 h-5 text-[#4c6635]" />;
      case 'Prune':
        return <Scissors className="w-5 h-5 text-[#4c6635]" />;
      case 'Mist':
        return <Sparkles className="w-5 h-5 text-[#4c6635]" />;
      default:
        return <Droplets className="w-5 h-5 text-[#4c6635]" />;
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlantName.trim()) {
      onAddTask(newPlantName.trim(), newTaskType);
      setNewPlantName('');
      setShowAddForm(false);
    }
  };

  const pendingCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-fade-in text-[#191c1b]">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[90vh] overflow-hidden border border-[#cdecae]/60">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-[#e1e3e0]">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#4c6635]" />
              <h2 className="text-xl font-bold text-[#191c1b]">Care Schedule</h2>
            </div>
            <p className="text-xs text-[#44483e] mt-0.5">
              {pendingCount} tasks scheduled for your botanical garden
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#f2f4f1] text-[#74796d] flex items-center justify-center hover:bg-[#e7e9e6] active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 hide-scrollbar">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onToggleTask(task.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                task.completed
                  ? 'bg-[#f2f4f1] border-[#e1e3e0] opacity-60'
                  : 'bg-white border-[#c4c8ba]/40 hover:border-[#8ba870] shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    task.completed ? 'bg-[#e1e3e0]' : 'bg-[#d2e9ce]'
                  }`}
                >
                  {getTaskIcon(task.taskType)}
                </div>

                <div className="min-w-0">
                  <h4
                    className={`text-sm font-bold truncate ${
                      task.completed ? 'line-through text-[#74796d]' : 'text-[#191c1b]'
                    }`}
                  >
                    {task.plantName}
                  </h4>
                  <p className="text-xs text-[#44483e]">
                    {task.taskType} • {task.dueDate}
                  </p>
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  task.completed
                    ? 'bg-[#4c6635] border-[#4c6635] text-white'
                    : 'border-[#c4c8ba] bg-white'
                }`}
              >
                {task.completed && <CheckCircle2 className="w-4 h-4 fill-current" />}
              </div>
            </div>
          ))}

          {showAddForm ? (
            <form onSubmit={handleCreate} className="bg-[#f8faf7] p-4 rounded-2xl border border-[#8ba870] space-y-3">
              <h4 className="text-xs font-bold text-[#4c6635] uppercase">Add New Reminder</h4>
              <input
                type="text"
                required
                value={newPlantName}
                onChange={(e) => setNewPlantName(e.target.value)}
                placeholder="Plant Name (e.g. Monstera)"
                className="w-full text-xs p-2.5 rounded-xl border border-[#c4c8ba] bg-white"
              />
              <div className="flex gap-2">
                {(['Water', 'Fertilize', 'Prune', 'Mist'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewTaskType(type)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border ${
                      newTaskType === type
                        ? 'bg-[#8ba870] text-[#0d2000] border-[#8ba870]'
                        : 'bg-white border-[#c4c8ba] text-[#44483e]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-[#4c6635] text-white py-2 rounded-xl text-xs font-bold"
                >
                  Save Task
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-2 bg-[#e7e9e6] text-[#44483e] rounded-xl text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 border-2 border-dashed border-[#c4c8ba] hover:border-[#4c6635] text-[#4c6635] font-semibold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Care Task</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#e1e3e0]">
          <button
            onClick={onClose}
            className="w-full bg-[#4c6635] hover:bg-[#354e1f] text-white py-3.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
