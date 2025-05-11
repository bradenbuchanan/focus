// src/models/dataModels.ts
export interface Session {
    id: string;
    startTime: Date;
    endTime?: Date | null;
    duration: number;
    type: 'focus' | 'break';
    completed: boolean;
    activity?: string;
  }
  
  export interface LocalSession {
    id: string;
    date: string;
    localDate?: string;
    duration: number;
    type: 'focus' | 'break';
    completed: boolean;
    activity?: string;
  }
  
  // Add other data model interfaces...
