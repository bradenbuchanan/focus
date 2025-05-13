// src/utils/events.ts
export const DATA_UPDATED_EVENT = 'focusDataUpdated';

export function emitDataUpdate() {
  window.dispatchEvent(new CustomEvent(DATA_UPDATED_EVENT));
}

export function listenForDataUpdates(callback: () => void) {
  window.addEventListener(DATA_UPDATED_EVENT, callback);
  
  return () => {
    window.removeEventListener(DATA_UPDATED_EVENT, callback);
  };
}