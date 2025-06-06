// src/services/BaseService.ts
import { supabase } from '@/lib/supabase';
import { CacheService } from './CacheService';
import { OfflineQueue, QueuedOperation, OperationData } from '@/utils/offlineQueue';

export abstract class BaseService {
  protected cacheService: CacheService;
  protected offlineQueue: OfflineQueue;

  constructor(cacheService: CacheService, offlineQueue: OfflineQueue) {
    this.cacheService = cacheService;
    this.offlineQueue = offlineQueue;
  }

  protected async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user;
  }

  protected isOnline(): boolean {
    return navigator.onLine;
  }

  protected getCacheKey(type: string, userId?: string, ...params: string[]): string {
    const userPart = userId ? `user:${userId}` : 'global';
    return `${type}:${userPart}:${params.join(':')}`;
  }

  protected invalidateUserCache(userId: string, type: string): void {
    this.cacheService.invalidatePattern(`${type}:user:${userId}`);
  }

  // Helper to convert data to OperationData
  protected toOperationData(data: any): OperationData {
    return { ...data } as OperationData;
  }

  // Abstract method that each service must implement
  abstract processOfflineOperation(operation: QueuedOperation): Promise<void>;
}