"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"; 

export default function CalendarPage() {
    const [user, setUser] = useState<any>(null);
    const [myUsername, setMyUsername] = useState(""); 
    const [date, setDate] = useState<Date>(new Date());
    const [loading, setLoading] = useState(true);
    
    type DiaryEntry = { title: string; hasImage: boolean };
    const [writtenDiaries, setWrittenDiaries] = useState<Record<string, DiaryEntry[]>>({});
    
    const [viewingUserId, setViewingUserId] = useState<string>("");
    
    const [sharedUsers, setSharedUsers] = useState<{owner_id: string, owner_email: string, username?: string}[]>([]);

    const router = useRouter();
    const today = new Date();

    useEffect(() => {
        const initUserAndShares = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/");
                return;
            }
            setUser(session.user);
            setViewingUserId(session.user.id); 

            const { data: myProfile } = await supabase.from('profiles').select('username').eq('id', session.user.id).single();
            if (myProfile?.username) setMyUsername(myProfile.username);

            const { data: shares } = await supabase
                .from('diary_shares')
                .select('owner_id, owner_email')
                .eq('shared_with_email', session.user.email)
                .eq('status', 'accepted');
            
            if (shares && shares.length > 0) {
                const ownerIds = shares.map(s => s.owner_id);
                const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', ownerIds);
                
                const enrichedShares = shares.map(share => {
                    const profile = profiles?.find(p => p.id === share.owner_id);
                    return {
                        ...share,
                        username: profile?.username || share.owner_email.split('@')[0]
                    };
                });
                setSharedUsers(enrichedShares);
            } else {
                setSharedUsers([]);
            }
        };
        initUserAndShares();
    }, [router]);

    useEffect(() => {
        if (!user || !viewingUserId) return;

        const fetchDates = async () => {
            setLoading(true);
            const { data } = await supabase
                .from("diaries")
                .select("entry_date, title, image_url")
                .eq("user_id", viewingUserId)
                .order("created_at", { ascending: true });
            
            const diaryMap: Record<string, DiaryEntry[]> = {};
            if (data) {
                data.forEach(d => {
                    if (!diaryMap[d.entry_date]) diaryMap[d.entry_date] = [];
                    if (diaryMap[d.entry_date].length < 10) {
                        diaryMap[d.entry_date].push({
                            title: d.title || "📝 日記",
                            hasImage: !!d.image_url
                        });
                    }
                });
            }
            setWrittenDiaries(diaryMap);
            setLoading(false);
        };
        fetchDates();
    }, [user, viewingUserId]);

    const handleDayClick = (value: Date) => {
        setDate(value);
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        
        const query = viewingUserId !== user.id ? `?user=${viewingUserId}` : "";
        router.push(`/diary/${year}-${month}-${day}${query}`);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    const tileContent = ({ date, view }: { date: Date, view: string }) => {
        if (view === 'month') {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            
            const entries = writtenDiaries[formattedDate];
            if (entries && entries.length > 0) {
                return (
                    <div className="flex flex-col items-center mt-0.5 sm:mt-1 w-full px-0.5 sm:px-1 overflow-hidden gap-0.5 sm:gap-1">
                        {/* 1個目：常に表示 */}
                        {entries.length > 0 && (
                            <div className={`text-[8px] sm:text-[11px] leading-tight px-0.5 sm:px-1.5 py-0.5 rounded truncate w-full max-w-full text-center border shadow-sm font-bold ${entries[0].hasImage ? 'text-white bg-gradient-to-r from-rose-500 to-rose-400 border-rose-400' : 'text-rose-700 bg-rose-100/80 border-rose-200/50'}`}>
                                {entries[0].hasImage && "🖼️"}{entries[0].title}
                            </div>
                        )}
                        
                        {/* 2個目：PCの時だけ表示 */}
                        {entries.length > 1 && (
                            <div className={`hidden sm:block text-[11px] px-1.5 py-0.5 rounded truncate w-full max-w-full text-center border shadow-sm font-bold ${entries[1].hasImage ? 'text-white bg-gradient-to-r from-rose-500 to-rose-400 border-rose-400' : 'text-rose-700 bg-rose-100/80 border-rose-200/50'}`}>
                                {entries[1].hasImage && "🖼️"}{entries[1].title}
                            </div>
                        )}

                        {/* スマホ用「+〇」 */}
                        {entries.length > 1 && (
                            <div className="sm:hidden text-[9px] text-rose-500 font-bold leading-none">
                                +{entries.length - 1}
                            </div>
                        )}

                        {/* PC用「+〇件」 */}
                        {entries.length > 2 && (
                            <div className="hidden sm:block text-xs text-rose-500 font-bold mt-0.5">
                                +{entries.length - 2}
                            </div>
                        )}
                    </div>
                );
            }
        }
        return null;
    };

    if (!user) return <div className="min-h-screen flex items-center justify-center text-rose-900 bg-rose-50">読み込み中...</div>;

    return (
        <div className="h-[100dvh] bg-rose-50 text-rose-900 p-2 pb-[80px] lg:pb-6 lg:p-6 flex flex-col items-center overflow-hidden font-sans">
            <header className="w-full max-w-7xl bg-white/90 backdrop-blur-md shadow-[0_0_20px_rgba(225,29,72,0.15)] rounded-2xl px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center mb-3 sm:mb-6 border border-rose-100 shrink-0">
                <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-rose-400">
                    My Nikki
                </h1>
                <div className="flex items-center gap-2 sm:gap-4">
                    <span className="text-sm font-bold text-rose-400 hidden sm:inline">{myUsername || user.email}</span>
                    <div className="hidden sm:flex gap-2">
                        <button onClick={() => router.push("/search")} className="text-sm font-bold text-rose-600 hover:text-white bg-rose-100 hover:bg-rose-500 px-4 py-2 rounded-full transition-colors shadow-sm">
                            🔍 探す
                        </button>
                        <button onClick={() => router.push("/settings")} className="text-sm font-bold text-rose-600 hover:text-white bg-rose-100 hover:bg-rose-500 px-4 py-2 rounded-full transition-colors shadow-sm">
                            ⚙️ 設定
                        </button>
                        <button onClick={handleLogout} className="text-sm font-bold text-rose-500 hover:text-rose-700 bg-rose-100 px-4 py-2 rounded-full hover:bg-rose-200 transition-colors shadow-sm">
                            ログアウト
                        </button>
                    </div>
                </div>
            </header>

            {/* 【変更】はみ出さないように overflow-hidden で固定！ */}
            <main className="w-full max-w-7xl flex-1 bg-white rounded-3xl shadow-[0_0_40px_rgba(225,29,72,0.1)] border border-rose-100 p-2 sm:p-6 flex flex-col min-h-0 relative overflow-hidden">
                
                {sharedUsers.length > 0 && (
                    <div className="mb-2 sm:mb-4 p-2 sm:p-3 bg-rose-50/50 rounded-2xl border border-rose-100 flex items-center justify-center gap-3 shrink-0">
                        <span className="font-bold text-rose-700 hidden sm:inline text-sm">👀 表示するカレンダー:</span>
                        <select 
                            value={viewingUserId}
                            onChange={(e) => setViewingUserId(e.target.value)}
                            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-rose-200 rounded-xl font-bold text-rose-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm cursor-pointer"
                        >
                            <option value={user.id}>自分の日記</option>
                            {sharedUsers.map(su => (
                                <option key={su.owner_id} value={su.owner_id}>
                                    {su.username} さんの日記
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-3xl">
                        <span className="font-bold text-rose-500">読み込み中...</span>
                    </div>
                )}

                <div className="flex-1 w-full relative calendar-container overflow-hidden">
                    <Calendar 
                        onClickDay={handleDayClick} 
                        value={date} 
                        calendarType="gregory"
                        tileContent={tileContent}
                        maxDate={today}
                    />
                </div>
            </main>

            <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-rose-100 flex justify-around items-center h-[70px] pb-safe z-50 shadow-[0_-5px_15px_rgba(225,29,72,0.05)]">
                <button onClick={() => router.push("/calendar")} className="flex flex-col items-center justify-center w-full h-full text-rose-500 bg-rose-50/50">
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
                /* カレンダー全体を親コンテナに完全にフィットさせる魔法 */
                .calendar-container { height: 100%; width: 100%; display: flex; flex-direction: column; }
                .calendar-container .react-calendar { width: 100% !important; height: 100% !important; background: transparent !important; border: none !important; font-family: inherit; display: flex; flex-direction: column; }
                
                /* ヘッダー部分（年月とか矢印） */
                .calendar-container .react-calendar__navigation { height: 40px; margin-bottom: 5px; flex-shrink: 0; }
                @media (min-width: 640px) { .calendar-container .react-calendar__navigation { height: 60px; margin-bottom: 10px; } }
                .calendar-container .react-calendar__navigation button { color: #be123c; font-weight: 900; font-size: 1.1rem; border-radius: 12px; transition: all 0.2s; }
                .calendar-container .react-calendar__navigation button:hover { background-color: #ffe4e6; transform: scale(0.98); }
                
                /* カレンダーの中身（親を突き破らないように min-height: 0 を設定） */
                .calendar-container .react-calendar__viewContainer, 
                .calendar-container .react-calendar__month-view, 
                .calendar-container .react-calendar__month-view > div, 
                .calendar-container .react-calendar__month-view > div > div { display: flex; flex-direction: column; flex: 1; min-height: 0; }
                
                /* 【重要】マス目をGridレイアウトにして、画面の高さに合わせて均等に伸び縮みさせる！ */
                .calendar-container .react-calendar__month-view__days { flex: 1; display: grid !important; grid-template-columns: repeat(7, 1fr); grid-auto-rows: 1fr; min-height: 0; }
                
                /* 1つ1つのマス目の設定 */
                .calendar-container .react-calendar__tile { 
                    border-radius: 8px; font-weight: bold; color: #881337; transition: all 0.2s; 
                    font-size: clamp(0.7rem, 1.5vw, 1.2rem); position: relative; 
                    display: flex !important; flex-direction: column; align-items: center; justify-content: flex-start; 
                    padding: 0.1em !important; 
                    height: 100% !important; min-height: 0 !important; /* 高さを枠に完全固定！ */
                    overflow: hidden; /* はみ出た中身は隠す！ */
                }
                @media (min-width: 640px) { .calendar-container .react-calendar__tile { border-radius: 16px; padding: 0.5em 0.2em !important; } }
                .calendar-container .react-calendar__tile:hover { background: #fecdd3; transform: scale(0.95); }
                .calendar-container .react-calendar__tile--now { background: #ffe4e6; color: #e11d48; font-weight: 900; }
                .calendar-container .react-calendar__tile--active, .calendar-container .react-calendar__tile--active:enabled:hover { background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); color: white !important; box-shadow: 0 0 20px rgba(225, 29, 72, 0.5); border-radius: 12px; }
                .calendar-container .react-calendar__tile--disabled { background-color: transparent !important; color: #fda4af !important; cursor: not-allowed; }
                .calendar-container .react-calendar__tile--disabled:hover { transform: none !important; background: transparent !important; }
                .calendar-container abbr[title] { text-decoration: none; }
                .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
            `}</style>
        </div>
    );
}