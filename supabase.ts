
// NOTE: To use real Supabase, uncomment the real client and add your URL/Key
// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = 'https://your-project.supabase.co';
// const supabaseKey = 'your-anon-key';
// export const supabase = createClient(supabaseUrl, supabaseKey);

// For the sake of this interactive demo, we will use a "MockSupabase" 
// that mimics the Realtime SDK behavior using browser events.

export class MockSupabase {
  static listeners: any[] = [];

  static subscribe(table: string, callback: (payload: any) => void) {
    const listener = (e: CustomEvent) => {
      if (e.detail.table === table) {
        callback(e.detail.payload);
      }
    };
    window.addEventListener('supabase_realtime' as any, listener as any);
    return () => window.removeEventListener('supabase_realtime' as any, listener as any);
  }

  static notify(table: string, payload: any) {
    const event = new CustomEvent('supabase_realtime', {
      detail: { table, payload }
    });
    window.dispatchEvent(event);
  }
}
