export interface Track {
  track_number: number;
  title: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  composer: string;
  author_lyrics?: string;
  language_audio: string;
  explicit_content: boolean;
  lyrics_text?: string;
  tiktok_preview_start?: number;
  file?: File;
  preview_url?: string;
}

export interface Release {
  id: number;
  release_name: string;
  artist_name?: string;
  cover_url?: string;
  release_date?: string;
  preorder_date?: string;
  sales_start_date?: string;
  genre?: string;
  copyright?: string;
  price_category?: string;
  title_language?: string;
  status: string;
  tracks_count?: number;
  created_at: string;
  review_comment?: string;
  reviewer_name?: string;
}

import { API_ENDPOINTS } from '@/config/api';

export const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Jazz', 'Classical', 'R&B', 'Country', 'Alternative'];
export const LANGUAGES = ['Русский', 'Английский', 'Испанский', 'Французский', 'Немецкий', 'Итальянский', 'Японский', 'Корейский'];

export interface Pitching {
  id?: number;
  release_id: number;
  artist_name: string;
  release_name: string;
  release_date: string;
  genre: string;
  artist_description: string;
  release_description: string;
  playlist_fit: string;
  current_reach: string;
  preview_link: string;
  artist_photos: string[];
  status?: string;
  created_at?: string;
}

export const API_URL = API_ENDPOINTS.RELEASES;
export const UPLOAD_URL = API_ENDPOINTS.UPLOAD_FILE;