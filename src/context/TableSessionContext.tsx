import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface TableSession {
  tableId: number;
  tableNumber: string;
  startedAt: string;
}

interface TableSessionContextType {
  session: TableSession | null;
  startSession: (tableId: number, tableNumber: string) => void;
  endSession: () => void;
  isSessionActive: boolean;
}

const TableSessionContext = createContext<TableSessionContextType | undefined>(undefined);

export function TableSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<TableSession | null>(() => {
    // Load session from localStorage on initialization
    const savedSession = localStorage.getItem('tableSession');
    return savedSession ? JSON.parse(savedSession) : null;
  });

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (session) {
      localStorage.setItem('tableSession', JSON.stringify(session));
    } else {
      localStorage.removeItem('tableSession');
    }
  }, [session]);

  const startSession = (tableId: number, tableNumber: string) => {
    const newSession: TableSession = {
      tableId,
      tableNumber,
      startedAt: new Date().toISOString(),
    };
    setSession(newSession);
  };

  const endSession = () => {
    setSession(null);
  };

  const isSessionActive = session !== null;

  return (
    <TableSessionContext.Provider
      value={{
        session,
        startSession,
        endSession,
        isSessionActive,
      }}
    >
      {children}
    </TableSessionContext.Provider>
  );
}

export function useTableSession() {
  const context = useContext(TableSessionContext);
  if (context === undefined) {
    throw new Error('useTableSession must be used within a TableSessionProvider');
  }
  return context;
}
