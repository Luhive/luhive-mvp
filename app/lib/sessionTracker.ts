// Session tracking with 5-minute deduplication window

const SESSION_KEY = 'community_session_id';
const VISIT_TRACKING_KEY = 'community_last_visit';
const TRACKING_WINDOW = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Generate or retrieve session ID
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return ''; // Server-side guard
  
  let sessionId = localStorage.getItem(SESSION_KEY);
  
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  
  return sessionId;
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if we should track a visit for this community
 * Returns true if >5 minutes since last visit to this community
 */
export function shouldTrackVisit(communityId: string): boolean {
  if (typeof window === 'undefined') return false; // Server-side guard
  
  const trackingKey = `${VISIT_TRACKING_KEY}_${communityId}`;
  const lastVisitStr = localStorage.getItem(trackingKey);
  
  if (!lastVisitStr) {
    // First visit to this community
    localStorage.setItem(trackingKey, Date.now().toString());
    return true;
  }
  
  const lastVisit = parseInt(lastVisitStr);
  const timeSinceLastVisit = Date.now() - lastVisit;
  
  if (timeSinceLastVisit >= TRACKING_WINDOW) {
    // More than 5 minutes, update and track
    localStorage.setItem(trackingKey, Date.now().toString());
    return true;
  }
  
  return false;
}

/**
 * Check if this is user's first visit ever to any community
 */
export function isFirstVisit(): boolean {
  if (typeof window === 'undefined') return false;
  
  const FIRST_VISIT_KEY = 'community_first_visit';
  const hasVisited = localStorage.getItem(FIRST_VISIT_KEY);
  
  if (!hasVisited) {
    localStorage.setItem(FIRST_VISIT_KEY, 'true');
    return true;
  }
  
  return false;
}