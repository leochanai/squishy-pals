import Link from 'next/link';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import styles from './home.module.css';
import HomeDemo from './HomeDemo';

export default function Home() {
  return (
    <main className={styles.home}>
      <header className={styles.header}>
        <Link
          className={styles.brand}
          href="/"
          aria-label="Squishy Pals · 软软伙伴"
        >
          <span aria-hidden="true">s</span>Squishy Pals
        </Link>
        <Link className={styles.nav} href="/pals">
          挑选伙伴 <ArrowUpRight size={19} />
        </Link>
      </header>
      <HomeDemo>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>
            <span />
            掌心游乐场
          </p>
          <h1 id="landing-title">
            把快乐，
            <br />
            <em>捏在手里。</em>
          </h1>
          <p className={styles.description}>和软软的小伙伴，玩一会儿。</p>
          <div className={styles.entries}>
            <Link className={styles.start} href="/pals/octomochi">
              开始捏捏 <ArrowRight size={24} />
            </Link>
          </div>
          <p className={styles.note}>9 位小伙伴，等你来认识</p>
        </div>
      </HomeDemo>
    </main>
  );
}
