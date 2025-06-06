// src/services/SessionService.ts
import { BaseService } from './BaseService';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { QueuedOperation } from '@/utils/offlineQueue';
import { emitDataUpdate, emitSessionCompleted } from '@/utils/events';

type FocusSession = Database['public']['Tables']['focus_sessions']['Row'];

export interface SessionInput {
  startTime: Date;
  endTime?: Date;
  duration: number;
  type: 'focus' | 'break';
  completed: boolean;
  activity?: string;
  [key: string]: unknown; // Add index signature for OperationData compatibility
}

export class SessionService extends BaseService {
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes for sessions

  async saveSession(session: SessionInput): Promise<string> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          start_time: session.startTime.toISOString(),
          end_time: session.endTime?.toISOString() || null,
          duration: session.duration,
          category: session.type,
          activity: session.activity || null,
          completed: session.completed,
        })
        .select()
        .single();

      if (error) throw error;

      // Invalidate cache and emit events
      this.invalidateUserCache(user.id, 'sessions');
      emitDataUpdate();
      emitSessionCompleted({
        type: session.type,
        activity: session.activity || 'Other',
        duration: session.duration
      });

      return data.id;
    } catch (error) {
      if (!this.isOnline()) {
        // Store in offline queue
        const offlineData = this.toOperationData({
          ...session,
          startTime: session.startTime.toISOString(),
          endTime: session.endTime?.toISOString(),
        });
        return this.offlineQueue.add('focus_sessions', 'create', offlineData);
      }
      throw error;
    }
  }

  async getSessions(limit: number = 100): Promise<FocusSession[]> {
    try {
      const user = await this.getCurrentUser();
      const cacheKey = this.getCacheKey('sessions', user.id, `limit:${limit}`);
      
      // Check cache first
      const cached = this.cacheService.get<FocusSession[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const sessions = data || [];
      
      // Cache the result
      this.cacheService.set(cacheKey, sessions, this.CACHE_TTL);
      
      return sessions;
    } catch (error) {
      if (!this.isOnline()) {
        return [];
      }
      throw error;
    }
  }

  async getSessionsInDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = 100
  ): Promise<FocusSession[]> {
    try {
      const user = await this.getCurrentUser();
      const cacheKey = this.getCacheKey(
        'sessions', 
        user.id, 
        'dateRange',
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        `limit:${limit}`
      );

      // Check cache first
      const cached = this.cacheService.get<FocusSession[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const sessions = data || [];
      
      // Cache the result with shorter TTL for date ranges
      this.cacheService.set(cacheKey, sessions, this.CACHE_TTL / 2);
      
      return sessions;
    } catch (error) {
      if (!this.isOnline()) {
        return [];
      }
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      
      const { error } = await supabase
        .from('focus_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Invalidate cache
      this.invalidateUserCache(user.id, 'sessions');
      emitDataUpdate();
    } catch (error) {
      if (!this.isOnline()) {
        this.offlineQueue.add('focus_sessions', 'delete', this.toOperationData({ id: sessionId }));
        return;
      }
      throw error;
    }
  }

  async processOfflineOperation(operation: QueuedOperation): Promise<void> {
    if (operation.table !== 'focus_sessions') return;

    switch (operation.operation) {
      case 'create':
        const sessionData: SessionInput = {
          ...operation.data,
          startTime: new Date(operation.data.startTime as string),
          endTime: operation.data.endTime ? new Date(operation.data.endTime as string) : undefined,
        } as SessionInput;
        await this.saveSession(sessionData);
        break;
      case 'delete':
        await this.deleteSession(operation.data.id as string);
        break;
    }
  }
}