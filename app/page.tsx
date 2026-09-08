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
          <div className="landing-invitation">
          <p className="landing-subtitle"><span>让今天，</span><strong>软一点。</strong></p>
          <p className="landing-description">和软软的小动物待一会儿。<br />捏一捏，拉一拉，把紧绷的心情慢慢松开。</p>
          <a className="landing-cta" href="/pals">打开小伙伴图鉴 <ArrowUpRight size={20} /></a>
          <span className="landing-caption">不用下载 · 打开就能放松</span>
          </div>
        </div>
      </section>
      <section className="landing-rituals" aria-label="放松的小动作">
        <div><svg className="soft-gesture" viewBox="0 0 48 48" aria-hidden="true"><path className="gesture-form" d="M7 31C7 22 13 18 18 22Q24 27 30 22C35 18 41 22 41 31C41 39 7 39 7 31Z"/><path d="M24 5v12m-4-4 4 4 4-4"/></svg><span><strong>轻轻捏一下</strong><small>让紧绷，<br />变柔软。</small></span></div>
        <div><svg className="soft-gesture" viewBox="0 0 48 48" aria-hidden="true"><path className="gesture-form" d="M8 24C8 16 15 19 24 19S40 16 40 24S33 29 24 29S8 32 8 24Z"/><path d="m5 20-4 4 4 4m38-8 4 4-4 4M1 24h7m32 0h7"/></svg><span><strong>慢慢拉一拉</strong><small>烦恼也能<br />有弹性。</small></span></div>
        <div><svg className="soft-gesture" viewBox="0 0 48 48" aria-hidden="true"><path className="gesture-form" d="M13 21C13 12 17 7 24 7S35 12 35 21S31 32 24 32S13 30 13 21Z"/><path d="M14 42h20m-15-5h10"/></svg><span><strong>松开，弹回来</strong><small>什么都不做，<br />也很好。</small></span></div>
      </section>
      <footer className="landing-footer"><span>A tiny pal. A softer day.</span><span>慢一点，也很好 <ArrowUpRight size={13} /></span></footer>
    </main>
  );
}
