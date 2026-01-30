
import { createClient } from '@supabase/supabase-js';
import { ChatSession } from '../types';

const SUPABASE_URL = 'https://xyagwwfdmssuzenugscn.supabase.co';
const SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5YWd3d2ZkbXNzdXplbnVnc2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTY0MDQsImV4cCI6MjA4NDczMjQwNH0.ttqdjJxb7Ki4nsJwKrDR6po2NjycNb6rJ6ipZ0NToI0';

export class DatabaseService {
  private supabase = (SUPABASE_ANON_KEY === 'PASTE_YOUR_KEY_HERE' || !SUPABASE_ANON_KEY) 
    ? null 
    : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  isConfigured() {
    return this.supabase !== null && SUPABASE_ANON_KEY !== 'PASTE_YOUR_KEY_HERE';
  }

  async saveSession(session: ChatSession, userName: string) {
    if (!this.supabase || (session as any).isPrivate) return;
    
    try {
      const { error } = await this.supabase
        .from('aura_sessions')
        .upsert({
          id: session.id,
          user_name: userName,
          title: session.title,
          messages: session.messages,
          updated_at: new Date().toISOString(),
          app_mode: session.appMode
        });
      
      if (error) console.error("Sync Error:", error.message);
    } catch (e) {
      console.warn("Aura Cloud Sync Issue.");
    }
  }

  async getAllSessions() {
    if (!this.supabase) return [];
    
    try {
      const { data, error } = await this.supabase
        .from('aura_sessions')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (e) {
      return [];
    }
  }

  async deleteSession(id: string) {
    if (!this.supabase) return;
    const { error } = await this.supabase.from('aura_sessions').delete().eq('id', id);
    if (error) console.error("Delete Error:", error.message);
  }

  async purgeAllSessions() {
    if (!this.supabase) return;
    // Note: This requires a policy that allows deleting all or a specific RPC
    // For simple implementation, we can delete all rows if the table allows it
    const { error } = await this.supabase.from('aura_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) console.error("Purge Error:", error.message);
  }
}

export const dbService = new DatabaseService();
