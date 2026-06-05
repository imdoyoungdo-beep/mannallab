-- 우리 만날랩? 데이터베이스 스키마
-- Supabase SQL Editor에 붙여넣고 실행하세요

-- 모임 테이블
create table meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  purpose text not null,
  organizer_name text not null,
  organizer_token text not null,
  status text not null default 'voting',
  deadline date,
  confirmed_date date,
  confirmed_place_name text,
  confirmed_place_address text,
  confirmed_lat float8,
  confirmed_lng float8,
  created_at timestamptz default now()
);

-- 날짜 후보 테이블
create table date_options (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id) on delete cascade,
  date date not null
);

-- 참여자 테이블
create table participants (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id) on delete cascade,
  name text not null,
  session_token text not null,
  address text,
  latitude float8,
  longitude float8,
  transport_mode text default 'transit',
  created_at timestamptz default now()
);

-- 날짜 투표 테이블
create table participant_votes (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants(id) on delete cascade,
  date_option_id uuid references date_options(id) on delete cascade,
  unique(participant_id, date_option_id)
);

-- 누구나 읽고 쓸 수 있도록 RLS 정책 설정 (로그인 없이 링크로 접근)
alter table meetings enable row level security;
alter table date_options enable row level security;
alter table participants enable row level security;
alter table participant_votes enable row level security;

create policy "모임 전체 접근" on meetings for all using (true) with check (true);
create policy "날짜후보 전체 접근" on date_options for all using (true) with check (true);
create policy "참여자 전체 접근" on participants for all using (true) with check (true);
create policy "투표 전체 접근" on participant_votes for all using (true) with check (true);
