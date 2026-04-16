"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Diary = { id: string; title: string; content: string; entry_date: string; created_at: string; image_url?: string; tags?: string };

export default function SearchPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // 検索用のステート
    const [keyword, setKeyword] = useState("");
    const [searchResults, setSearchResults] = useState<Diary[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [message, setMessage] = useState("");

    // 今まで使ったハッシュタグの一覧を保存するステート
    const [availableTags, setAvailableTags] = useState<string[]>([]);

    const router = useRouter();

    useEffect(() => {
        const checkUserAndFetchTags = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/");
                return;
            }
            setUser(session.user);

            // 過去の日記からハッシュタグを全部集める処理
            const { data } = await supabase
                .from("diaries")
                .select("tags")
                .eq("user_id", session.user.id);
            
            if (data) {
                const tagsSet = new Set<string>(); // 重複をなくすためのSet
                data.forEach(d => {
                    if (d.tags) {
                        // 【修正】(tag: string) と書いて「これは文字だよ」と教えてあげる
                        d.tags.split(/\s+/).forEach((tag: string) => {
                            if (tag) tagsSet.add(tag.replace(/^#/, '')); // #がついてたら消して統一
                        });
                    }
                });
                setAvailableTags(Array.from(tagsSet));
            }
            setLoading(false);
        };
        checkUserAndFetchTags();
    }, [router]);

    // キーワードを受け取って検索を実行する関数（ボタンからもタグからも呼べるようにした）
    const executeSearch = async (searchWord: string) => {
        if (!searchWord.trim()) {
            setSearchResults([]);
            setMessage("");
            return;
        }

        setSearchLoading(true);
        setMessage("");

        try {
            const { data, error } = await supabase
                .from("diaries")
                .select("*")
                .eq("user_id", user.id)
                .or(`title.ilike.%${searchWord}%,content.ilike.%${searchWord}%,tags.ilike.%${searchWord}%`)
                .order('entry_date', { ascending: false });

            if (error) throw error;
            
            setSearchResults(data || []);
            if (data?.length === 0) {
                setMessage("見つからなかったよ 😢");
            } else {
                setMessage(`${data?.length}件見つかったよ！🎉`);
            }
        } catch (error: any) {
            setMessage("検索エラー: " + error.message);
        } finally {
            setSearchLoading(false);
        }
    };

    // 検索ボタンを押したときの処理
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        executeSearch(keyword);
    };

    // ハッシュタグをクリックしたときの処理
    const handleTagClick = (tag: string) => {
        setKeyword(tag); // 検索ボックスにタグを入れる
        executeSearch(tag); // すぐに検索実行！
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-rose-900 bg-rose-50">読み込み中...</div>;

    return (
        <div className="min-h-screen bg-rose-50 p-4 lg:p-8 text-rose-900 font-sans">
            {/* ヘッダー */}
            <div className="max-w-7xl mx-auto mb-8 bg-white/80 backdrop-blur-md rounded-2xl p-4 flex justify-between items-center border border-rose-100 shadow-[0_0_20px_rgba(225,29,72,0.15)]">
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-rose-400 drop-shadow-sm">
                    🔍 日記を探す
                </h1>
                <Link href="/calendar" className="px-5 py-2 bg-rose-100 text-rose-700 font-bold rounded-full hover:bg-rose-200 transition-colors shadow-sm">
                    カレンダーに戻る
                </Link>
            </div>

            {/* 2ペインレイアウトに変更 */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 左側：検索結果 (3列中2列を使用) */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-[0_0_30px_rgba(225,29,72,0.1)] border border-rose-50 flex flex-col h-[75vh]">
                    <h2 className="text-xl font-bold text-rose-800 mb-4 border-b-2 border-rose-100 pb-2">検索結果</h2>
                    
                    {message && (
                        <p className="text-center font-bold text-rose-600 mb-4">{message}</p>
                    )}

                    <div className="overflow-y-auto flex-1 pr-4 pl-1 py-1 space-y-4 custom-scrollbar">
                        {searchResults.length === 0 && !message && (
                            <p className="text-rose-400 text-center mt-10 font-medium">右からキーワードかタグを選んで探してみてね！</p>
                        )}
                        
                        {searchResults.map((diary) => (
                            <div key={diary.id} className="p-5 rounded-2xl border bg-rose-50 border-rose-100 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-rose-700 text-lg flex-1 mr-4">{diary.title || "無題"}</h3>
                                    <div className="text-sm font-black text-rose-500 bg-white px-3 py-1 rounded-lg shadow-sm border border-rose-100 shrink-0">
                                        {diary.entry_date}
                                    </div>
                                </div>
                                
                                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed mb-3 flex-1">{diary.content}</p>
                                
                                {/* 検索結果にもタグを表示 */}
                                {diary.tags && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {diary.tags.split(/\s+/).map((tag, i) => tag ? (
                                            <span key={i} className="text-xs text-rose-600 bg-white/60 border border-rose-200 px-2 py-0.5 rounded-full font-bold">
                                                #{tag.replace(/^#/, '')}
                                            </span>
                                        ) : null)}
                                    </div>
                                )}
                                
                                {diary.image_url && (
                                    <div className="mt-2 rounded-xl overflow-hidden border border-rose-200 shadow-sm bg-white/50 w-full sm:w-1/2">
                                        <img src={diary.image_url} alt="日記の画像" className="w-full h-auto max-h-48 object-contain" />
                                    </div>
                                )}

                                <div className="mt-4 pt-3 border-t border-rose-200/50 text-right">
                                    <Link 
                                        href={`/diary/${diary.entry_date}`}
                                        className="text-sm font-bold text-rose-500 hover:text-rose-700 transition-colors inline-block"
                                    >
                                        この日の日記を見る ＞
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 右側：検索入力・タグ一覧 (3列中1列を使用) */}
                <div className="lg:col-span-1 bg-white rounded-3xl p-6 shadow-[0_0_30px_rgba(159,18,57,0.15)] border border-rose-100 flex flex-col h-[75vh]">
                    <h2 className="text-xl font-bold text-rose-800 mb-4 border-b-2 border-rose-100 pb-2">キーワードで探す</h2>
                    
                    <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 mb-8 shrink-0">
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="検索ワードを入力..."
                            className="w-full px-5 py-4 bg-rose-50/50 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-rose-900 font-medium transition-all"
                        />
                        <button
                            type="submit"
                            disabled={searchLoading || !keyword.trim()}
                            className="w-full py-4 px-6 bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold text-lg rounded-xl hover:from-rose-500 hover:to-rose-400 focus:outline-none focus:ring-4 focus:ring-rose-300 disabled:opacity-50 transition-all shadow-md"
                        >
                            {searchLoading ? "検索中..." : "検索する"}
                        </button>
                    </form>

                    <h2 className="text-xl font-bold text-rose-800 mb-4 border-b-2 border-rose-100 pb-2 shrink-0">ハッシュタグから探す</h2>
                    
                    {/* タグ一覧 */}
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-wrap gap-2 content-start">
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

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #fecdd3; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #fda4af; }
            `}</style>
        </div>
    );
}