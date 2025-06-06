// src/hooks/useCache.ts
import { useData } from '@/providers/DataProvider';
import { useCallback } from 'react';

export function useCache() {
  const { clearCaches, getCacheStats } = useData();

  const clearAllCaches = useCallback(() => {
    clearCaches();
    console.log('All caches cleared');
  }, [clearCaches]);

  const logCacheStats = useCallback(() => {
    const stats = getCacheStats();
    console.log('Cache Statistics:', stats);
  }, [getCacheStats]);

  return {
    clearAllCaches,
    logCacheStats,
  };
}