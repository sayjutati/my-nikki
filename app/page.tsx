"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const router = useRouter();

    // すでにログイン状態なら、自動でカレンダー画面に飛ばす
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.push("/calendar");
            }
        };
        checkUser();
    }, [router]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        if (isLogin) {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setMessage(error.message);
            } else {
                router.push("/calendar"); 
            }
        } else {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) {
                setMessage(error.message);
            } else {
                // 【修正】メール認証あり版！登録後はメールを確認するように促す！
                setMessage("確認メールを送信しました！メールのリンクをクリックして登録を完了してください。");
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-rose-50 text-rose-900 p-4">
            <div className="max-w-md w-full p-8 bg-white rounded-3xl shadow-[0_0_40px_rgba(159,18,57,0.15)] border border-rose-100">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-rose-400 mb-2">My Nikki</h1>
                    <h2 className="text-lg font-bold text-rose-700">
                        {isLogin ? "おかえりなさい" : "はじめまして"}
                    </h2>
                </div>
                
                <form onSubmit={handleAuth} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-rose-800 mb-2">メールアドレス</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-rose-900 font-medium transition-all"
                            placeholder="you@example.com"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-rose-800 mb-2">パスワード</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-rose-900 font-medium transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    {message && (
                        <p className={`text-sm text-center font-bold p-3 rounded-xl ${message.includes("確認") ? "bg-rose-100 text-rose-600" : "bg-red-100 text-red-600"}`}>
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 px-6 bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold text-lg rounded-xl hover:from-rose-500 hover:to-rose-400 focus:outline-none focus:ring-4 focus:ring-rose-300 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(225,29,72,0.4)] transform hover:-translate-y-0.5"
                    >
                        {loading ? "処理中..." : isLogin ? "ログイン" : "登録する"}
                    </button>
                </form>

                <div className="mt-8 text-center flex flex-col gap-4">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm font-bold text-rose-400 hover:text-rose-600 transition-colors"
                    >
                        {isLogin ? "アカウントがない場合はこちらから登録" : "すでにアカウントがある場合はログイン"}
                    </button>
                    
                    <Link href="/privacy" className="text-xs font-bold text-rose-300 hover:text-rose-500 transition-colors underline underline-offset-4">
                        プライバシーポリシー
                    </Link>
                </div>
            </div>
        </div>
    );
}