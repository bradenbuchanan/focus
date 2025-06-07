// src/services/GoalService.ts
import { BaseService } from './BaseService';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { QueuedOperation } from '@/utils/offlineQueue';
import { emitDataUpdate } from '@/utils/events';

type Goal = Database['public']['Tables']['goals']['Row'];
type GoalUpdate = Database['public']['Tables']['goals']['Update'];

export interface GoalInput {
  title: string;
  description?: string;
  type: 'time' | 'sessions';
  target: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  activity?: string;
  startDate: string;
  endDate?: string;
  [key: string]: unknown; // Add index signature for OperationData compatibility
}

export class GoalService extends BaseService {
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes for goals

  async saveGoal(goal: GoalInput): Promise<string> {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: goal.title,
          description: goal.description || null,
          type: goal.type,
          target: goal.target,
          period: goal.period,
          activity: goal.activity || null,
          start_date: goal.startDate,
          end_date: goal.endDate || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Invalidate cache
      this.invalidateUserCache(user.id, 'goals');
      emitDataUpdate();

      return data.id;
    } catch (error) {
      if (!this.isOnline()) {
        return this.offlineQueue.add('goals', 'create', this.toOperationData(goal));
      }
      throw error;
    }
  }

  async getGoals(): Promise<Goal[]> {
    try {
      const user = await this.getCurrentUser();
      const cacheKey = this.getCacheKey('goals', user.id);
      
      // Check cache first
      const cached = this.cacheService.get<Goal[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const goals = data || [];
      
      // Cache the result
      this.cacheService.set(cacheKey, goals, this.CACHE_TTL);
      
      return goals;
    } catch (error) {
      if (!this.isOnline()) {
        return [];
      }
      throw error;
    }
  }

  async deleteGoal(goalId: string): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Invalidate cache
      this.invalidateUserCache(user.id, 'goals');
      emitDataUpdate();
    } catch (error) {
      if (!this.isOnline()) {
        this.offlineQueue.add('goals', 'delete', this.toOperationData({ id: goalId }));
        return;
      }
      throw error;
    }
  }

  async updateGoal(goalId: string, updates: Partial<GoalInput>): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      
      const updateData: Partial<GoalUpdate> = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.target !== undefined) updateData.target = updates.target;
      if (updates.period !== undefined) updateData.period = updates.period;
      if (updates.activity !== undefined) updateData.activity = updates.activity;
      if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
      if (updates.endDate !== undefined) updateData.end_date = updates.endDate;

      const { error } = await supabase
        .from('goals')
        .update(updateData)
        .eq('id', goalId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Invalidate cache
      this.invalidateUserCache(user.id, 'goals');
      emitDataUpdate();
    } catch (error) {
      if (!this.isOnline()) {
        this.offlineQueue.add('goals', 'update', this.toOperationData({ id: goalId, ...updates }));
        return;
      }
      throw error;
    }
  }

  async processOfflineOperation(operation: QueuedOperation): Promise<void> {
    if (operation.table !== 'goals') return;

    switch (operation.operation) {
      case 'create':
        await this.saveGoal(operation.data as GoalInput);
        break;
      case 'update':
        const { id, ...updates } = operation.data;
        await this.updateGoal(id as string, updates as Partial<GoalInput>);
        break;
      case 'delete':
        await this.deleteGoal(operation.data.id as string);
        break;
    }
  }
}