import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, address, latitude, longitude, transport_mode, voted_dates } = body;

    if (!name) return NextResponse.json({ error: '이름을 입력해주세요' }, { status: 400 });

    const supabase = await createClient();
    const session_token = uuidv4();

    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .insert({
        meeting_id: id,
        name,
        session_token,
        address: address || null,
        latitude: latitude || null,
        longitude: longitude || null,
        transport_mode: transport_mode || 'transit',
      })
      .select()
      .single();

    if (participantError) throw participantError;

    if (voted_dates?.length) {
      const votes = voted_dates.map((date_option_id: string) => ({
        participant_id: participant.id,
        date_option_id,
      }));
      const { error: voteError } = await supabase.from('participant_votes').insert(votes);
      if (voteError) throw voteError;
    }

    return NextResponse.json({ participant_id: participant.id, session_token });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '참여 등록에 실패했습니다' }, { status: 500 });
  }
}
