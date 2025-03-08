export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  date: string;
  color?: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    endDate?: string;
  };
}

export interface DayTodos {
  date: string;
  todos: Todo[];
}