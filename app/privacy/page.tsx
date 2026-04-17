"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PrivacyPolicy() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-rose-50 p-4 lg:p-8 text-rose-900 font-sans">
            <div className="max-w-4xl mx-auto mb-8 bg-white/80 backdrop-blur-md rounded-2xl p-4 flex justify-between items-center border border-rose-100 shadow-sm">
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-rose-400">
                    プライバシーポリシー
                </h1>
                <button onClick={() => router.back()} className="px-5 py-2 bg-rose-100 text-rose-700 font-bold rounded-full hover:bg-rose-200 transition-colors text-sm">
                    戻る
                </button>
            </div>

            <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 lg:p-10 shadow-sm border border-rose-100 space-y-8 leading-relaxed">
                <section>
                    <h2 className="text-xl font-bold text-rose-800 mb-3 border-b border-rose-100 pb-2">1. 取得する情報</h2>
                    <p className="text-gray-700">
                        本アプリ「My Nikki」では、ユーザーの皆様から以下の情報を取得します。<br />
                        ・メールアドレス<br />
                        ・パスワード（暗号化され、開発者も閲覧できません）<br />
                        ・アプリ内で入力された日記のテキストおよび画像<br />
                        ・ユーザーネーム等のプロフィール情報
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-rose-800 mb-3 border-b border-rose-100 pb-2">2. 情報の利用目的</h2>
                    <p className="text-gray-700">
                        取得した個人情報は、以下の目的で利用いたします。<br />
                        ・本アプリの機能提供（ログイン、日記の保存・閲覧など）のため<br />
                        ・ユーザー間の共有機能（交換日記）の提供のため<br />
                        ・アプリの改善や不具合対応のため
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-rose-800 mb-3 border-b border-rose-100 pb-2">3. 個人情報の第三者提供</h2>
                    <p className="text-gray-700">
                        本アプリでは、ユーザー本人の同意がある場合や法令に基づく場合を除き、個人情報を第三者に提供することはありません。<br />
                        ただし、アプリの「共有機能」を利用してユーザー自身が招待・承認した相手には、一部の情報（メールアドレス、ユーザーネーム、日記内容等）が開示されます。
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-rose-800 mb-3 border-b border-rose-100 pb-2">4. セキュリティ</h2>
                    <p className="text-gray-700">
                        本アプリは、ユーザーのデータを安全に保管するため、データベースのアクセス制御（Row Level Security等）を使用し、適切に保護しています。ただし、インターネット通信やサーバーの完全な安全性を保証するものではありません。
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-rose-800 mb-3 border-b border-rose-100 pb-2">5. 免責事項</h2>
                    <p className="text-gray-700">
                        本アプリの利用により生じたトラブルや損害について、開発者は一切の責任を負わないものとします。
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-rose-800 mb-3 border-b border-rose-100 pb-2">6. プライバシーポリシーの変更</h2>
                    <p className="text-gray-700">
                        開発者は、必要に応じて本プライバシーポリシーを変更することがあります。変更した場合は、本ページにてお知らせします。
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-rose-800 mb-3 border-b border-rose-100 pb-2">7. お問い合わせ窓口</h2>
                    <p className="text-gray-700">
                        本アプリの個人情報の取り扱いに関するお問い合わせは、以下のメールアドレスまでお願いいたします。<br />
                        <span className="font-bold text-rose-600">sayju.official@gmail.com</span>
                    </p>
                </section>

                <div className="pt-8 text-right text-gray-500 text-sm font-bold">
                    制定日: 2026年4月17日<br />
                    開発者: sayju.official@gmail.com
                </div>
            </div>
        </div>
    );
}