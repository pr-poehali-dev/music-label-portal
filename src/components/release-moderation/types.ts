export interface Track {
  id: number;
  track_number: number;
  title: string;
  file_url: string;
  file_name: string;
  composer: string;
  author_lyrics?: string;
  language_audio: string;
  lyrics_text?: string;
}

export interface Pitching {
  id: number;
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
  status: string;
  created_at: string;
}

export interface Release {
  id: number;
  release_name: string;
  artist_name: string;
  user_id?: number;
  cover_url?: string;
  release_date?: string;
  genre?: string;
  copyright?: string;
  status: string;
  tracks_count?: number;
  created_at: string;
  tracks?: Track[];
  review_comment?: string;
  reviewer_id?: number;
  reviewer_name?: string;
  pitching?: Pitching | null;
}
