/**
 * View Tracker Utility
 * Ensures unique views per session to prevent accidental view-limit exhaustion.
 */

export async function trackInvitationView(inviteId: string) {
  if (typeof window === 'undefined') return;

  const sessionKey = `viewed_${inviteId}`;
  const alreadyViewed = sessionStorage.getItem(sessionKey);

  if (!alreadyViewed) {
    try {
      // Use the internal fetch with auth handling if needed, 
      // but for public views we use a public endpoint.
      const res = await fetch('/api/increment-views', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteId }),
      });
      
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem(sessionKey, 'true');
      }
    } catch (err) {
      console.error('Failed to track view:', err);
    }
  }
}
