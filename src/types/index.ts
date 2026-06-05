export type MeetingPurpose =
  | 'chat'        // 수다떨기
  | 'boardgame'   // 보드게임
  | 'meal'        // 식사
  | 'cafe'        // 카페
  | 'movie'       // 영화
  | 'activity';   // 액티비티

export type TransportMode = 'transit' | 'car' | 'walk';

export type MeetingStatus = 'voting' | 'closed' | 'confirmed';

export interface Meeting {
  id: string;
  title: string;
  purpose: MeetingPurpose;
  organizer_name: string;
  status: MeetingStatus;
  deadline: string | null;
  confirmed_date: string | null;
  confirmed_place_name: string | null;
  confirmed_place_address: string | null;
  confirmed_lat: number | null;
  confirmed_lng: number | null;
  created_at: string;
}

export interface DateOption {
  id: string;
  meeting_id: string;
  date: string;
}

export interface Participant {
  id: string;
  meeting_id: string;
  name: string;
  session_token: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  transport_mode: TransportMode;
  created_at: string;
}

export interface ParticipantVote {
  id: string;
  participant_id: string;
  date_option_id: string;
}

export interface MeetingWithDetails extends Meeting {
  date_options: DateOption[];
  participants: (Participant & { votes: ParticipantVote[] })[];
}

export interface KakaoPlace {
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  category_name: string;
  phone: string;
  place_url: string;
}

export const PURPOSE_LABELS: Record<MeetingPurpose, string> = {
  chat: '수다떨기 ☕',
  boardgame: '보드게임 🎲',
  meal: '식사 🍽️',
  cafe: '카페 ☕',
  movie: '영화 🎬',
  activity: '액티비티 🎯',
};

export const PURPOSE_KEYWORDS: Record<MeetingPurpose, string> = {
  chat: '카페',
  boardgame: '보드게임카페',
  meal: '음식점',
  cafe: '카페',
  movie: '영화관',
  activity: '놀이공원',
};
