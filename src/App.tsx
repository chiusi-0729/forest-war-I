import { useMemo } from 'react';

const features = [
  {
    title: '快速啟動',
    description: '使用 Vite 和 TypeScript 快速建立單頁應用，開發階段立即享受熱模組替換。',
  },
  {
    title: '現代化介面',
    description: '使用 React 元件與 Tailwind CSS 打造乾淨、響應式的單頁網站。',
  },
  {
    title: '單頁體驗',
    description: '所有內容都在同一頁呈現，讓訪客專注於品牌與訊息。',
  },
];

const App = () => {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-6xl px-6 py-12 md:px-10">
        <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-300">
              Vite + React + TypeScript 單頁網站
            </p>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              以現代前端技術打造簡潔的單頁體驗
            </h1>
            <p className="max-w-2xl text-slate-400 leading-relaxed text-lg">
              這是一個以 Vite、React、TypeScript 建置的單一網頁應用，支援快速開發與生產部署。使用者可在同一頁瀏覽品牌介紹、特色與聯絡資訊。
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#features" className="rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                查看特色
              </a>
              <a href="#contact" className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500">
                聯絡我們
              </a>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl shadow-cyan-500/10">
            <div className="space-y-6">
              <div className="rounded-3xl bg-slate-950/80 p-6 text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">單頁應用範例</p>
                <h2 className="mt-4 text-3xl font-bold text-white">簡約設計</h2>
                <p className="mt-3 text-slate-400">專注於內容與轉換，避免多餘頁面切換。</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-500">快速啟動</p>
                  <p className="mt-3 text-slate-300">Vite 讓開發編譯更快，效能更佳。</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-500">強型別</p>
                  <p className="mt-3 text-slate-300">TypeScript 提供穩定性與開發體驗。</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mt-20 space-y-8">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-400">功能特色</p>
            <h2 className="text-3xl font-bold text-white">完美適合單一頁面展示</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-3xl border border-slate-800 bg-slate-900/85 p-6 shadow-lg shadow-slate-950/20 transition hover:-translate-y-1 hover:border-cyan-500">
                <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-slate-400 leading-relaxed">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-20 rounded-3xl border border-slate-800 bg-slate-900/90 p-10 shadow-xl shadow-cyan-500/5" id="contact">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-400">聯絡方式</p>
              <h2 className="mt-4 text-3xl font-bold text-white">想要製作自己的單頁網站？</h2>
              <p className="mt-4 max-w-xl text-slate-400 leading-relaxed">
                無論是產品展示、個人作品集，或品牌介紹，這個 Vite React TypeScript 專案都能快速搭建並維持優雅外觀。
              </p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-8">
              <p className="text-sm text-slate-500">電子郵件</p>
              <p className="mt-2 text-lg font-semibold text-white">hello@example.com</p>
              <div className="mt-6 rounded-3xl bg-slate-900/90 p-5">
                <p className="text-slate-400">立即開始</p>
                <p className="mt-2 text-3xl font-bold text-white">單頁網站建置</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-800 bg-slate-950/90 py-6 text-center text-sm text-slate-500">
        © {currentYear} Forest War I. 由 Vite + React + TypeScript 建置。
      </footer>
    </div>
  );
};

export default App;
