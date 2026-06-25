"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, addMonths, startOfDay, eachDayOfInterval, endOfMonth, startOfMonth, getDay } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PURPOSE_LABELS, type MeetingPurpose } from "@/types";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import AddressSearch from "@/components/AddressSearch";

const STEP_LABELS = ["모임 정보", "날짜 선택", "출발지"];

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [organizerName, setOrganizerName] = useState("");
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState<MeetingPurpose | null>(null);

  // Step 2
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  // Step 3
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [noLocation, setNoLocation] = useState(false);

  const [loading, setLoading] = useState(false);

  const today = startOfDay(new Date());
  const oneMonthLater = addMonths(today, 1);
  const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

  const addDates = (newDates: Date[]) => {
    setSelectedDates((prev) => {
      const prevKeys = new Set(prev.map((d) => format(d, "yyyy-MM-dd")));
      const toAdd = newDates.filter((d) => !prevKeys.has(format(d, "yyyy-MM-dd")));
      return [...prev, ...toAdd];
    });
  };

  const selectThisMonth = () => {
    const end = endOfMonth(today) < oneMonthLater ? endOfMonth(today) : oneMonthLater;
    addDates(eachDayOfInterval({ start: today, end }));
  };

  const selectNextMonth = () => {
    const nextStart = startOfMonth(addMonths(today, 1));
    if (nextStart > oneMonthLater) return;
    addDates(eachDayOfInterval({ start: nextStart, end: oneMonthLater }));
  };

  const toggleWeekday = (dayIndex: number) => {
    const allInRange = eachDayOfInterval({ start: today, end: oneMonthLater });
    const matching = allInRange.filter((d) => getDay(d) === dayIndex);
    const matchingKeys = matching.map((d) => format(d, "yyyy-MM-dd"));
    const selectedKeys = new Set(selectedDates.map((d) => format(d, "yyyy-MM-dd")));
    const allSelected = matchingKeys.every((k) => selectedKeys.has(k));
    if (allSelected) {
      setSelectedDates((prev) => prev.filter((d) => !matchingKeys.includes(format(d, "yyyy-MM-dd"))));
    } else {
      addDates(matching);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const key = format(date, "yyyy-MM-dd");
    setSelectedDates((prev) => {
      const exists = prev.some((d) => format(d, "yyyy-MM-dd") === key);
      if (exists) return prev.filter((d) => format(d, "yyyy-MM-dd") !== key);
      return [...prev, date];
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          purpose,
          organizer_name: organizerName,
          date_options: selectedDates.map((d) => format(d, "yyyy-MM-dd")),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem(`organizer_${data.meeting_id}`, data.organizer_token);

      if (!noLocation && lat && lng) {
        await fetch(`/api/meetings/${data.meeting_id}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: organizerName,
            address,
            latitude: lat,
            longitude: lng,
            transport_mode: "transit",
            voted_dates: [],
          }),
        });
      }

      router.push(`/meeting/${data.meeting_id}?organizer=true`);
    } catch {
      toast.error("모임 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        {step === 1 ? (
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
        ) : (
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h1 className="text-xl font-bold">모임 만들기</h1>
          <p className="text-xs text-gray-400">{STEP_LABELS[step - 1]}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-yellow-400" : "bg-gray-200"}`}
          />
        ))}
      </div>

      {/* Step 1: 모임 정보 */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <Label className="text-base font-semibold mb-2 block">내 이름은?</Label>
            <Input
              placeholder="예: 김루미"
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              className="h-12 rounded-xl text-base"
            />
          </div>
          <div>
            <Label className="text-base font-semibold mb-2 block">모임 이름은?</Label>
            <Input
              placeholder="예: 6월 번개 모임"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12 rounded-xl text-base"
            />
          </div>
          <div>
            <Label className="text-base font-semibold mb-3 block">어떤 모임이에요?</Label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(PURPOSE_LABELS) as [MeetingPurpose, string][]).map(([key, label]) => (
                <Card
                  key={key}
                  className={`cursor-pointer transition-all border-2 ${
                    purpose === key ? "border-yellow-400 bg-yellow-50" : "border-gray-100 hover:border-gray-300"
                  }`}
                  onClick={() => setPurpose(key)}
                >
                  <CardContent className="flex items-center justify-center py-5 px-3">
                    <span className="text-base font-medium text-center">{label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <Button
            className="w-full h-14 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-base"
            disabled={!organizerName || !title || !purpose}
            onClick={() => setStep(2)}
          >
            다음
          </Button>
        </div>
      )}

      {/* Step 2: 날짜 선택 */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold mb-1 block">언제 만날 수 있어요?</Label>
            <p className="text-sm text-gray-500 mb-3">여러 날짜를 선택할 수 있어요</p>

            <div className="flex gap-2 mb-3 flex-wrap">
              <button type="button" onClick={selectThisMonth}
                className="px-3 py-1.5 text-xs rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 font-medium hover:bg-yellow-100">
                이번달 전체
              </button>
              <button type="button" onClick={selectNextMonth}
                className="px-3 py-1.5 text-xs rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 font-medium hover:bg-yellow-100">
                다음달 전체
              </button>
              {WEEKDAYS.map((label, i) => (
                <button key={i} type="button" onClick={() => toggleWeekday(i)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-gray-50 border border-gray-200 text-gray-700 font-medium hover:bg-gray-100">
                  매{label}
                </button>
              ))}
            </div>

            <Calendar
              mode="multiple"
              selected={selectedDates}
              onSelect={(dates) => setSelectedDates(dates || [])}
              disabled={(date) => date < today || date > oneMonthLater}
              locale={ko}
              className="rounded-2xl border border-gray-100 w-full [&_[data-selected=true]]:bg-yellow-400 [&_[data-selected=true]]:text-gray-900 [&_[data-today=true]]:border [&_[data-today=true]]:border-yellow-400"
            />
          </div>

          {selectedDates.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">선택된 날짜 ({selectedDates.length}개)</p>
              <div className="flex flex-wrap gap-2">
                {selectedDates
                  .sort((a, b) => a.getTime() - b.getTime())
                  .map((d) => (
                    <Badge
                      key={format(d, "yyyy-MM-dd")}
                      variant="secondary"
                      className="bg-yellow-100 text-gray-700 cursor-pointer"
                      onClick={() => handleDateSelect(d)}
                    >
                      {format(d, "M/d (EEE)", { locale: ko })} ✕
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          <Button
            className="w-full h-14 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-base"
            disabled={selectedDates.length === 0}
            onClick={() => setStep(3)}
          >
            다음
          </Button>
        </div>
      )}

      {/* Step 3: 출발지 선택 */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <Label className="text-base font-semibold mb-1 block">내 출발지는 어디예요?</Label>
            <p className="text-sm text-gray-500 mb-4">입력하면 친구들과의 중간 지점을 계산해드려요</p>

            <div
              className={`transition-opacity ${noLocation ? "opacity-40 pointer-events-none" : ""}`}
            >
              <AddressSearch
                onSelect={(addr, latitude, longitude) => {
                  setAddress(addr);
                  setLat(latitude);
                  setLng(longitude);
                }}
              />
            </div>

            <label className="flex items-center gap-3 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={noLocation}
                onChange={(e) => {
                  setNoLocation(e.target.checked);
                }}
                className="w-5 h-5 rounded accent-yellow-400"
              />
              <span className="text-sm text-gray-600">위치 상관 없음 (중간 지점 계산에서 제외)</span>
            </label>
          </div>

          <Button
            className="w-full h-14 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-base"
            disabled={(!noLocation && !lat) || loading}
            onClick={handleSubmit}
          >
            {loading ? "만드는 중..." : "모임 만들기 🎉"}
          </Button>

          <p className="text-center text-xs text-gray-400">
            출발지를 선택하거나 위치 상관 없음을 체크해주세요
          </p>
        </div>
      )}
    </div>
  );
}
