import { useEffect, useState } from "react";

import { getDatabase } from "@/lib/db";

import { getInfos } from "../services/users";

type Todo = {
  id: number;
  title: string;
  created_at: number;
  dirty: 0 | 1;
  updatedAt?: number;
  deleted?: 0 | 1;
  serverVersion?: number;
};

export function useUsers() {
  const [title, setTitle] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchUsers() {
    try {
      const users = await getInfos();
      console.log("Users from API:", users);
      return users;
    } catch (fetchError) {
      console.log("Failed to fetch users:", fetchError);
      throw fetchError;
    }
  }

  async function loadTodos() {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Todo>(
      "SELECT id, title, created_at, deleted FROM todos ORDER BY created_at DESC;",
    );
    setTodos(rows);
  }

  async function addTodo() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const db = await getDatabase();
      await db.runAsync(
        "INSERT INTO todos (title, created_at) VALUES (?, ?);",
        [trimmed, Date.now()],
      );
      setTitle("");
      await loadTodos();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to insert todo.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteTodo(id: number) {
    setLoading(true);
    try {
      const db = await getDatabase();
      await db.runAsync(
        "UPDATE todos SET dirty = 1, deleted = 1, updatedAt = ?, serverVersion = 1 WHERE id = ?;",
        [Date.now(), id],
      );
      await loadTodos();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete todo.");
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setLoading(true);
    try {
      await loadTodos();
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load todos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    void fetchUsers();
  }, []);

  return {
    title,
    setTitle,
    todos,
    error,
    loading,
    addTodo,
    deleteTodo,
    refresh,
    fetchUsers,
  };
}
