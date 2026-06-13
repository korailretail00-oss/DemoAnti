import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-100 via-white to-slate-50 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/50 blur-3xl z-0 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-200/50 blur-3xl z-0 pointer-events-none" />
      
      <div className="z-10 w-full flex flex-col items-center justify-center gap-4">
        <LoginForm />
        <Link
          href="/breakout"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
        >
          🧱 벽돌깨기 게임 하러 가기 →
        </Link>
      </div>
    </main>
  );
}
