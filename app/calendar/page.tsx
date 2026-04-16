"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"; 

export default function CalendarPage() {
    const [user, setUser] = useState<any>(null);
    const [date, setDate] = useState<Date>(new Date());
    const [loading, setLoading] = useState(true);
    
    type DiaryEntry = { title: string; hasImage: boolean };
    const [writtenDiaries, setWrittenDiaries] = useState<Record<string, DiaryEntry[]>>({});
    
    // 【追加】誰のカレンダーを見ているか＆共有相手のリスト
    const [viewingUserId, setViewingUserId] = useState<string>("");
    const [sharedUsers, setSharedUsers] = useState<{owner_id: string, owner_email: string}[]>([]);

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
            setViewingUserId(session.user.id); // 最初は自分のID

            // 自分が承認した（見せてもらっている）相手のリストを取得
            const { data: shares } = await supabase
                .from('diary_shares')
                .select('owner_id, owner_email')
                .eq('shared_with_email', session.user.email)
                .eq('status', 'accepted');
            
            if (shares) setSharedUsers(shares);
        };
        initUserAndShares();
    }, [router]);

    // 【変更】見る相手（viewingUserId）が変わるたびに、カレンダーのドットを再取得する
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
                    if (diaryMap[d.entry_date].length < 3) {
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
        
        // 【追加】もし他人のカレンダーを見ているなら、URLにその人のIDをくっつけて遷移する
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
                    <div className="flex flex-col items-center mt-1 w-full px-1 overflow-hidden gap-1">
                        {entries.map((entry, idx) => (
                            <div 
                                key={idx}
                                className={`text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded truncate w-full max-w-full text-center border shadow-sm font-bold ${
                                    entry.hasImage 
                                        ? 'text-white bg-gradient-to-r from-rose-500 to-rose-400 border-rose-400' 
                                        : 'text-rose-700 bg-rose-100/80 border-rose-200/50' 
                                }`}
                            >
                                {entry.hasImage && "🖼️ "}{entry.title}
                            </div>
                        ))}
                    </div>
                );
            }
        }
        return null;
    };

    if (!user) return <div className="min-h-screen flex items-center justify-center text-rose-900 bg-rose-50">読み込み中...</div>;

    return (
        <div className="h-screen bg-rose-50 text-rose-900 p-4 lg:p-6 flex flex-col items-center overflow-hidden font-sans">
            <header className="w-full max-w-7xl bg-white/90 backdrop-blur-md shadow-[0_0_20px_rgba(225,29,72,0.1)] rounded-2xl px-6 py-4 flex justify-between items-center mb-6 border border-rose-100 shrink-0">
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-rose-400">
                    My Nikki
                </h1>
                <div className="flex items-center gap-2 sm:gap-4">
                    <span className="text-sm font-bold text-rose-400 hidden sm:inline">{user.email}</span>
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
            </header>

            <main className="w-full max-w-7xl flex-1 bg-white rounded-3xl shadow-[0_0_40px_rgba(225,29,72,0.1)] border border-rose-100 p-4 sm:p-6 flex flex-col min-h-0 relative">
                
                {/* 【追加】カレンダー切り替えプルダウン（共有相手がいる場合のみ表示） */}
                {sharedUsers.length > 0 && (
                    <div className="mb-4 p-3 bg-rose-50/50 rounded-2xl border border-rose-100 flex items-center justify-center gap-3 shrink-0">
                        <span className="font-bold text-rose-700 hidden sm:inline">👀 表示するカレンダー:</span>
                        <select 
                            value={viewingUserId}
                            onChange={(e) => setViewingUserId(e.target.value)}
                            className="px-4 py-2 bg-white border border-rose-200 rounded-xl font-bold text-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm cursor-pointer"
                        >
                            <option value={user.id}>自分の日記</option>
                            {sharedUsers.map(su => (
                                <option key={su.owner_id} value={su.owner_id}>
                                    {su.owner_email.split('@')[0]} さんの日記
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

            <style jsx global>{`
                .calendar-container .react-calendar { width: 100% !important; height: 100% !important; background: transparent !important; border: none !important; font-family: inherit; display: flex; flex-direction: column; }
                .calendar-container .react-calendar__navigation { height: 60px; margin-bottom: 10px; }
                .calendar-container .react-calendar__navigation button { color: #be123c; font-weight: 900; font-size: 1.2rem; border-radius: 12px; transition: all 0.2s; }
                .calendar-container .react-calendar__navigation button:hover { background-color: #ffe4e6; transform: scale(0.98); }
                .calendar-container .react-calendar__viewContainer, .calendar-container .react-calendar__month-view, .calendar-container .react-calendar__month-view > div, .calendar-container .react-calendar__month-view > div > div { height: 100%; display: flex; flex-direction: column; flex: 1; }
                .calendar-container .react-calendar__month-view__days { flex: 1; display: flex !important; flex-wrap: wrap; }
                .calendar-container .react-calendar__tile { border-radius: 16px; font-weight: bold; color: #881337; transition: all 0.2s; font-size: clamp(1rem, 2vw, 1.5rem); position: relative; display: flex !important; flex-direction: column; align-items: center; justify-content: flex-start; padding: 0.5em 0.2em !important; }
                .calendar-container .react-calendar__tile:hover { background: #fecdd3; transform: scale(0.95); }
                .calendar-container .react-calendar__tile--now { background: #ffe4e6; color: #e11d48; font-weight: 900; }
                .calendar-container .react-calendar__tile--active, .calendar-container .react-calendar__tile--active:enabled:hover { background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); color: white !important; box-shadow: 0 0 20px rgba(225, 29, 72, 0.5); border-radius: 20px; }
                .calendar-container .react-calendar__tile--disabled { background-color: transparent !important; color: #fda4af !important; cursor: not-allowed; }
                .calendar-container .react-calendar__tile--disabled:hover { transform: none !important; background: transparent !important; }
                .calendar-container abbr[title] { text-decoration: none; }
            `}</style>
        </div>
    );
}