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

import { API_ENDPOINTS } from '@/config/api';

export const API_URLS = {
  auth: API_ENDPOINTS.AUTH,
  tickets: API_ENDPOINTS.TICKETS,
  users: API_ENDPOINTS.USERS,
  uploadFile: API_ENDPOINTS.UPLOAD_FILE,
  ticketComments: API_ENDPOINTS.TICKET_COMMENTS
} as const;