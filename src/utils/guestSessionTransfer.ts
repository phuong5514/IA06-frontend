import { apiClient } from '../config/api';

/**
 * Transfer guest session data to an authenticated account
 * @returns The number of orders transferred
 */
export async function transferGuestSession(): Promise<{ ordersTransferred: number } | null> {
  try {
    // Check if there's a guest session to transfer
    const guestSessionStr = localStorage.getItem('guestSession');
    if (!guestSessionStr) {
      return null;
    }

    const guestSession = JSON.parse(guestSessionStr);
    if (!guestSession.guestUserId || !guestSession.sessionId) {
      console.warn('Invalid guest session data');
      return null;
    }

    // Call the transfer endpoint
    const response = await apiClient.post('/guest-session/transfer', {
      guestUserId: guestSession.guestUserId,
      sessionId: guestSession.sessionId,
    });

    // Clean up guest session data
    localStorage.removeItem('guestSession');
    localStorage.removeItem('tableSession');

    console.log(`Transferred ${response.data.ordersTransferred} orders from guest session`);
    
    return {
      ordersTransferred: response.data.ordersTransferred,
    };
  } catch (error) {
    console.error('Failed to transfer guest session:', error);
    // Still clean up guest session even if transfer fails
    localStorage.removeItem('guestSession');
    return null;
  }
}
