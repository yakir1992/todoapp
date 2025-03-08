import { addDays, format, startOfDay } from "date-fns";
import { DayTodos } from "../types";

/**
 * Generates an array of day objects for a week starting from the given date
 * @param startDate The starting date
 * @param numDays Number of days to generate (default: 7)
 * @returns Array of day objects with empty todos arrays
 */
export const generateDaysFromDate = (
  startDate: Date,
  numDays: number = 7
): DayTodos[] => {
  const days: DayTodos[] = [];
  const start = startOfDay(startDate);

  for (let i = 0; i < numDays; i++) {
    const date = addDays(start, i);
    const formattedDate = format(date, "yyyy-MM-dd");
    days.push({
      date: formattedDate,
      todos: [],
    });
  }

  console.log(
    `Generated ${days.length} days from ${format(start, "yyyy-MM-dd")}`
  );
  return days;
};
