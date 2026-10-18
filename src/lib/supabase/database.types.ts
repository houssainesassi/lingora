
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "bookings": {
                  Row: {
                    "cancellation_reason": string | null,"cancelled_at": string | null,"cancelled_by": string | null,"completed_at": string | null,"confirmed_at": string | null,"created_at": string,"currency": string,"duration_minutes": number,"ends_at": string,"hourly_rate_cents": number,"id": string,"language_code": string,"lesson_type": Database["public"]['Enums']["lesson_type"],"price_cents": number,"reschedule_requested_by": string | null,"reschedule_starts_at": string | null,"responded_at": string | null,"starts_at": string,"status": Database["public"]['Enums']["booking_status"],"student_id": string,"student_note": string | null,"tutor_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cancellation_reason"?: string | null,"cancelled_at"?: string | null,"cancelled_by"?: string | null,"completed_at"?: string | null,"confirmed_at"?: string | null,"created_at"?: string,"currency": string,"duration_minutes": number,"ends_at": string,"hourly_rate_cents": number,"id"?: string,"language_code": string,"lesson_type"?: Database["public"]['Enums']["lesson_type"],"price_cents": number,"reschedule_requested_by"?: string | null,"reschedule_starts_at"?: string | null,"responded_at"?: string | null,"starts_at": string,"status"?: Database["public"]['Enums']["booking_status"],"student_id": string,"student_note"?: string | null,"tutor_id": string,"updated_at"?: string
                  }
                  Update: {
                    "cancellation_reason"?: string | null,"cancelled_at"?: string | null,"cancelled_by"?: string | null,"completed_at"?: string | null,"confirmed_at"?: string | null,"created_at"?: string,"currency"?: string,"duration_minutes"?: number,"ends_at"?: string,"hourly_rate_cents"?: number,"id"?: string,"language_code"?: string,"lesson_type"?: Database["public"]['Enums']["lesson_type"],"price_cents"?: number,"reschedule_requested_by"?: string | null,"reschedule_starts_at"?: string | null,"responded_at"?: string | null,"starts_at"?: string,"status"?: Database["public"]['Enums']["booking_status"],"student_id"?: string,"student_note"?: string | null,"tutor_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "bookings_cancelled_by_fkey"
      columns: ["cancelled_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_language_code_fkey"
      columns: ["language_code"]
isOneToOne: false
      referencedRelation: "languages"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "bookings_reschedule_requested_by_fkey"
      columns: ["reschedule_requested_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_tutor_id_fkey"
      columns: ["tutor_id"]
isOneToOne: false
      referencedRelation: "tutor_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"conversation_participants": {
                  Row: {
                    "conversation_id": string,"last_read_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "conversation_id": string,"last_read_at"?: string,"user_id": string
                  }
                  Update: {
                    "conversation_id"?: string,"last_read_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "conversation_participants_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversation_participants_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"conversations": {
                  Row: {
                    "created_at": string,"id": string,"last_message_at": string | null,"last_message_preview": string | null,"last_message_sender": string | null,"user_high": string,"user_low": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"last_message_at"?: string | null,"last_message_preview"?: string | null,"last_message_sender"?: string | null,"user_high": string,"user_low": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"last_message_at"?: string | null,"last_message_preview"?: string | null,"last_message_sender"?: string | null,"user_high"?: string,"user_low"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "conversations_last_message_sender_fkey"
      columns: ["last_message_sender"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversations_user_high_fkey"
      columns: ["user_high"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversations_user_low_fkey"
      columns: ["user_low"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"favorites": {
                  Row: {
                    "created_at": string,"student_id": string,"tutor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"student_id": string,"tutor_id": string
                  }
                  Update: {
                    "created_at"?: string,"student_id"?: string,"tutor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "favorites_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "favorites_tutor_id_fkey"
      columns: ["tutor_id"]
isOneToOne: false
      referencedRelation: "tutor_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"languages": {
                  Row: {
                    "code": string,"created_at": string,"is_active": boolean,"name": string,"native_name": string | null,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"created_at"?: string,"is_active"?: boolean,"name": string,"native_name"?: string | null,"sort_order"?: number
                  }
                  Update: {
                    "code"?: string,"created_at"?: string,"is_active"?: boolean,"name"?: string,"native_name"?: string | null,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"messages": {
                  Row: {
                    "body": string,"conversation_id": string,"created_at": string,"id": string,"sender_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"conversation_id": string,"created_at"?: string,"id"?: string,"sender_id": string
                  }
                  Update: {
                    "body"?: string,"conversation_id"?: string,"created_at"?: string,"id"?: string,"sender_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "body": string | null,"created_at": string,"id": string,"link": string | null,"read_at": string | null,"title": string,"type": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"created_at"?: string,"id"?: string,"link"?: string | null,"read_at"?: string | null,"title": string,"type": string,"user_id": string
                  }
                  Update: {
                    "body"?: string | null,"created_at"?: string,"id"?: string,"link"?: string | null,"read_at"?: string | null,"title"?: string,"type"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"platform_settings": {
                  Row: {
                    "description": string | null,"key": string,"updated_at": string,"updated_by": string | null,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "description"?: string | null,"key": string,"updated_at"?: string,"updated_by"?: string | null,"value": NonNullable<Json>
                  }
                  Update: {
                    "description"?: string | null,"key"?: string,"updated_at"?: string,"updated_by"?: string | null,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "platform_settings_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"bio": string | null,"country": string | null,"created_at": string,"full_name": string,"id": string,"is_suspended": boolean,"learning_goals": string | null,"onboarded": boolean,"role": Database["public"]['Enums']["user_role"],"timezone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"bio"?: string | null,"country"?: string | null,"created_at"?: string,"full_name"?: string,"id": string,"is_suspended"?: boolean,"learning_goals"?: string | null,"onboarded"?: boolean,"role"?: Database["public"]['Enums']["user_role"],"timezone"?: string,"updated_at"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"bio"?: string | null,"country"?: string | null,"created_at"?: string,"full_name"?: string,"id"?: string,"is_suspended"?: boolean,"learning_goals"?: string | null,"onboarded"?: boolean,"role"?: Database["public"]['Enums']["user_role"],"timezone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"reports": {
                  Row: {
                    "admin_note": string | null,"created_at": string,"details": string | null,"id": string,"reason": string,"reported_user_id": string | null,"reporter_id": string,"resolved_at": string | null,"resolved_by": string | null,"review_id": string | null,"status": Database["public"]['Enums']["report_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "admin_note"?: string | null,"created_at"?: string,"details"?: string | null,"id"?: string,"reason": string,"reported_user_id"?: string | null,"reporter_id": string,"resolved_at"?: string | null,"resolved_by"?: string | null,"review_id"?: string | null,"status"?: Database["public"]['Enums']["report_status"]
                  }
                  Update: {
                    "admin_note"?: string | null,"created_at"?: string,"details"?: string | null,"id"?: string,"reason"?: string,"reported_user_id"?: string | null,"reporter_id"?: string,"resolved_at"?: string | null,"resolved_by"?: string | null,"review_id"?: string | null,"status"?: Database["public"]['Enums']["report_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_reported_user_id_fkey"
      columns: ["reported_user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_resolved_by_fkey"
      columns: ["resolved_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_review_id_fkey"
      columns: ["review_id"]
isOneToOne: false
      referencedRelation: "reviews"
      referencedColumns: ["id"]
    }
                  ]
                },"reviews": {
                  Row: {
                    "booking_id": string,"comment": string | null,"created_at": string,"id": string,"rating": number,"status": Database["public"]['Enums']["review_status"],"student_id": string,"tutor_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "booking_id": string,"comment"?: string | null,"created_at"?: string,"id"?: string,"rating": number,"status"?: Database["public"]['Enums']["review_status"],"student_id": string,"tutor_id": string,"updated_at"?: string
                  }
                  Update: {
                    "booking_id"?: string,"comment"?: string | null,"created_at"?: string,"id"?: string,"rating"?: number,"status"?: Database["public"]['Enums']["review_status"],"student_id"?: string,"tutor_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: true
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_tutor_id_fkey"
      columns: ["tutor_id"]
isOneToOne: false
      referencedRelation: "tutor_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"student_languages": {
                  Row: {
                    "created_at": string,"current_level": Database["public"]['Enums']["cefr_level"],"goal": string | null,"language_code": string,"student_id": string,"target_level": Database["public"]['Enums']["cefr_level"] | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"current_level"?: Database["public"]['Enums']["cefr_level"],"goal"?: string | null,"language_code": string,"student_id": string,"target_level"?: Database["public"]['Enums']["cefr_level"] | null
                  }
                  Update: {
                    "created_at"?: string,"current_level"?: Database["public"]['Enums']["cefr_level"],"goal"?: string | null,"language_code"?: string,"student_id"?: string,"target_level"?: Database["public"]['Enums']["cefr_level"] | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "student_languages_language_code_fkey"
      columns: ["language_code"]
isOneToOne: false
      referencedRelation: "languages"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "student_languages_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"tutor_availability": {
                  Row: {
                    "created_at": string,"end_minute": number,"id": string,"start_minute": number,"tutor_id": string,"weekday": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"end_minute": number,"id"?: string,"start_minute": number,"tutor_id": string,"weekday": number
                  }
                  Update: {
                    "created_at"?: string,"end_minute"?: number,"id"?: string,"start_minute"?: number,"tutor_id"?: string,"weekday"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "tutor_availability_tutor_id_fkey"
      columns: ["tutor_id"]
isOneToOne: false
      referencedRelation: "tutor_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"tutor_languages": {
                  Row: {
                    "is_native": boolean,"language_code": string,"proficiency": Database["public"]['Enums']["cefr_level"] | null,"teaches": boolean,"tutor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "is_native"?: boolean,"language_code": string,"proficiency"?: Database["public"]['Enums']["cefr_level"] | null,"teaches"?: boolean,"tutor_id": string
                  }
                  Update: {
                    "is_native"?: boolean,"language_code"?: string,"proficiency"?: Database["public"]['Enums']["cefr_level"] | null,"teaches"?: boolean,"tutor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tutor_languages_language_code_fkey"
      columns: ["language_code"]
isOneToOne: false
      referencedRelation: "languages"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "tutor_languages_tutor_id_fkey"
      columns: ["tutor_id"]
isOneToOne: false
      referencedRelation: "tutor_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"tutor_profiles": {
                  Row: {
                    "about": string,"avg_rating": number,"certifications": string | null,"completed_lessons": number,"created_at": string,"currency": string,"headline": string,"hourly_rate_cents": number,"id": string,"is_demo": boolean,"lesson_durations": (number)[],"levels_taught": (Database["public"]['Enums']["cefr_level"])[],"rejection_reason": string | null,"review_count": number,"reviewed_at": string | null,"reviewed_by": string | null,"specialties": (string)[],"status": Database["public"]['Enums']["tutor_status"],"submitted_at": string | null,"teaching_experience_years": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "about"?: string,"avg_rating"?: number,"certifications"?: string | null,"completed_lessons"?: number,"created_at"?: string,"currency"?: string,"headline"?: string,"hourly_rate_cents"?: number,"id": string,"is_demo"?: boolean,"lesson_durations"?: (number)[],"levels_taught"?: (Database["public"]['Enums']["cefr_level"])[],"rejection_reason"?: string | null,"review_count"?: number,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"specialties"?: (string)[],"status"?: Database["public"]['Enums']["tutor_status"],"submitted_at"?: string | null,"teaching_experience_years"?: number,"updated_at"?: string
                  }
                  Update: {
                    "about"?: string,"avg_rating"?: number,"certifications"?: string | null,"completed_lessons"?: number,"created_at"?: string,"currency"?: string,"headline"?: string,"hourly_rate_cents"?: number,"id"?: string,"is_demo"?: boolean,"lesson_durations"?: (number)[],"levels_taught"?: (Database["public"]['Enums']["cefr_level"])[],"rejection_reason"?: string | null,"review_count"?: number,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"specialties"?: (string)[],"status"?: Database["public"]['Enums']["tutor_status"],"submitted_at"?: string | null,"teaching_experience_years"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tutor_profiles_id_fkey"
      columns: ["id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tutor_profiles_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"tutor_time_off": {
                  Row: {
                    "created_at": string,"ends_at": string,"id": string,"note": string | null,"starts_at": string,"tutor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"ends_at": string,"id"?: string,"note"?: string | null,"starts_at": string,"tutor_id": string
                  }
                  Update: {
                    "created_at"?: string,"ends_at"?: string,"id"?: string,"note"?: string | null,"starts_at"?: string,"tutor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tutor_time_off_tutor_id_fkey"
      columns: ["tutor_id"]
isOneToOne: false
      referencedRelation: "tutor_profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "admin_platform_stats":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"assert_active_user":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"can_view_profile":
{ Args: { "p_profile_id": string }; Returns: boolean
                           },
"cancel_booking":
{ Args: { "p_booking_id": string,"p_reason"?: string }; Returns: undefined
                           },
"complete_booking":
{ Args: { "p_booking_id": string }; Returns: undefined
                           },
"get_my_conversations":
{ Args: { "p_limit"?: number }; Returns: {
              "conversation_id": string,"last_message_at": string,"last_message_preview": string,"last_message_sender": string,"other_avatar_url": string,"other_name": string,"other_role": Database["public"]['Enums']["user_role"],"other_user_id": string,"unread_count": number
            }[]
                           },
"get_tutor_reviews":
{ Args: { "p_limit"?: number,"p_offset"?: number,"p_tutor_id": string }; Returns: {
              "comment": string,"created_at": string,"id": string,"lesson_type": Database["public"]['Enums']["lesson_type"],"rating": number,"reviewer_name": string,"total_count": number
            }[]
                           },
"get_tutor_slots":
{ Args: { "p_duration": number,"p_from": string,"p_ignore_booking"?: string,"p_to": string,"p_tutor_id": string }; Returns: {
              "starts_at": string
            }[]
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_bookable_slot":
{ Args: { "p_duration": number,"p_ignore_booking"?: string,"p_starts_at": string,"p_tutor_id": string }; Returns: boolean
                           },
"is_conversation_participant":
{ Args: { "p_conversation_id": string }; Returns: boolean
                           },
"is_end_user_context":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"mark_conversation_read":
{ Args: { "p_conversation_id": string }; Returns: undefined
                           },
"notify_user":
{ Args: { "p_body": string,"p_link": string,"p_title": string,"p_type": string,"p_user_id": string }; Returns: undefined
                           },
"request_booking":
{ Args: { "p_duration": number,"p_language_code": string,"p_lesson_type": Database["public"]['Enums']["lesson_type"],"p_note"?: string,"p_starts_at": string,"p_tutor_id": string }; Returns: string
                           },
"request_reschedule":
{ Args: { "p_booking_id": string,"p_new_starts_at": string }; Returns: undefined
                           },
"respond_booking":
{ Args: { "p_accept": boolean,"p_booking_id": string,"p_reason"?: string }; Returns: Database["public"]['Enums']["booking_status"]
                           },
"respond_reschedule":
{ Args: { "p_accept": boolean,"p_booking_id": string }; Returns: undefined
                           },
"search_tutors":
{ Args: { "p_country"?: string,"p_level"?: Database["public"]['Enums']["cefr_level"],"p_limit"?: number,"p_max_price"?: number,"p_min_price"?: number,"p_min_rating"?: number,"p_native"?: string,"p_offset"?: number,"p_query"?: string,"p_sort"?: string,"p_specialty"?: string,"p_teaches"?: string }; Returns: {
              "about": string,"avatar_url": string,"avg_rating": number,"completed_lessons": number,"country": string,"currency": string,"full_name": string,"headline": string,"hourly_rate_cents": number,"id": string,"is_demo": boolean,"languages": Json,"lesson_durations": (number)[],"levels_taught": (Database["public"]['Enums']["cefr_level"])[],"review_count": number,"specialties": (string)[],"total_count": number
            }[]
                           },
"setting_int":
{ Args: { "p_default": number,"p_key": string }; Returns: number
                           },
"start_conversation":
{ Args: { "p_other_user": string }; Returns: string
                           }
          }
          Enums: {
            "booking_status": "pending"|"confirmed"|"cancelled"|"completed"|"rejected","cefr_level": "A1"|"A2"|"B1"|"B2"|"C1"|"C2","lesson_type": "trial"|"conversation"|"structured"|"exam_prep"|"business","report_status": "open"|"reviewing"|"resolved"|"dismissed","review_status": "published"|"hidden","tutor_status": "draft"|"pending"|"approved"|"rejected"|"suspended","user_role": "student"|"tutor"|"admin"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "booking_status": ["pending", "confirmed", "cancelled", "completed", "rejected"],"cefr_level": ["A1", "A2", "B1", "B2", "C1", "C2"],"lesson_type": ["trial", "conversation", "structured", "exam_prep", "business"],"report_status": ["open", "reviewing", "resolved", "dismissed"],"review_status": ["published", "hidden"],"tutor_status": ["draft", "pending", "approved", "rejected", "suspended"],"user_role": ["student", "tutor", "admin"]
          }
        }
} as const
