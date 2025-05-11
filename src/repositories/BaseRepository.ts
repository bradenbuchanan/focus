// src/repositories/BaseRepository.ts
import { supabase } from '@/lib/supabase';

export abstract class BaseRepository<T, LocalT> {
  constructor(
    protected tableName: string,
    protected localStorageKey: string,
    protected modelToDb: (item: T, userId: string) => any,
    protected dbToModel: (item: any) => T,
    protected localToModel: (item: LocalT) => T,
    protected modelToLocal: (item: T) => LocalT
  ) {}
  
  protected async getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    return data.user;
  }
  
  protected getLocalItems(): LocalT[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(this.localStorageKey);
    return data ? JSON.parse(data) : [];
  }
  
  protected saveLocalItem(item: LocalT): void {
    if (typeof window === 'undefined') return;
    const items = this.getLocalItems();
    items.push(item);
    localStorage.setItem(this.localStorageKey, JSON.stringify(items));
  }
  
  // Common CRUD methods can go here...
}