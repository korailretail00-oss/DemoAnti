"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  name: z.string().min(2, "이름은 2글자 이상이어야 합니다."),
  email: z.string().min(1, "이메일을 입력해주세요.").email("올바른 이메일 형식을 입력해주세요."),
  password: z.string().min(6, "비밀번호는 6자리 이상이어야 합니다."),
  passwordConfirm: z.string().min(1, "비밀번호 확인을 입력해주세요."),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "비밀번호가 일치하지 않습니다.",
  path: ["passwordConfirm"],
});

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      passwordConfirm: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    // API 통신 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsLoading(false);

    toast.success("회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.");
    setTimeout(() => {
      router.push("/");
    }, 1500);
  }

  return (
    <Card className="w-full max-w-sm shadow-xl bg-white/70 backdrop-blur-lg border-white/20">
      <CardHeader className="space-y-1 flex flex-col items-center">
        <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mb-2 shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">회원가입</CardTitle>
        <CardDescription className="text-slate-500 text-center">
          새로운 계정을 생성하기 위한 정보를 입력해주세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-700">이름</Label>
            <Input 
              id="name"
              placeholder="홍길동" 
              className="bg-white"
              {...form.register("name")}
              disabled={isLoading} 
            />
            {form.formState.errors.name && (
              <p className="text-sm font-medium text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700">이메일</Label>
            <Input 
              id="email"
              type="email"
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
          <div className="space-y-2">
            <Label htmlFor="passwordConfirm" className="text-slate-700">비밀번호 확인</Label>
            <Input 
              id="passwordConfirm"
              type="password" 
              placeholder="••••••••" 
              className="bg-white"
              {...form.register("passwordConfirm")}
              disabled={isLoading} 
            />
            {form.formState.errors.passwordConfirm && (
              <p className="text-sm font-medium text-red-500">{form.formState.errors.passwordConfirm.message}</p>
            )}
          </div>
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-6 transition-all" type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "가입 처리 중..." : "가입하기"}
          </Button>
        </form>
        <div className="mt-5 text-center text-sm">
          <span className="text-slate-500">이미 계정이 있으신가요? </span>
          <Link href="/" className="text-indigo-600 hover:text-indigo-700 hover:underline font-semibold transition-colors">
            로그인하기
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
