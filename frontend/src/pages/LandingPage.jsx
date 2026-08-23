import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { gsap } from "gsap";
import Lenis from "lenis";
import { ArrowRight, BookOpen, Check, HeartHandshake, LockKeyhole, ShieldCheck } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { BackToTopButton } from "@/components/layout/BackToTopButton";
import { InfoFooter } from "@/components/layout/InfoFooter";
const MIND_STATES = ["Overthinking", "Burnout", "Dreshing", "Stress", "Calmness"];
export function LandingPage() {
  const [showAll, setShowAll] = useState(false);
  const [activeState, setActiveState] = useState("Overthinking");
  const [pulse, setPulse] = useState(0);
  const lenisRef = useRef(null);
  const heroTitleRef = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".hero-title-letter", { yPercent: 115, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.85, stagger: 0.035, ease: "power4.out", delay: 0.12 });
    }, heroTitleRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setActiveState((current) => MIND_STATES[(MIND_STATES.indexOf(current) + 1) % MIND_STATES.length]), 3200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenisRef.current = lenis;
    let raf;
    const loop = (time) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return (
    <div className="public-page">
      <PublicHeader />
      <main>
        {/* ================= HERO SECTION ================= */}
        <section className={`hero-section hero-canvas mind-hero ${pulse ? "is-pulsing" : ""}`} data-testid="hero-section">
          <div className="hero-bg" aria-hidden="true" />
          <div className="mind-hero-layout">
            <motion.div
              className="mind-hero-copy"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="hero-eyebrow">Ruang kesehatan mental yang terasa manusiawi</span>
              <h1 ref={heroTitleRef} className="hero-title mind-title" data-testid="hero-heading-left">{"Temukan Ketenangan Anda".split(" ").map((word, i) => <span className="hero-title-word" key={word}>{word.split("").map((letter, j) => <span className="hero-title-letter" key={`${i}-${j}`}>{letter}</span>)}{i < 2 && <span className="hero-title-space"> </span>}</span>)}</h1>
              <p className="hero-value">Titikjiwa adalah ruang privat untuk menulis jurnal, berbagi cerita anonim, dan menemukan panduan tepercaya bagi kesehatan mentalmu.</p>
              <div className="mind-state-wrap" onMouseEnter={() => setActiveState(activeState)} aria-live="polite">
                <span className="mind-state-kicker">Hari ini terasa seperti</span>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.button key={activeState} type="button" className="mind-state-pill" onMouseEnter={() => setPulse(1)} onMouseLeave={() => setPulse(0)} initial={{ opacity: 0, scale: 0.78, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.78, y: -8 }} transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}>{activeState}<span>↗</span></motion.button>
                </AnimatePresence>
              </div>
              <div className="hero-actions-primary">
                <Link
                  to="/masuk"
                  className="hero-btn-pill hero-btn-primary"
                  onMouseEnter={() => setPulse(1)}
                  onMouseLeave={() => setPulse(0)}
                  data-testid="hero-primary-cta"
                >
                  Mulai <ArrowRight size={16} />
                </Link>
                <a href="/#mengapa" className="hero-learn-link">Kenali titikjiwa</a>
              </div>
              <span className="hero-trust"><ShieldCheck size={15} /> Privat, anonim, dan tanpa penghakiman.</span>
            </motion.div>

            <motion.div
              className="mind-hero-visual"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            >
              <motion.div className="mind-logo-hero" whileHover={{ scale: 1.035 }} animate={{ scale: pulse ? 1.07 : 1 }} transition={{ type: "spring", stiffness: 120, damping: 15 }} aria-label="Logo Titikjiwa bergerak di dalam pikiran">
                <div className="mind-logo-halo mind-logo-halo-one" />
                <div className="mind-logo-halo mind-logo-halo-two" />
                <svg className="mind-neural-activity" viewBox="0 0 100 100" aria-hidden="true">
                  <path className="mind-neural-path" d="M18 73 C28 62 29 43 43 39 C55 35 66 45 58 55 C51 64 52 73 72 69" />
                  <circle className="mind-neural-checkpoint checkpoint-one" cx="18" cy="73" r="2.2" />
                  <circle className="mind-neural-checkpoint checkpoint-two" cx="43" cy="39" r="2.2" />
                  <circle className="mind-neural-checkpoint checkpoint-three" cx="72" cy="69" r="2.2" />
                  <circle className="mind-neural-walker" cx="18" cy="73" r="2.5">
                    <animateMotion dur="5.8s" repeatCount="indefinite" path="M0 0 C10 -11 11 -30 25 -34 C37 -38 48 -28 40 -18 C33 -9 34 0 54 -4" />
                  </circle>
                </svg>
                <span className="mind-brand-signal mind-brand-signal-a" />
                <span className="mind-brand-signal mind-brand-signal-b" />
                <img src="/titikjiwa-logo.png" alt="Logo Titikjiwa" className="mind-logo-hero-image" />
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ================= MENGAPA TITIKJIWA ================= */}
        <section className="intro-section page-container" id="mengapa" data-testid="why-section">
          <motion.div
            className="intro-grid"
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-70px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="section-copy">
              <h2>Karena pulih tidak harus <em>sendirian.</em></h2>
              <p>Setiap orang punya cerita yang membentuknya. Di sini, kamu boleh menyimpannya rapat-rapat sebagai jurnal pribadi, atau membaginya anonim untuk memberi dan menerima dukungan.</p>
              <div className="intro-actions">
                <Link to="/masuk" className="button button-primary" data-testid="intro-journal-button">Mulai jurnal pribadi <ArrowRight size={16} /></Link>
                <Link to="/ruang" className="inline-link" data-testid="intro-stories-link">Baca cerita anonim <ArrowRight size={15} /></Link>
              </div>
            </div>
          </motion.div>
          <div className="feature-grid">
            <Feature icon={<LockKeyhole />} number="01" title="Tulis tanpa takut" text="Jurnal pribadi yang hanya bisa kamu lihat. Ruang untuk jujur pada diri sendiri." />
            <Feature icon={<HeartHandshake />} number="02" title="Ditemani yang mengerti" text="Cerita anonim, dukungan hangat, dan percakapan yang tidak menghakimi." />
            <Feature icon={<BookOpen />} number="03" title="Temukan langkah" text="Panduan dari psikolog terverifikasi dan direktori bantuan yang mudah dijangkau." />
          </div>
        </section>

        {/* ================= STORY / PRINSIP ================= */}
        <section className="story-section page-container" data-testid="story-section">
          <motion.div
            className="story-card"
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-70px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="story-quote">“</div>
            <p>Ruang ini bukan untuk memaksa kita melupakan. Tapi untuk perlahan mengerti apa yang pernah terjadi, dan memilih apa yang ingin kita bawa ke depan.</p>
            <span>— Prinsip titikjiwa</span>
          </motion.div>
          <motion.div
            className="story-aside"
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-70px" }}
            transition={{ duration: 0.6, delay: 0.12, ease: "easeOut" }}
          >
            <span className="eyebrow">Yang kamu temukan di sini</span>
            <ul>
              <li><Check size={16} /> Bahasa yang manusiawi</li>
              <li><Check size={16} /> Privasi yang dihormati</li>
              <li><Check size={16} /> Dukungan yang nyata</li>
            </ul>
            <Link to="/masuk" className="inline-link" data-testid="story-cta-link">
              Masuk ke ruangmu <ArrowRight size={15} />
            </Link>
          </motion.div>
        </section>

        {/* ================= UNTUK SIAPA ================= */}
        <section className="audience-section" id="untuk-siapa" data-testid="audience-section">
          <div className="page-container audience-inner">
            <motion.div
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-70px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <h2>Untuk kamu yang<br /><em>sedang belajar</em> memahami diri.</h2>
            </motion.div>
            <div className="audience-list">
              <AudienceItem title="Yang sedang memulai" text="Ingin punya tempat aman untuk menulis dan menamai apa yang dirasakan." delay={0} />
              <AudienceItem title="Yang sedang menemani" text="Ingin berbagi pengalaman tanpa mengambil alih proses orang lain." delay={0.1} />
              <AudienceItem title="Yang ingin bertumbuh" text="Siap menemukan insight baru dengan panduan yang bertanggung jawab." delay={0.2} />
            </div>
          </div>
        </section>

        {/* ================= DARI PARA AHLI ================= */}
        <section className="articles-preview page-container" data-testid="articles-preview-section">
          <motion.div
            className="section-heading"
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-70px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div>
              <h2>Pengetahuan yang terasa <em>dekat.</em></h2>
            </div>
            <button className="text-button" onClick={() => setShowAll(!showAll)} data-testid="articles-toggle-button">
              {showAll ? "Sembunyikan" : "Lihat semua panduan"} <ArrowRight size={16} />
            </button>
          </motion.div>
          <div className="article-strip">
            <ArticleTeaser category="REGULASI EMOSI" title="Saat tubuh menyimpan cerita yang belum selesai" color="sage" delay={0} />
            <ArticleTeaser category="RELASI SEHAT" title="Batasan diri bukan bentuk penolakan" color="clay" delay={0.08} />
            <ArticleTeaser category="JURNAL" title="Mulai dari satu kalimat yang jujur" color="sand" delay={0.16} />
          </div>
          {showAll && <div className="mini-note" data-testid="articles-expanded-note">Panduan lengkap tersedia setelah kamu masuk ke ruang titikjiwa.</div>}
        </section>

        {/* ================= FINAL CTA ================= */}
        <section className="final-cta">
          <motion.div
            className="page-container final-cta-inner"
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-70px" }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            <div className="final-cta-copy">
              <div className="section-kicker">Mulai dari mana saja</div>
              <h2>Satu langkah kecil<br />bisa mengubah <em>arah.</em></h2>
              <p>Tulis satu kalimat. Baca satu cerita. Tarik napas. Kamu tidak perlu menyelesaikan semuanya hari ini.</p>
            </div>
            <div className="final-cta-action">
              <Link to="/masuk" className="button button-light button-large" data-testid="final-cta-button">
                Buka ruang pulih <ArrowRight size={17} />
              </Link>
              <span className="final-cta-note">Privat sejak langkah pertama.</span>
            </div>
          </motion.div>
        </section>
      </main>
      <BackToTopButton />
      <InfoFooter />
    </div>
  );
}

function Feature({ icon, number, title, text }) { return <motion.article className="feature-item" initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-70px" }} transition={{ duration: .55, delay: parseInt(number, 10) * .09, ease: "easeOut" }}><div className="feature-top"><span className="feature-icon">{icon}</span><span className="feature-number">{number}</span></div><h3>{title}</h3><p>{text}</p></motion.article>; }

function AudienceItem({ title, text, delay = 0 }) { return <motion.div className="audience-item" initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-70px" }} transition={{ duration: .55, delay, ease: "easeOut" }}><span className="audience-line" /><div><h3>{title}</h3><p>{text}</p></div></motion.div>; }

function ArticleTeaser({ category, title, color, delay = 0 }) { return <motion.article className={`article-teaser ${color}`} initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-70px" }} transition={{ duration: .55, delay, ease: "easeOut" }}><span>{category}</span><h3>{title}</h3><ArrowRight size={17} /></motion.article>; }
