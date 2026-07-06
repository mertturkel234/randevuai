export type Sector = "kuaför" | "klinik" | "avukat" | "emlak" | "diğer";
export type SubscriptionStatus = "trial" | "active" | "cancelled";
export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";
export type ConversationStep =
  | "greeting"
  | "selecting_service"
  | "selecting_date"
  | "selecting_time"
  | "confirming"
  | "completed";

export interface WorkingHoursDay {
  open: string;
  close: string;
  closed?: boolean;
}

export interface WorkingHours {
  monday: WorkingHoursDay;
  tuesday: WorkingHoursDay;
  wednesday: WorkingHoursDay;
  thursday: WorkingHoursDay;
  friday: WorkingHoursDay;
  saturday: WorkingHoursDay;
  sunday: WorkingHoursDay;
}

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface ConversationState {
  step: ConversationStep;
  selected_service_id: string | null;
  selected_date: string | null;
  selected_time: string | null;
  customer_name: string | null;
}

export interface Business {
  id: string;
  name: string;
  phone: string | null;
  whatsapp_number: string | null;
  whatsapp_phone_number_id: string | null;
  sector: Sector;
  timezone: string;
  working_hours: WorkingHours;
  google_calendar_id: string | null;
  google_refresh_token: string | null;
  subscription_status: SubscriptionStatus;
  admin_whatsapp: string | null;
  daily_message_count: number;
  daily_message_reset_at: string | null;
  onboarding_completed: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  duration_minutes: number;
  price: number | null;
  is_active: boolean;
}

export interface Appointment {
  id: string;
  business_id: string;
  customer_name: string;
  customer_phone: string;
  service_id: string | null;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  google_event_id: string | null;
  notes: string | null;
  reminder_sent: boolean;
  created_at: string;
  services?: Service | null;
}

export interface Conversation {
  id: string;
  business_id: string;
  customer_phone: string;
  customer_name: string | null;
  messages: ConversationMessage[];
  state: ConversationState;
  updated_at: string;
}

export interface Profile {
  id: string;
  business_id: string;
  role: "owner" | "staff";
}

export const DEFAULT_WORKING_HOURS: WorkingHours = {
  monday: { open: "09:00", close: "18:00" },
  tuesday: { open: "09:00", close: "18:00" },
  wednesday: { open: "09:00", close: "18:00" },
  thursday: { open: "09:00", close: "18:00" },
  friday: { open: "09:00", close: "18:00" },
  saturday: { open: "10:00", close: "16:00" },
  sunday: { open: "09:00", close: "18:00", closed: true },
};

export const DEFAULT_CONVERSATION_STATE: ConversationState = {
  step: "greeting",
  selected_service_id: null,
  selected_date: null,
  selected_time: null,
  customer_name: null,
};

export const SECTOR_OPTIONS: { value: Sector; label: string }[] = [
  { value: "kuaför", label: "Kuaför / Berber" },
  { value: "klinik", label: "Klinik / Sağlık" },
  { value: "avukat", label: "Avukat / Hukuk" },
  { value: "emlak", label: "Emlak" },
  { value: "diğer", label: "Diğer" },
];

export const DAY_LABELS: Record<keyof WorkingHours, string> = {
  monday: "Pazartesi",
  tuesday: "Salı",
  wednesday: "Çarşamba",
  thursday: "Perşembe",
  friday: "Cuma",
  saturday: "Cumartesi",
  sunday: "Pazar",
};
