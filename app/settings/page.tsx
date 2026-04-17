"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // プロフィール用
    const [username, setUsername] = useState("");
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMessage, setProfileMessage] = useState({ text: "", isError: false });

    // パスワード変更用
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState({ text: "", isError: false });

    // テーマとフォント用
    const [themeColor, setThemeColor] = useState("rose");
    const [fontFamily, setFontFamily] = useState("sans");
    const [designMessage, setDesignMessage] = useState("");

    // 共有機能用のステート
    const [shareEmail, setShareEmail] = useState("");
    const [shareLoading, setShareLoading] = useState(false);
    const [shareMessage, setShareMessage] = useState({ text: "", isError: false });
    const [myShares, setMyShares] = useState<any[]>([]); 
    const [receivedRequests, setReceivedRequests] = useState<any[]>([]); 

    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    const fetchSharesAndProfile = async (userId: string, userEmail: string | undefined) => {
        if (!userEmail) return;

        // 自分のプロフィール（ユーザーネーム）を取得
        const { data: profileData } = await supabase.from('profiles').select('username').eq('id', userId).single();
        if (profileData?.username) setUsername(profileData.username);

        // 自分が送った招待を取得
        const { data: myData } = await supabase.from('diary_shares').select('*').eq('owner_id', userId);
        if (myData) setMyShares(myData);

        // 自分宛ての招待を取得
        const { data: receivedData } = await supabase.from('diary_shares').select('*').eq('shared_with_email', userEmail);
        if (receivedData) setReceivedRequests(receivedData);
    };

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/");
                return;
            }
            setUser(session.user);
            
            const savedTheme = localStorage.getItem("appTheme");
            const savedFont = localStorage.getItem("appFont");
            if (savedTheme) setThemeColor(savedTheme);
            if (savedFont) setFontFamily(savedFont);

            await fetchSharesAndProfile(session.user.id, session.user.email);
            setLoading(false);
        };
        checkUser();
    }, [router]);

    const handleApplyDesign = () => {
        localStorage.setItem("appTheme", themeColor);
        localStorage.setItem("appFont", fontFamily);
        setDesignMessage("デザインを適用しました！✨");
        
        // 【変更】リロードではなく、イベントを発行して一瞬で切り替える
        window.dispatchEvent(new Event("themeChanged"));
        
        // メッセージを3秒後にスッと消す
        setTimeout(() => setDesignMessage(""), 3000);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileMessage({ text: "", isError: false });
        try {
            const { error } = await supabase.from("profiles").upsert([{ id: user.id, email: user.email, username }]);
            if (error) throw error;
            setProfileMessage({ text: "プロフィールを更新しました！", isError: false });
        } catch (error: any) {
            setProfileMessage({ text: "エラー: " + error.message, isError: true });
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage({ text: "", isError: false });

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ text: "新しいパスワードが一致しません！", isError: true });
            return;
        }
        if (newPassword.length < 6) {
            setPasswordMessage({ text: "パスワードは6文字以上にしてね！", isError: true });
            return;
        }

        setPasswordLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setPasswordMessage({ text: "パスワードを変更しました！", isError: false });
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            setPasswordMessage({ text: "エラー: " + error.message, isError: true });
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleSendShare = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shareEmail.trim()) return;
        if (shareEmail === user.email) {
            setShareMessage({ text: "自分自身には送れません！", isError: true });
            return;
        }
        
        setShareLoading(true);
        setShareMessage({ text: "", isError: false });

        try {
            const { error } = await supabase.from('diary_shares').insert([{
                owner_id: user.id,
                owner_email: user.email,
                shared_with_email: shareEmail
            }]);

            if (error) {
                if (error.code === '23505') throw new Error("すでにリクエストを送っているか、共有済みです！");
                throw error;
            }

            setShareMessage({ text: "招待リクエストを送りました！", isError: false });
            setShareEmail("");
            fetchSharesAndProfile(user.id, user.email);
        } catch (error: any) {
            setShareMessage({ text: error.message, isError: true });
        } finally {
            setShareLoading(false);
        }
    };

    const handleAcceptShare = async (id: string) => {
        try {
            await supabase.from('diary_shares').update({ status: 'accepted' }).eq('id', id);
            fetchSharesAndProfile(user.id, user.email);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteShare = async (id: string) => {
        try {
            await supabase.from('diary_shares').delete().eq('id', id);
            fetchSharesAndProfile(user.id, user.email);
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-rose-900 bg-rose-50">読み込み中...</div>;

    return (
        <div className="min-h-[100dvh] bg-rose-50 p-4 pb-24 lg:p-8 lg:pb-8 text-rose-900 font-sans relative">
            <div className="max-w-4xl mx-auto mb-8 bg-white/80 backdrop-blur-md rounded-2xl p-4 flex justify-between items-center border border-rose-100 shadow-[0_0_20px_rgba(225,29,72,0.15)]">
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-rose-400 drop-shadow-sm">
                    ⚙️ 設定 (マイページ)
                </h1>
                <Link href="/calendar" className="hidden sm:block px-5 py-2 bg-rose-100 text-rose-700 font-bold rounded-full hover:bg-rose-200 transition-colors shadow-sm">
                    カレンダーに戻る
                </Link>
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* 左側：デザイン設定 */}
                <div className="bg-white rounded-3xl p-6 shadow-[0_0_30px_rgba(225,29,72,0.1)] border border-rose-50">
                    <h2 className="text-xl font-bold text-rose-800 mb-6 border-b-2 border-rose-100 pb-2">🎨 デザイン設定</h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-rose-700 mb-3">メインカラー</label>
                            <div className="flex gap-4">
                                <button onClick={() => setThemeColor('rose')} className={`w-10 h-10 rounded-full shadow-sm transition-transform ${themeColor === 'rose' ? 'scale-110' : 'hover:scale-110'}`} style={{ backgroundColor: '#f43f5e', boxShadow: themeColor === 'rose' ? '0 0 0 4px #fecdd3' : 'none' }} title="ローズ"></button>
                                <button onClick={() => setThemeColor('blue')} className={`w-10 h-10 rounded-full bg-blue-500 shadow-sm transition-transform ${themeColor === 'blue' ? 'ring-4 ring-blue-200 scale-110' : 'hover:scale-110'}`} title="ブルー"></button>
                                <button onClick={() => setThemeColor('green')} className={`w-10 h-10 rounded-full bg-emerald-500 shadow-sm transition-transform ${themeColor === 'green' ? 'ring-4 ring-emerald-200 scale-110' : 'hover:scale-110'}`} title="グリーン"></button>
                                <button onClick={() => setThemeColor('purple')} className={`w-10 h-10 rounded-full bg-purple-500 shadow-sm transition-transform ${themeColor === 'purple' ? 'ring-4 ring-purple-200 scale-110' : 'hover:scale-110'}`} title="パープル"></button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-rose-700 mb-3">フォントスタイル</label>
                            <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-rose-50 transition-colors">
                                    <input type="radio" name="font" checked={fontFamily === 'sans'} onChange={() => setFontFamily('sans')} className="w-4 h-4 text-rose-600 focus:ring-rose-500" />
                                    <span className="font-sans font-medium">ゴシック体 (標準)</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-rose-50 transition-colors">
                                    <input type="radio" name="font" checked={fontFamily === 'serif'} onChange={() => setFontFamily('serif')} className="w-4 h-4 text-rose-600 focus:ring-rose-500" />
                                    <span className="font-serif font-medium">明朝体 (大人っぽく)</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-rose-50 transition-colors">
                                    <input type="radio" name="font" checked={fontFamily === 'rounded'} onChange={() => setFontFamily('rounded')} className="w-4 h-4 text-rose-600 focus:ring-rose-500" />
                                    <span className="font-medium" style={{ fontFamily: 'var(--font-mplus, "M PLUS Rounded 1c", sans-serif)' }}>丸ゴシック (かわいく)</span>
                                </label>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-rose-100">
                            <button onClick={handleApplyDesign} className="w-full py-4 px-6 bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold text-lg rounded-xl hover:from-rose-500 hover:to-rose-400 focus:outline-none focus:ring-4 focus:ring-rose-300 transition-all shadow-md transform hover:-translate-y-0.5">
                                デザインを適用する
                            </button>
                            {designMessage && <p className="text-center text-sm font-bold text-rose-600 mt-3">{designMessage}</p>}
                        </div>
                    </div>
                </div>

                {/* 右側：プロフィールとセキュリティ */}
                <div className="flex flex-col gap-8">
                    {/* プロフィール設定 */}
                    <div className="bg-white rounded-3xl p-6 shadow-[0_0_30px_rgba(159,18,57,0.15)] border border-rose-100">
                        <h2 className="text-xl font-bold text-rose-800 mb-6 border-b-2 border-rose-100 pb-2">👤 プロフィール</h2>
                        <form onSubmit={handleUpdateProfile} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-rose-700 mb-1">ユーザーネーム（表示名）</label>
                                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 bg-rose-50/50 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-rose-900 font-medium transition-all" placeholder="例: たろう" required />
                                <p className="text-xs text-gray-500 mt-2">※カレンダー画面や、共有した相手にこの名前が表示されます。</p>
                            </div>
                            {profileMessage.text && (
                                <div className={`p-3 rounded-xl text-sm font-bold text-center ${profileMessage.isError ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                                    {profileMessage.text}
                                </div>
                            )}
                            <button type="submit" disabled={profileLoading} className="w-full py-4 px-6 bg-rose-100 text-rose-600 font-bold text-lg rounded-xl hover:bg-rose-200 focus:outline-none focus:ring-4 focus:ring-rose-300 disabled:opacity-50 transition-all shadow-sm transform hover:-translate-y-0.5 mt-2">
                                {profileLoading ? "更新中..." : "名前を保存する"}
                            </button>
                        </form>
                    </div>

                    {/* セキュリティ */}
                    <div className="bg-white rounded-3xl p-6 shadow-[0_0_30px_rgba(159,18,57,0.15)] border border-rose-100">
                        <h2 className="text-xl font-bold text-rose-800 mb-6 border-b-2 border-rose-100 pb-2">🔒 パスワード変更</h2>
                        <form onSubmit={handlePasswordChange} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-rose-700 mb-1">新しいパスワード</label>
                                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 bg-rose-50/50 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-rose-900 font-medium transition-all" placeholder="6文字以上" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-rose-700 mb-1">新しいパスワード (確認用)</label>
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 bg-rose-50/50 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-rose-900 font-medium transition-all" placeholder="もう一度入力してね" required />
                            </div>
                            {passwordMessage.text && (
                                <div className={`p-3 rounded-xl text-sm font-bold text-center ${passwordMessage.isError ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                                    {passwordMessage.text}
                                </div>
                            )}
                            <button type="submit" disabled={passwordLoading} className="w-full py-4 px-6 bg-rose-50 text-rose-500 font-bold text-lg rounded-xl hover:bg-rose-100 focus:outline-none transition-all shadow-sm mt-2">
                                {passwordLoading ? "更新中..." : "パスワードを変更する"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* 共有設定エリア */}
            <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 shadow-[0_0_30px_rgba(225,29,72,0.1)] border border-rose-50">
                <h2 className="text-xl font-bold text-rose-800 mb-6 border-b-2 border-rose-100 pb-2">🤝 日記の共有設定</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 左：招待を送る */}
                    <div>
                        <h3 className="font-bold text-rose-700 mb-2">特定の人に日記を見せる</h3>
                        <p className="text-sm text-gray-500 mb-4">相手のメールアドレスを入力して招待します。相手がこのアプリでログインした際に承認できます。</p>
                        
                        <form onSubmit={handleSendShare} className="space-y-4">
                            <input type="email" value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} className="w-full px-4 py-3 bg-rose-50/50 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-rose-900 font-medium transition-all" placeholder="相手のメールアドレス" required />
                            {shareMessage.text && (
                                <p className={`text-sm font-bold ${shareMessage.isError ? "text-red-500" : "text-rose-600"}`}>
                                    {shareMessage.text}
                                </p>
                            )}
                            <button type="submit" disabled={shareLoading} className="w-full py-3 px-6 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-all shadow-sm">
                                {shareLoading ? "送信中..." : "招待リクエストを送る"}
                            </button>
                        </form>

                        <div className="mt-8">
                            <h3 className="font-bold text-rose-700 mb-3 border-b border-rose-100 pb-1">あなたが招待した人</h3>
                            {myShares.length === 0 ? (
                                <p className="text-sm text-gray-400">まだ誰にも招待を送っていません。</p>
                            ) : (
                                <ul className="space-y-2">
                                    {myShares.map(share => (
                                        <li key={share.id} className="flex justify-between items-center bg-rose-50 px-4 py-2 rounded-lg text-sm">
                                            <div>
                                                <span className="font-bold text-rose-900 block">{share.shared_with_email}</span>
                                                <span className={`text-xs font-bold ${share.status === 'accepted' ? 'text-green-600' : 'text-orange-500'}`}>
                                                    {share.status === 'accepted' ? "共有中" : "承認待ち..."}
                                                </span>
                                            </div>
                                            <button onClick={() => handleDeleteShare(share.id)} className="text-red-500 font-bold hover:text-red-700">解除</button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* 右：届いた招待 */}
                    <div>
                        <h3 className="font-bold text-rose-700 mb-3 border-b border-rose-100 pb-1">あなた宛ての招待</h3>
                        {receivedRequests.length === 0 ? (
                            <p className="text-sm text-gray-400">現在、届いている招待はありません。</p>
                        ) : (
                            <ul className="space-y-3">
                                {receivedRequests.map(req => (
                                    <li key={req.id} className="bg-rose-50 p-3 rounded-xl border border-rose-100 flex flex-col gap-2">
                                        <div className="text-sm">
                                            <span className="font-bold text-rose-800">{req.owner_email}</span>
                                            <span className="text-gray-600"> さんからの招待</span>
                                        </div>
                                        
                                        {req.status === 'pending' ? (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleAcceptShare(req.id)} className="flex-1 bg-green-500 text-white text-sm font-bold py-2 rounded-lg hover:bg-green-600">承認する</button>
                                                <button onClick={() => handleDeleteShare(req.id)} className="flex-1 bg-gray-300 text-gray-700 text-sm font-bold py-2 rounded-lg hover:bg-gray-400">拒否する</button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-green-600">✅ 共有済み</span>
                                                <button onClick={() => handleDeleteShare(req.id)} className="text-xs text-red-500 font-bold hover:underline">共有を解除</button>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                        <p className="text-xs text-gray-400 mt-4">
                            ※「承認」すると、相手の日記があなたのカレンダー画面から見れるようになります。
                        </p>
                    </div>
                </div>
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
                {/* 設定タブをアクティブ状態に */}
                <button onClick={() => router.push("/settings")} className="flex flex-col items-center justify-center w-full h-full text-rose-500 bg-rose-50/50">
                    <span className="text-xl mb-0.5">⚙️</span>
                    <span className="text-[10px] font-bold">設定</span>
                </button>
                <button onClick={handleLogout} className="flex flex-col items-center justify-center w-full h-full text-rose-400 hover:text-rose-500 hover:bg-rose-50/50 transition-colors">
                    <span className="text-xl mb-0.5">🚪</span>
                    <span className="text-[10px] font-bold">ログアウト</span>
                </button>
            </nav>

            <style jsx global>{`
                .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
            `}</style>
        </div>
    );
}