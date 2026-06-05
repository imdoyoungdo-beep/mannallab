import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateMidpoint } from '@/lib/midpoint';
import { PURPOSE_KEYWORDS } from '@/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: meeting } = await supabase
      .from('meetings')
      .select('purpose, participants(*)')
      .eq('id', id)
      .single();

    if (!meeting) return NextResponse.json({ error: '모임을 찾을 수 없습니다' }, { status: 404 });

    const locatedParticipants = meeting.participants.filter(
      (p: { latitude: number | null; longitude: number | null }) =>
        p.latitude !== null && p.longitude !== null
    );

    if (locatedParticipants.length === 0) {
      return NextResponse.json({ places: [], midpoint: null });
    }

    const midpoint = calculateMidpoint(
      locatedParticipants.map((p: { latitude: number; longitude: number }) => ({
        latitude: p.latitude,
        longitude: p.longitude,
      }))
    );

    const keyword = PURPOSE_KEYWORDS[meeting.purpose as keyof typeof PURPOSE_KEYWORDS] || '카페';
    const restApiKey = process.env.KAKAO_REST_API_KEY;

    if (!restApiKey) {
      return NextResponse.json({ places: [], midpoint });
    }

    const kakaoUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(keyword)}&x=${midpoint.longitude}&y=${midpoint.latitude}&radius=1500&size=10&sort=distance`;

    const kakaoResponse = await fetch(kakaoUrl, {
      headers: { Authorization: `KakaoAK ${restApiKey}` },
    });

    const kakaoData = await kakaoResponse.json();

    return NextResponse.json({
      places: kakaoData.documents || [],
      midpoint,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '장소 추천에 실패했습니다' }, { status: 500 });
  }
}
