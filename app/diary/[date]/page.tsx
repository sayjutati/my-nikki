"use client";

import { useEffect, useState, use, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Params = Promise<{ date: string }>;
type Diary = { id: string; title: string; content: string; created_at: string; image_url?: string; tags?: string };

// Next.jsの仕様上、useSearchParamsを使うときはラップする必要がある
export default function DiaryPageWrapper(props: { params: Params }) {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-rose-900 bg-rose-50">読み込み中...</div>}>
            <DiaryPage params={props.params} />
        </Suspense>
    );
}

function DiaryPage(props: { params: Params }) {
    const params = use(props.params);
    const dateParam = params.date;
    
    // URLにくっついている他人のID（?user=...）を取得する
    const searchParams = useSearchParams();
    const sharedUserId = searchParams.get('user');
    const isSharedMode = !!sharedUserId; // URLに他人のIDがあれば閲覧専用モードになる

    const [user, setUser] = useState<any>(null);
    const [diaries, setDiaries] = useState<Diary[]>([]);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tagsInput, setTagsInput] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const router = useRouter();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    const fetchUserAndDiaries = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push("/");
            return;
        }
        setUser(session.user);

        // 他人のIDがあればそっちを取得、なければ自分のを取得
        const targetUserId = sharedUserId || session.user.id;

        const { data } = await supabase
            .from("diaries")
            .select("*")
            .eq("user_id", targetUserId)
            .eq("entry_date", dateParam)
            .order('created_at', { ascending: false });

        if (data) setDiaries(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchUserAndDiaries();
    }, [dateParam, router, sharedUserId]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setMessage("エラー：画像サイズは1枚5MB以下にしてね！");
            e.target.value = ''; 
            return;
        }
        const isEditingWithImage = editingId ? diaries.find(d => d.id === editingId)?.image_url : false;
        const currentImageCount = diaries.filter(d => d.image_url).length;
        if (!isEditingWithImage && currentImageCount >= 2) {
            setMessage("エラー：1日に投稿できる画像は2枚までだよ！");
            e.target.value = ''; 
            return;
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file)); 
        setMessage("");
    };

    const handleEditClick = (diary: Diary) => {
        if (isSharedMode) return; // 閲覧モードでは何もしない
        setEditingId(diary.id);
        setTitle(diary.title || "");
        setContent(diary.content || "");
        setTagsInput(diary.tags || ""); 
        setImagePreview(diary.image_url || null); 
        setImageFile(null); 
        setMessage("");
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setTitle("");
        setContent("");
        setTagsInput(""); 
        setImageFile(null);
        setImagePreview(null);
        setMessage("");
    };

    const handleDeleteConfirm = async (id: string) => {
        if (isSharedMode) return;
        setSaving(true);
        setMessage("");
        try {
            const { error } = await supabase.from("diaries").delete().eq("id", id);
            if (error) throw error;
            setMessage("日記を削除しました。");
            setDeletingId(null);
            if (editingId === id) handleCancelEdit();
            await fetchUserAndDiaries();
        } catch (error: any) {
            setMessage("削除に失敗しました: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        if (isSharedMode) return; // 閲覧モードでは保存させない
        if (!title.trim() && !content.trim() && !imageFile && !imagePreview && !tagsInput.trim()) return;
        setSaving(true);
        setMessage("");

        try {
            await supabase.from("profiles").upsert([{ id: user.id, email: user.email }]);
            let finalImageUrl = editingId ? diaries.find(d => d.id === editingId)?.image_url || null : null;

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `${user.id}/${dateParam}/${fileName}`;
                const { error: uploadError } = await supabase.storage.from('diary-images').upload(filePath, imageFile);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('diary-images').getPublicUrl(filePath);
                finalImageUrl = publicUrl;
            }

            const saveData: any = { title, content, tags: tagsInput, image_url: finalImageUrl };

            if (editingId) {
                const { error } = await supabase.from("diaries").update(saveData).eq("id", editingId);
                if (error) throw error;
                setMessage("日記を更新しました！");
                setEditingId(null);
            } else {
                saveData.user_id = user.id;
                saveData.entry_date = dateParam;
                const { error } = await supabase.from("diaries").insert([saveData]);
                if (error) throw error;
                setMessage("日記を追加しました！");
            }
            
            setTitle("");
            setContent("");
            setTagsInput(""); 
            setImageFile(null);
            setImagePreview(null);
            await fetchUserAndDiaries();
        } catch (error: any) {
            setMessage("保存に失敗しました: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-rose-900 bg-rose-50">読み込み中...</div>;

    const imageCount = diaries.filter(d => d.image_url).length;

    return (
        <div className="min-h-[100dvh] bg-rose-50 p-4 pb-24 lg:p-8 lg:pb-8 text-rose-900 font-sans relative">
            <div className="max-w-7xl mx-auto mb-8 bg-white/80 backdrop-blur-md rounded-2xl p-4 flex justify-between items-center border border-rose-100 shadow-[0_0_20px_rgba(225,29,72,0.15)]">
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-rose-400 drop-shadow-sm flex items-center gap-2">
                    {dateParam} の日記 {isSharedMode && <span className="text-sm bg-rose-100 text-rose-600 px-3 py-1 rounded-full border border-rose-200">👀 閲覧モード</span>}
                </h1>
                <Link href="/calendar" className="px-5 py-2 bg-rose-100 text-rose-700 font-bold rounded-full hover:bg-rose-200 transition-colors shadow-sm">
                    カレンダーに戻る
                </Link>
            </div>

            {/* 他人の日記を見ているときは、右側の「書くフォーム」を消して、左側を画面の真ん中にデカく表示する */}
            <div className={`mx-auto grid grid-cols-1 ${isSharedMode ? 'max-w-4xl' : 'max-w-7xl lg:grid-cols-2'} gap-8`}>
                
                {/* 左側：入力履歴（閲覧時はこれがメインになる） */}
                {/* 【変更】スマホでは下に（order-2）、PCでは左に（lg:order-1）なるように追加。高さもスマホ用に調整。 */}
                <div className="order-2 lg:order-1 bg-white rounded-3xl p-6 shadow-[0_0_30px_rgba(225,29,72,0.1)] border border-rose-50 flex flex-col h-[60vh] lg:h-[75vh]">
                    <h2 className="text-xl font-bold text-rose-800 mb-4 border-b-2 border-rose-100 pb-2">
                        {isSharedMode ? "相手の日記" : "過去の入力履歴"}
                    </h2>
                    <div className="overflow-y-auto flex-1 pr-4 pl-1 py-1 space-y-4 custom-scrollbar">
                        {diaries.length === 0 ? (
                            <p className="text-rose-400 text-center mt-10 font-medium">
                                {isSharedMode ? "この日の日記はまだ書かれていないみたい！" : "まだ日記がありません。右から追加してみてね！"}
                            </p>
                        ) : (
                            diaries.map((diary) => (
                                <div key={diary.id} className={`p-5 rounded-2xl border transition-all flex flex-col ${editingId === diary.id ? 'bg-rose-100 border-rose-300 shadow-md' : 'bg-rose-50 border-rose-100 shadow-sm hover:shadow-md hover:-translate-y-1'}`}>
                                    {diary.title && <h3 className="font-bold text-rose-700 text-lg mb-2">{diary.title}</h3>}
                                    <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed flex-1">{diary.content}</p>
                                    
                                    {diary.tags && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {diary.tags.split(/\s+/).map((tag, i) => tag ? (
                                                <span key={i} className="text-xs text-rose-600 bg-white/60 border border-rose-200 px-2.5 py-1 rounded-full font-bold shadow-sm">
                                                    #{tag.replace(/^#/, '')}
                                                </span>
                                            ) : null)}
                                        </div>
                                    )}

                                    {diary.image_url && (
                                        <div className="mt-3 rounded-xl overflow-hidden border border-rose-200 shadow-sm bg-white/50">
                                            <img src={diary.image_url} alt="日記の画像" className="w-full h-auto max-h-72 object-contain" />
                                        </div>
                                    )}
                                    
                                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-rose-200/50">
                                        <div className="text-xs font-bold text-rose-400">
                                            {new Date(diary.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        
                                        {/* 閲覧モードの時は「編集」「削除」ボタンを隠す */}
                                        {!isSharedMode && (
                                            deletingId === diary.id ? (
                                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-red-100">
                                                    <span className="text-xs font-bold text-red-500">本当に消す？</span>
                                                    <button onClick={() => handleDeleteConfirm(diary.id)} className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 font-bold">はい</button>
                                                    <button onClick={() => setDeletingId(null)} className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-bold">やめる</button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-3">
                                                    <button onClick={() => handleEditClick(diary)} className="text-sm font-bold text-rose-500 hover:text-rose-700 transition-colors">編集</button>
                                                    <button onClick={() => setDeletingId(diary.id)} className="text-sm font-bold text-red-400 hover:text-red-600 transition-colors">削除</button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 右側：新しく書く (閲覧モードのときは丸ごと非表示！) */}
                {/* 【変更】スマホでは上に（order-1）、PCでは右に（lg:order-2）なるように追加。高さもスマホ用に調整。 */}
                {!isSharedMode && (
                    <div className="order-1 lg:order-2 bg-white rounded-3xl p-6 shadow-[0_0_30px_rgba(159,18,57,0.15)] border border-rose-100 flex flex-col h-[70vh] lg:h-[75vh]">
                        <h2 className={`text-xl font-bold mb-4 border-b-2 pb-2 flex justify-between items-center ${editingId ? 'text-rose-600 border-rose-200' : 'text-rose-800 border-rose-100'}`}>
                            <span>{editingId ? "✍️ 日記を編集する" : "新しく書く"}</span>
                            <span className="text-sm font-bold text-rose-400 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                                今日の画像: {imageCount}/2
                            </span>
                        </h2>
                        
                        <div className="flex-1 flex flex-col space-y-4 mt-2 overflow-y-auto pr-4 pl-1 pb-2 pt-1 custom-scrollbar">
                            <div>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={`w-full px-5 py-4 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-rose-900 font-medium transition-all ${editingId ? 'bg-white border-rose-300 focus:ring-rose-500 shadow-inner' : 'bg-rose-50/50 border-rose-200 focus:ring-rose-400 placeholder-rose-300'}`} placeholder="タイトル（今日の気分など）" />
                            </div>

                            <div>
                                <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className={`w-full px-5 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-rose-900 font-medium transition-all text-sm ${editingId ? 'bg-white border-rose-300 focus:ring-rose-500 shadow-inner' : 'bg-rose-50/50 border-rose-200 focus:ring-rose-400 placeholder-rose-300'}`} placeholder="ハッシュタグ（例: 原神 ガチャ 最高）※スペース区切り" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="flex items-center justify-center w-full px-4 py-3 bg-white border-2 border-dashed border-rose-300 rounded-xl cursor-pointer hover:bg-rose-50 transition-colors">
                                    <span className="text-sm font-bold text-rose-500">📸 画像を追加する (1枚5MB / 1日2枚まで)</span>
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>
                                {imagePreview && (
                                    <div className="relative rounded-xl overflow-hidden border border-rose-200 shadow-sm mt-2 bg-rose-50/50">
                                        <img src={imagePreview} alt="プレビュー" className="w-full h-auto max-h-48 object-contain" />
                                        <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70 font-bold">×</button>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col min-h-[150px]">
                                <textarea value={content} onChange={(e) => setContent(e.target.value)} className={`flex-1 w-full px-5 py-4 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-rose-900 resize-none transition-all leading-relaxed ${editingId ? 'bg-white border-rose-300 focus:ring-rose-500 shadow-inner' : 'bg-rose-50/50 border-rose-200 focus:ring-rose-400 placeholder-rose-300'}`} placeholder="ここにあったことや思ったことを書く..." />
                            </div>

                            {message && (
                                <div className={`p-3 rounded-xl text-sm font-bold text-center ${message.includes("エラー") || message.includes("失敗") ? "bg-red-100 text-red-600" : "bg-rose-100 text-rose-600"}`}>
                                    {message}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                {editingId && (
                                    <button onClick={handleCancelEdit} className="w-1/3 py-4 px-2 bg-rose-100 text-rose-600 font-bold text-lg rounded-xl hover:bg-rose-200 focus:outline-none transition-all">やめる</button>
                                )}
                                <button onClick={handleSave} disabled={saving || (!title.trim() && !content.trim() && !imageFile && !imagePreview && !tagsInput.trim())} className={`py-4 px-6 bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold text-lg rounded-xl hover:from-rose-500 hover:to-rose-400 focus:outline-none focus:ring-4 focus:ring-rose-300 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:shadow-[0_0_25px_rgba(225,29,72,0.6)] transform hover:-translate-y-0.5 ${editingId ? 'w-2/3' : 'w-full'}`}>
                                    {saving ? "処理中..." : editingId ? "更新する" : "追加する"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* スマホ用ボトムナビゲーション */}
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-rose-100 flex justify-around items-center h-[70px] pb-safe z-50 shadow-[0_-5px_15px_rgba(225,29,72,0.05)]">
                <button onClick={() => router.push("/calendar")} className="flex flex-col items-center justify-center w-full h-full text-rose-400 hover:text-rose-500 hover:bg-rose-50/50 transition-colors">
                    <span className="text-xl mb-0.5">📅</span>
                    <span className="text-[10px] font-bold">カレンダー</span>
                </button>
                <button onClick={() => router.push("/search")} className="flex flex-col items-center justify-center w-full h-full text-rose-400 hover:text-rose-500 hover:bg-rose-50/50 transition-colors">
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