// src/hooks/useCache.ts
import { useData } from '@/providers/DataProvider';
import { useCallback } from 'react';

interface CacheStats {
  [key: string]: {
    size: number;
    keys: string[];
  };
}

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

  const getStats = useCallback((): CacheStats => {
    const rawStats = getCacheStats();
    if ('size' in rawStats && 'keys' in rawStats) {
      // If it returns a single cache stats object, wrap it
      return {
        cache: rawStats as { size: number; keys: string[] }
      };
    }
    
    // If it already returns the correct format, just return it
    return rawStats as CacheStats;
  }, [getCacheStats]);

  return {
    clearAllCaches,
    logCacheStats,
    getCacheStats: getStats, // Expose the stats getter
  };
}