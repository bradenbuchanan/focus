// src/services/CacheService.ts
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // time to live in milliseconds
  }
  
  export class CacheService {
    private cache = new Map<string, CacheEntry<unknown>>();
    private readonly DEFAULT_TTL = 5 * 60 * 1000;
  
    set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      });
    }
  
    get<T>(key: string): T | null {
      const entry = this.cache.get(key) as CacheEntry<T> | undefined;
      
      if (!entry) {
        return null;
      }
  
      // Check if expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        return null;
      }
  
      return entry.data;
    }
  
    invalidate(key: string): void {
      this.cache.delete(key);
    }
  
    invalidatePattern(pattern: string): void {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    }
  
    clearAll(): void {
      this.cache.clear();
    }
  
    getStats() {
      return {
        size: this.cache.size,
        keys: Array.from(this.cache.keys())
      };
    }
  
    // Check if cache entry exists and is valid
    has(key: string): boolean {
      return this.get(key) !== null;
    }
  }