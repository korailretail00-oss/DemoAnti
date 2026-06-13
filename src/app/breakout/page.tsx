import type { Metadata, Viewport } from "next";
import BreakoutGame from "@/components/breakout/breakout-game";

export const metadata: Metadata = {
  title: "벽돌깨기 - DemoBoared",
  description: "다양한 아이템이 쏟아지는 벽돌깨기 게임",
};

// 모바일에서 핀치/더블탭 줌을 막아 게임이 앱처럼 동작하도록 설정
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#020617",
};

export default function BreakoutPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-950">
      <BreakoutGame />
    </main>
  );
}
