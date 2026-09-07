import { ArrowDown, ArrowUpRight, Hand, MousePointer2, Sparkles } from 'lucide-react';
import { characters } from '@/src/characters/registry';

export default function Home() {
  const featured = characters[0];
  return (
    <main className="landing-page">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Squishy Pals · 软软伙伴"><span className="brand-mark">✿</span><strong>Squishy Pals</strong><span className="brand-cn">软软伙伴</span></a>
        <a className="landing-nav" href="#pals">认识伙伴 <ArrowDown size={15} /></a>
      </header>
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-copy">
          <span className="eyebrow">A SMALL MOMENT, JUST FOR YOU</span>
          <h1 id="landing-title">Life gets busy.<br />Stay <em>squishy.</em></h1>
          <p className="landing-subtitle">让今天，软一点。</p>
          <p className="landing-description">和软软的小动物待一会儿。<br />捏一捏，拉一拉，把紧绷的心情慢慢松开。</p>
          <a className="landing-cta" href={`/pals/${featured.id}`}>和{featured.name}玩一会儿 <ArrowUpRight size={20} /></a>
          <span className="landing-caption">不用下载 · 打开就能放松</span>
        </div>
        <a className="landing-portrait" href={`/pals/${featured.id}`} aria-label={`进入${featured.name}游玩页`}>
          <span className="portrait-note">YOUR LITTLE SOFT SPOT</span>
          <img src={featured.image} alt={`${featured.name}的实际渲染形象`} width="977" height="877" fetchPriority="high" />
          <span className="portrait-label"><i style={{ background: featured.color }} /><span>{featured.englishName}<small>{featured.name}</small></span><ArrowUpRight size={20} /></span>
        </a>
      </section>
      <section className="landing-rituals" aria-label="放松的小动作">
        <div><Hand size={23} /><span><strong>轻轻捏一下</strong><small>让紧绷，变柔软。</small></span></div>
        <div><MousePointer2 size={23} /><span><strong>慢慢拉一拉</strong><small>烦恼也能有弹性。</small></span></div>
        <div><Sparkles size={23} /><span><strong>松开，弹回来</strong><small>什么都不做，也很好。</small></span></div>
      </section>
      <section className="landing-pals" id="pals" aria-labelledby="pals-title">
        <div className="pals-heading"><div><span className="eyebrow">MEET YOUR PALS / {String(characters.length).padStart(2, '0')}</span><h2 id="pals-title">找一个软软伙伴。</h2></div><p>每个小伙伴，都有自己的柔软方式。</p></div>
        <div className="pal-grid">{characters.map((pal, index) => (
          <a className="pal-card" key={pal.id} href={`/pals/${pal.id}`}>
            <div className="pal-card-image"><span className="pal-number">PAL / {String(index + 1).padStart(2, '0')}</span><img src={pal.image} alt={pal.name} width="977" height="877" loading="lazy" /></div>
            <div className="pal-card-copy"><span className="eyebrow">{pal.englishName}</span><h3>{pal.name}</h3><p>{pal.description}</p><span className="pal-card-link">进入小伙伴的世界 <ArrowUpRight size={20} /></span></div>
          </a>
        ))}</div>
      </section>
      <footer className="landing-footer"><span>A tiny pal. A softer day.</span><span>慢一点，也很好 <ArrowUpRight size={13} /></span></footer>
    </main>
  );
}
