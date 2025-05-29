export type OperationData = any; // Simplified for now

export interface QueuedOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  table: string;
  data: OperationData;
  timestamp: number;
}

export class OfflineQueue {
  private readonly QUEUE_KEY = 'offline_operations_queue';
  
  getQueue(): QueuedOperation[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(this.QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  }
  
  add(table: string, operation: 'create' | 'update' | 'delete', data: OperationData): string {
    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    const newOp: QueuedOperation = {
      id,
      table,
      operation,
      data,
      timestamp: Date.now()
    };
    
    const queue = this.getQueue();
    queue.push(newOp);
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    
    return id;
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