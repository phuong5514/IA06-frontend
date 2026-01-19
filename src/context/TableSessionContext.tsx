import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface TableSession {
  tableId: number;
  tableNumber: string;
  sessionId: string;
  startedAt: string;
  guestUserId?: string;
  isGuest?: boolean;
}

interface TableSessionContextType {
  session: TableSession | null;
  startSession: (tableId: number, tableNumber: string, sessionId: string, guestUserId?: string) => void;
  endSession: () => void;
  isSessionActive: boolean;
}

const TableSessionContext = createContext<TableSessionContextType | undefined>(undefined);

export function TableSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<TableSession | null>(() => {
    // Load session from localStorage on initialization
    // Check both 'tableSession' and 'guestSession' keys
    const savedSession = localStorage.getItem('tableSession') || localStorage.getItem('guestSession');
    if (savedSession) {
      try {
        return JSON.parse(savedSession);
      } catch (error) {
        console.error('Failed to parse saved session:', error);
        return null;
      }
    }
    return null;
  });

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (session) {
      localStorage.setItem('tableSession', JSON.stringify(session));
    } else {
      localStorage.removeItem('tableSession');
    }
  }, [session]);

  const startSession = (tableId: number, tableNumber: string, sessionId: string, guestUserId?: string) => {
    const newSession: TableSession = {
      tableId,
      tableNumber,
      sessionId,
      startedAt: new Date().toISOString(),
      guestUserId,
      isGuest: !!guestUserId,
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
