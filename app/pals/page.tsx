import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { characters } from '@/src/characters/registry';
import brand from '../home.module.css';
import styles from './catalogue.module.css';

export default function Pals() {
  return (
    <main className={`${brand.home} ${styles.catalogue}`}>
      <header className={brand.header}>
        <Link
          className={brand.brand}
          href="/"
          aria-label="Squishy Pals · 软软伙伴"
        >
          <span aria-hidden="true">s</span>Squishy Pals
        </Link>
        <Link className={brand.nav} href="/">
          <ArrowLeft size={17} /> 返回首页
        </Link>
      </header>
      <section className={styles.collection} aria-labelledby="pals-title">
        <div className={styles.heading}>
          <h1 id="pals-title">
            今天，<em>捏谁？</em>
          </h1>
          <p className={styles.count}>{characters.length} 位小伙伴</p>
        </div>
        <div className={styles.grid}>
          {characters.map((pal, index) => (
            <Link className={styles.card} key={pal.id} href={`/pals/${pal.id}`}>
              <div className={styles.portrait}>
                <Image
                  unoptimized
                  src={`/art/catalogue/${pal.id}-${['crabmochi', 'cuttlemochi', 'turtlemochi'].includes(pal.id) ? 'v2' : 'v1'}.png`}
                  alt=""
                  width={1024}
                  height={1024}
                  loading={index < 3 ? 'eager' : 'lazy'}
                />
              </div>
              <div className={styles.copy}>
                <div className={styles.nameRow}>
                  <h2>{pal.name}</h2>
                  <ChevronRight className={styles.arrow} size={20} aria-hidden="true" />
                </div>
                <p>{pal.description.split(' · ').map(part => <span key={part}>{part}</span>)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
