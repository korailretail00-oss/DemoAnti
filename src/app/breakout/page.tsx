import type { Metadata } from "next";
import BreakoutGame from "@/components/breakout/breakout-game";

export const metadata: Metadata = {
  title: "벽돌깨기 - DemoBoared",
  description: "다양한 아이템이 쏟아지는 벽돌깨기 게임",
};

export default function BreakoutPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 p-4">
      <BreakoutGame />
    </main>
  );
}
