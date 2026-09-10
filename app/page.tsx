import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowRight,
  Hand,
  MoveHorizontal,
  RotateCcw,
} from 'lucide-react';
import styles from './home.module.css';

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
      <section className={styles.hero} aria-labelledby="landing-title">
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
          <p className={styles.description}>
            和软软的小伙伴，玩一会儿。
          </p>
          <div className={styles.entries}>
            <Link className={styles.start} href="/pals/octomochi">
              开始捏捏 <ArrowRight size={24} />
            </Link>
          </div>
          <p className={styles.note}>9 位小伙伴，等你来认识</p>
        </div>
        <figure className={styles.figure}>
          <Image
            unoptimized
            src="/art/palm-octopus-white-pinch.png"
            alt="糯糯八爪鱼的玩法插画：暖白色卡通厚手套轻拉身体，近侧眼睛和脸颊随表面向拉扯方向偏移"
            width={1254}
            height={1254}
            priority
          />
          <figcaption>
            <span>
              <strong>糯糯八爪鱼</strong>
              <small>OctoMochi</small>
            </span>
          </figcaption>
        </figure>
      </section>
      <section className={styles.how} aria-label="怎么玩">
        <p>
          不用学，
          <br />
          <strong>上手就会。</strong>
        </p>
        <div>
          <Hand size={30} strokeWidth={1.7} />
          <span>
            <strong>捏一下</strong>
            <small>按住软软的身体</small>
          </span>
        </div>
        <div>
          <MoveHorizontal size={31} strokeWidth={1.7} />
          <span>
            <strong>拉一拉</strong>
            <small>拖住它，轻轻拉开</small>
          </span>
        </div>
        <div>
          <RotateCcw size={29} strokeWidth={1.7} />
          <span>
            <strong>松开手</strong>
            <small>看它慢慢弹回来</small>
          </span>
        </div>
      </section>
    </main>
  );
}
