export interface User {
  id: number;
  username: string;
  role: 'artist' | 'manager' | 'director';
  full_name: string;
  social_links_filled?: boolean;
  yandex_music_url?: string;
  vk_group_url?: string;
  tiktok_url?: string;
  is_blocked?: boolean;
  is_frozen?: boolean;
  frozen_until?: string;
  blocked_reason?: string;
  last_ip?: string;
  device_fingerprint?: string;
  avatar?: string;
  email?: string;
  login?: string;
  fullName?: string;
  isBlocked?: boolean;
  isFrozen?: boolean;
  freezeUntil?: string;
  vk_photo?: string;
  vk_first_name?: string;
  vk_last_name?: string;
  telegram_chat_id?: string;
  telegram_id?: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_by: number;
  creator_name: string;
  created_at: string;
  assigned_to?: number | null;
  assigned_name?: string | null;
  deadline?: string | null;
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: number;
  tasks_total?: number;
  tasks_completed?: number;
}

export interface NewTicket {
  title: string;
  description: string;
  priority: string;
}

export interface NewUser {
  username: string;
  full_name: string;
  role: string;
}

export const API_URLS = {
  auth: 'https://functions.poehali.dev/d2601eec-1d55-4956-b655-187431987ed9',
  tickets: 'https://functions.poehali.dev/cdcd7646-5a98-477f-8464-d1aa48319296',
  users: 'https://functions.poehali.dev/cf5d45c1-d64b-4400-af77-a51c7588d942',
  uploadFile: 'https://functions.poehali.dev/08bf9d4e-6ddc-4b6b-91a0-84187cbd89fa',
  ticketComments: 'https://functions.poehali.dev/b636dc56-7328-4fb7-933d-5d6d32e9ee96'
} as const;