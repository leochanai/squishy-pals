import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Hand, MoveHorizontal, RotateCcw } from 'lucide-react';

export default function Home() {
  return (
    <main className="joy-home">
      <header className="joy-header">
        <Link className="joy-brand" href="/" aria-label="Squishy Pals · 软软伙伴"><span aria-hidden="true">✿</span><strong>Squishy Pals</strong></Link>
        <Link className="joy-nav" href="/pals">小伙伴图鉴 <ArrowUpRight size={18} /></Link>
      </header>
      <section className="joy-hero" aria-labelledby="landing-title">
        <div className="joy-copy">
          <p className="joy-kicker">软软伙伴 · SQUISHY PALS</p>
          <h1 id="landing-title">让今天，<br /><span>软一点。</span></h1>
          <p className="joy-description">捏一捏，拉一拉。<br />和软软的小动物，待一会儿。</p>
          <Link className="joy-cta" href="/pals">挑一位小伙伴 <ArrowUpRight size={22} /></Link>
          <p className="joy-caption">无需下载，在浏览器里玩</p>
        </div>
        <figure className="joy-portrait">
          <span className="joy-word" aria-hidden="true">squishy.</span>
          <Image className="joy-pal" unoptimized src="/pals/octomochi-refined.png" alt="紫色的糯糯八爪鱼，圆圆的脑袋和八只柔软腕足" width={1024} height={1024} priority />
          <figcaption><Link className="joy-featured" href="/pals/octomochi"><span>01 / 09</span><span>糯糯八爪鱼 <small>OctoMochi</small></span><ArrowUpRight size={20} aria-hidden="true" /></Link></figcaption>
        </figure>
      </section>
      <section className="joy-gestures" aria-label="放松的小动作">
        <div><Hand size={25} strokeWidth={1.5} /><span><strong>轻轻捏</strong><small>按住，捏一捏</small></span></div>
        <div><MoveHorizontal size={28} strokeWidth={1.5} /><span><strong>慢慢拉</strong><small>拖动，拉一拉</small></span></div>
        <div><RotateCcw size={25} strokeWidth={1.5} /><span><strong>松开手</strong><small>松手，弹回来</small></span></div>
      </section>
      <footer className="joy-footer"><span>A tiny pal. A softer day.</span><span>慢一点，也很好。</span></footer>
    </main>
  );
}
