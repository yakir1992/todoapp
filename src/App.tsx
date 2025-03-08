import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayColumn } from "./components/DayColumn";
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
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Check auth state
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      console.log("Auth state changed:", user ? user.email : "Not logged in");
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Test database connection on mount
  useEffect(() => {
    const testConnection = async () => {
      const connected = await testDatabaseConnection();
      setConnectionStatus({ tested: true, connected });
    };
    testConnection();
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  useEffect(() => {
    console.log("Current days state:", days);

    // Check each day for todos
    days.forEach((day) => {
      console.log(
        `Day ${day.date} has ${day.todos.length} todos:`,
        day.todos.map((t) => t.text).join(", ")
      );
    });
  }, [days]);

  // DEBUG: Add this line to directly fetch all todos on load
  useEffect(() => {
    const debugFetch = async () => {
      try {
        const allTodos = await getAllTodos();
        console.log("DEBUG - All todos in Firestore:", allTodos);
      } catch (e) {
        console.error("DEBUG - Error fetching all todos:", e);
      }
    };
    debugFetch();
  }, []);

  // Add a login function
  const handleLogin = async () => {
    try {
      // Use a test account or prompt for credentials
      await loginUser("test@example.com", "password123");
      alert("Logged in successfully!");
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed: " + error.message);
    }
  };

  // Add this handler to force refresh todos
  const forceRefresh = async () => {
    try {
      // Clear days first
      useStore.setState({
        days: generateDaysFromDate(useStore.getState().currentStartDate),
      });
      // Then fetch todos
      await fetchTodos();
      console.log("Force refreshed todos");
    } catch (e) {
      console.error("Force refresh error:", e);
    }
  };

  // Add auth state change effect to trigger fetch
  useEffect(() => {
    if (currentUser) {
      console.log("User logged in, fetching todos...");
      forceRefresh();
    }
  }, [currentUser]);

  if (isLoading && days.every((day) => day.todos.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 font-['Playfair_Display'] flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 font-['Playfair_Display'] flex flex-col items-center justify-center p-4">
        <div className="max-w-lg text-center">
          <h1 className="text-2xl text-red-500 mb-4">Error</h1>
          <p className="mb-4">{error}</p>

          {error.includes("index") && (
            <div className="bg-gray-800 p-4 rounded mt-4 text-left">
              <h2 className="font-bold mb-2">Firestore Index Required</h2>
              <p className="mb-2">
                This error occurs because Firebase Firestore needs an index for
                the query.
              </p>
              <p className="mb-2">To fix this:</p>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Find the URL in the console error message</li>
                <li>Open that URL in a new browser tab</li>
                <li>Click "Create index" in the Firebase console</li>
                <li>Wait a few minutes for the index to be created</li>
                <li>Refresh this page</li>
              </ol>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mt-4"
              >
                Refresh Now
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-['Playfair_Display']">
      {/* Debug panel */}
      <div className="fixed top-16 right-4 z-50 bg-black/90 p-4 rounded-lg text-xs max-w-xs overflow-auto max-h-[500px]">
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
          Auth: {currentUser ? `✅ ${currentUser.email}` : "❌ Not logged in"}
        </p>

        {!currentUser ? (
          <div className="bg-gray-800 p-3 rounded-md mb-3">
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setAuthMode("login")}
                className={`flex-1 px-3 py-1.5 rounded text-sm ${
                  authMode === "login"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setAuthMode("register")}
                className={`flex-1 px-3 py-1.5 rounded text-sm ${
                  authMode === "register"
                    ? "bg-green-600 text-white"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                Register
              </button>
            </div>

            {authError && (
              <div className="bg-red-900/40 text-red-300 p-2 rounded mb-3 text-xs">
                {authError}
              </div>
            )}

            <input
              type="email"
              placeholder="Email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              className="w-full mb-2 px-3 py-2 bg-gray-700 rounded border border-gray-600 text-gray-100"
            />
            <input
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              className="w-full mb-3 px-3 py-2 bg-gray-700 rounded border border-gray-600 text-gray-100"
            />

            <button
              onClick={async () => {
                try {
                  setAuthError("");
                  if (authMode === "login") {
                    await loginUser(authEmail, authPassword);
                    console.log("Login successful!");
                  } else {
                    await registerUser(authEmail, authPassword);
                    console.log("Registration successful!");
                  }
                  setAuthEmail("");
                  setAuthPassword("");
                } catch (e) {
                  console.error(`${authMode} error:`, e);
                  setAuthError(`Failed: ${e.message}`);
                }
              }}
              className={`w-full font-bold py-2 rounded-md ${
                authMode === "login"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white`}
            >
              {authMode === "login" ? "Login" : "Register New Account"}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={async () => {
                try {
                  await logoutUser();
                  console.log("Logout successful!");
                } catch (e) {
                  console.error("Logout error:", e);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md mb-3 w-full"
            >
              Logout
            </button>

            <button
              onClick={forceRefresh}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded mb-2 w-full"
            >
              Force Refresh
            </button>
          </div>
        )}

        {!currentUser && authMode === "register" && (
          <div className="mt-2 bg-blue-900/30 p-2 rounded text-xs">
            <p className="font-bold text-blue-300">Account Creation Guide:</p>
            <ol className="list-decimal pl-4 mt-1 space-y-1 text-blue-200">
              <li>Enter your email (any valid format)</li>
              <li>Use a password at least 6 characters long</li>
              <li>Click "Register New Account"</li>
              <li>After registration, you'll be automatically logged in</li>
            </ol>
          </div>
        )}

        {/* <p className="text-xs mt-2 border-t border-gray-700 pt-2">
          Days with todos:
        </p>
        <ul className="text-xs mt-1 space-y-1">
          {days.map((day) => (
            <li key={day.date}>
              {day.date}: {day.todos.length} todos
            </li>
          ))}
        </ul> */}
      </div>

      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 p-4 flex justify-between items-center fixed top-0 w-full z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateWeek("prev")}
            className="hover:bg-gray-800 p-2 rounded-full transition-colors duration-200 ease-in-out"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={() => navigateWeek("next")}
            className="hover:bg-gray-800 p-2 rounded-full transition-colors duration-200 ease-in-out"
          >
            <ChevronRight size={24} />
          </button>
        </div>
        <h1 className="text-3xl font-light tracking-wider">Less is More</h1>
        <div className="w-20"></div>
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
