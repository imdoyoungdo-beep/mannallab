import Link from "next/link";
import { Button } from "@/components/ui/button";
import MyMeetings from "@/components/MyMeetings";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-yellow-400 mb-6 shadow-lg">
            <span className="text-4xl">📅</span>
          </div>

          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
            우리 만날랩?
          </h1>
          <p className="text-sm font-medium text-yellow-600 mb-6">
            잘 만나는 방법을 연구하는 서비스
          </p>

          <p className="text-gray-500 text-base leading-relaxed">
            친구들과 모임 날짜와 장소를<br />쉽고 빠르게 정해요
          </p>
        </div>

        <Link href="/create" className="block w-full mb-10">
          <Button className="w-full h-14 text-base font-bold rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 shadow-md">
            모임 만들기
          </Button>
        </Link>

        <div className="w-full space-y-3">
          {[
            { icon: "🔗", text: "회원가입 없이 링크 공유로만 약속 잡기" },
            { icon: "📍", text: "중간 지점으로 만날 장소 추천" },
            { icon: "🎯", text: "목적에 맞는 장소 추천" },
          ].map(({ icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 text-left"
            >
              <span className="text-xl shrink-0">{icon}</span>
              <span className="text-sm text-gray-600 font-medium">{text}</span>
            </div>
          ))}
        </div>

        <MyMeetings />
      </div>
    </main>
  );
}
