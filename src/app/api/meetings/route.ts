import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, purpose, organizer_name, date_options, deadline } = body;

    if (!title || !purpose || !organizer_name || !date_options?.length) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다' }, { status: 400 });
    }

    const supabase = await createClient();
    const organizer_token = uuidv4();

    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({ title, purpose, organizer_name, organizer_token, deadline: deadline || null })
      .select()
      .single();

    if (meetingError) throw meetingError;

    const dateRows = date_options.map((date: string) => ({
      meeting_id: meeting.id,
      date,
    }));

    const { error: dateError } = await supabase.from('date_options').insert(dateRows);
    if (dateError) throw dateError;

    return NextResponse.json({ meeting_id: meeting.id, organizer_token });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '모임 생성에 실패했습니다' }, { status: 500 });
  }
}
