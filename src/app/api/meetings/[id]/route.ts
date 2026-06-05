import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: meeting, error } = await supabase
      .from('meetings')
      .select(`
        *,
        date_options(*),
        participants(*, votes:participant_votes(*))
      `)
      .eq('id', id)
      .single();

    if (error) return NextResponse.json({ error: '모임을 찾을 수 없습니다' }, { status: 404 });

    return NextResponse.json(meeting);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '오류가 발생했습니다' }, { status: 500 });
  }
}
