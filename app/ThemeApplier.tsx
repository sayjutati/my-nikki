"use client";

import { useEffect, useState } from "react";

export default function ThemeApplier() {
    const [theme, setTheme] = useState("rose");
    const [font, setFont] = useState("sans");

    useEffect(() => {
        const updateTheme = () => {
            const savedTheme = localStorage.getItem("appTheme");
            const savedFont = localStorage.getItem("appFont");
            if (savedTheme) setTheme(savedTheme);
            if (savedFont) setFont(savedFont);
        };

        // 最初の読み込み時
        updateTheme();

        // 【追加】「themeChanged」という合図が来たら瞬時に色を変える！
        window.addEventListener("themeChanged", updateTheme);
        window.addEventListener("storage", updateTheme);

        return () => {
            window.removeEventListener("themeChanged", updateTheme);
            window.removeEventListener("storage", updateTheme);
        };
    }, []);

    let styles = "";

    // フォントの適用
    if (font === 'serif') {
        styles += `body, input, textarea, button { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif !important; }`;
    } else if (font === 'rounded') {
        styles += `body, input, textarea, button { font-family: "M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", "Quicksand", sans-serif !important; font-weight: 500; }`;
    }

    // テーマカラーの適用 (元のローズ色を別の色に強制上書きするCSS)
    if (theme === 'blue') {
        styles += `
            .bg-rose-50 { background-color: #eff6ff !important; }
            .bg-rose-100 { background-color: #dbeafe !important; }
            .bg-rose-500 { background-color: #3b82f6 !important; }
            .bg-rose-600 { background-color: #2563eb !important; }
            .text-rose-400 { color: #60a5fa !important; }
            .text-rose-500 { color: #3b82f6 !important; }
            .text-rose-600 { color: #2563eb !important; }
            .text-rose-700 { color: #1d4ed8 !important; }
            .text-rose-800 { color: #1e40af !important; }
            .text-rose-900 { color: #1e3a8a !important; }
            .border-rose-50 { border-color: #eff6ff !important; }
            .border-rose-100 { border-color: #dbeafe !important; }
            .border-rose-200 { border-color: #bfdbfe !important; }
            .border-rose-300 { border-color: #93c5fd !important; }
            .border-rose-400 { border-color: #60a5fa !important; }
            .ring-rose-200 { --tw-ring-color: #bfdbfe !important; }
            .ring-rose-300 { --tw-ring-color: #93c5fd !important; }
            .ring-rose-400 { --tw-ring-color: #60a5fa !important; }
            .from-rose-500 { --tw-gradient-from: #3b82f6 !important; --tw-gradient-to: rgba(59, 130, 246, 0) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
            .from-rose-600 { --tw-gradient-from: #2563eb !important; --tw-gradient-to: rgba(37, 99, 235, 0) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
            .to-rose-400 { --tw-gradient-to: #60a5fa !important; }
            .to-rose-500 { --tw-gradient-to: #3b82f6 !important; }
            .hover\\:bg-rose-50:hover { background-color: #eff6ff !important; }
            .hover\\:bg-rose-200:hover { background-color: #bfdbfe !important; }
            .hover\\:bg-rose-500:hover { background-color: #3b82f6 !important; }
            .hover\\:text-rose-600:hover { color: #2563eb !important; }
            .hover\\:text-rose-700:hover { color: #1d4ed8 !important; }
            .hover\\:from-rose-500:hover { --tw-gradient-from: #3b82f6 !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
            .hover\\:to-rose-400:hover { --tw-gradient-to: #60a5fa !important; }
            .calendar-container .react-calendar__navigation button { color: #1d4ed8 !important; }
            .calendar-container .react-calendar__navigation button:hover { background-color: #dbeafe !important; }
            .calendar-container .react-calendar__tile { color: #1e3a8a !important; }
            .calendar-container .react-calendar__tile:hover { background: #bfdbfe !important; }
            .calendar-container .react-calendar__tile--now { background: #dbeafe !important; color: #2563eb !important; }
            .calendar-container .react-calendar__tile--active, .calendar-container .react-calendar__tile--active:enabled:hover { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important; color: white !important; box-shadow: 0 0 20px rgba(37, 99, 235, 0.5) !important; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #bfdbfe !important; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #93c5fd !important; }
        `;
    } else if (theme === 'green') {
        styles += `
            .bg-rose-50 { background-color: #ecfdf5 !important; }
            .bg-rose-100 { background-color: #d1fae5 !important; }
            .bg-rose-500 { background-color: #10b981 !important; }
            .bg-rose-600 { background-color: #059669 !important; }
            .text-rose-400 { color: #34d399 !important; }
            .text-rose-500 { color: #10b981 !important; }
            .text-rose-600 { color: #059669 !important; }
            .text-rose-700 { color: #047857 !important; }
            .text-rose-800 { color: #065f46 !important; }
            .text-rose-900 { color: #064e3b !important; }
            .border-rose-50 { border-color: #ecfdf5 !important; }
            .border-rose-100 { border-color: #d1fae5 !important; }
            .border-rose-200 { border-color: #a7f3d0 !important; }
            .border-rose-300 { border-color: #6ee7b7 !important; }
            .border-rose-400 { border-color: #34d399 !important; }
            .ring-rose-200 { --tw-ring-color: #a7f3d0 !important; }
            .ring-rose-300 { --tw-ring-color: #6ee7b7 !important; }
            .ring-rose-400 { --tw-ring-color: #34d399 !important; }
            .from-rose-500 { --tw-gradient-from: #10b981 !important; --tw-gradient-to: rgba(16, 185, 129, 0) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
            .from-rose-600 { --tw-gradient-from: #059669 !important; --tw-gradient-to: rgba(5, 150, 105, 0) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
            .to-rose-400 { --tw-gradient-to: #34d399 !important; }
            .to-rose-500 { --tw-gradient-to: #10b981 !important; }
            .hover\\:bg-rose-50:hover { background-color: #ecfdf5 !important; }
            .hover\\:bg-rose-200:hover { background-color: #a7f3d0 !important; }
            .hover\\:bg-rose-500:hover { background-color: #10b981 !important; }
            .hover\\:text-rose-600:hover { color: #059669 !important; }
            .hover\\:text-rose-700:hover { color: #047857 !important; }
            .hover\\:from-rose-500:hover { --tw-gradient-from: #10b981 !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
            .hover\\:to-rose-400:hover { --tw-gradient-to: #34d399 !important; }
            .calendar-container .react-calendar__navigation button { color: #047857 !important; }
            .calendar-container .react-calendar__navigation button:hover { background-color: #d1fae5 !important; }
            .calendar-container .react-calendar__tile { color: #064e3b !important; }
            .calendar-container .react-calendar__tile:hover { background: #a7f3d0 !important; }
            .calendar-container .react-calendar__tile--now { background: #d1fae5 !important; color: #059669 !important; }
            .calendar-container .react-calendar__tile--active, .calendar-container .react-calendar__tile--active:enabled:hover { background: linear-gradient(135deg, #059669 0%, #047857 100%) !important; color: white !important; box-shadow: 0 0 20px rgba(16, 185, 129, 0.5) !important; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #a7f3d0 !important; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6ee7b7 !important; }
        `;
    } else if (theme === 'purple') {
        styles += `
            .bg-rose-50 { background-color: #faf5ff !important; }
            .bg-rose-100 { background-color: #f3e8ff !important; }
            .bg-rose-500 { background-color: #a855f7 !important; }
            .bg-rose-600 { background-color: #9333ea !important; }
            .text-rose-400 { color: #c084fc !important; }
            .text-rose-500 { color: #a855f7 !important; }
            .text-rose-600 { color: #9333ea !important; }
            .text-rose-700 { color: #7e22ce !important; }
            .text-rose-800 { color: #6b21a8 !important; }
            .text-rose-900 { color: #581c87 !important; }
            .border-rose-50 { border-color: #faf5ff !important; }
            .border-rose-100 { border-color: #f3e8ff !important; }
            .border-rose-200 { border-color: #e9d5ff !important; }
            .border-rose-300 { border-color: #d8b4fe !important; }
            .border-rose-400 { border-color: #c084fc !important; }
            .ring-rose-200 { --tw-ring-color: #e9d5ff !important; }
            .ring-rose-300 { --tw-ring-color: #d8b4fe !important; }
            .ring-rose-400 { --tw-ring-color: #c084fc !important; }
            .from-rose-500 { --tw-gradient-from: #a855f7 !important; --tw-gradient-to: rgba(168, 85, 247, 0) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
            .from-rose-600 { --tw-gradient-from: #9333ea !important; --tw-gradient-to: rgba(147, 51, 234, 0) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
            .to-rose-400 { --tw-gradient-to: #c084fc !important; }
            .to-rose-500 { --tw-gradient-to: #a855f7 !important; }
            .hover\\:bg-rose-50:hover { background-color: #faf5ff !important; }
            .hover\\:bg-rose-200:hover { background-color: #e9d5ff !important; }
            .hover\\:bg-rose-500:hover { background-color: #a855f7 !important; }
            .hover\\:text-rose-600:hover { color: #9333ea !important; }
            .hover\\:text-rose-700:hover { color: #7e22ce !important; }
            .hover\\:from-rose-500:hover { --tw-gradient-from: #a855f7 !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
            .hover\\:to-rose-400:hover { --tw-gradient-to: #c084fc !important; }
            .calendar-container .react-calendar__navigation button { color: #7e22ce !important; }
            .calendar-container .react-calendar__navigation button:hover { background-color: #f3e8ff !important; }
            .calendar-container .react-calendar__tile { color: #581c87 !important; }
            .calendar-container .react-calendar__tile:hover { background: #e9d5ff !important; }
            .calendar-container .react-calendar__tile--now { background: #f3e8ff !important; color: #9333ea !important; }
            .calendar-container .react-calendar__tile--active, .calendar-container .react-calendar__tile--active:enabled:hover { background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%) !important; color: white !important; box-shadow: 0 0 20px rgba(168, 85, 247, 0.5) !important; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #e9d5ff !important; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d8b4fe !important; }
        `;
    }

    return <style dangerouslySetInnerHTML={{ __html: styles }} />;
}