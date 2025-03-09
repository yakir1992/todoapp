import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { DayColumn } from "./components/DayColumn";
import { LoginPage } from "./components/LoginPage";
import { useStore } from "./store";
import {
  getAllTodos,
  testDatabaseConnection,
} from "./services/firestoreService";
import { onAuthChange } from "./services/authService";
import { loginUser, logoutUser, registerUser } from "./services/authService";
import { generateDaysFromDate } from "./utils/dateUtils";

function App() {
  const {
    days,
    addTodo,
    toggleTodo,
    deleteTodo,
    navigateWeek,
    fetchTodos,
    isLoading,
    error,
  } = useStore();

  const [dayCount, setDayCount] = useState<number>(7);
  const [connectionStatus, setConnectionStatus] = useState({
    tested: false,
    connected: false,
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [debugExpanded, setDebugExpanded] = useState<boolean>(false);

  // Check auth state
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      console.log("Auth state changed:", user ? "Logged in" : "Logged out");
      setCurrentUser(user);

      // If user just logged in, fetch todos
      if (user) {
        fetchTodos();
      }
    });

    return () => unsubscribe();
  }, [fetchTodos]);

  // Test database connection
  useEffect(() => {
    const testConnection = async () => {
      try {
        const connected = await testDatabaseConnection();
        setConnectionStatus({ tested: true, connected });
      } catch (error) {
        console.error("Error testing database connection:", error);
        setConnectionStatus({ tested: true, connected: false });
      }
    };

    testConnection();
  }, []);

  // Logout handler
  const handleLogout = async () => {
    try {
      await logoutUser();
      // Auth state change will be caught by the onAuthChange listener
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // If not logged in, show login page
  if (!currentUser) {
    return <LoginPage onLogin={(user) => setCurrentUser(user)} />;
  }

  // Main app UI (when logged in)
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-['Playfair_Display']">
      {/* Minimized debug panel */}
      <div className="fixed top-16 right-4 z-50 bg-black/90 rounded-lg text-xs overflow-hidden">
        <button
          onClick={() => setDebugExpanded(!debugExpanded)}
          className="w-full flex items-center justify-between p-2 text-xs bg-gray-800 hover:bg-gray-700"
        >
          <span>Debug {connectionStatus.connected ? "✅" : "❌"}</span>
          <span>{currentUser ? "Logged in" : "Not logged in"}</span>
          {debugExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {debugExpanded && (
          <div className="p-4 max-w-xs overflow-auto max-h-[500px]">
            <h3 className="font-bold mb-2">Debug Info:</h3>
            <p className="mb-2">
              Connection:{" "}
              {connectionStatus.tested
                ? connectionStatus.connected
                  ? "✅"
                  : "❌"
                : "Testing..."}
            </p>
            <p className="mb-2">
              Auth:{" "}
              {currentUser ? `✅ ${currentUser.email}` : "❌ Not logged in"}
            </p>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="mt-2 w-full text-center bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-2 rounded"
            >
              Log Out
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 p-4 flex justify-between items-center fixed top-0 w-full z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateWeek("prev")}
            className="bg-gray-800 hover:bg-gray-700 p-2 rounded"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => navigateWeek("next")}
            className="bg-gray-800 hover:bg-gray-700 p-2 rounded"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <h1 className="text-xl font-bold flex items-center">
          less is more
          <span className="text-lg font-serif text-gray-300 ml-4">
            build, ship, learn, repeat 🚀
          </span>
        </h1>

        {/* User profile/logout button */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{currentUser?.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto p-4 pt-24">
        <div className="flex justify-between mb-4">
          <div className="flex space-x-2">
            {[1, 3, 5, 7].map((numDays) => (
              <button
                key={numDays}
                onClick={() => setDayCount(numDays)}
                className={`px-3 py-1 rounded text-sm ${
                  dayCount === numDays
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {numDays}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-4">
          {days.slice(0, dayCount).map((day) => (
            <DayColumn
              key={day.date}
              date={day.date}
              todos={day.todos}
              onAddTodo={(text) => addTodo(day.date, text)}
              onToggleTodo={(todoId) => toggleTodo(day.date, todoId)}
              onDeleteTodo={(todoId) => deleteTodo(day.date, todoId)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
