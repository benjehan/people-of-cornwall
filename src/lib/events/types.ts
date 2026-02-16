export type RecurrencePattern = 'daily' | 'weekly' | 'fortnightly' | 'monthly';

export const EVENT_CATEGORIES = [
  'music', 'food', 'arts', 'sports', 'community', 'nature', 'festival',
  'heritage', 'family', 'charity', 'market', 'theatre', 'workshop', 'other',
] as const;

export type EventCategory = typeof EVENT_CATEGORIES[number];

export interface EventBase {
  id: string;
  title: string;
  description: string | null;
  location_name: string;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  image_url: string | null;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  source_url: string | null;
  price_info: string | null;
  is_free: boolean;
  is_accessible: boolean;
  is_dog_friendly: boolean;
  is_child_friendly: boolean;
  is_vegan_friendly: boolean;
  is_featured: boolean;
  is_approved: boolean;
  created_by: string;
  created_at: string;
  category: string | null;
  recurring: boolean;
  recurrence_pattern: RecurrencePattern | null;
  recurrence_end_date: string | null;
  excluded_dates: string[];
  primary_image?: string | null;
}

export interface EventInstance extends EventBase {
  original_starts_at: string;
  instance_date: string;
  is_recurring_instance: boolean;
}
