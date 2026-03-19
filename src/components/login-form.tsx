"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const formSchema = z.object({
  email: z.string().min(1, "이메일을 입력해주세요.").email("올바른 이메일 형식을 입력해주세요."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    // API 통신 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsLoading(false);

    // 로그인 검증 목업
    if (values.email === "test@example.com" && values.password === "password") {
      toast.success("로그인에 성공했습니다.");
    } else {
      toast.error("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-xl bg-white/70 backdrop-blur-lg border-white/20">
      <CardHeader className="space-y-1 flex flex-col items-center">
        <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mb-2 shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">로그인</CardTitle>
        <CardDescription className="text-slate-500 text-center">
          이메일과 비밀번호를 입력해주세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700">이메일</Label>
            <Input 
              id="email"
              placeholder="user@example.com" 
              className="bg-white"
              {...form.register("email")}
              disabled={isLoading} 
            />
            {form.formState.errors.email && (
              <p className="text-sm font-medium text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700">비밀번호</Label>
            <Input 
              id="password"
              type="password" 
              placeholder="••••••••" 
              className="bg-white"
              {...form.register("password")}
              disabled={isLoading} 
            />
            {form.formState.errors.password && (
              <p className="text-sm font-medium text-red-500">{form.formState.errors.password.message}</p>
            )}
          </div>
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-6 transition-all" type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "로그인 중..." : "로그인"}
          </Button>
        </form>
        <div className="mt-5 text-center text-sm">
          <span className="text-slate-500">계정이 없으신가요? </span>
          <Link href="/signup" className="text-indigo-600 hover:text-indigo-700 hover:underline font-semibold transition-colors">
            회원가입하기
          </Link>
        </div>
        <div className="mt-6 text-center text-sm text-slate-500 p-3 bg-slate-100/50 rounded-lg">
          <p className="font-semibold text-slate-700 mb-1">테스트 계정</p>
          <p>test@example.com / password</p>
        </div>
      </CardContent>
    </Card>
  );
}
