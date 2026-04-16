"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Diary = { id: string; title: string; content: string; entry_date: string; created_at: string; image_url?: string; tags?: string };

export default function SearchPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState("");
    const [searchResults, setSearchResults] = useState<Diary[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    useEffect(() => {
        const checkUserAndFetchTags = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/");
                return;
            }
            setUser(session.user);

            // 全ての日記を取得してタグを抽出
            const { data } = await supabase
                .from("diaries")
                .select("tags")
                .eq("user_id", session.user.id);
            
            if (data) {
                const tags = new Set<string>();
                data.forEach(d => {
                    if (d.tags) {
                        d.tags.split(/\s+/).forEach((t: string) => {
                            if (t) tags.add(t.replace(/^#/, ''));
                        });
                    }
                });
                setAvailableTags(Array.from(tags));
            }
            setLoading(false);
        };
        checkUserAndFetchTags();
    }, [router]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!keyword.trim()) return;
        
        setLoading(true);
        const { data } = await supabase
            .from("diaries")
            .select("*")
            .eq("user_id", user.id)
            .or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%,tags.ilike.%${keyword}%`)
            .order("entry_date", { ascending: false });

        if (data) setSearchResults(data);
        setHasSearched(true);
        setLoading(false);
    };

    const handleTagClick = async (tag: string) => {
        setKeyword(tag);
        setLoading(true);
        const { data } = await supabase
            .from("diaries")
            .select("*")
            .eq("user_id", user.id)
            .ilike('tags', `%${tag}%`)
            .order("entry_date", { ascending: false });

        if (data) setSearchResults(data);
        setHasSearched(true);
        setLoading(false);
    };

    if (loading && !hasSearched) return <div className="min-h-screen flex items-center justify-center text-rose-900 bg-rose-50">読み込み中...</div>;

    return (
        <div className="min-h-[100dvh] bg-rose-50 p-4 pb-24 lg:p-8 lg:pb-8 text-rose-900 font-sans relative">
            {/* ヘッダー */}
            <div className="max-w-7xl mx-auto mb-8 bg-white/80 backdrop-blur-md rounded-2xl p-4 flex justify-between items-center border border-rose-100 shadow-[0_0_20px_rgba(225,29,72,0.15)]">
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-rose-400 drop-shadow-sm">
                    🔍 探す
                </h1>
                <Link href="/calendar" className="px-5 py-2 bg-rose-100 text-rose-700 font-bold rounded-full hover:bg-rose-200 transition-colors shadow-sm">
                    カレンダーに戻る
                </Link>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 左側：検索フォームとタグ */}
                <div className="lg:col-span-1 space-y-6">
                    {/* 検索フォーム */}
                    <div className="bg-white rounded-3xl p-6 shadow-[0_0_30px_rgba(225,29,72,0.1)] border border-rose-50">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="キーワードやタグで検索"
                                className="flex-1 px-4 py-3 bg-rose-50/50 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-rose-900 font-medium transition-all"
                            />
                            <button
                                type="submit"
                                className="px-5 py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-all shadow-sm"
                            >
                                検索
                            </button>
                        </form>
                    </div>

                    {/* ハッシュタグ一覧 */}
                    <div className="bg-white rounded-3xl p-6 shadow-[0_0_30px_rgba(225,29,72,0.1)] border border-rose-50">
                        <h2 className="text-lg font-bold text-rose-800 mb-4 border-b-2 border-rose-100 pb-2">🏷️ よく使うタグ</h2>
                        <div className="flex flex-wrap gap-2">
                            {availableTags.length === 0 ? (
                                <p className="text-rose-400 text-sm">まだハッシュタグが使われてないよ</p>
                            ) : (
                                availableTags.map((tag, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleTagClick(tag)}
                                        className="text-sm text-rose-600 bg-white border border-rose-300 hover:bg-rose-500 hover:text-white hover:border-rose-500 px-3 py-1.5 rounded-full font-bold shadow-sm transition-all transform hover:-translate-y-0.5"
                                    >
                                        #{tag}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* 右側：検索結果 */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-[0_0_30px_rgba(225,29,72,0.1)] border border-rose-50 flex flex-col min-h-[50vh]">
                    <h2 className="text-xl font-bold text-rose-800 mb-4 border-b-2 border-rose-100 pb-2">
                        {hasSearched ? `検索結果: ${searchResults.length}件` : "検索結果がここに表示されます"}
                    </h2>
                    
                    <div className="overflow-y-auto flex-1 pr-4 pl-1 py-1 space-y-4 custom-scrollbar">
                        {hasSearched && searchResults.length === 0 && (
                            <p className="text-rose-400 text-center mt-10 font-medium">見つからなかったよ...🥺</p>
                        )}
                        
                        {searchResults.map(diary => (
                            <div key={diary.id} className="p-5 rounded-2xl bg-rose-50 border border-rose-100 shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-rose-700 text-lg">{diary.title || "無題"}</h3>
                                    <Link href={`/diary/${diary.entry_date}`} className="text-xs font-bold text-white bg-rose-400 px-3 py-1.5 rounded-full hover:bg-rose-500 transition-colors shadow-sm">
                                        その日を見る
                                    </Link>
                                </div>
                                <p className="text-sm font-bold text-rose-400 mb-3">{diary.entry_date}</p>
                                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed mb-3 line-clamp-3">{diary.content}</p>
                                
                                {diary.tags && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {diary.tags.split(/\s+/).map((tag, i) => tag ? (
                                            <span key={i} className="text-xs text-rose-600 bg-white border border-rose-200 px-2.5 py-1 rounded-full font-bold shadow-sm">
                                                #{tag.replace(/^#/, '')}
                                            </span>
                                        ) : null)}
                                    </div>
                                )}
                                
                                {diary.image_url && (
                                    <div className="rounded-xl overflow-hidden border border-rose-200 shadow-sm bg-white/50 w-full max-w-sm">
                                        <img src={diary.image_url} alt="画像" className="w-full h-auto object-cover" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* スマホ用ボトムナビゲーション */}
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-rose-100 flex justify-around items-center h-[70px] pb-safe z-50 shadow-[0_-5px_15px_rgba(225,29,72,0.05)]">
                <button onClick={() => router.push("/calendar")} className="flex flex-col items-center justify-center w-full h-full text-rose-400 hover:text-rose-500 hover:bg-rose-50/50 transition-colors">
                    <span className="text-xl mb-0.5">📅</span>
                    <span className="text-[10px] font-bold">カレンダー</span>
                </button>
                {/* 検索タブをアクティブ状態に */}
                <button onClick={() => router.push("/search")} className="flex flex-col items-center justify-center w-full h-full text-rose-500 bg-rose-50/50">
                    <span className="text-xl mb-0.5">🔍</span>
                    <span className="text-[10px] font-bold">探す</span>
                </button>
                <button onClick={() => router.push("/settings")} className="flex flex-col items-center justify-center w-full h-full text-rose-400 hover:text-rose-500 hover:bg-rose-50/50 transition-colors">
                    <span className="text-xl mb-0.5">⚙️</span>
                    <span className="text-[10px] font-bold">設定</span>
                </button>
                <button onClick={handleLogout} className="flex flex-col items-center justify-center w-full h-full text-rose-400 hover:text-rose-500 hover:bg-rose-50/50 transition-colors">
                    <span className="text-xl mb-0.5">🚪</span>
                    <span className="text-[10px] font-bold">ログアウト</span>
                </button>
            </nav>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #fecdd3; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #fda4af; }
                .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
            `}</style>
        </div>
    );
}