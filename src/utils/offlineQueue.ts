// src/utils/offlineQueue.ts
export interface QueuedOperation {
    id: string;
    operation: 'create' | 'update' | 'delete';
    table: string;
    data: any;
    timestamp: number;
  }
  
  export class OfflineQueue {
    private readonly QUEUE_KEY = 'offline_operations_queue';
    
    getQueue(): QueuedOperation[] {
      if (typeof window === 'undefined') return [];
      const data = localStorage.getItem(this.QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    }
    
    addToQueue(operation: Omit<QueuedOperation, 'id' | 'timestamp'>): void {
      const queue = this.getQueue();
      const newOp: QueuedOperation = {
        ...operation,
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        timestamp: Date.now()
      };
      
      queue.push(newOp);
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    }
    
    removeFromQueue(id: string): void {
      const queue = this.getQueue();
      const newQueue = queue.filter(op => op.id !== id);
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(newQueue));
    }
    
    clearQueue(): void {
      localStorage.removeItem(this.QUEUE_KEY);
    }
  }