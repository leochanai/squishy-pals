'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Hand, RotateCcw, Check, ArrowUpRight } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import type { MaterialPreset } from '@/src/characters/types';
import { accessoryOptions, toggleAccessory, type AccessoryId } from '@/src/core/accessory-options';
import type { Playground } from '@/src/core/playground';
import { characters, type RegisteredCharacter } from '@/src/characters/registry';

const basePalette = [
  { name: '芋泥紫', color: '#c6a0df' }, { name: '草莓粉', color: '#f2a4c0' },
  { name: '珊瑚橙', color: '#f69b85' }, { name: '薄荷绿', color: '#9cccbc' },
];
const materialOptions = [{ id: 'original', name: '软胶' }, { id: 'jelly', name: '果冻' }, { id: 'mechanical', name: '机械' }] as const;

export default function PlaygroundPage({ characterId }: { characterId: string }) {
  const router = useRouter();
  const host = useRef<HTMLDivElement>(null);
  const activeCompanion = useRef<HTMLButtonElement>(null);
  const game = useRef<Playground | null>(null);
  const selected = characters.find(item => item.id === characterId)!;
  const [displayedCharacter, setDisplayedCharacter] = useState(selected);
  const palette = basePalette.some(item => item.color === selected.color) ? basePalette : [{ name: ({ goldmochi: '金鱼橙', whalemochi: '深海蓝', sharkmochi: '鲨鱼蓝', crabmochi: '蟹壳红' }[selected.id] ?? '原色'), color: selected.color }, ...basePalette.slice(1)];
  const [color, setColor] = useState(selected.defaults.color);
  const [material, setMaterial] = useState<MaterialPreset>(selected.defaults.material);
  const [stiffness, setStiffness] = useState(selected.defaults.stiffness * 100);
  const [damping, setDamping] = useState(selected.defaults.damping * 100);
  const [status, setStatus] = useState('正在唤醒伙伴…');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const [hasScene, setHasScene] = useState(false);
  const [retry, setRetry] = useState(0);
  const [accessories, setAccessories] = useState<AccessoryId[]>([]);
  useLayoutEffect(() => {
    const button = activeCompanion.current;
    const list = button?.parentElement;
    if (!button || !list) return;
    const centerSelected = () => {
      const centered = button.offsetLeft + button.offsetWidth / 2 - list.clientWidth / 2;
      list.scrollLeft = Math.max(0, Math.min(centered, list.scrollWidth - list.clientWidth));
    };
    centerSelected();
    const observer = new ResizeObserver(centerSelected);
    observer.observe(list);
    observer.observe(button);
    return () => observer.disconnect();
  }, [characterId]);
  useEffect(() => {
    setEngineReady(false);
    let cancelled = false;
    let instance: Playground | null = null;
    import('@/src/core/playground').then(async ({ createPlayground }) => {
      if (cancelled || !host.current) return;
      instance = await createPlayground(host.current, { onStatus: setStatus });
      if (cancelled) { instance.dispose(); return; }
      game.current = instance;
      setEngineReady(true);
    }).catch((reason: Error) => { if (!cancelled) { setError(reason.message); setStatus('暂时无法唤醒'); } });
    return () => { cancelled = true; instance?.dispose(); if (game.current === instance) game.current = null; };
  }, []);
  useEffect(() => {
    setReady(false);
    const defaults = selected.defaults;
    setColor(defaults.color); setStiffness(defaults.stiffness * 100); setDamping(defaults.damping * 100);
    // Fetch the first model module while the shared renderer initializes.
    if (!engineReady || !game.current) { void selected.load().catch(() => {}); return; }
    let cancelled = false;
    setError('');
    void game.current!.switchCharacter(selected).then(shown => {
      if (cancelled || !shown) return;
      setDisplayedCharacter(selected); setHasScene(true); setReady(true);
    }).catch((reason: Error) => { if (!cancelled) { setError(reason.message); setStatus('暂时无法唤醒'); } });
    return () => { cancelled = true; };
  }, [selected, engineReady, retry]);
  useEffect(() => { if (ready) game.current?.setParameters({ color, material, stiffness: stiffness / 100, damping: damping / 100 }); }, [color, material, stiffness, damping, ready]);
  useEffect(() => { if (ready) game.current?.setAccessories(accessories); }, [accessories, ready]);
  const preload = (item: RegisteredCharacter) => {
    router.prefetch(`/pals/${item.id}`);
    if (game.current) void game.current.preloadCharacter(item).catch(() => {});
    else void item.load().catch(() => {});
  };
  const reset = () => { game.current?.reset(); setAccessories([]); setColor(selected.defaults.color); setMaterial(selected.defaults.material); setStiffness(selected.defaults.stiffness * 100); setDamping(selected.defaults.damping * 100); };
  return (
    <main className="playground-page" data-pal={characterId} style={{ '--pal-accent': color } as React.CSSProperties}>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Squishy Pals · 软软伙伴"><span className="brand-mark">✿</span><strong>Squishy Pals</strong><span className="brand-cn">软软伙伴</span></a>
      </header>
      <section className="experience" aria-label="软软伙伴互动区">
        <nav className="companions" aria-label="选择伙伴"><div>{characters.map(item => <button ref={item.id === characterId ? activeCompanion : undefined} className={`companion ${item.id === characterId ? 'selected' : ''}`} key={item.id} aria-label={`${item.englishName} ${item.name}`} aria-pressed={item.id === characterId} onPointerEnter={() => preload(item)} onFocus={() => preload(item)} onClick={() => { if (item.id === characterId) { if (error) setRetry(value => value + 1); return; } router.push(`/pals/${item.id}`, { scroll: false }); }}><span className="companion-icon" aria-hidden="true"><Image unoptimized src={`/pals/${item.id}-front.png${['sealmochi', 'turtlemochi', 'crabmochi'].includes(item.id) ? item.id === 'turtlemochi' ? '?v=4' : '?v=3' : ''}`} alt="" width={44} height={44} /></span>{item.id === characterId && <span className="selected-check"><Check size={12} /></span>}</button>)}</div></nav>
        <div className="play-stage">
        <div className="scene-host" ref={host} />
        {(!hasScene || error) && <div className="loading-card" role="status">{error ? <><strong>{engineReady ? '暂时无法切换伙伴' : '需要支持 WebGPU 的浏览器'}</strong><p>{error}</p>{engineReady ? <Button onClick={() => setRetry(value => value + 1)}>再试一次</Button> : <small>请在开启硬件加速的新版 Chrome、Edge 或 Safari 中打开。</small>}</> : <><span className="loading-dot" />正在揉好你的软软伙伴…</>}</div>}
        </div>
        <div className="stage-caption">
        <div className="character-label"><span className="label-dot" /><div><strong>{displayedCharacter.name}</strong><span>{displayedCharacter.englishName}</span></div></div>
        <div className="mood" aria-live="polite"><span />{status}</div>
        </div>
        <aside className="control-panel" aria-label="伙伴设置">
          <div className="color-section"><div className="control-label"><span>颜色</span><span>{palette.find(item => item.color === color)?.name}</span></div><div className="swatches">{palette.map(item => <button key={item.color} className={`swatch ${color === item.color ? 'selected' : ''}`} style={{ '--swatch': item.color } as React.CSSProperties} disabled={!ready} aria-label={item.name} aria-pressed={color === item.color} onClick={() => setColor(item.color)}>{color === item.color && <Check size={20} strokeWidth={2} />}</button>)}</div></div>
          <section className="material-section" aria-labelledby="material-label">
            <div className="control-label"><span id="material-label">材质</span></div>
            <RadioGroup className="material-options" aria-labelledby="material-label" value={material} disabled={!ready} onValueChange={value => setMaterial(value as MaterialPreset)}>
              {materialOptions.map(item => <label className="material-option" key={item.id}><RadioGroupItem value={item.id} /><span>{item.name}</span></label>)}
            </RadioGroup>
          </section>
          <section className="accessory-section" aria-labelledby="accessory-label">
            <div className="control-label"><span id="accessory-label">饰品</span><button className="clear-accessories" disabled={!ready || accessories.length === 0} onClick={() => setAccessories([])}>全部摘下</button></div>
            <div className="accessory-grid">{accessoryOptions.map(item => { const worn = accessories.includes(item.id); return <button key={item.id} className={`accessory-option ${worn ? 'selected' : ''}`} disabled={!ready} aria-label={item.name} aria-pressed={worn} onClick={() => setAccessories(current => toggleAccessory(current, item.id))}><Image unoptimized src={`/accessories/${item.id}.png`} alt="" width={48} height={48} />{worn && <Check className="accessory-check" size={12} aria-hidden="true" />}</button>; })}</div>
          </section>
          <div className="slider-section"><div className="control-label"><label id="stiffness-label">软硬</label><output>{stiffness < 34 ? '软乎乎' : stiffness < 68 ? '糯叽叽' : '紧实些'}</output></div><Slider disabled={!ready} aria-labelledby="stiffness-label" value={[stiffness]} min={0} max={100} onValueChange={value => setStiffness(Array.isArray(value) ? value[0] : value)} /><div className="range-ends"><span>软</span><span>硬</span></div></div>
          <div className="slider-section"><div className="control-label"><label id="damping-label">阻尼</label><output>{damping < 34 ? '晃一会儿' : damping < 68 ? '刚刚好' : '稳稳停住'}</output></div><Slider disabled={!ready} aria-labelledby="damping-label" value={[damping]} min={0} max={100} onValueChange={value => setDamping(Array.isArray(value) ? value[0] : value)} /><div className="range-ends"><span>多晃几下</span><span>很快停稳</span></div></div>
          <div className="actions"><Button className="poke-button" disabled={!ready} onClick={() => game.current?.poke()}><Hand size={20} />戳一下<kbd>SPACE</kbd></Button><Button className="reset-button" variant="outline" disabled={!ready} onClick={reset}><RotateCcw size={17} />恢复原状</Button></div>
        </aside>
      </section>
      <footer><span>A tiny pal. A softer day.</span><span>慢一点，也很好 <ArrowUpRight size={13} /></span></footer>
    </main>
  );
}
