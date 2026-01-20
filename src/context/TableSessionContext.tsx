import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';

interface TableSession {
  tableId: number;
  tableNumber: string;
  sessionId: string;
  startedAt: string;
  isGuest: boolean;
}

interface TableSessionContextType {
  session: TableSession | null;
  startSession: (tableId: number, tableNumber: string, sessionId: string) => void;
  endSession: () => void;
  isSessionActive: boolean;
}

const TableSessionContext = createContext<TableSessionContextType | undefined>(undefined);

export function TableSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<TableSession | null>(() => {
    // Load session from sessionStorage (guest-only sessions)
    const savedSession = sessionStorage.getItem('tableSession');
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

  // Save session to sessionStorage whenever it changes
  useEffect(() => {
    if (session) {
      sessionStorage.setItem('tableSession', JSON.stringify(session));
    } else {
      sessionStorage.removeItem('tableSession');
    }
  }, [session]);

  const startSession = (tableId: number, tableNumber: string, sessionId: string) => {
    const newSession: TableSession = {
      tableId,
      tableNumber,
      sessionId,
      startedAt: new Date().toISOString(),
      isGuest: true,
    };
    setSession(newSession);
  };

  const endSession = () => {
    // Simply clear local session data (no backend call needed)
    setSession(null);
    sessionStorage.removeItem('tableSession');
    toast.success('Session ended successfully.');
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
