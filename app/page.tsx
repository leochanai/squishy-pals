import { ArrowUpRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="landing-page home-page">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Squishy Pals · 软软伙伴"><span className="brand-mark">✿</span><strong>Squishy Pals</strong><span className="brand-cn">软软伙伴</span></a>
        <a className="landing-nav" href="/pals">小伙伴图鉴 <ArrowUpRight size={15} /></a>
      </header>
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-copy">
          <span className="eyebrow">A SMALL MOMENT, JUST FOR YOU</span>
          <h1 id="landing-title"><span>Life gets busy.</span><span>Stay <em>squishy.</em></span></h1>
          <p className="landing-subtitle">让今天，软一点。</p>
          <p className="landing-description">和软软的小动物待一会儿。<br />捏一捏，拉一拉，把紧绷的心情慢慢松开。</p>
          <a className="landing-cta" href="/pals">打开小伙伴图鉴 <ArrowUpRight size={20} /></a>
          <span className="landing-caption">不用下载 · 打开就能放松</span>
        </div>
      </section>
      <section className="landing-rituals" aria-label="放松的小动作">
        <div><svg className="soft-gesture" viewBox="0 0 48 48" aria-hidden="true"><path d="M9 28c0-8 6-13 15-13s15 5 15 13c0 5-7 7-15 7S9 33 9 28Z"/><path d="M24 4v15m-4-4 4 4 4-4"/></svg><span><strong>轻轻捏一下</strong><small>让紧绷，变柔软。</small></span></div>
        <div><svg className="soft-gesture" viewBox="0 0 48 48" aria-hidden="true"><path d="M9 24c0-8 7-7 15-7s15-1 15 7-7 7-15 7-15 1-15-7Z"/><path d="m5 20-4 4 4 4m38-8 4 4-4 4M1 24h8m30 0h8"/></svg><span><strong>慢慢拉一拉</strong><small>烦恼也能有弹性。</small></span></div>
        <div><svg className="soft-gesture" viewBox="0 0 48 48" aria-hidden="true"><path d="M13 22c0-11 5-16 11-16s11 5 11 16c0 8-5 12-11 12s-11-4-11-12Z"/><path d="M14 42h20m-15-4h10"/></svg><span><strong>松开，弹回来</strong><small>什么都不做，也很好。</small></span></div>
      </section>
      <footer className="landing-footer"><span>A tiny pal. A softer day.</span><span>慢一点，也很好 <ArrowUpRight size={13} /></span></footer>
    </main>
  );
}
