import AetherHero from '@/components/AetherHero';

export default function Home() {
  return (
    <main className="bg-[#0a0a0f] text-[#f0f0f5]">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between h-16 px-[min(6vw,64px)] bg-transparent">
        <span className="font-bold text-xl tracking-tight text-white">
          Naliart AI
        </span>
        <div className="hidden md:flex gap-8 text-sm text-white/60">
          <a href="#" className="text-white/60 no-underline hover:text-white transition-colors">기능</a>
          <a href="#" className="text-white/60 no-underline hover:text-white transition-colors">사용법</a>
          <a href="#" className="text-white/60 no-underline hover:text-white transition-colors">가격</a>
        </div>
        <a
          href="#"
          className="px-5 py-2 rounded-lg font-semibold text-sm text-white no-underline border border-white/20 bg-white/[0.08] backdrop-blur-md hover:bg-white/15 transition-colors"
        >
          무료 시작
        </a>
      </nav>

      {/* Hero */}
      <AetherHero />

    </main>
  );
}
