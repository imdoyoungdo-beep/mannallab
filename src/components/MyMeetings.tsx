"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronRight } from "lucide-react";
import { type Meeting, PURPOSE_LABELS } from "@/types";

interface MyMeeting extends Meeting {
  role: "organizer" | "participant";
}

export default function MyMeetings() {
  const [meetings, setMeetings] = useState<MyMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    const ids: { id: string; role: "organizer" | "participant" }[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith("organizer_")) {
        ids.push({ id: key.replace("organizer_", ""), role: "organizer" });
      } else if (key.startsWith("participant_")) {
        ids.push({ id: key.replace("participant_", ""), role: "participant" });
      }
    }

    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    Promise.all(
      ids.map(({ id, role }) =>
        fetch(`/api/meetings/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => (data ? { ...data, role } : null))
      )
    ).then((results) => {
      const valid = results.filter(Boolean) as MyMeeting[];
      valid.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setMeetings(valid);
      setLoading(false);
    });
  }, []);

  if (loading || meetings.length === 0) return null;

  return (
    <div className="w-full mt-8">
      <h2 className="text-sm font-semibold text-gray-500 mb-3">내 모임</h2>
      <div className="space-y-2">
        {meetings.slice(0, visibleCount).map((m) => {
          const isConfirmed = m.status === "confirmed";
          const href = isConfirmed
            ? `/meeting/${m.id}/result`
            : `/meeting/${m.id}${m.role === "organizer" ? "?organizer=true" : ""}`;

          return (
            <Link key={m.id} href={href}>
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isConfirmed
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {isConfirmed ? "완료" : "진행중"}
                    </span>
                    {m.role === "organizer" && (
                      <span className="text-xs text-gray-400">방장</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">{m.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {PURPOSE_LABELS[m.purpose as keyof typeof PURPOSE_LABELS]}
                    {isConfirmed && m.confirmed_date && (
                      <> · {format(new Date(m.confirmed_date), "M월 d일 (EEE)", { locale: ko })}</>
                    )}
                    {!isConfirmed && (
                      <> · {format(new Date(m.created_at), "M월 d일 생성", { locale: ko })}</>
                    )}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 ml-2" />
              </div>
            </Link>
          );
        })}
      </div>

      {visibleCount < meetings.length && (
        <button
          onClick={() => setVisibleCount((c) => c + 3)}
          className="w-full mt-2 py-3 text-sm font-medium text-gray-500 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          더보기 ({meetings.length - visibleCount}개)
        </button>
      )}
    </div>
  );
}
