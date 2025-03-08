import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
  limit,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { Todo, DayTodos } from "../types";

// Collection name - make sure this exactly matches what's in your Firebase console
const TODOS_COLLECTION = "todos";

// Get current user ID (or null if not logged in)
const getCurrentUserId = () => {
  const user = auth.currentUser;
  if (!user) {
    console.log("No authenticated user found");
    return null;
  }
  console.log(`Authenticated as user: ${user.email} (${user.uid})`);
  return user.uid;
};

// Create a new todo
export const addTodoToFirestore = async (
  todo: Omit<Todo, "id">
): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error("Error adding todo: User not logged in");
      throw new Error("User not logged in");
    }

    // Add user ID to the todo document
    const todoWithUserId = {
      ...todo,
      userId,
      createdAt: Timestamp.now(),
    };

    console.log("Adding todo to Firestore:", todoWithUserId);

    const docRef = await addDoc(
      collection(db, TODOS_COLLECTION),
      todoWithUserId
    );
    console.log("Todo added with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding todo:", error);
    throw error;
  }
};

// Get todos for a specific date range
export const getTodosForDateRange = async (
  startDate: string,
  endDate: string
): Promise<Todo[]> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.log("User not authenticated, returning empty todos array");
      return [];
    }

    console.log(
      `Fetching todos from ${startDate} to ${endDate} for user ${userId}`
    );

    try {
      // Try the complex query first (this requires an index)
      const q = query(
        collection(db, TODOS_COLLECTION),
        where("userId", "==", userId),
        where("date", ">=", startDate),
        where("date", "<=", endDate)
      );

      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.size} todos in date range`);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.text || "No text",
          completed: data.completed || false,
          date: data.date,
          color: data.color,
          recurring: data.recurring,
        };
      });
    } catch (error) {
      // If we get an index error, try a simpler approach temporarily
      if (error.message && error.message.includes("index")) {
        console.log("Index error detected, trying simple query as fallback");

        // Create a simple query - just get all user's todos and filter in memory
        const simpleQuery = query(
          collection(db, TODOS_COLLECTION),
          where("userId", "==", userId)
        );

        const querySnapshot = await getDocs(simpleQuery);
        console.log(`Found ${querySnapshot.size} total todos for user`);

        // Filter the results in memory
        return querySnapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              text: data.text || "No text",
              completed: data.completed || false,
              date: data.date,
              color: data.color,
              recurring: data.recurring,
            };
          })
          .filter((todo) => todo.date >= startDate && todo.date <= endDate);
      }

      // If it's not an index error, rethrow
      throw error;
    }
  } catch (error) {
    console.error("Error getting todos:", error);

    // Add better error handling for the index error
    if (error.message && error.message.includes("index")) {
      console.log(
        "This is a Firestore index error. You need to create an index."
      );
      console.log(
        "Click the URL in the error message to create the required index."
      );

      // You can also extract and log the URL directly
      const indexUrlMatch = error.message.match(
        /https:\/\/console\.firebase\.google\.com\/[^\s]+/
      );
      if (indexUrlMatch) {
        console.log("Create the index here:", indexUrlMatch[0]);
      }
    }

    throw error;
  }
};

// Update a todo
export const updateTodoInFirestore = async (
  todoId: string,
  updates: Partial<Todo>
): Promise<void> => {
  try {
    const todoRef = doc(db, TODOS_COLLECTION, todoId);
    await updateDoc(todoRef, updates);
  } catch (error) {
    console.error("Error updating todo:", error);
    throw error;
  }
};

// Delete a todo
export const deleteTodoFromFirestore = async (
  todoId: string
): Promise<void> => {
  try {
    const todoRef = doc(db, TODOS_COLLECTION, todoId);
    await deleteDoc(todoRef);
  } catch (error) {
    console.error("Error deleting todo:", error);
    throw error;
  }
};

// Test database connection
export const testDatabaseConnection = async () => {
  try {
    console.log("Testing database connection...");

    // Don't try to list all collections - that's what's causing the error
    // const collections = await getDocs(collection(db, "")); <- THIS IS THE PROBLEM

    // Instead, directly try to access the todos collection
    const q = query(collection(db, TODOS_COLLECTION), limit(1));
    const querySnapshot = await getDocs(q);

    console.log(
      `Test query on "${TODOS_COLLECTION}" returned:`,
      querySnapshot.docs.length ? "✅ Success" : "⚠️ Empty collection"
    );

    // Test write capability
    const testDocRef = await addDoc(collection(db, TODOS_COLLECTION), {
      text: "Test connection",
      completed: false,
      date: new Date().toISOString().split("T")[0],
      createdAt: Timestamp.now(),
      _isTestDoc: true,
    });

    // Delete the test document
    await deleteDoc(testDocRef);

    console.log("✅ Database connection successful!");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
};

// Alternative function to get all todos
export const getAllTodos = async (): Promise<Todo[]> => {
  try {
    console.log("Fetching ALL todos from Firestore");

    const userId = getCurrentUserId();
    if (!userId) {
      console.warn("No user logged in, returning empty todos");
      return [];
    }

    // Try multiple collection paths
    const collectionsToTry = [TODOS_COLLECTION, "todo", "tasks"];
    let todos: Todo[] = [];

    for (const collName of collectionsToTry) {
      try {
        console.log(`Trying collection "${collName}"...`);
        // Query with user ID filter
        const q = query(
          collection(db, collName),
          where("userId", "==", userId)
        );
        const querySnapshot = await getDocs(q);

        console.log(
          `Collection "${collName}" returned ${querySnapshot.docs.length} documents`
        );

        if (querySnapshot.docs.length > 0) {
          todos = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            console.log("Document data:", doc.id, data);
            return {
              id: doc.id,
              text: data.text || "No text",
              completed: data.completed || false,
              date: data.date || new Date().toISOString().split("T")[0],
              color: data.color,
              recurring: data.recurring,
            } as Todo;
          });

          // If we found todos, break out of the loop
          if (todos.length > 0) {
            console.log(
              `Using collection "${collName}" with ${todos.length} todos`
            );
            break;
          }
        }
      } catch (e) {
        console.log(`Error trying collection "${collName}":`, e);
      }
    }

    return todos;
  } catch (error) {
    console.error("Error getting all todos:", error);
    throw error;
  }
};
