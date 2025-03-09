import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Trash2, Repeat, Settings2, X, Plus } from "lucide-react";
import { Todo } from "../types";
import { getHolidaysForDate } from "../utils/holidays";
import { triggerConfetti } from "../utils/confetti";
import { useStore } from "../store";

const formatWeekday = (dateString: string) => {
  const date = parseISO(dateString);
  return format(date, "EEEE").toUpperCase();
};

const formatDate = (dateString: string) => {
  const date = parseISO(dateString);
  return `${format(date, "MMM").toUpperCase()} ${format(date, "d")}`;
};

interface DayColumnProps {
  date: string;
  todos: Todo[];
  onAddTodo: (text: string) => void;
  onToggleTodo: (todoId: string) => void;
  onDeleteTodo: (todoId: string) => void;
}

export const DayColumn: React.FC<DayColumnProps> = ({
  date,
  todos,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
}) => {
  const [newTodo, setNewTodo] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const updateTodoSettings = useStore((state) => state.updateTodoSettings);

  // DEBUG: Log todos every time they change
  useEffect(() => {
    console.log(`DayColumn for ${date} received todos:`, todos);
  }, [todos, date]);

  const colors = [
    { name: "default", value: "" },
    { name: "red", value: "bg-red-600/20" },
    { name: "green", value: "bg-green-600/20" },
    { name: "blue", value: "bg-blue-600/20" },
    { name: "purple", value: "bg-purple-600/20" },
    { name: "yellow", value: "bg-yellow-600/20" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      onAddTodo(newTodo.trim());
      setNewTodo("");
    }
  };

  const handleToggleTodo = (todoId: string) => {
    onToggleTodo(todoId);
    const todo = todos.find((t) => t.id === todoId);
    if (todo && !todo.completed) {
      triggerConfetti();
    }
  };

  const handleUpdateSettings = (
    todoId: string,
    updates: Partial<Pick<Todo, "color" | "recurring">>
  ) => {
    updateTodoSettings(date, todoId, updates);
  };

  const openTodoSettings = (todoId: string, event: React.MouseEvent) => {
    if (
      (event.target as HTMLElement).tagName.toLowerCase() !== "input" &&
      !event.target.closest("button")
    ) {
      setEditingTodoId(editingTodoId === todoId ? null : todoId);
    }
  };

  const dayDate = parseISO(date);
  const dayName = format(dayDate, "EEEE").toUpperCase();
  const dayNumber = format(dayDate, "d");
  const month = format(dayDate, "MMM").toUpperCase();
  const holidays = getHolidaysForDate(date);

  return (
    <div className="bg-gray-900 rounded-lg p-4 min-w-[250px] h-[calc(100vh-150px)] flex flex-col">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{formatWeekday(date)}</h2>
        <p className="text-sm text-gray-400">{formatDate(date)}</p>

        {/* Debug count - show count of todos even if rendering fails */}
        <p className="text-xs text-blue-400 mt-1">
          {todos.length > 0 ? `${todos.length} todos` : "No todos"}
        </p>

        <form onSubmit={handleSubmit} className="mt-3 mb-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a todo..."
            className="w-full p-2 bg-transparent border-b border-gray-700 focus:border-blue-500 text-gray-100 placeholder-gray-500 focus:outline-none transition-colors duration-200"
          />
        </form>
      </div>

      <div className="flex-grow overflow-y-auto">
        {/* Empty state with Create First Todo button */}
        {todos.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-500 text-center italic text-sm mb-4">
              No tasks
            </p>
            <button
              onClick={() => {
                onAddTodo(`Task for ${formatDate(date)}`);
              }}
              className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-1.5 rounded-full text-sm"
            >
              <Plus size={14} />
              Create First Todo
            </button>
          </div>
        )}

        {/* Main todo rendering */}
        {todos.map((todo) => (
          <div key={todo.id} className="relative">
            <div
              className={`group flex items-center gap-3 hover:bg-gray-800/50 p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                todo.color || ""
              }`}
              onClick={(e) => openTodoSettings(todo.id, e)}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={(e) => {
                  e.stopPropagation();
                  handleToggleTodo(todo.id);
                }}
                className="form-checkbox h-4 w-4 rounded-sm border-gray-600 bg-transparent checked:bg-blue-500 checked:border-blue-500 focus:ring-0 focus:ring-offset-0 transition-colors duration-200"
              />
              <span
                className={`flex-1 font-light ${
                  todo.completed ? "line-through text-gray-500" : ""
                } transition-all duration-200`}
              >
                {todo.text}
                {todo.recurring && (
                  <Repeat size={14} className="inline ml-2 text-blue-400" />
                )}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTodo(todo.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all duration-200"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <button
              className="absolute right-10 top-3 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-blue-400"
              onClick={(e) => {
                e.stopPropagation();
                setEditingTodoId(editingTodoId === todo.id ? null : todo.id);
              }}
            >
              <Settings2 size={16} />
            </button>

            {editingTodoId === todo.id && (
              <div className="absolute left-0 right-0 mt-2 p-4 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-20">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium">Task Settings</h3>
                  <button
                    onClick={() => setEditingTodoId(null)}
                    className="text-gray-400 hover:text-gray-300"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      Color
                    </label>
                    <div className="flex gap-2">
                      {colors.map((color) => (
                        <button
                          key={color.name}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateSettings(todo.id, {
                              color: color.value,
                            });
                          }}
                          className={`w-6 h-6 rounded-full ${
                            color.value || "bg-gray-700"
                          } ${
                            todo.color === color.value
                              ? "ring-2 ring-white"
                              : ""
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      Recurring
                    </label>
                    <select
                      value={todo.recurring?.frequency || "none"}
                      onChange={(e) => {
                        const frequency = e.target.value;
                        handleUpdateSettings(todo.id, {
                          recurring:
                            frequency === "none"
                              ? undefined
                              : {
                                  frequency: frequency as
                                    | "daily"
                                    | "weekly"
                                    | "monthly",
                                },
                        });
                      }}
                      className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-gray-100"
                    >
                      <option value="none">Not recurring</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
