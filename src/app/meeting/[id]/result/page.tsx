"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { type MeetingWithDetails, type KakaoPlace, PURPOSE_LABELS } from "@/types";
import { countVotesByDate } from "@/lib/midpoint";
import { ChevronLeft, MapPin, Phone, ExternalLink, Share2 } from "lucide-react";
import Link from "next/link";

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [meeting, setMeeting] = useState<MeetingWithDetails | null>(null);
  const [places, setPlaces] = useState<KakaoPlace[]>([]);
  const [midpoint, setMidpoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<KakaoPlace | null>(null);
  const [confirming, setConfirming] = useState(false);

  const organizerToken =
    typeof window !== "undefined" ? localStorage.getItem(`organizer_${id}`) : null;
  const isOrganizer = !!organizerToken;

  useEffect(() => {
    Promise.all([fetchMeeting(), fetchRecommendations()]).finally(() => setLoading(false));
  }, [id]);

  const fetchMeeting = async () => {
    const res = await fetch(`/api/meetings/${id}`);
    if (res.ok) {
      const data = await res.json();
      setMeeting(data);
    }
  };

  const fetchRecommendations = async () => {
    const res = await fetch(`/api/meetings/${id}/recommendations`);
    if (res.ok) {
      const data = await res.json();
      setPlaces(data.places || []);
      setMidpoint(data.midpoint || null);
    }
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedPlace) {
      toast.error("날짜와 장소를 선택해주세요");
      return;
    }
    setConfirming(true);
    try {
      const res = await fetch(`/api/meetings/${id}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizer_token: organizerToken,
          confirmed_date: selectedDate,
          confirmed_place_name: selectedPlace.place_name,
          confirmed_place_address: selectedPlace.road_address_name || selectedPlace.address_name,
          confirmed_lat: parseFloat(selectedPlace.y),
          confirmed_lng: parseFloat(selectedPlace.x),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("모임이 확정됐어요! 🎉");
      fetchMeeting();
    } catch {
      toast.error("확정에 실패했습니다");
    } finally {
      setConfirming(false);
    }
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/meeting/${id}`);
    toast.success("링크가 복사됐어요! 친구에게 붙여넣기 해주세요 📋");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-3 animate-bounce">🗺️</div>
          <p>장소 찾는 중...</p>
        </div>
      </div>
    );
  }

  if (!meeting) return null;

  const voteSummary = countVotesByDate(meeting.date_options, meeting.participants);

  return (
    <div className="min-h-screen px-4 py-6 pb-24">
      <div className="flex items-center gap-2 mb-4">
        <Link href={`/meeting/${id}`}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{meeting.title}</h1>
          <p className="text-sm text-gray-500">
            {PURPOSE_LABELS[meeting.purpose as keyof typeof PURPOSE_LABELS]}
          </p>
        </div>
      </div>

      {meeting.status === "confirmed" && (
        <div className="mb-6 p-5 rounded-2xl bg-green-50 border border-green-200">
          <p className="text-green-700 font-semibold text-sm mb-3">✅ 모임이 확정됐어요!</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">📆</span>
              <span className="font-semibold">
                {format(new Date(meeting.confirmed_date!), "M월 d일 (EEE)", { locale: ko })}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xl">📍</span>
              <div>
                <p className="font-semibold">{meeting.confirmed_place_name}</p>
                <p className="text-sm text-gray-500">{meeting.confirmed_place_address}</p>
              </div>
            </div>
          </div>
          <Button
            className="w-full mt-4 h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 mr-2" />
            결과 공유하기
          </Button>
        </div>
      )}

      {meeting.status !== "confirmed" && (
        <>
          <div className="mb-6">
            <h2 className="font-semibold text-gray-800 mb-3">
              날짜 투표 결과
              {isOrganizer && <span className="text-sm text-gray-500 ml-2">날짜를 선택해주세요</span>}
            </h2>
            <div className="space-y-2">
              {voteSummary.map((item) => (
                <button
                  key={item.optionId}
                  disabled={!isOrganizer}
                  onClick={() => setSelectedDate(item.date)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                    selectedDate === item.date
                      ? "border-yellow-400 bg-yellow-50"
                      : item.count === voteSummary[0]?.count && item.count > 0
                      ? "border-yellow-200 bg-yellow-50/50"
                      : "border-gray-100"
                  }`}
                >
                  <span className="font-medium">
                    {format(new Date(item.date), "M월 d일 (EEE)", { locale: ko })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {"🙋".repeat(Math.min(item.count, 8))}
                    </span>
                    <Badge
                      className={
                        item.count === voteSummary[0]?.count && item.count > 0
                          ? "bg-yellow-400 text-gray-900"
                          : ""
                      }
                      variant={
                        item.count === voteSummary[0]?.count && item.count > 0
                          ? "default"
                          : "secondary"
                      }
                    >
                      {item.count}명
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="font-semibold text-gray-800 mb-1">추천 장소</h2>
            {midpoint && (
              <p className="text-sm text-gray-500 mb-3">
                <MapPin className="w-3 h-3 inline mr-1" />
                {meeting.participants.filter((p) => p.latitude).length}명의 중간 지점 기준
              </p>
            )}
            {places.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>출발지를 입력한 참여자가 없어서</p>
                <p>장소를 추천할 수 없어요</p>
              </div>
            ) : (
              <div className="space-y-3">
                {places.slice(0, 8).map((place, i) => (
                  <button
                    key={i}
                    disabled={!isOrganizer}
                    onClick={() => setSelectedPlace(place)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedPlace?.place_name === place.place_name
                        ? "border-yellow-400 bg-yellow-50"
                        : "border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{place.place_name}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {place.road_address_name || place.address_name}
                        </p>
                        {place.phone && (
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {place.phone}
                          </p>
                        )}
                      </div>
                      {place.place_url && (
                        <a
                          href={place.place_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-500 shrink-0 mt-0.5"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {isOrganizer && meeting.status !== "confirmed" && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 py-4 bg-white border-t border-gray-100">
          <Button
            className="w-full h-14 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-base disabled:opacity-50"
            disabled={!selectedDate || !selectedPlace || confirming}
            onClick={handleConfirm}
          >
            {confirming ? "확정 중..." : "이 날짜, 이 장소로 확정! 🎯"}
          </Button>
        </div>
      )}
    </div>
  );
}
