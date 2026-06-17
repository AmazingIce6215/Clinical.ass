export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string;
          pin_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name: string;
          pin_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          pin_hash?: string | null;
          updated_at?: string;
        };
      };
      cases: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          specialty: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          specialty: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          specialty?: string;
          content?: string;
          updated_at?: string;
        };
      };
      teaching_progress: {
        Row: {
          id: string;
          user_id: string;
          case_id: string;
          score: number;
          completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          case_id: string;
          score?: number;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          score?: number;
          completed?: boolean;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
