import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query');
  if (!query) return NextResponse.json({ documents: [] });

  const restApiKey = process.env.KAKAO_REST_API_KEY;
  if (!restApiKey) return NextResponse.json({ documents: [] });

  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}&size=5`;
  const keywordUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=5`;

  const [addrRes, keywordRes] = await Promise.all([
    fetch(url, { headers: { Authorization: `KakaoAK ${restApiKey}` } }),
    fetch(keywordUrl, { headers: { Authorization: `KakaoAK ${restApiKey}` } }),
  ]);

  const [addrData, keywordData] = await Promise.all([addrRes.json(), keywordRes.json()]);

  const addrDocs = (addrData.documents || []).map((d: { address_name: string; x: string; y: string }) => ({
    address_name: d.address_name,
    x: d.x,
    y: d.y,
  }));

  const keywordDocs = (keywordData.documents || []).map((d: { place_name: string; address_name: string; x: string; y: string }) => ({
    address_name: `${d.place_name} (${d.address_name})`,
    x: d.x,
    y: d.y,
  }));

  const combined = [...addrDocs, ...keywordDocs].slice(0, 5);

  return NextResponse.json({ documents: combined });
}
