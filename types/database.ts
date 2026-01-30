export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      divvies: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      divvy_members: {
        Row: {
          id: string
          divvy_id: string
          member_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          divvy_id: string
          member_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          id?: string
          divvy_id?: string
          member_id?: string
          role?: string
          joined_at?: string
        }
      }
      userprofiles: {
        Row: {
          id: string
          email: string
          fullname: string
          displayname: string
          createdat: string
          updatedat: string
        }
        Insert: {
          id: string
          email: string
          fullname: string
          displayname?: string
          createdat?: string
          updatedat?: string
        }
        Update: {
          id?: string
          email?: string
          fullname?: string
          displayname?: string
          createdat?: string
          updatedat?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}