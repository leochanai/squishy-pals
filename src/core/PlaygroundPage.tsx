'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Hand, RotateCcw, Check, ArrowUpRight, SlidersHorizontal, ArrowLeft } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import styles from './playground.module.css';
import brand from '../../app/home.module.css';
import type { MaterialPreset } from '@/src/characters/types';
import { accessoryOptions, toggleAccessory, type AccessoryId } from '@/src/core/accessory-options';
import type { Playground } from '@/src/core/playground';
import { characters, getDefaultCharacterColor, type RegisteredCharacter } from '@/src/characters/registry';

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
  const settingsToggle = useRef<HTMLButtonElement>(null);
  const settingsBack = useRef<HTMLButtonElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const showSettings = (open: boolean) => {
    setSettingsOpen(open);
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => (open ? settingsBack : settingsToggle).current?.focus({ preventScroll: true }));
  };
  const selected = characters.find(item => item.id === characterId)!;
  const [displayedCharacter, setDisplayedCharacter] = useState(selected);
  const [color, setColor] = useState(selected.defaults.color);
  const [material, setMaterial] = useState<MaterialPreset>(selected.defaults.material);
  const currentMaterial = useRef(material);
  const defaultColor = getDefaultCharacterColor(selected, material);
  const palette = basePalette.some(item => item.color === defaultColor) ? basePalette : [{ name: selected.id === 'octomochi' && material === 'mechanical' ? '金属灰' : ({ goldmochi: '金鱼橙', whalemochi: '深海蓝', sharkmochi: '鲨鱼蓝', crabmochi: '蟹壳红' }[selected.id] ?? '原色'), color: defaultColor }, ...basePalette.slice(1)];
  const changeMaterial = (next: MaterialPreset) => {
    if (color === getDefaultCharacterColor(selected, material)) setColor(getDefaultCharacterColor(selected, next));
    currentMaterial.current = next;
    setMaterial(next);
  };
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
    setColor(getDefaultCharacterColor(selected, currentMaterial.current)); setStiffness(defaults.stiffness * 100); setDamping(defaults.damping * 100);
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
  const reset = () => { currentMaterial.current = selected.defaults.material; game.current?.reset(); setAccessories([]); setColor(selected.defaults.color); setMaterial(selected.defaults.material); setStiffness(selected.defaults.stiffness * 100); setDamping(selected.defaults.damping * 100); };
  return (
    <main className={styles.page} data-pal={characterId} data-settings={settingsOpen}>
      <header className={styles.header}>
        <Link className={brand.brand} href="/" aria-label="Squishy Pals · 软软伙伴"><span aria-hidden="true">s</span><strong>Squishy Pals</strong></Link>
        <Link className={brand.nav} href="/pals">小伙伴图鉴 <ArrowUpRight size={18} /></Link>
      </header>
      <section className={styles["experience"]} aria-label="软软伙伴互动区">
        <nav className={styles["companions"]} aria-label="选择伙伴"><span className={styles["companion-heading"]}>换个伙伴 <span>滑动查看更多 →</span></span><div>{characters.map(item => <button ref={item.id === characterId ? activeCompanion : undefined} className={styles.companion} key={item.id} aria-label={`${item.englishName} ${item.name}`} aria-pressed={item.id === characterId} onPointerEnter={() => preload(item)} onFocus={() => preload(item)} onClick={() => { if (item.id === characterId) { if (error) setRetry(value => value + 1); return; } router.push(`/pals/${item.id}`, { scroll: false }); }}><span className={styles["companion-icon"]} aria-hidden="true"><Image unoptimized src={`/art/catalogue/${item.id}-${['cuttlemochi', 'turtlemochi', 'crabmochi'].includes(item.id) ? 'v2' : 'v1'}.png`} alt="" width={44} height={44} /></span>{item.id === characterId && <span className={styles["selected-check"]}><Check size={12} /></span>}</button>)}</div></nav>
        <div className={styles["stage-caption"]}>
        <div className={styles["character-label"]}><div><h1>{displayedCharacter.name}</h1><span>{displayedCharacter.englishName}</span></div></div>
        <div className={styles["mood"]} aria-live="polite"><span />{status}</div>
        </div>
        <div className={styles["play-stage"]}>

        <div className={styles["scene-host"]} ref={host} />
        <p className={styles['preview-name']}>{displayedCharacter.name}</p>
        <button ref={settingsBack} className={styles['settings-back']} onClick={() => showSettings(false)}><ArrowLeft size={14} />回到捏玩</button>
        {(!hasScene || error) && <div className={styles["loading-card"]} role="status">{error ? <><strong>{engineReady ? '暂时无法切换伙伴' : '需要支持 WebGPU 的浏览器'}</strong><p>{error}</p>{engineReady ? <Button onClick={() => setRetry(value => value + 1)}>再试一次</Button> : <small>请在开启硬件加速的新版 Chrome、Edge 或 Safari 中打开。</small>}</> : <><span className={styles["loading-dot"]} />正在揉好你的软软伙伴…</>}</div>}
        </div>
          <div className={styles["actions"]}><p className={styles["play-instruction"]}>按住捏 · 拖动拉 · 松手弹</p><Button className={styles["poke-button"]} disabled={!ready} onClick={() => game.current?.poke()}><Hand size={20} />戳一下<kbd>SPACE</kbd></Button><Button className={styles["reset-button"]} variant="outline" disabled={!ready} onClick={reset}><RotateCcw size={17} />恢复原状</Button></div>
        <button ref={settingsToggle} className={styles['settings-toggle']} aria-expanded={settingsOpen} aria-controls="pal-settings" onClick={() => showSettings(true)}><SlidersHorizontal size={18} />外观与手感<ArrowUpRight size={18} /></button>
        <aside id="pal-settings" className={styles["control-panel"]} aria-label="伙伴设置">
          <div className={styles["settings-heading"]}><h2>外观与手感</h2></div>
          <div className={styles["color-section"]}><div className={styles["control-label"]}><span>颜色</span><span>{palette.find(item => item.color === color)?.name}</span></div><div className={styles["swatches"]}>{palette.map(item => <button key={item.color} className={styles.swatch} style={{ '--swatch': item.color } as React.CSSProperties} disabled={!ready} aria-label={item.name} aria-pressed={color === item.color} onClick={() => setColor(item.color)}>{color === item.color && <Check size={20} strokeWidth={2} />}</button>)}</div></div>
          <section className={styles["material-section"]} aria-labelledby="material-label">
            <div className={styles["control-label"]}><span id="material-label">材质</span></div>
            <RadioGroup className={styles["material-options"]} aria-labelledby="material-label" value={material} disabled={!ready} onValueChange={value => changeMaterial(value as MaterialPreset)}>
              {materialOptions.map(item => <label className={styles["material-option"]} key={item.id}><RadioGroupItem value={item.id} /><span>{item.name}</span></label>)}
            </RadioGroup>
          </section>
          <section className={styles["accessory-section"]} aria-labelledby="accessory-label">
            <div className={styles["control-label"]}><span id="accessory-label">饰品</span><button className={styles["clear-accessories"]} disabled={!ready || accessories.length === 0} onClick={() => setAccessories([])}>全部摘下</button></div>
            <div className={styles["accessory-grid"]}>{accessoryOptions.map(item => { const worn = accessories.includes(item.id); return <button key={item.id} className={styles['accessory-option']} disabled={!ready} aria-label={item.name} aria-pressed={worn} onClick={() => setAccessories(current => toggleAccessory(current, item.id))}><Image unoptimized src={`/accessories/${item.id}.png`} alt="" width={48} height={48} />{worn && <Check className={styles["accessory-check"]} size={12} aria-hidden="true" />}</button>; })}</div>
          </section>
          <div className={styles["slider-section"]}><div className={styles["control-label"]}><span id="stiffness-label">软硬</span><output>{stiffness < 34 ? '软乎乎' : stiffness < 68 ? '糯叽叽' : '紧实些'}</output></div><Slider thumbAlignment="center" disabled={!ready} aria-labelledby="stiffness-label" value={[stiffness]} min={0} max={100} onValueChange={value => setStiffness(Array.isArray(value) ? value[0] : value)} /><div className={styles["range-ends"]}><span>软</span><span>硬</span></div></div>
          <div className={styles["slider-section"]}><div className={styles["control-label"]}><span id="damping-label">阻尼</span><output>{damping < 34 ? '晃一会儿' : damping < 68 ? '刚刚好' : '稳稳停住'}</output></div><Slider thumbAlignment="center" disabled={!ready} aria-labelledby="damping-label" value={[damping]} min={0} max={100} onValueChange={value => setDamping(Array.isArray(value) ? value[0] : value)} /><div className={styles["range-ends"]}><span>多晃几下</span><span>很快停稳</span></div></div>

        </aside>
      </section>
    </main>
  );
}
