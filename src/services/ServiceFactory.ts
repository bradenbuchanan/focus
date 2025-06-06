// src/services/ServiceFactory.ts
import { CacheService } from './CacheService';
import { SessionService } from './SessionService';
import { GoalService } from './GoalService';
import { TaskService } from './TaskService';
import { AccomplishmentService } from './AccomplishmentService';
import { OfflineQueue } from '@/utils/offlineQueue';

export class ServiceFactory {
  private static instance: ServiceFactory;
  private cacheService: CacheService;
  private offlineQueue: OfflineQueue;
  
  // Service instances
  private sessionService?: SessionService;
  private goalService?: GoalService;
  private taskService?: TaskService;
  private accomplishmentService?: AccomplishmentService;

  private constructor() {
    this.cacheService = new CacheService();
    this.offlineQueue = new OfflineQueue();
  }

  static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  getSessionService(): SessionService {
    if (!this.sessionService) {
      this.sessionService = new SessionService(this.cacheService, this.offlineQueue);
    }
    return this.sessionService;
  }

  getGoalService(): GoalService {
    if (!this.goalService) {
      this.goalService = new GoalService(this.cacheService, this.offlineQueue);
    }
    return this.goalService;
  }

  getTaskService(): TaskService {
    if (!this.taskService) {
      this.taskService = new TaskService(this.cacheService, this.offlineQueue);
    }
    return this.taskService;
  }

  getAccomplishmentService(): AccomplishmentService {
    if (!this.accomplishmentService) {
      this.accomplishmentService = new AccomplishmentService(this.cacheService, this.offlineQueue);
    }
    return this.accomplishmentService;
  }

  // Process offline operations when back online
  async processOfflineQueue(): Promise<void> {
    if (!navigator.onLine) return;

    const queue = this.offlineQueue.getQueue();
    
    for (const operation of queue) {
      try {
        switch (operation.table) {
          case 'focus_sessions':
            await this.getSessionService().processOfflineOperation(operation);
            break;
          case 'goals':
            await this.getGoalService().processOfflineOperation(operation);
            break;
          case 'tasks':
            await this.getTaskService().processOfflineOperation(operation);
            break;
          case 'accomplishments':
            await this.getAccomplishmentService().processOfflineOperation(operation);
            break;
        }
        
        this.offlineQueue.removeFromQueue(operation.id);
      } catch (error) {
        console.error('Error processing offline operation:', error);
      }
    }
  }

  // Clear all caches
  clearAllCaches(): void {
    this.cacheService.clearAll();
  }

  // Get cache statistics
  getCacheStats() {
    return this.cacheService.getStats();
  }
}