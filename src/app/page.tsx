import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center">
      <div className="mb-8">
        <div className="text-6xl mb-4">📅</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">우리 만날랩?</h1>
        <p className="text-gray-500 text-base leading-relaxed">
          친구들과 모임 날짜와 장소를<br />쉽고 빠르게 정해요
        </p>
      </div>

      <div className="w-full space-y-3">
        <Link href="/create" className="block">
          <Button className="w-full h-14 text-base font-semibold rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 shadow-md">
            모임 만들기 ✨
          </Button>
        </Link>
      </div>

      <div className="mt-12 text-xs text-gray-400 space-y-1">
        <p>링크 공유만으로 친구 초대</p>
        <p>중간 지점 자동 계산</p>
        <p>목적에 맞는 장소 추천</p>
      </div>
    </main>
  );
}
