'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Hand, MoveHorizontal, Pause, Play, RotateCcw } from 'lucide-react';
import styles from './home.module.css';

const STAGES = [
  {
    title: '捏一下',
    start: 0,
    detail: '按住软软的身体',
    image: '/art/palm-demo-start.webp',
    Icon: Hand,
  },
  {
    title: '拉一拉',
    start: 2,
    detail: '拖动身体，轻轻拉开',
    image: '/art/palm-demo-pull.webp',
    Icon: MoveHorizontal,
  },
  {
    title: '松开手',
    start: 5.65,
    detail: '看它慢慢弹回来',
    image: '/art/palm-demo-release.webp',
    Icon: RotateCcw,
  },
];

export default function HomeDemo({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const figureRef = useRef<HTMLElement>(null);
  const attempted = useRef(false);
  const pendingSeek = useRef<number | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [ended, setEnded] = useState(false);
  const [videoStage, setVideoStage] = useState(0);
  const [requested, setRequested] = useState(0);
  const [stage, setStage] = useState(0);
  const [loads, setLoads] = useState<Array<'loading' | 'loaded' | 'failed'>>([
    'loading',
    'loading',
    'loading',
  ]);
  const selectStage = (index: number) => {
    setRequested(index);
    if (loads[index] === 'loaded') setStage(index);
    if (!videoFailed) playVideo(STAGES[index].start);
  };
  const playVideo = (start?: number) => {
    const video = videoRef.current;
    if (!video || videoFailed) return;
    attempted.current = true;
    setWaiting(true);
    setEnded(false);
    if (start !== undefined) {
      if (video.readyState >= 1) video.currentTime = start;
      else pendingSeek.current = start;
    }
    void video.play().catch(() => {
      setPlaying(false);
      setWaiting(false);
    });
  };
  useEffect(() => {
    const video = videoRef.current;
    const figure = figureRef.current;
    if (!video || !figure) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    video.preload =
      motion.matches || connection?.saveData ? 'none' : 'metadata';
    video.src = '/art/palm-demo.mp4';
    let visible = false;
    const maybePlay = () => {
      if (
        !visible ||
        document.hidden ||
        attempted.current ||
        motion.matches ||
        connection?.saveData
      )
        return;
      attempted.current = true;
      setWaiting(true);
      void video.play().catch(() => setWaiting(false));
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio >= 0.2;
        if (visible) maybePlay();
        else video.pause();
      },
      { threshold: 0.2 },
    );
    observer.observe(figure);
    const visibility = () => {
      if (document.hidden) video.pause();
      else maybePlay();
    };
    const preference = () => {
      if (motion.matches) video.pause();
    };
    document.addEventListener('visibilitychange', visibility);
    motion.addEventListener('change', preference);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      motion.removeEventListener('change', preference);
      video.pause();
    };
  }, []);
  const displayedStage = videoVisible && !videoFailed ? videoStage : stage;
  const staticStatus =
    loads[requested] === 'failed'
      ? '这一步暂时无法加载，请选择其他步骤'
      : loads[requested] === 'loading'
        ? '正在加载演示…'
        : '点选步骤，看它变化';
  const status = videoFailed
    ? staticStatus
    : waiting
      ? '正在加载演示…'
      : '点选步骤，看它变化';

  return (
    <>
      <section className={styles.hero} aria-labelledby="landing-title">
        {children}
        <figure className={styles.figure} id="palm-demo" ref={figureRef}>
          <div className={styles.demoFrames}>
            {STAGES.map(({ image }, index) => (
              <Image
                key={image}
                className={styles.demoFrame}
                style={{
                  visibility:
                    stage === index && loads[index] !== 'failed'
                      ? 'visible'
                      : 'hidden',
                }}
                unoptimized
                src={image}
                alt={
                  stage === index
                    ? `糯糯八爪鱼玩法演示：${STAGES[displayedStage].detail}`
                    : ''
                }
                aria-hidden={stage !== index}
                width={1024}
                height={1024}
                priority={index === 0}
                loading={index === 0 ? undefined : 'eager'}
                onLoad={() => {
                  setLoads((current) =>
                    current.map((value, item) =>
                      item === index ? 'loaded' : value,
                    ),
                  );
                  if (requested === index || loads[stage] === 'failed')
                    setStage(index);
                }}
                onError={() => {
                  setLoads((current) =>
                    current.map((value, item) =>
                      item === index ? 'failed' : value,
                    ),
                  );
                  if (stage === index) {
                    const fallback = loads.findIndex(
                      (value) => value === 'loaded',
                    );
                    if (fallback >= 0) setStage(fallback);
                  }
                }}
              />
            ))}
            <video
              ref={videoRef}
              className={styles.demoVideo}
              style={{
                visibility: videoVisible && !videoFailed ? 'visible' : 'hidden',
              }}
              poster="/art/palm-demo-start.webp"
              muted
              playsInline
              preload="metadata"
              aria-hidden="true"
              onLoadedMetadata={(event) => {
                if (pendingSeek.current !== null) {
                  event.currentTarget.currentTime = pendingSeek.current;
                  pendingSeek.current = null;
                }
              }}
              onPlaying={() => {
                setPlaying(true);
                setWaiting(false);
                setVideoVisible(true);
              }}
              onPause={() => {
                setPlaying(false);
                setWaiting(false);
              }}
              onWaiting={() => setWaiting(true)}
              onEnded={() => {
                setPlaying(false);
                setWaiting(false);
                setEnded(true);
              }}
              onTimeUpdate={(event) => {
                const time = event.currentTarget.currentTime;
                setVideoStage(
                  time >= STAGES[2].start ? 2 : time >= STAGES[1].start ? 1 : 0,
                );
              }}
              onError={() => {
                setVideoFailed(true);
                setPlaying(false);
                setWaiting(false);
                setRequested(videoStage);
                if (loads[videoStage] === 'loaded') setStage(videoStage);
              }}
            />
          </div>
          <figcaption>
            <span>
              <strong>糯糯八爪鱼</strong>
              <small>OctoMochi</small>
            </span>
            <div className={styles.demoControls}>
              {!videoFailed && !ended && (
                <button
                  type="button"
                  className={styles.demoToggle}
                  aria-controls="palm-demo"
                  onClick={() =>
                    playing || waiting ? videoRef.current?.pause() : playVideo()
                  }
                  aria-label={
                    playing || waiting
                      ? '暂停演示'
                      : videoVisible
                        ? '继续演示'
                        : '播放演示'
                  }
                >
                  {playing || waiting ? (
                    <Pause size={15} />
                  ) : (
                    <Play size={15} />
                  )}
                  {playing || waiting ? '暂停' : videoVisible ? '继续' : '播放'}
                </button>
              )}
              <output
                className={
                  videoFailed ? styles.demoStatic : styles.demoAnnouncement
                }
                aria-live="polite"
              >
                {videoFailed
                  ? loads[requested] === 'failed'
                    ? staticStatus
                    : '动态演示暂不可用，可点选步骤查看'
                  : `${STAGES[displayedStage].title}。${status}`}
              </output>
            </div>
          </figcaption>
        </figure>
      </section>
      <section className={styles.how} aria-label="怎么玩：选择步骤观看演示">
        <h2>玩法演示</h2>
        {STAGES.map(({ title, detail, Icon }, index) => {
          const content = (
            <>
              <Icon size={30} strokeWidth={1.7} />
              <span>
                <strong>{title}</strong>
                <small>{detail}</small>
              </span>
            </>
          );
          return (
            <button
              className={styles.demoStep}
              type="button"
              key={title}
              aria-label={`观看${title}演示：${detail}`}
              aria-pressed={
                displayedStage === index &&
                (videoVisible || loads[index] === 'loaded')
              }
              aria-controls="palm-demo"
              onClick={() => selectStage(index)}
            >
              {content}
            </button>
          );
        })}
      </section>
    </>
  );
}
