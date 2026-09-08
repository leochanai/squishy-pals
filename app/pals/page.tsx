import Image from 'next/image';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { characters } from '@/src/characters/registry';

export default function Pals() {
  return (
    <main className="landing-page catalogue-page">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Squishy Pals · 软软伙伴"><span className="brand-mark">✿</span><strong>Squishy Pals</strong><span className="brand-cn">软软伙伴</span></a>
        <a className="landing-nav" href="/"><ArrowLeft size={15} /> 返回首页</a>
      </header>
      <section className="landing-pals" id="pals" aria-labelledby="pals-title">
        <div className="pals-heading"><div><span className="eyebrow">MEET YOUR PALS / {String(characters.length).padStart(2, '0')}</span><h1 id="pals-title">小伙伴图鉴</h1></div><p>每个小伙伴，都有自己的柔软方式。</p></div>
        <div className="pal-grid">{characters.map((pal, index) => (
          <a className="pal-card" style={{ '--pal-color': pal.color } as React.CSSProperties} key={pal.id} href={`/pals/${pal.id}`}>
            <div className="pal-card-image"><Image unoptimized src={pal.image} alt={pal.name} width={960} height={710} loading="lazy" /></div>
            <div className="pal-card-copy"><div className="pal-card-title"><span className="pal-number">PAL / {String(index + 1).padStart(2, '0')}</span><div><span className="eyebrow">{pal.englishName}</span><h3>{pal.name}</h3></div></div><p>{pal.description}</p><span className="pal-card-link">进入小伙伴的世界 <ArrowUpRight size={20} /></span></div>
          </a>
        ))}</div>
      </section>
      <footer className="landing-footer"><span>A tiny pal. A softer day.</span><span>慢一点，也很好 <ArrowUpRight size={13} /></span></footer>
    </main>
  );
}
