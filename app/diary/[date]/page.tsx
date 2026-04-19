"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

type Diary = {
    id: string;
    title: string;
    content: string;
    entry_date: string;
    created_at: string;
    image_url?: string;
    tags?: string;
};

// Next.jsの仕様に合わせてSuspenseで囲むための準備
export default function DiaryPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-rose-900 bg-rose-50">読み込み中...</div>}>
            <DiaryContent />
        </Suspense>
    );
}

function DiaryContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const date = params.date as string;
    const viewingUser = searchParams.get("user");
    
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [diaries, setDiaries] = useState<Diary[]>([]);
    
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tagsInput, setTagsInput] = useState("");
    
    // 【変更】画像を複数枚対応にするためのステート！
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    
    const [isSharedMode, setIsSharedMode] = useState(false);
    const [message, setMessage] = useState("");

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
        
        const targetUserId = viewingUser || session.user.id;
        setIsSharedMode(targetUserId !== session.user.id);

        const { data } = await supabase
            .from("diaries")
            .select("*")
            .eq("user_id", targetUserId)
            .eq("entry_date", date)
            .order("created_at", { ascending: false }); // 履歴は上が新しい順にする
            
        if (data) setDiaries(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchUserAndDiaries();
    }, [date, viewingUser]);

    // 【変更】画像を複数選んだ時の処理（2枚まで ＆ 5MB制限）
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            
            // 最大2枚までに制限
            if (imagePreviews.length + files.length > 2) {
                setMessage("📸 画像は1つの日記につき最大2枚までです！");
                setTimeout(() => setMessage(""), 3000);
                return;
            }

            // 5MBのサイズ制限チェック
            const MAX_SIZE = 5 * 1024 * 1024; // 5MB
            const validFiles = files.filter(file => {
                if (file.size > MAX_SIZE) {
                    setMessage(`📸 「${file.name}」は5MBを超えているため追加できません！`);
                    setTimeout(() => setMessage(""), 4000);
                    return false;
                }
                return true;
            });

            if (validFiles.length === 0) return;

            setImageFiles(prev => [...prev, ...validFiles]);

            const newPreviews = validFiles.map(f => URL.createObjectURL(f));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    // 【追加】選んだ画像をプレビューから消す処理
    const removePreview = (indexToRemove: number) => {
        const urlToRemove = imagePreviews[indexToRemove];
        setImagePreviews(prev => prev.filter((_, i) => i !== indexToRemove));

        if (urlToRemove.startsWith("blob:")) {
            const blobPreviews = imagePreviews.filter(url => url.startsWith("blob:"));
            const blobIndex = blobPreviews.indexOf(urlToRemove);
            if (blobIndex !== -1) {
                setImageFiles(prev => prev.filter((_, i) => i !== blobIndex));
            }
        }
    };

    const handleSave = async () => {
        if (!title.trim() && !content.trim() && imagePreviews.length === 0) return;
        setSaving(true);
        setMessage("");

        try {
            let uploadedUrls: string[] = [];

            // すでにプレビューに残っている既存の画像URLをキープ（編集時用）
            const existingUrls = imagePreviews.filter(url => url.startsWith("http"));
            uploadedUrls = [...existingUrls];

            // 新しく追加されたファイルを1枚ずつアップロード
            for (const file of imageFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('diary-images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('diary-images')
                    .getPublicUrl(filePath);
                
                uploadedUrls.push(publicUrl);
            }

            // 複数枚のURLをカンマ(,)区切りで1つの文字列にくっつける魔法
            const finalImageUrl = uploadedUrls.length > 0 ? uploadedUrls.join(',') : null;

            const diaryData = {
                user_id: user.id,
                entry_date: date,
                title,
                content,
                tags: tagsInput,
                image_url: finalImageUrl
            };

            if (editingId) {
                const { error } = await supabase.from("diaries").update(diaryData).eq("id", editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("diaries").insert([diaryData]);
                if (error) throw error;
            }

            setTitle("");
            setContent("");
            setTagsInput("");
            setImageFiles([]);
            setImagePreviews([]);
            setEditingId(null);
            fetchUserAndDiaries();
            
        } catch (error: any) {
            setMessage("エラー: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEditClick = (diary: Diary) => {
        setEditingId(diary.id);
        setTitle(diary.title || "");
        setContent(diary.content || "");
        setTagsInput(diary.tags || "");
        
        setImageFiles([]);
        if (diary.image_url) {
            setImagePreviews(diary.image_url.split(','));
        } else {
            setImagePreviews([]);
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setTitle("");
        setContent("");
        setTagsInput("");
        setImageFiles([]);
        setImagePreviews([]);
    };

    const handleDeleteConfirm = async (id: string) => {
        await supabase.from("diaries").delete().eq("id", id);
        setDeletingId(null);
        fetchUserAndDiaries();
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-rose-900 bg-rose-50">読み込み中...</div>;

    const formattedDate = new Date(date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="min-h-[100dvh] bg-rose-50 p-4 pb-24 lg:p-8 lg:pb-8 text-rose-900 font-sans relative">
            {/* ヘッダー */}
            <div className="max-w-7xl mx-auto mb-8 bg-white/80 backdrop-blur-md rounded-2xl p-4 flex justify-between items-center border border-rose-100 shadow-[0_0_20px_rgba(225,29,72,0.15)]">
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-rose-400 drop-shadow-sm">
                    {formattedDate} の日記
                </h1>
                <Link href="/calendar" className="px-5 py-2 bg-rose-100 text-rose-700 font-bold rounded-full hover:bg-rose-200 transition-colors shadow-sm hidden sm:block">
                    カレンダーに戻る
                </Link>
            </div>

            <div className={`mx-auto grid grid-cols-1 ${isSharedMode ? 'max-w-4xl' : 'max-w-7xl lg:grid-cols-2'} gap-8`}>
                
                {/* 左側（スマホでは下）：入力履歴 */}
                <div className="order-2 lg:order-1 bg-white rounded-3xl p-6 shadow-[0_0_30px_rgba(225,29,72,0.1)] border border-rose-50 flex flex-col h-[60vh] lg:h-[75vh]">
                    <h2 className="text-xl font-bold text-rose-800 mb-4 border-b-2 border-rose-100 pb-2">
                        {isSharedMode ? "相手の日記" : "過去の入力履歴"}
                    </h2>
                    <div className="overflow-y-auto flex-1 pr-4 pl-1 py-1 space-y-4 custom-scrollbar">
                        {diaries.length === 0 ? (
                            <p className="text-rose-400 text-center mt-10 font-medium">まだ日記がありません。{isSharedMode ? "" : "書いてみよう！"}</p>
                        ) : (
                            diaries.map(diary => (
                                <div key={diary.id} className="p-5 rounded-2xl bg-rose-50 border border-rose-100 shadow-sm hover:shadow-md transition-all">
                                    <h3 className="font-bold text-rose-700 text-lg mb-2">{diary.title || "無題"}</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed mb-3">{diary.content}</p>
                                    
                                    {/* タグの表示 */}
                                    {diary.tags && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {diary.tags.split(/\s+/).map((tag, i) => tag ? (
                                                <span key={i} className="text-xs text-rose-600 bg-white border border-rose-200 px-2.5 py-1 rounded-full font-bold shadow-sm">
                                                    #{tag.replace(/^#/, '')}
                                                </span>
                                            ) : null)}
                                        </div>
                                    )}

                                    {/* 【変更】画像が複数あったらグリッドで綺麗に並べる */}
                                    {diary.image_url && (
                                        <div className={`grid gap-2 mb-3 ${diary.image_url.split(',').length === 1 ? 'grid-cols-1 max-w-sm' : 'grid-cols-2'}`}>
                                            {diary.image_url.split(',').map((url, i) => (
                                                <div key={i} className="rounded-xl overflow-hidden border border-rose-200 shadow-sm bg-white/50">
                                                    <img src={url} alt={`画像 ${i + 1}`} className="w-full h-auto max-h-64 object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    <div className="text-right flex justify-end items-center gap-3 mt-2">
                                        <span className="text-xs text-rose-300 font-bold">{new Date(diary.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
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

                {/* 右側（スマホでは上）：新しく書く */}
                {!isSharedMode && (
                    <div className="order-1 lg:order-2 bg-white rounded-3xl p-6 shadow-[0_0_30px_rgba(159,18,57,0.15)] border border-rose-100 flex flex-col h-[70vh] lg:h-[75vh]">
                        <h2 className={`text-xl font-bold mb-4 border-b-2 pb-2 flex justify-between items-center ${editingId ? 'text-rose-600 border-rose-200' : 'text-rose-800 border-rose-100'}`}>
                            <span>{editingId ? "✍️ 日記を編集する" : "新しく書く"}</span>
                            <span className="text-sm font-bold text-rose-400 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                                画像: {imagePreviews.length}/2
                            </span>
                        </h2>
                        
                        <div className="flex-1 flex flex-col space-y-4 mt-2 overflow-y-auto pr-4 pl-1 pb-2 pt-1 custom-scrollbar">
                            <input
                                type="text"
                                placeholder="タイトル (オプション)"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-5 py-3 bg-rose-50/50 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-rose-900 font-bold transition-all"
                            />
                            
                            <textarea
                                placeholder="今日あったことや、感じたことを自由に書いてね ✨"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full flex-1 min-h-[150px] px-5 py-4 bg-rose-50/50 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-rose-900 resize-none font-medium transition-all"
                            />
                            
                            <input
                                type="text"
                                placeholder="ハッシュタグ（例: #カフェ #お散歩 スペース区切り）"
                                value={tagsInput}
                                onChange={(e) => setTagsInput(e.target.value)}
                                className="w-full px-5 py-3 bg-rose-50/50 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-rose-900 font-bold transition-all text-sm"
                            />

                            <div>
                                {/* 【変更】複数選べるけど、2枚制限をかける */}
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    multiple
                                    onChange={handleImageChange} 
                                    className="hidden" 
                                    id="image-upload" 
                                    disabled={imagePreviews.length >= 2}
                                />
                                <label 
                                    htmlFor="image-upload" 
                                    className={`inline-block px-5 py-3 font-bold rounded-xl cursor-pointer transition-all shadow-sm ${imagePreviews.length >= 2 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'}`}
                                >
                                    📸 写真を追加する
                                </label>
                                
                                {/* 複数画像のプレビュー */}
                                {imagePreviews.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {imagePreviews.map((url, i) => (
                                            <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-rose-200 shadow-sm">
                                                <img src={url} alt={`プレビュー ${i+1}`} className="w-full h-full object-cover" />
                                                <button 
                                                    onClick={() => removePreview(i)} 
                                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/70"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {message && (
                                <p className="text-sm font-bold text-rose-500 text-center bg-rose-50 py-2 rounded-lg">{message}</p>
                            )}

                            <div className="flex gap-3 pt-2">
                                {editingId && (
                                    <button onClick={handleCancelEdit} className="w-1/3 py-4 px-2 bg-rose-100 text-rose-600 font-bold text-lg rounded-xl hover:bg-rose-200 focus:outline-none transition-all">やめる</button>
                                )}
                                <button 
                                    onClick={handleSave} 
                                    disabled={saving || (!title.trim() && !content.trim() && imagePreviews.length === 0)} 
                                    className={`py-4 px-6 bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold text-lg rounded-xl hover:from-rose-500 hover:to-rose-400 focus:outline-none focus:ring-4 focus:ring-rose-300 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:shadow-[0_0_25px_rgba(225,29,72,0.6)] transform hover:-translate-y-0.5 ${editingId ? 'w-2/3' : 'w-full'}`}
                                >
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