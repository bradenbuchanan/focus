// src/utils/events.ts
export const DATA_UPDATED_EVENT = 'focusDataUpdated';
export const SESSION_COMPLETED_EVENT = 'focusSessionCompleted';

export function emitDataUpdate() {
  window.dispatchEvent(new CustomEvent(DATA_UPDATED_EVENT));
}

export function emitSessionCompleted(sessionData: { 
  type: string; 
  activity: string; 
  duration: number;
}) {
  window.dispatchEvent(new CustomEvent(SESSION_COMPLETED_EVENT, { detail: sessionData }));
}

export function listenForDataUpdates(callback: () => void) {
  window.addEventListener(DATA_UPDATED_EVENT, callback);
  
  return () => {
    window.removeEventListener(DATA_UPDATED_EVENT, callback);
  };
}

export function listenForSessionCompleted(callback: (event: CustomEvent) => void) {
  window.addEventListener(SESSION_COMPLETED_EVENT, callback as EventListener);
  
  return () => {
    window.removeEventListener(SESSION_COMPLETED_EVENT, callback as EventListener);
  };
}