// Tab synchronization utility using BroadcastChannel API with localStorage fallback

interface AuthEvent {
  type: 'login' | 'logout' | 'token_refresh';
  timestamp: number;
}

class TabSyncManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(event: AuthEvent) => void> = new Set();

  constructor() {
    // Try to use BroadcastChannel if available
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('auth_sync');
        this.channel.onmessage = (event) => {
          this.notifyListeners(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel not available, using localStorage fallback');
        this.setupLocalStorageFallback();
      }
    } else {
      this.setupLocalStorageFallback();
    }
  }

  private setupLocalStorageFallback() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'auth_event' && e.newValue) {
        try {
          const event = JSON.parse(e.newValue) as AuthEvent;
          this.notifyListeners(event);
        } catch (err) {
          console.error('Failed to parse auth event:', err);
        }
      }
    });
  }

  private notifyListeners(event: AuthEvent) {
    this.listeners.forEach(listener => listener(event));
  }

  broadcast(event: AuthEvent) {
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch (e) {
        console.error('Failed to broadcast via channel:', e);
        this.broadcastViaLocalStorage(event);
      }
    } else {
      this.broadcastViaLocalStorage(event);
    }
  }

  private broadcastViaLocalStorage(event: AuthEvent) {
    try {
      localStorage.setItem('auth_event', JSON.stringify(event));
      // Remove immediately to allow repeated events with same type
      setTimeout(() => localStorage.removeItem('auth_event'), 100);
    } catch (e) {
      console.error('Failed to broadcast via localStorage:', e);
    }
  }

  subscribe(listener: (event: AuthEvent) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  close() {
    if (this.channel) {
      this.channel.close();
    }
    this.listeners.clear();
  }
}

export const tabSyncManager = new TabSyncManager();
