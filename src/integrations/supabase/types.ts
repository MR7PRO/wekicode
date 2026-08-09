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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievement_definitions: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string | null
          id: string
          is_active: boolean
          points_reward: number
          rarity: string
          slug: string
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          icon?: string | null
          id?: string
          is_active?: boolean
          points_reward?: number
          rarity?: string
          slug: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          points_reward?: number
          rarity?: string
          slug?: string
          title?: string
        }
        Relationships: []
      }
      ai_chat_rate_limits: {
        Row: {
          created_at: string
          id: string
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          id?: string
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          input_hash: string | null
          target_id: string | null
          target_type: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          input_hash?: string | null
          target_id?: string | null
          target_type?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          input_hash?: string | null
          target_id?: string | null
          target_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      answers: {
        Row: {
          content: string
          created_at: string
          id: string
          is_accepted: boolean | null
          question_id: string
          updated_at: string
          user_id: string
          votes: number | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_accepted?: boolean | null
          question_id: string
          updated_at?: string
          user_id: string
          votes?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_accepted?: boolean | null
          question_id?: string
          updated_at?: string
          user_id?: string
          votes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      article_comments: {
        Row: {
          article_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          article_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          article_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_votes: {
        Row: {
          article_id: string
          created_at: string
          id: string
          user_id: string
          vote_type: number
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          user_id: string
          vote_type: number
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          user_id?: string
          vote_type?: number
        }
        Relationships: [
          {
            foreignKeyName: "article_votes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          views: number | null
          votes: number | null
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          views?: number | null
          votes?: number | null
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          views?: number | null
          votes?: number | null
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          answer_id: string | null
          content: string
          created_at: string
          id: string
          question_id: string | null
          user_id: string
        }
        Insert: {
          answer_id?: string | null
          content: string
          created_at?: string
          id?: string
          question_id?: string | null
          user_id: string
        }
        Update: {
          answer_id?: string | null
          content?: string
          created_at?: string
          id?: string
          question_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          participant_1: string
          participant_2: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          participant_1: string
          participant_2: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          participant_1?: string
          participant_2?: string
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          completed_lessons: number[] | null
          course_id: string
          created_at: string
          id: string
          progress: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_lessons?: number[] | null
          course_id: string
          created_at?: string
          id?: string
          progress?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_lessons?: number[] | null
          course_id?: string
          created_at?: string
          id?: string
          progress?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_quizzes: {
        Row: {
          course_id: string
          created_at: string
          id: string
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string
          created_at: string
          description: string
          duration: string | null
          id: string
          image_url: string | null
          instructor: string
          is_free: boolean | null
          lessons_count: number | null
          level: string
          price: number | null
          rating: number | null
          students_count: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          duration?: string | null
          id?: string
          image_url?: string | null
          instructor: string
          is_free?: boolean | null
          lessons_count?: number | null
          level?: string
          price?: number | null
          rating?: number | null
          students_count?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          duration?: string | null
          id?: string
          image_url?: string | null
          instructor?: string
          is_free?: boolean | null
          lessons_count?: number | null
          level?: string
          price?: number | null
          rating?: number | null
          students_count?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          checkin_date: string
          created_at: string
          id: string
          points_earned: number
          user_id: string
        }
        Insert: {
          checkin_date?: string
          created_at?: string
          id?: string
          points_earned?: number
          user_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string
          id?: string
          points_earned?: number
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          audience: string
          description: string | null
          enabled: boolean
          key: string
          updated_at: string
        }
        Insert: {
          audience?: string
          description?: string | null
          enabled?: boolean
          key: string
          updated_at?: string
        }
        Update: {
          audience?: string
          description?: string | null
          enabled?: boolean
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      forum_ai_summaries: {
        Row: {
          created_at: string
          generated_by: string | null
          id: string
          input_hash: string
          key_points: string[]
          model_name: string | null
          solution_summary: string | null
          summary: string
          topic_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          generated_by?: string | null
          id?: string
          input_hash: string
          key_points?: string[]
          model_name?: string | null
          solution_summary?: string | null
          summary: string
          topic_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          generated_by?: string | null
          id?: string
          input_hash?: string
          key_points?: string[]
          model_name?: string | null
          solution_summary?: string | null
          summary?: string
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_ai_summaries_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_bookmarks: {
        Row: {
          created_at: string
          id: string
          topic_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          topic_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_bookmarks_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      forum_follows: {
        Row: {
          created_at: string
          forum_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          forum_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          forum_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_follows_forum_id_fkey"
            columns: ["forum_id"]
            isOneToOne: false
            referencedRelation: "forums"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_solution: boolean
          parent_reply_id: string | null
          score: number
          topic_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_solution?: boolean
          parent_reply_id?: string | null
          score?: number
          topic_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_solution?: boolean
          parent_reply_id?: string | null
          score?: number
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reply_id: string | null
          reporter_id: string
          resolution: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          topic_id: string | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reply_id?: string | null
          reporter_id: string
          resolution?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          topic_id?: string | null
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reply_id?: string | null
          reporter_id?: string
          resolution?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_reports_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_reports_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_tags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          usage_count?: number
        }
        Relationships: []
      }
      forum_topic_tags: {
        Row: {
          tag_id: string
          topic_id: string
        }
        Insert: {
          tag_id: string
          topic_id: string
        }
        Update: {
          tag_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_topic_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "forum_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_topic_tags_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topics: {
        Row: {
          author_id: string
          content: string
          created_at: string
          excerpt: string | null
          forum_id: string
          id: string
          is_featured: boolean
          is_locked: boolean
          is_pinned: boolean
          last_activity_at: string
          replies_count: number
          score: number
          solved_reply_id: string | null
          status: string
          title: string
          type: string
          updated_at: string
          views_count: number
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          excerpt?: string | null
          forum_id: string
          id?: string
          is_featured?: boolean
          is_locked?: boolean
          is_pinned?: boolean
          last_activity_at?: string
          replies_count?: number
          score?: number
          solved_reply_id?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          forum_id?: string
          id?: string
          is_featured?: boolean
          is_locked?: boolean
          is_pinned?: boolean
          last_activity_at?: string
          replies_count?: number
          score?: number
          solved_reply_id?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "forum_topics_forum_id_fkey"
            columns: ["forum_id"]
            isOneToOne: false
            referencedRelation: "forums"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_votes: {
        Row: {
          created_at: string
          id: string
          reply_id: string | null
          topic_id: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          reply_id?: string | null
          topic_id?: string | null
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          reply_id?: string | null
          topic_id?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "forum_votes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_votes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forums: {
        Row: {
          category_id: string | null
          color: string | null
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          is_new: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          is_new?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          is_new?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forums_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_services: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          quantity: number
          service_id: string | null
          service_title: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          quantity?: number
          service_id?: string | null
          service_title: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          quantity?: number
          service_id?: string | null
          service_title?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_services_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "workspace_services"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          due_date: string
          id: string
          invoice_number: string
          issued_at: string
          paid_at: string | null
          payment_method: string | null
          status: string
          subscription_id: string | null
          total_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string
          id?: string
          invoice_number: string
          issued_at?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subscription_id?: string | null
          total_amount?: number
          user_id: string
        }
        Update: {
          created_at?: string
          due_date?: string
          id?: string
          invoice_number?: string
          issued_at?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subscription_id?: string | null
          total_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "workspace_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          cover_letter: string | null
          created_at: string
          id: string
          job_id: string
          status: string
          user_id: string
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id: string
          status?: string
          user_id: string
        }
        Update: {
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          applications_count: number | null
          budget_max: number | null
          budget_min: number | null
          company: string | null
          created_at: string
          description: string
          id: string
          job_type: string
          skills: string[] | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          applications_count?: number | null
          budget_max?: number | null
          budget_min?: number | null
          company?: string | null
          created_at?: string
          description: string
          id?: string
          job_type?: string
          skills?: string[] | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          applications_count?: number | null
          budget_max?: number | null
          budget_min?: number | null
          company?: string | null
          created_at?: string
          description?: string
          id?: string
          job_type?: string
          skills?: string[] | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_articles: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          excerpt: string | null
          id: string
          slug: string | null
          source_topic_id: string | null
          status: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          slug?: string | null
          source_topic_id?: string | null
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          slug?: string | null
          source_topic_id?: string | null
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_articles_source_topic_id_fkey"
            columns: ["source_topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          source: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          source?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          source?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          achievements_enabled: boolean
          followed_content_enabled: boolean
          in_app_enabled: boolean
          mentions_enabled: boolean
          push_enabled: boolean
          quiet_hours_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          replies_enabled: boolean
          solutions_enabled: boolean
          updated_at: string
          user_id: string
          weekly_digest_enabled: boolean
        }
        Insert: {
          achievements_enabled?: boolean
          followed_content_enabled?: boolean
          in_app_enabled?: boolean
          mentions_enabled?: boolean
          push_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          replies_enabled?: boolean
          solutions_enabled?: boolean
          updated_at?: string
          user_id: string
          weekly_digest_enabled?: boolean
        }
        Update: {
          achievements_enabled?: boolean
          followed_content_enabled?: boolean
          in_app_enabled?: boolean
          mentions_enabled?: boolean
          push_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          replies_enabled?: boolean
          solutions_enabled?: boolean
          updated_at?: string
          user_id?: string
          weekly_digest_enabled?: boolean
        }
        Relationships: []
      }
      offline_saved_items: {
        Row: {
          id: string
          item_id: string
          item_type: string
          last_synced_at: string | null
          saved_at: string
          title: string
          url: string
          user_id: string
        }
        Insert: {
          id?: string
          item_id: string
          item_type: string
          last_synced_at?: string | null
          saved_at?: string
          title: string
          url: string
          user_id: string
        }
        Update: {
          id?: string
          item_id?: string
          item_type?: string
          last_synced_at?: string | null
          saved_at?: string
          title?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          badges: string[] | null
          bio: string | null
          cover_url: string | null
          created_at: string
          current_streak: number | null
          experience_level: string | null
          full_name: string | null
          github_url: string | null
          id: string
          is_public: boolean | null
          last_checkin_date: string | null
          level: number | null
          linkedin_url: string | null
          location: string | null
          longest_streak: number | null
          onboarding_completed: boolean
          points: number | null
          portfolio_url: string | null
          preferred_tracks: string[]
          primary_goal: string | null
          skills: string[] | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          username: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          badges?: string[] | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          current_streak?: number | null
          experience_level?: string | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          is_public?: boolean | null
          last_checkin_date?: string | null
          level?: number | null
          linkedin_url?: string | null
          location?: string | null
          longest_streak?: number | null
          onboarding_completed?: boolean
          points?: number | null
          portfolio_url?: string | null
          preferred_tracks?: string[]
          primary_goal?: string | null
          skills?: string[] | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          badges?: string[] | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          current_streak?: number | null
          experience_level?: string | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          is_public?: boolean | null
          last_checkin_date?: string | null
          level?: number | null
          linkedin_url?: string | null
          location?: string | null
          longest_streak?: number | null
          onboarding_completed?: boolean
          points?: number | null
          portfolio_url?: string | null
          preferred_tracks?: string[]
          primary_goal?: string | null
          skills?: string[] | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          device_name: string | null
          endpoint: string
          id: string
          is_active: boolean
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          device_name?: string | null
          endpoint: string
          id?: string
          is_active?: boolean
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          device_name?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          accepted_answer_id: string | null
          answers_count: number | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_solved: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          views: number | null
          votes: number | null
        }
        Insert: {
          accepted_answer_id?: string | null
          answers_count?: number | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_solved?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          views?: number | null
          votes?: number | null
        }
        Update: {
          accepted_answer_id?: string | null
          answers_count?: number | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_solved?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          views?: number | null
          votes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_accepted_answer_fkey"
            columns: ["accepted_answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          completed_at: string
          id: string
          points_earned: number
          quiz_id: string
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          points_earned?: number
          quiz_id: string
          score?: number
          total_questions?: number
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          points_earned?: number
          quiz_id?: string
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "course_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: number
          id: string
          options: Json
          points: number
          question_text: string
          quiz_id: string
          sort_order: number
        }
        Insert: {
          correct_answer?: number
          id?: string
          options?: Json
          points?: number
          question_text: string
          quiz_id: string
          sort_order?: number
        }
        Update: {
          correct_answer?: number
          id?: string
          options?: Json
          points?: number
          question_text?: string
          quiz_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "course_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_redemptions: {
        Row: {
          created_at: string
          id: string
          points_spent: number
          redemption_code: string
          reward_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_spent: number
          redemption_code: string
          reward_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points_spent?: number
          redemption_code?: string
          reward_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean | null
          points_cost: number
          stock: number | null
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          points_cost: number
          stock?: number | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          points_cost?: number
          stock?: number | null
          title?: string
        }
        Relationships: []
      }
      tag_follows: {
        Row: {
          created_at: string
          id: string
          tag_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tag_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tag_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tag_follows_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "forum_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          progress: number
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          progress?: number
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievement_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_streaks: {
        Row: {
          current_streak: number
          last_active_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
          week_start: string
          weekly_points: number
        }
        Insert: {
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
          week_start?: string
          weekly_points?: number
        }
        Update: {
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
          week_start?: string
          weekly_points?: number
        }
        Relationships: []
      }
      user_challenge_progress: {
        Row: {
          challenge_id: string
          completed_at: string | null
          created_at: string
          current_progress: number
          id: string
          is_completed: boolean
          points_awarded: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          id?: string
          is_completed?: boolean
          points_awarded?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          id?: string
          is_completed?: boolean
          points_awarded?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_dismissed_nudges: {
        Row: {
          dismissed_at: string
          id: string
          nudge_key: string
          user_id: string
        }
        Insert: {
          dismissed_at?: string
          id?: string
          nudge_key: string
          user_id: string
        }
        Update: {
          dismissed_at?: string
          id?: string
          nudge_key?: string
          user_id?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          job_id: string | null
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invites: {
        Row: {
          code: string
          created_at: string
          id: string
          invited_email: string | null
          inviter_id: string
          rewarded: boolean
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          invited_email?: string | null
          inviter_id: string
          rewarded?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          invited_email?: string | null
          inviter_id?: string
          rewarded?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          answer_id: string | null
          created_at: string
          id: string
          question_id: string | null
          user_id: string
          vote_type: number
        }
        Insert: {
          answer_id?: string | null
          created_at?: string
          id?: string
          question_id?: string | null
          user_id: string
          vote_type: number
        }
        Update: {
          answer_id?: string | null
          created_at?: string
          id?: string
          question_id?: string | null
          user_id?: string
          vote_type?: number
        }
        Relationships: [
          {
            foreignKeyName: "votes_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          reward_badge: string | null
          reward_points: number
          target_count: number
          title: string
          week_end: string
          week_start: string
        }
        Insert: {
          challenge_type?: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          reward_badge?: string | null
          reward_points?: number
          target_count?: number
          title: string
          week_end?: string
          week_start?: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          reward_badge?: string | null
          reward_points?: number
          target_count?: number
          title?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
      workspace_services: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          is_addon: boolean
          price: number
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          is_addon?: boolean
          price?: number
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          is_addon?: boolean
          price?: number
          title?: string
        }
        Relationships: []
      }
      workspace_subscriptions: {
        Row: {
          auto_renew: boolean
          created_at: string
          end_date: string
          id: string
          payment_method: string
          plan_name: string
          price: number
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          end_date?: string
          id?: string
          payment_method?: string
          plan_name: string
          price?: number
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          end_date?: string
          id?: string
          payment_method?: string
          plan_name?: string
          price?: number
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      quiz_questions_public: {
        Row: {
          id: string | null
          options: Json | null
          points: number | null
          question_text: string | null
          quiz_id: string | null
          sort_order: number | null
        }
        Insert: {
          id?: string | null
          options?: Json | null
          points?: number | null
          question_text?: string | null
          quiz_id?: string | null
          sort_order?: number | null
        }
        Update: {
          id?: string | null
          options?: Json | null
          points?: number | null
          question_text?: string | null
          quiz_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "course_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_insights: { Args: never; Returns: Json }
      ai_usage_count_today: {
        Args: { _action: string; _user_id: string }
        Returns: number
      }
      check_ai_chat_rate_limit: {
        Args: {
          p_max_requests?: number
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: Json
      }
      complete_challenge: { Args: { p_challenge_id: string }; Returns: Json }
      create_notification: {
        Args: {
          _actor_id: string
          _body: string
          _link: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: undefined
      }
      forum_add_points: {
        Args: { _delta: number; _user_id: string }
        Returns: undefined
      }
      get_or_create_invite_code: { Args: never; Returns: string }
      grant_achievement: {
        Args: { _slug: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_article_comments: {
        Args: { article_uuid: string }
        Returns: undefined
      }
      increment_article_views: {
        Args: { article_uuid: string }
        Returns: undefined
      }
      increment_forum_topic_views: {
        Args: { p_topic_id: string }
        Returns: undefined
      }
      increment_question_answers: {
        Args: { question_uuid: string }
        Returns: undefined
      }
      increment_question_views: {
        Args: { question_uuid: string }
        Returns: undefined
      }
      is_forum_mod: { Args: { _user_id: string }; Returns: boolean }
      mark_forum_solution: { Args: { p_reply_id: string }; Returns: Json }
      record_activity: {
        Args: { _kind: string; _points?: number }
        Returns: Json
      }
      redeem_invite_code: { Args: { _code: string }; Returns: Json }
      refresh_challenge_progress: {
        Args: { p_challenge_id: string }
        Returns: Json
      }
      submit_quiz_attempt: {
        Args: { p_answers: Json; p_quiz_id: string }
        Returns: Json
      }
      sync_my_achievements: { Args: never; Returns: Json }
      update_profile_info:
        | {
            Args: {
              p_avatar_url?: string
              p_bio?: string
              p_full_name?: string
              p_skills?: string[]
            }
            Returns: undefined
          }
        | {
            Args: {
              p_avatar_url?: string
              p_bio?: string
              p_cover_url?: string
              p_full_name?: string
              p_github_url?: string
              p_is_public?: boolean
              p_linkedin_url?: string
              p_location?: string
              p_skills?: string[]
              p_twitter_url?: string
              p_website_url?: string
            }
            Returns: undefined
          }
    }
    Enums: {
      app_role: "user" | "moderator" | "admin"
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
      app_role: ["user", "moderator", "admin"],
    },
  },
} as const
