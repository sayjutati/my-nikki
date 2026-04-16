"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

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

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                router.push("/calendar"); 
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                // メール確認オフなので、登録成功＝即カレンダーへ！
                router.push("/calendar"); 
            }
        } catch (error: any) {
            setMessage("エラー: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-rose-50 text-rose-900 p-4 font-sans">
            <div className="max-w-md w-full p-8 bg-white/90 backdrop-blur-md rounded-3xl shadow-[0_0_40px_rgba(225,29,72,0.15)] border border-rose-100">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-rose-400 mb-2 drop-shadow-sm">My Nikki</h1>
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
                            className="w-full px-5 py-4 bg-rose-50/50 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-rose-900 font-medium transition-all"
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
                            className="w-full px-5 py-4 bg-rose-50/50 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-rose-900 font-medium transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    {message && (
                        <p className={`text-sm text-center font-bold p-3 rounded-xl ${message.includes("エラー") ? "bg-red-100 text-red-600" : "bg-rose-100 text-rose-600"}`}>
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

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm font-bold text-rose-400 hover:text-rose-600 transition-colors underline underline-offset-4"
                    >
                        {isLogin ? "アカウントがない場合はこちらから登録" : "すでにアカウントがある場合はログイン"}
                    </button>
                </div>
            </div>
        </div>
    );
}