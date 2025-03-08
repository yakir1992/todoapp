import { create } from "zustand";
import { persist } from "zustand/middleware";
import { addDays, subDays, startOfDay, format, parseISO } from "date-fns";
import { Todo, DayTodos } from "./types";
import {
  addTodoToFirestore,
  getTodosForDateRange,
  updateTodoInFirestore,
  deleteTodoFromFirestore,
  getAllTodos,
} from "./services/firestoreService";
import { generateDaysFromDate } from "./utils/dateUtils";

interface TodoStore {
  days: DayTodos[];
  currentStartDate: Date;
  isLoading: boolean;
  error: string | null;
  fetchTodos: () => Promise<void>;
  addTodo: (date: string, text: string) => Promise<void>;
  toggleTodo: (date: string, todoId: string) => Promise<void>;
  deleteTodo: (date: string, todoId: string) => Promise<void>;
  moveTodo: (fromDate: string, toDate: string, todoId: string) => Promise<void>;
  navigateWeek: (direction: "prev" | "next") => void;
  updateTodoSettings: (
    date: string,
    todoId: string,
    updates: Partial<Pick<Todo, "color" | "recurring">>
  ) => Promise<void>;
}

const createRecurringTodos = (
  todo: Todo,
  startDate: string,
  existingDays: DayTodos[]
) => {
  if (!todo.recurring) return [];

  const newTodos: { date: string; todo: Todo }[] = [];
  const start = parseISO(startDate);

  existingDays.forEach((day) => {
    const currentDate = parseISO(day.date);
    if (currentDate <= start) return;

    let shouldAdd = false;
    switch (todo.recurring.frequency) {
      case "daily":
        shouldAdd = true;
        break;
      case "weekly":
        shouldAdd = format(currentDate, "EEEE") === format(start, "EEEE");
        break;
      case "monthly":
        shouldAdd = format(currentDate, "d") === format(start, "d");
        break;
    }

    if (shouldAdd) {
      newTodos.push({
        date: day.date,
        todo: {
          ...todo,
          id: crypto.randomUUID(),
          date: day.date,
        },
      });
    }
  });

  return newTodos;
};

export const useStore = create<TodoStore>()(
  persist(
    (set, get) => ({
      days: generateDaysFromDate(startOfDay(new Date())),
      currentStartDate: startOfDay(new Date()),
      isLoading: false,
      error: null,

      fetchTodos: async () => {
        set({ isLoading: true, error: null });
        try {
          console.log("Fetching todos...");

          // Generate date range for the current week
          const days = generateDaysFromDate(get().currentStartDate);
          const startDate = days[0].date;
          const endDate = days[days.length - 1].date;

          console.log(`Date range: ${startDate} to ${endDate}`);

          // Get todos from Firestore
          const todos = await getTodosForDateRange(startDate, endDate);
          console.log(`Received ${todos.length} todos from Firestore`);

          // Add todos to their respective days
          const updatedDays = days.map((day) => ({
            ...day,
            todos: todos.filter((todo) => todo.date === day.date),
          }));

          // Update state with new data
          set({ days: updatedDays, isLoading: false });
        } catch (error) {
          console.error("Failed to fetch todos:", error);

          let errorMessage = "Failed to fetch todos";

          // Improve error message for common cases
          if (error.message && error.message.includes("index")) {
            errorMessage =
              "Firebase needs an index created. See console for details and the URL to create it.";
          } else if (error.message && error.message.includes("auth")) {
            errorMessage = "Authentication error. Please log in again.";
          } else if (error.message) {
            errorMessage = `Error: ${error.message}`;
          }

          set({ error: errorMessage, isLoading: false });
        }
      },

      addTodo: async (date, text) => {
        try {
          set({ isLoading: true, error: null });

          const newTodo: Omit<Todo, "id"> = {
            text,
            completed: false,
            date,
          };

          const todoId = await addTodoToFirestore(newTodo);

          set((state) => ({
            days: state.days.map((day) =>
              day.date === date
                ? {
                    ...day,
                    todos: [...day.todos, { id: todoId, ...newTodo }],
                  }
                : day
            ),
            isLoading: false,
          }));
        } catch (error) {
          console.error("Error adding todo:", error);
          set({ error: "Failed to add todo", isLoading: false });
        }
      },

      toggleTodo: async (date, todoId) => {
        try {
          const todo = get()
            .days.find((day) => day.date === date)
            ?.todos.find((t) => t.id === todoId);

          if (!todo) return;

          await updateTodoInFirestore(todoId, { completed: !todo.completed });

          set((state) => ({
            days: state.days.map((day) =>
              day.date === date
                ? {
                    ...day,
                    todos: day.todos.map((todo) =>
                      todo.id === todoId
                        ? { ...todo, completed: !todo.completed }
                        : todo
                    ),
                  }
                : day
            ),
          }));
        } catch (error) {
          console.error("Error toggling todo:", error);
          set({ error: "Failed to update todo" });
        }
      },

      deleteTodo: async (date, todoId) => {
        try {
          await deleteTodoFromFirestore(todoId);

          set((state) => ({
            days: state.days.map((day) =>
              day.date === date
                ? {
                    ...day,
                    todos: day.todos.filter((todo) => todo.id !== todoId),
                  }
                : day
            ),
          }));
        } catch (error) {
          console.error("Error deleting todo:", error);
          set({ error: "Failed to delete todo" });
        }
      },

      moveTodo: (fromDate, toDate, todoId) =>
        set((state) => {
          const todo = state.days
            .find((day) => day.date === fromDate)
            ?.todos.find((t) => t.id === todoId);

          if (!todo) return state;

          return {
            days: state.days.map((day) => {
              if (day.date === fromDate) {
                return {
                  ...day,
                  todos: day.todos.filter((t) => t.id !== todoId),
                };
              }
              if (day.date === toDate) {
                return {
                  ...day,
                  todos: [...day.todos, { ...todo, date: toDate }],
                };
              }
              return day;
            }),
          };
        }),

      updateTodoSettings: (date, todoId, updates) =>
        set((state) => {
          const todo = state.days
            .find((day) => day.date === date)
            ?.todos.find((t) => t.id === todoId);

          if (!todo) return state;

          const updatedTodo = { ...todo, ...updates };
          const recurringTodos = createRecurringTodos(
            updatedTodo,
            date,
            state.days
          );

          return {
            days: state.days.map((day) => {
              const recurringTodosForDay = recurringTodos.filter(
                (rt) => rt.date === day.date
              );

              if (day.date === date) {
                return {
                  ...day,
                  todos: day.todos.map((t) =>
                    t.id === todoId ? updatedTodo : t
                  ),
                };
              } else if (recurringTodosForDay.length > 0) {
                return {
                  ...day,
                  todos: [
                    ...day.todos,
                    ...recurringTodosForDay.map((rt) => rt.todo),
                  ],
                };
              }
              return day;
            }),
          };
        }),

      navigateWeek: (direction) => {
        set((state) => {
          const newStartDate =
            direction === "prev"
              ? subDays(state.currentStartDate, 7)
              : addDays(state.currentStartDate, 7);

          return {
            currentStartDate: newStartDate,
            days: generateDaysFromDate(newStartDate),
          };
        });

        // Fetch todos for the new week
        get().fetchTodos();
      },
    }),
    {
      name: "todo-storage",
      partialize: (state) => ({
        currentStartDate: state.currentStartDate.toISOString(),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (typeof state.currentStartDate === "string") {
            state.currentStartDate = parseISO(state.currentStartDate);
          } else if (!(state.currentStartDate instanceof Date)) {
            state.currentStartDate = startOfDay(new Date());
          }
        }
      },
    }
  )
);
