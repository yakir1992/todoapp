import { format, isWithinInterval, parseISO } from 'date-fns';

interface Holiday {
  name: string;
  date: string;
  color: string;
}

// 2024 Israeli holidays (dates are in YYYY-MM-DD format)
export const israeliHolidays: Holiday[] = [
  { name: "Tu BiShvat", date: "2024-01-25", color: "bg-green-500" },
  { name: "Purim", date: "2024-03-23", color: "bg-purple-500" },
  { name: "Passover", date: "2024-04-22", color: "bg-blue-500" },
  { name: "Yom HaShoah", date: "2024-05-06", color: "bg-gray-500" },
  { name: "Yom HaZikaron", date: "2024-05-13", color: "bg-blue-900" },
  { name: "Yom HaAtzmaut", date: "2024-05-14", color: "bg-blue-500" },
  { name: "Lag BaOmer", date: "2024-05-26", color: "bg-orange-500" },
  { name: "Shavuot", date: "2024-06-11", color: "bg-yellow-500" },
  { name: "Tisha B'Av", date: "2024-08-13", color: "bg-red-900" },
  { name: "Rosh Hashanah", date: "2024-10-02", color: "bg-yellow-600" },
  { name: "Yom Kippur", date: "2024-10-11", color: "bg-white" },
  { name: "Sukkot", date: "2024-10-16", color: "bg-green-600" },
  { name: "Simchat Torah", date: "2024-10-23", color: "bg-blue-600" },
  { name: "Hanukkah", date: "2024-12-25", color: "bg-blue-400" },
];

export const getHolidaysForDate = (date: string): Holiday[] => {
  const formattedDate = format(parseISO(date), 'yyyy-MM-dd');
  return israeliHolidays.filter(holiday => holiday.date === formattedDate);
};