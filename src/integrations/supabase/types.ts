export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      anamneses: {
        Row: {
          activity_history: string | null
          allergies: string | null
          completed_at: string | null
          created_at: string
          doctor_clearance: boolean | null
          drinks: boolean | null
          emergency_contact: string | null
          goal: string | null
          has_health_issues: boolean | null
          health_issues: string | null
          injuries: string | null
          medications: string | null
          notes: string | null
          personal_id: string | null
          sleep_hours: number | null
          smokes: boolean | null
          stress_level: number | null
          surgeries: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_history?: string | null
          allergies?: string | null
          completed_at?: string | null
          created_at?: string
          doctor_clearance?: boolean | null
          drinks?: boolean | null
          emergency_contact?: string | null
          goal?: string | null
          has_health_issues?: boolean | null
          health_issues?: string | null
          injuries?: string | null
          medications?: string | null
          notes?: string | null
          personal_id?: string | null
          sleep_hours?: number | null
          smokes?: boolean | null
          stress_level?: number | null
          surgeries?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_history?: string | null
          allergies?: string | null
          completed_at?: string | null
          created_at?: string
          doctor_clearance?: boolean | null
          drinks?: boolean | null
          emergency_contact?: string | null
          goal?: string | null
          has_health_issues?: boolean | null
          health_issues?: string | null
          injuries?: string | null
          medications?: string | null
          notes?: string | null
          personal_id?: string | null
          sleep_hours?: number | null
          smokes?: boolean | null
          stress_level?: number | null
          surgeries?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string
          duration_min: number
          id: string
          location: string | null
          notes: string | null
          personal_id: string
          starts_at: string
          status: string
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_min?: number
          id?: string
          location?: string | null
          notes?: string | null
          personal_id: string
          starts_at: string
          status?: string
          student_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_min?: number
          id?: string
          location?: string | null
          notes?: string | null
          personal_id?: string
          starts_at?: string
          status?: string
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      assessments: {
        Row: {
          abdomen_cm: number | null
          arm_l_cm: number | null
          arm_r_cm: number | null
          bmi: number | null
          calf_cm: number | null
          chest_cm: number | null
          created_at: string
          date: string
          height_cm: number | null
          hip_cm: number | null
          id: string
          notes: string | null
          personal_id: string | null
          student_id: string
          thigh_l_cm: number | null
          thigh_r_cm: number | null
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          abdomen_cm?: number | null
          arm_l_cm?: number | null
          arm_r_cm?: number | null
          bmi?: number | null
          calf_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          date?: string
          height_cm?: number | null
          hip_cm?: number | null
          id?: string
          notes?: string | null
          personal_id?: string | null
          student_id: string
          thigh_l_cm?: number | null
          thigh_r_cm?: number | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          abdomen_cm?: number | null
          arm_l_cm?: number | null
          arm_r_cm?: number | null
          bmi?: number | null
          calf_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          date?: string
          height_cm?: number | null
          hip_cm?: number | null
          id?: string
          notes?: string | null
          personal_id?: string | null
          student_id?: string
          thigh_l_cm?: number | null
          thigh_r_cm?: number | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      diet_meal_items: {
        Row: {
          amount: string | null
          custom_food: string | null
          food_id: string | null
          id: string
          meal_id: string
          measure: string | null
          sort_order: number
          substitutions: string | null
        }
        Insert: {
          amount?: string | null
          custom_food?: string | null
          food_id?: string | null
          id?: string
          meal_id: string
          measure?: string | null
          sort_order?: number
          substitutions?: string | null
        }
        Update: {
          amount?: string | null
          custom_food?: string | null
          food_id?: string | null
          id?: string
          meal_id?: string
          measure?: string | null
          sort_order?: number
          substitutions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diet_meal_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_meal_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "diet_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_meals: {
        Row: {
          diet_id: string
          id: string
          image_url: string | null
          kind: Database["public"]["Enums"]["meal_kind"]
          observation: string | null
          sort_order: number
          time_range: string | null
          title: string
        }
        Insert: {
          diet_id: string
          id?: string
          image_url?: string | null
          kind: Database["public"]["Enums"]["meal_kind"]
          observation?: string | null
          sort_order?: number
          time_range?: string | null
          title: string
        }
        Update: {
          diet_id?: string
          id?: string
          image_url?: string | null
          kind?: Database["public"]["Enums"]["meal_kind"]
          observation?: string | null
          sort_order?: number
          time_range?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_meals_diet_id_fkey"
            columns: ["diet_id"]
            isOneToOne: false
            referencedRelation: "diets"
            referencedColumns: ["id"]
          },
        ]
      }
      diets: {
        Row: {
          created_at: string
          golden_tip: string | null
          id: string
          name: string
          notes: string | null
          objective: Database["public"]["Enums"]["diet_objective"]
          personal_id: string
          status: Database["public"]["Enums"]["publish_status"]
          student_id: string
          updated_at: string
          water_liters: number | null
        }
        Insert: {
          created_at?: string
          golden_tip?: string | null
          id?: string
          name: string
          notes?: string | null
          objective?: Database["public"]["Enums"]["diet_objective"]
          personal_id: string
          status?: Database["public"]["Enums"]["publish_status"]
          student_id: string
          updated_at?: string
          water_liters?: number | null
        }
        Update: {
          created_at?: string
          golden_tip?: string | null
          id?: string
          name?: string
          notes?: string | null
          objective?: Database["public"]["Enums"]["diet_objective"]
          personal_id?: string
          status?: Database["public"]["Enums"]["publish_status"]
          student_id?: string
          updated_at?: string
          water_liters?: number | null
        }
        Relationships: []
      }
      exercise_categories: {
        Row: {
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      exercise_subcategories: {
        Row: {
          category_id: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          category_id: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          category_id?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "exercise_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category_id: string | null
          common_mistakes: string[] | null
          created_at: string
          default_reps: string | null
          default_rest: string | null
          default_sets: string | null
          execution_steps: string[] | null
          id: string
          image_end: string | null
          image_start: string | null
          level: Database["public"]["Enums"]["workout_level"]
          name: string
          status: Database["public"]["Enums"]["publish_status"]
          subcategory_id: string | null
          target_muscle: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          common_mistakes?: string[] | null
          created_at?: string
          default_reps?: string | null
          default_rest?: string | null
          default_sets?: string | null
          execution_steps?: string[] | null
          id?: string
          image_end?: string | null
          image_start?: string | null
          level?: Database["public"]["Enums"]["workout_level"]
          name: string
          status?: Database["public"]["Enums"]["publish_status"]
          subcategory_id?: string | null
          target_muscle?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          common_mistakes?: string[] | null
          created_at?: string
          default_reps?: string | null
          default_rest?: string | null
          default_sets?: string | null
          execution_steps?: string[] | null
          id?: string
          image_end?: string | null
          image_start?: string | null
          level?: Database["public"]["Enums"]["workout_level"]
          name?: string
          status?: Database["public"]["Enums"]["publish_status"]
          subcategory_id?: string | null
          target_muscle?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "exercise_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "exercise_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          audience: Database["public"]["Enums"]["audience_kind"]
          created_at: string
          file_url: string
          id: string
          mime: string | null
          name: string
          personal_id: string | null
          target_user_id: string | null
          uploaded_by: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["audience_kind"]
          created_at?: string
          file_url: string
          id?: string
          mime?: string | null
          name: string
          personal_id?: string | null
          target_user_id?: string | null
          uploaded_by: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["audience_kind"]
          created_at?: string
          file_url?: string
          id?: string
          mime?: string | null
          name?: string
          personal_id?: string | null
          target_user_id?: string | null
          uploaded_by?: string
        }
        Relationships: []
      }
      foods: {
        Row: {
          carb_g: number | null
          category: string
          created_at: string
          default_measure: string | null
          fat_g: number | null
          id: string
          kcal_per_100g: number | null
          name: string
          protein_g: number | null
        }
        Insert: {
          carb_g?: number | null
          category: string
          created_at?: string
          default_measure?: string | null
          fat_g?: number | null
          id?: string
          kcal_per_100g?: number | null
          name: string
          protein_g?: number | null
        }
        Update: {
          carb_g?: number | null
          category?: string
          created_at?: string
          default_measure?: string | null
          fat_g?: number | null
          id?: string
          kcal_per_100g?: number | null
          name?: string
          protein_g?: number | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_cents: number
          created_at: string
          due_date: string
          id: string
          mp_payment_id: string | null
          paid_at: string | null
          personal_id: string | null
          plan_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          due_date: string
          id?: string
          mp_payment_id?: string | null
          paid_at?: string | null
          personal_id?: string | null
          plan_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          due_date?: string
          id?: string
          mp_payment_id?: string | null
          paid_at?: string | null
          personal_id?: string | null
          plan_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notices: {
        Row: {
          audience: Database["public"]["Enums"]["audience_kind"]
          created_at: string
          created_by: string
          id: string
          message: string
          personal_id: string | null
          status: Database["public"]["Enums"]["publish_status"]
          target_user_id: string | null
          title: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["audience_kind"]
          created_at?: string
          created_by: string
          id?: string
          message: string
          personal_id?: string | null
          status?: Database["public"]["Enums"]["publish_status"]
          target_user_id?: string | null
          title: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["audience_kind"]
          created_at?: string
          created_by?: string
          id?: string
          message?: string
          personal_id?: string | null
          status?: Database["public"]["Enums"]["publish_status"]
          target_user_id?: string | null
          title?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          benefits: string[] | null
          can_generate_diet: boolean
          can_generate_workout: boolean
          created_at: string
          description: string | null
          id: string
          max_offers: number | null
          max_students: number | null
          name: string
          period: string
          price_cents: number
          role_target: string
          slug: string | null
          status: Database["public"]["Enums"]["publish_status"]
          trial_days: number
        }
        Insert: {
          benefits?: string[] | null
          can_generate_diet?: boolean
          can_generate_workout?: boolean
          created_at?: string
          description?: string | null
          id?: string
          max_offers?: number | null
          max_students?: number | null
          name: string
          period?: string
          price_cents?: number
          role_target?: string
          slug?: string | null
          status?: Database["public"]["Enums"]["publish_status"]
          trial_days?: number
        }
        Update: {
          benefits?: string[] | null
          can_generate_diet?: boolean
          can_generate_workout?: boolean
          created_at?: string
          description?: string | null
          id?: string
          max_offers?: number | null
          max_students?: number | null
          name?: string
          period?: string
          price_cents?: number
          role_target?: string
          slug?: string | null
          status?: Database["public"]["Enums"]["publish_status"]
          trial_days?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          benefits: string[] | null
          category: string | null
          content: string | null
          cover_url: string | null
          created_at: string
          delivery_days: number | null
          description: string | null
          file_url: string | null
          for_whom: string | null
          id: string
          included: string | null
          long_desc: string | null
          modules: Json | null
          offer_type: string
          preview: string | null
          price_cents: number
          seller_id: string | null
          short_desc: string | null
          status: Database["public"]["Enums"]["publish_status"]
          title: string
          updated_at: string
          wa_clicks: number
          whatsapp: string | null
        }
        Insert: {
          benefits?: string[] | null
          category?: string | null
          content?: string | null
          cover_url?: string | null
          created_at?: string
          delivery_days?: number | null
          description?: string | null
          file_url?: string | null
          for_whom?: string | null
          id?: string
          included?: string | null
          long_desc?: string | null
          modules?: Json | null
          offer_type?: string
          preview?: string | null
          price_cents?: number
          seller_id?: string | null
          short_desc?: string | null
          status?: Database["public"]["Enums"]["publish_status"]
          title: string
          updated_at?: string
          wa_clicks?: number
          whatsapp?: string | null
        }
        Update: {
          benefits?: string[] | null
          category?: string | null
          content?: string | null
          cover_url?: string | null
          created_at?: string
          delivery_days?: number | null
          description?: string | null
          file_url?: string | null
          for_whom?: string | null
          id?: string
          included?: string | null
          long_desc?: string | null
          modules?: Json | null
          offer_type?: string
          preview?: string | null
          price_cents?: number
          seller_id?: string | null
          short_desc?: string | null
          status?: Database["public"]["Enums"]["publish_status"]
          title?: string
          updated_at?: string
          wa_clicks?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          cref: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          cref?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          cref?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: []
      }
      progress_entries: {
        Row: {
          attended: boolean | null
          created_at: string
          date: string
          id: string
          note: string | null
          student_id: string
          weight_kg: number | null
        }
        Insert: {
          attended?: boolean | null
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          student_id: string
          weight_kg?: number | null
        }
        Update: {
          attended?: boolean | null
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          student_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          active: boolean
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          logo_url: string | null
          slug: string | null
          specialty: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          active?: boolean
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          logo_url?: string | null
          slug?: string | null
          specialty?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          active?: boolean
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          logo_url?: string | null
          slug?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          birth_date: string | null
          created_at: string
          height_cm: number | null
          notes: string | null
          objective: Database["public"]["Enums"]["workout_objective"] | null
          personal_id: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          height_cm?: number | null
          notes?: string | null
          objective?: Database["public"]["Enums"]["workout_objective"] | null
          personal_id?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          height_cm?: number | null
          notes?: string | null
          objective?: Database["public"]["Enums"]["workout_objective"] | null
          personal_id?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          mp_payment_id: string | null
          plan_id: string
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          mp_payment_id?: string | null
          plan_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          mp_payment_id?: string | null
          plan_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          id: string
          message: string
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workout_days: {
        Row: {
          id: string
          label: string
          sort_order: number
          workout_id: string
        }
        Insert: {
          id?: string
          label: string
          sort_order?: number
          workout_id: string
        }
        Update: {
          id?: string
          label?: string
          sort_order?: number
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_days_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          custom_name: string | null
          day_id: string
          exercise_id: string | null
          id: string
          load: string | null
          notes: string | null
          reps: string
          rest: string
          sets: string
          sort_order: number
          technique: Database["public"]["Enums"]["exercise_technique"]
        }
        Insert: {
          custom_name?: string | null
          day_id: string
          exercise_id?: string | null
          id?: string
          load?: string | null
          notes?: string | null
          reps?: string
          rest?: string
          sets?: string
          sort_order?: number
          technique?: Database["public"]["Enums"]["exercise_technique"]
        }
        Update: {
          custom_name?: string | null
          day_id?: string
          exercise_id?: string | null
          id?: string
          load?: string | null
          notes?: string | null
          reps?: string
          rest?: string
          sets?: string
          sort_order?: number
          technique?: Database["public"]["Enums"]["exercise_technique"]
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "workout_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          created_at: string
          duration_min: number | null
          feedback: string | null
          id: string
          notes: string | null
          rating: number | null
          rpe: number | null
          session_date: string
          student_id: string
          updated_at: string
          workout_id: string | null
        }
        Insert: {
          created_at?: string
          duration_min?: number | null
          feedback?: string | null
          id?: string
          notes?: string | null
          rating?: number | null
          rpe?: number | null
          session_date?: string
          student_id: string
          updated_at?: string
          workout_id?: string | null
        }
        Update: {
          created_at?: string
          duration_min?: number | null
          feedback?: string | null
          id?: string
          notes?: string | null
          rating?: number | null
          rpe?: number | null
          session_date?: string
          student_id?: string
          updated_at?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          aerobic: string | null
          created_at: string
          frequency_per_week: number
          id: string
          level: Database["public"]["Enums"]["workout_level"]
          name: string
          notes: string | null
          objective: Database["public"]["Enums"]["workout_objective"]
          personal_id: string
          split: Database["public"]["Enums"]["workout_split"]
          status: Database["public"]["Enums"]["publish_status"]
          stretching: string | null
          student_id: string
          updated_at: string
          warmup: string | null
        }
        Insert: {
          aerobic?: string | null
          created_at?: string
          frequency_per_week?: number
          id?: string
          level?: Database["public"]["Enums"]["workout_level"]
          name: string
          notes?: string | null
          objective?: Database["public"]["Enums"]["workout_objective"]
          personal_id: string
          split?: Database["public"]["Enums"]["workout_split"]
          status?: Database["public"]["Enums"]["publish_status"]
          stretching?: string | null
          student_id: string
          updated_at?: string
          warmup?: string | null
        }
        Update: {
          aerobic?: string | null
          created_at?: string
          frequency_per_week?: number
          id?: string
          level?: Database["public"]["Enums"]["workout_level"]
          name?: string
          notes?: string | null
          objective?: Database["public"]["Enums"]["workout_objective"]
          personal_id?: string
          split?: Database["public"]["Enums"]["workout_split"]
          status?: Database["public"]["Enums"]["publish_status"]
          stretching?: string | null
          student_id?: string
          updated_at?: string
          warmup?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bump_wa_click: { Args: { _product: string }; Returns: undefined }
      can_add_student: { Args: { _personal_id: string }; Returns: boolean }
      can_publish_offer: { Args: { _seller: string }; Returns: boolean }
      can_view_profile: { Args: { _profile_id: string }; Returns: boolean }
      claim_ownership: { Args: never; Returns: boolean }
      current_plan: {
        Args: { _uid: string }
        Returns: {
          benefits: string[] | null
          can_generate_diet: boolean
          can_generate_workout: boolean
          created_at: string
          description: string | null
          id: string
          max_offers: number | null
          max_students: number | null
          name: string
          period: string
          price_cents: number
          role_target: string
          slug: string | null
          status: Database["public"]["Enums"]["publish_status"]
          trial_days: number
        }
        SetofOptions: {
          from: "*"
          to: "plans"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_role_label: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_my_student: {
        Args: { _personal_id?: string; _student_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "dono" | "personal" | "aluno"
      audience_kind: "todos" | "professores" | "alunos" | "aluno_especifico"
      diet_objective:
        | "emagrecimento"
        | "ganho_massa"
        | "manutencao"
        | "reeducacao"
        | "saude"
      exercise_technique:
        | "normal"
        | "superserie"
        | "dropset"
        | "piramide_crescente"
        | "piramide_decrescente"
      invoice_status: "pendente" | "pago" | "atrasado" | "cancelado"
      meal_kind:
        | "cafe_manha"
        | "lanche_manha"
        | "almoco"
        | "lanche_tarde"
        | "jantar"
        | "ceia"
      publish_status: "ativo" | "inativo" | "rascunho"
      subscription_status: "trial" | "ativo" | "vencido" | "cancelado"
      user_status: "ativo" | "bloqueado" | "inativo"
      workout_level: "iniciante" | "intermediario" | "avancado"
      workout_objective:
        | "hipertrofia"
        | "emagrecimento"
        | "forca"
        | "condicionamento"
        | "saude"
        | "manutencao"
      workout_split: "fullbody" | "ab" | "abc" | "abcd" | "abcde"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["dono", "personal", "aluno"],
      audience_kind: ["todos", "professores", "alunos", "aluno_especifico"],
      diet_objective: [
        "emagrecimento",
        "ganho_massa",
        "manutencao",
        "reeducacao",
        "saude",
      ],
      exercise_technique: [
        "normal",
        "superserie",
        "dropset",
        "piramide_crescente",
        "piramide_decrescente",
      ],
      invoice_status: ["pendente", "pago", "atrasado", "cancelado"],
      meal_kind: [
        "cafe_manha",
        "lanche_manha",
        "almoco",
        "lanche_tarde",
        "jantar",
        "ceia",
      ],
      publish_status: ["ativo", "inativo", "rascunho"],
      subscription_status: ["trial", "ativo", "vencido", "cancelado"],
      user_status: ["ativo", "bloqueado", "inativo"],
      workout_level: ["iniciante", "intermediario", "avancado"],
      workout_objective: [
        "hipertrofia",
        "emagrecimento",
        "forca",
        "condicionamento",
        "saude",
        "manutencao",
      ],
      workout_split: ["fullbody", "ab", "abc", "abcd", "abcde"],
    },
  },
} as const
