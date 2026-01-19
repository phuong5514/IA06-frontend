import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '../config/api';
import toast from 'react-hot-toast';

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
  endSession: () => Promise<void>;
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

  const endSession = async () => {
    // If there's an active session, notify backend
    if (session && session.sessionId) {
      try {
        // End the session (cancels incomplete orders)
        const response = await apiClient.post('/guest-session/end', {
          sessionId: session.sessionId,
          tableId: session.tableId,
        });

        if (response.data.success) {
          const { ordersCancelled } = response.data;
          
          // Delete guest user if this is a guest session
          if (session.isGuest && session.guestUserId) {
            try {
              await apiClient.post('/guest-session/delete-guest', {
                userId: session.guestUserId,
              });
            } catch (deleteError) {
              console.error('Failed to delete guest user:', deleteError);
              // Continue even if guest deletion fails
            }
          }
          
          if (ordersCancelled > 0) {
            toast.success(`Session ended. ${ordersCancelled} incomplete order${ordersCancelled !== 1 ? 's' : ''} cancelled.`);
          } else {
            toast.success('Session ended successfully.');
          }
        }
      } catch (error) {
        console.error('Failed to end session on server:', error);
        toast.error('Failed to end session on server, but local session cleared.');
      }
    }
    
    // Clear local session data
    setSession(null);
    localStorage.removeItem('tableSession');
    localStorage.removeItem('guestSession');
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
