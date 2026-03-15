const SESSION_CHANGED_EVENT = "sylla:session-changed";

export type SessionChangeReason = "started" | "ended";

export function emitSessionChanged(reason: SessionChangeReason) {
  window.dispatchEvent(new CustomEvent(SESSION_CHANGED_EVENT, { detail: { reason } }));
}

export function onSessionChanged(handler: () => void) {
  window.addEventListener(SESSION_CHANGED_EVENT, handler);
  return () => window.removeEventListener(SESSION_CHANGED_EVENT, handler);
}
