// src/hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' 
      ? !navigator.onLine 
      : false
  );
  
  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
    }
    
    function handleOffline() {
      setIsOffline(true);
    }
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOffline;
}