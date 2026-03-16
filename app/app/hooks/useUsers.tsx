import { useEffect, useRef, useState } from "react";

import { OutboxRepository } from "../data/outbox-repository";
import { UserRepository } from "../data/user-repository";
import { UserDB } from "../interfaces/user";
import { OutboxItem } from "../interfaces/outbox";
import { getInfos } from "../services/users";
import { useSync } from "./useSync";

export function useUsers() {
  const outboxRepository = useRef(new OutboxRepository()).current;
  const userRepository = useRef(new UserRepository()).current;
  const { sync } = useSync();
  const [todos, setTodos] = useState<UserDB[]>([]);
  const [outboxItems, setOutboxItems] = useState<OutboxItem[]>([]);
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
    const rows = await userRepository.loadAll();
    setTodos(rows);
  }

  async function loadOutboxItems() {
    const rows = await outboxRepository.loadAll();
    setOutboxItems(rows);
  }

  async function addTodo(name: string): Promise<boolean> {
    setLoading(true);
    try {
      await userRepository.add(name);
      await Promise.all([loadTodos(), loadOutboxItems()]);
      sync()
        .then(() => loadOutboxItems())
        .catch(() => {});
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to insert.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function deleteTodo(id: string) {
    setLoading(true);
    try {
      await userRepository.markDeleted(id);
      await Promise.all([loadTodos(), loadOutboxItems()]);
      sync()
        .then(() => loadOutboxItems())
        .catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete.");
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setLoading(true);
    try {
      await Promise.all([loadTodos(), loadOutboxItems()]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    void fetchUsers();
  }, []);

  return {
    todos,
    outboxItems,
    error,
    loading,
    addTodo,
    deleteTodo,
    refresh,
    fetchUsers,
  };
}
