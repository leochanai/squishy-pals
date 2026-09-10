import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { characters } from '@/src/characters/registry';

export default function Pals() {
  return (
    <main className="joy-catalogue">
      <header className="joy-header">
        <Link className="joy-brand" href="/" aria-label="Squishy Pals · 软软伙伴"><span aria-hidden="true">✿</span><strong>Squishy Pals</strong></Link>
        <Link className="joy-nav" href="/"><ArrowLeft size={15} /> 返回首页</Link>
      </header>
      <section className="collection" id="pals" aria-labelledby="pals-title">
        <div className="collection-heading"><div><span className="collection-en">MEET YOUR PALS / {String(characters.length).padStart(2, '0')}</span><h1 id="pals-title">小伙伴图鉴</h1></div><p>每个小伙伴，都有自己的柔软方式。</p></div>
        <div className="collection-grid">{characters.map((pal, index) => (
          <Link className="collection-card" style={{ '--pal-color': pal.color } as React.CSSProperties} key={pal.id} href={`/pals/${pal.id}`}>
            <div className="collection-image"><Image unoptimized src={pal.image} alt={pal.name} width={960} height={710} loading="lazy" /></div>
            <div className="collection-copy"><div className="collection-title"><span className="collection-number">{String(index + 1).padStart(2, '0')} / 09</span><div><h2>{pal.name}</h2><span className="collection-en">{pal.englishName}</span></div></div><p>{pal.description}</p><span className="collection-link" aria-hidden="true"><ArrowUpRight size={20} /></span></div>
          </Link>
        ))}</div>
      </section>
      <footer className="joy-footer"><span>A tiny pal. A softer day.</span><span>慢一点，也很好 <ArrowUpRight size={13} /></span></footer>
    </main>
  );
}
