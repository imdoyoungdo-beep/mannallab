"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { type MeetingWithDetails, PURPOSE_LABELS } from "@/types";
import { ChevronLeft, MapPin, Users, Share2 } from "lucide-react";
import Link from "next/link";
import AddressSearch from "@/components/AddressSearch";

export default function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOrganizer = searchParams.get("organizer") === "true";

  const [meeting, setMeeting] = useState<MeetingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"info" | "join" | "done">("info");
  const [name, setName] = useState("");
  const [selectedDateIds, setSelectedDateIds] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [transportMode, setTransportMode] = useState<"transit" | "car" | "walk">("transit");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMeeting();
  }, [id]);

  const fetchMeeting = async () => {
    try {
      const res = await fetch(`/api/meetings/${id}`);
      if (!res.ok) throw new Error("모임을 찾을 수 없습니다");
      const data = await res.json();
      setMeeting(data);
    } catch {
      toast.error("모임을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  };

  const toggleDateId = (optionId: string) => {
    setSelectedDateIds((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
    );
  };

  const handleJoin = async () => {
    if (!name) {
      toast.error("이름을 입력해주세요");
      return;
    }
    if (selectedDateIds.length === 0) {
      toast.error("가능한 날짜를 선택해주세요");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/meetings/${id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address: address || null,
          latitude: lat,
          longitude: lng,
          transport_mode: transportMode,
          voted_dates: selectedDateIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem(`participant_${id}`, data.session_token);
      setStep("done");
      fetchMeeting();
    } catch {
      toast.error("참여 등록에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/meeting/${id}`;
    await navigator.clipboard.writeText(url);
    toast.success("링크가 복사됐어요! 친구에게 붙여넣기 해주세요 📋");
  };

  const handleFinalize = () => {
    router.push(`/meeting/${id}/result`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-3 animate-bounce">📅</div>
          <p>불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-gray-500">모임을 찾을 수 없어요</p>
          <Link href="/">
            <Button className="mt-4">홈으로</Button>
          </Link>
        </div>
      </div>
    );
  }

  const voteSummary = meeting.date_options.map((opt) => ({
    ...opt,
    count: meeting.participants.filter((p) =>
      p.votes.some((v) => v.date_option_id === opt.id)
    ).length,
  }));

  const maxVotes = Math.max(...voteSummary.map((v) => v.count), 0);

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/">
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
        <Button variant="ghost" size="icon" className="rounded-full" onClick={handleShare}>
          <Share2 className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Users className="w-4 h-4" />
        <span>{meeting.participants.length}명 참여 중</span>
        {meeting.participants.length > 0 && (
          <span>
            ({meeting.participants.map((p) => p.name).join(", ")})
          </span>
        )}
      </div>

      {step === "info" && (
        <>
          <div className="mb-6">
            <h2 className="font-semibold text-gray-800 mb-3">날짜 현황</h2>
            <div className="space-y-2">
              {voteSummary
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((opt) => (
                  <div
                    key={opt.id}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      opt.count === maxVotes && opt.count > 0
                        ? "border-yellow-400 bg-yellow-50"
                        : "border-gray-100 bg-gray-50"
                    }`}
                  >
                    <span className="font-medium">
                      {format(new Date(opt.date), "M월 d일 (EEE)", { locale: ko })}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {Array.from({ length: opt.count }).map((_, i) => (
                          <span key={i} className="text-base">🙋</span>
                        ))}
                      </div>
                      <Badge
                        variant={opt.count === maxVotes && opt.count > 0 ? "default" : "secondary"}
                        className={opt.count === maxVotes && opt.count > 0 ? "bg-yellow-400 text-gray-900" : ""}
                      >
                        {opt.count}명
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {meeting.participants.some((p) => p.address) && (
            <div className="mb-6">
              <h2 className="font-semibold text-gray-800 mb-3">등록된 출발지</h2>
              <div className="space-y-2">
                {meeting.participants
                  .filter((p) => p.address)
                  .map((p) => (
                    <div key={p.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                      <MapPin className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.address}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {meeting.status === "voting" && !isOrganizer && (
              <Button
                className="w-full h-14 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-base"
                onClick={() => setStep("join")}
              >
                날짜 투표하기 ✋
              </Button>
            )}
            {isOrganizer && meeting.status === "voting" && (
              <Button
                variant="outline"
                className="w-full h-14 rounded-2xl font-semibold text-base"
                onClick={handleFinalize}
                disabled={meeting.participants.length === 0}
              >
                모임 확정하기 🎯
              </Button>
            )}
            {meeting.status === "confirmed" && (
              <Button
                className="w-full h-14 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-semibold text-base"
                onClick={handleFinalize}
              >
                확정된 모임 보기 ✅
              </Button>
            )}
          </div>
        </>
      )}

      {step === "join" && (
        <div className="space-y-5">
          <div>
            <Label className="text-base font-semibold mb-2 block">내 이름은?</Label>
            <Input
              placeholder="예: 박지수"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl text-base"
            />
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">
              언제 갈 수 있어요? (복수 선택 가능)
            </Label>
            <div className="space-y-2">
              {meeting.date_options
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => toggleDateId(opt.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedDateIds.includes(opt.id)
                        ? "border-yellow-400 bg-yellow-50"
                        : "border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <span className="font-medium">
                      {format(new Date(opt.date), "M월 d일 (EEE)", { locale: ko })}
                    </span>
                  </button>
                ))}
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold mb-1 block">출발 위치 (선택)</Label>
            <p className="text-sm text-gray-500 mb-2">입력하면 중간 지점을 추천해드려요</p>
            <AddressSearch
              onSelect={(addr, latitude, longitude) => {
                setAddress(addr);
                setLat(latitude);
                setLng(longitude);
              }}
            />
          </div>

          {(lat !== null) && (
            <div>
              <Label className="text-base font-semibold mb-2 block">교통수단</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["transit", "car", "walk"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTransportMode(mode)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      transportMode === mode
                        ? "border-yellow-400 bg-yellow-50"
                        : "border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    {mode === "transit" ? "🚇 대중교통" : mode === "car" ? "🚗 자가용" : "🚶 도보"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-14 rounded-2xl"
              onClick={() => setStep("info")}
            >
              취소
            </Button>
            <Button
              className="flex-1 h-14 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold"
              disabled={submitting || !name || selectedDateIds.length === 0}
              onClick={handleJoin}
            >
              {submitting ? "등록 중..." : "투표 완료!"}
            </Button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">투표 완료!</h2>
          <p className="text-gray-500 mb-8">
            친구들이 모두 투표하면 방장이 날짜와 장소를 확정해요
          </p>
          <Button
            className="w-full h-14 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-base mb-3"
            onClick={() => setStep("info")}
          >
            투표 현황 보기
          </Button>
          <Button variant="outline" className="w-full h-14 rounded-2xl" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            친구에게 링크 공유
          </Button>
        </div>
      )}
    </div>
  );
}
