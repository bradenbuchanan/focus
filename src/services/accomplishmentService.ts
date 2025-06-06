// src/services/AccomplishmentService.ts
import { BaseService } from './BaseService';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { QueuedOperation } from '@/utils/offlineQueue';
import { emitDataUpdate } from '@/utils/events';

type Accomplishment = Database['public']['Tables']['accomplishments']['Row'];

export interface AccomplishmentInput {
  sessionId: string;
  text: string;
  categories?: string;
  [key: string]: unknown; // Add index signature for OperationData compatibility
}

export class AccomplishmentService extends BaseService {
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes for accomplishments

  async saveAccomplishment(data: AccomplishmentInput): Promise<string> {
    try {
      const user = await this.getCurrentUser();
      
      const { data: result, error } = await supabase
        .from('accomplishments')
        .insert({
          user_id: user.id,
          session_id: data.sessionId,
          text: data.text,
          categories: data.categories || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Invalidate cache
      this.invalidateUserCache(user.id, 'accomplishments');
      emitDataUpdate();

      return result.id;
    } catch (error) {
      if (!this.isOnline()) {
        return this.offlineQueue.add('accomplishments', 'create', this.toOperationData(data));
      }
      throw error;
    }
  }

  async getAccomplishments(): Promise<Accomplishment[]> {
    try {
      const user = await this.getCurrentUser();
      const cacheKey = this.getCacheKey('accomplishments', user.id);
      
      // Check cache first
      const cached = this.cacheService.get<Accomplishment[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('accomplishments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const accomplishments = data || [];
      
      // Cache the result
      this.cacheService.set(cacheKey, accomplishments, this.CACHE_TTL);
      
      return accomplishments;
    } catch (error) {
      if (!this.isOnline()) {
        return [];
      }
      throw error;
    }
  }

  async processOfflineOperation(operation: QueuedOperation): Promise<void> {
    if (operation.table !== 'accomplishments') return;

    switch (operation.operation) {
      case 'create':
        await this.saveAccomplishment(operation.data as AccomplishmentInput);
        break;
      // Accomplishments typically don't have update/delete operations
      // but you can add them if needed
    }
  }
}