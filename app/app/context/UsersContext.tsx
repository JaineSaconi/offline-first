import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { UserDB } from "../interfaces/user";
import { OutboxItem } from "../interfaces/outbox";
import { loadAllUsers, addUser, markDeleted } from "../data/user-repository";
import { loadAllOutboxItems } from "../data/outbox-repository";
import { getInfos, UserInfo } from "../services/users";
import { useSync } from "../hooks/useSync";

interface UsersContextValue {
  todos: UserDB[];
  outboxItems: OutboxItem[];
  error: string | null;
  loading: boolean;
  addTodo: (name: string) => Promise<boolean>;
  deleteTodo: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  fetchUsers: () => Promise<UserInfo[]>;
}

const UsersContext = createContext<UsersContextValue | null>(null);

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [todos, setTodos] = useState<UserDB[]>([]);
  const [outboxItems, setOutboxItems] = useState<OutboxItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { sync } = useSync();

  const loadTodos = useCallback(async () => {
    const rows = await loadAllUsers();
    setTodos(rows);
  }, []);

  const loadOutboxItems = useCallback(async () => {
    const rows = await loadAllOutboxItems();
    setOutboxItems(rows);
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const users = await getInfos();
      console.log("Users from API:", users);
      return users;
    } catch (fetchError) {
      console.log("Failed to fetch users:", fetchError);
      throw fetchError;
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadTodos(), loadOutboxItems()]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [loadTodos, loadOutboxItems]);

  const addTodo = useCallback(
    async (name: string): Promise<boolean> => {
      setLoading(true);
      try {
        await addUser(name);
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
    },
    [loadTodos, loadOutboxItems, sync],
  );

  const deleteTodo = useCallback(
    async (id: string): Promise<void> => {
      setLoading(true);
      try {
        await markDeleted(id);
        await Promise.all([loadTodos(), loadOutboxItems()]);
        sync()
          .then(() => loadOutboxItems())
          .catch(() => {});
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete.");
      } finally {
        setLoading(false);
      }
    },
    [loadTodos, loadOutboxItems, sync],
  );

  useEffect(() => {
    void refresh();
    void fetchUsers();
  }, []);

  return (
    <UsersContext.Provider
      value={{
        todos,
        outboxItems,
        error,
        loading,
        addTodo,
        deleteTodo,
        refresh,
        fetchUsers,
      }}
    >
      {children}
    </UsersContext.Provider>
  );
}

export function useUsersContext(): UsersContextValue {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsersContext must be used within UsersProvider");
  return ctx;
}
