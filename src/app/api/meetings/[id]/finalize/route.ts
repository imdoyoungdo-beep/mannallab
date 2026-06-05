import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      organizer_token,
      confirmed_date,
      confirmed_place_name,
      confirmed_place_address,
      confirmed_lat,
      confirmed_lng,
    } = body;

    const supabase = await createClient();

    const { data: meeting } = await supabase
      .from('meetings')
      .select('organizer_token')
      .eq('id', id)
      .single();

    if (!meeting || meeting.organizer_token !== organizer_token) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    const { error } = await supabase
      .from('meetings')
      .update({
        status: 'confirmed',
        confirmed_date,
        confirmed_place_name,
        confirmed_place_address,
        confirmed_lat,
        confirmed_lng,
      })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '확정에 실패했습니다' }, { status: 500 });
  }
}
