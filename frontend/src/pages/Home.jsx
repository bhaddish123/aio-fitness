import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useInView } from '../hooks/useInView';
import { API_BASE_URL } from '../utils/constants';
import iconBody      from '../assets/icons/icon-body.png';
import iconMindset   from '../assets/icons/icon-mindset.png';
import iconLifestyle from '../assets/icons/icon-lifestyle.png';
import iconHealth    from '../assets/icons/icon-health.png';
import iconCoaching  from '../assets/icons/icon-coaching.png';
import iconNutrition from '../assets/icons/icon-nutrition.png';

const PHOTO_CACHE_KEY      = 'aio_fitness_hero_photo';
const VIDEO_CACHE_KEY      = 'aio_fitness_hero_video';
const FOCUS_PHOTO_CACHE_KEY = 'aio_fitness_focus_photo';

const DEFAULT_FAQ_PREVIEW = [
  { id: '1', question: 'How does online coaching work?',       answer: 'You get a personalized programming plan delivered through a digital dashboard, with remote check-ins to track progress and adjust as you go.' },
  { id: '2', question: 'Do I need a specific gym membership?', answer: "No — programs are built around the equipment you actually have access to, whether that's a full gym, a home setup, or just the basics." },
  { id: '3', question: 'How do we track progress?',            answer: 'Through app-based tracking and regular check-ins, so your plan keeps adapting to real results, not guesswork.' },
];

const BUILD_CARDS = [
  { title: 'Body Transformation',      desc: 'Build muscle, lose fat, become stronger, move with less pain, and improve performance.',                               icon: <img src={iconBody}      alt="" /> },
  { title: 'Mindset & Confidence',     desc: 'Develop confidence, resilience, discipline, and a healthier relationship with exercise.',                             icon: <img src={iconMindset}   alt="" /> },
  { title: 'Lifestyle & Habits',       desc: 'Create routines that fit your life and make consistency feel achievable.',                                            icon: <img src={iconLifestyle} alt="" /> },
  { title: 'Health & Longevity',       desc: 'Increase energy, build resilience, reduce injury risk, and support your long-term health.',                          icon: <img src={iconHealth}    alt="" /> },
  { title: 'Coaching & Accountability',desc: 'Stay focused, supported, and accountable through every stage of your journey.',                                       icon: <img src={iconCoaching}  alt="" /> },
  { title: 'Nutrition & Recovery',     desc: 'Build sustainable nutrition and recovery habits that support your goals without taking over your life.',               icon: <img src={iconNutrition} alt="" /> },
];

const COACHING_STEPS = [
  'Complimentary Consultation',
  'Assessment & Goal Setting',
  'Personalized Roadmap',
  'Implement, Adjust & Progress',
  'Build Results That Last',
];

const DEGREES = [
  { label: "Master's in Sport & Exercise Psychology", sub: 'West Chester University' },
  { label: "Bachelor's in Exercise Science",          sub: null },
  { label: "Associate's in Exercise Science & Wellness", sub: null },
];
const EDU_FOCUS = 'Nutrition & Athletic Coaching';

const CERTIFICATIONS = [
  'ACSM Certified Personal Trainer',
  'Pain-Free Performance Specialist',
  'Mental Health Aide',
  'CPR/AED Certified',
];

const EXPERIENCE_ITEMS = [
  { label: 'Personal Trainer & Online Coach',         sub: 'Life Time' },
  { label: 'Assistant Strength & Conditioning Coach', sub: 'Philadelphia Union' },
  { label: 'Gym Operations & Lead Coach',             sub: '3 Years' },
  { label: 'Physical Therapy Aide',                   sub: 'Exercise & Administrative Support' },
  { label: 'Group & Semi-Private Coach',              sub: null },
];

function AnimatedSection({ className, children }) {
  const [ref, inView] = useInView();
  return (
    <section
      ref={ref}
      className={`${className} animate-fade-in-up ${inView ? 'in-view' : ''}`}
    >
      {children}
    </section>
  );
}


export default function Home() {
  const [heroPhoto, setHeroPhoto]           = useState(() => localStorage.getItem(PHOTO_CACHE_KEY)       || '');
  const [heroVideo, setHeroVideo]           = useState(() => localStorage.getItem(VIDEO_CACHE_KEY)       || '');
  const [heroVideoError, setHeroVideoError] = useState(false);
  const [focusPhoto, setFocusPhoto]         = useState(() => localStorage.getItem(FOCUS_PHOTO_CACHE_KEY) || '');
  const [faqPreview, setFaqPreview]         = useState(DEFAULT_FAQ_PREVIEW);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);

  const heroMediaRef  = useRef(null);
  const focusMediaRef = useRef(null);
  const focusLagRef   = useRef(null);
  const [focusTextRef, focusTextInView] = useInView();

  useEffect(() => {
    const allowParallax = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && window.innerWidth >= 768;

    let rafId = null;
    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        if (allowParallax) {
          if (heroMediaRef.current) {
            const rect = heroMediaRef.current.getBoundingClientRect();
            heroMediaRef.current.style.transform = `translateY(${-rect.top * 0.5}px)`;
          }
          if (focusMediaRef.current) {
            const rect = focusMediaRef.current.getBoundingClientRect();
            focusMediaRef.current.style.transform = `translateY(${-rect.top * 0.3}px)`;
          }
          if (focusLagRef.current) {
            const rect = focusLagRef.current.getBoundingClientRect();
            const progress = Math.min(Math.max((window.innerHeight - rect.top) / window.innerHeight, 0), 1);
            focusLagRef.current.style.transform = `translateY(${progress * 60}px)`;
            focusLagRef.current.style.opacity = 0.7 + progress * 0.3;
          }
        }
        setScrolledPastHero(window.scrollY > 100);
        rafId = null;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/content`)
      .then((r) => r.json())
      .then((data) => {
        if (data['hero.photo']) {
          setHeroPhoto(data['hero.photo']);
          localStorage.setItem(PHOTO_CACHE_KEY, data['hero.photo']);
        }
        if (data['hero.video']) {
          setHeroVideo(data['hero.video']);
          setHeroVideoError(false);
          localStorage.setItem(VIDEO_CACHE_KEY, data['hero.video']);
        }
        if (data['home.focusPhoto']) {
          setFocusPhoto(data['home.focusPhoto']);
          localStorage.setItem(FOCUS_PHOTO_CACHE_KEY, data['home.focusPhoto']);
        }
        if (data.faqs) {
          try {
            const parsed = JSON.parse(data.faqs);
            if (parsed.length) setFaqPreview(parsed.slice(0, 3));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  return (
    <main className="home">

      {/* ── Section 1: Hero ────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-media" ref={heroMediaRef}>
          {heroVideo && !heroVideoError ? (
            <video
              className="hero-video"
              src={heroVideo}
              poster={heroPhoto || undefined}
              autoPlay loop muted playsInline
              onError={() => setHeroVideoError(true)}
            />
          ) : (
            <div
              className={`hero-media-fallback${heroPhoto ? ' hero-media-photo' : ''}`}
              style={heroPhoto ? { backgroundImage: `url(${heroPhoto})` } : undefined}
            >
              {!heroPhoto && (
                <>
                  <span className="hero-media-mark">A1</span>
                  <div className="hero-media-stripes" />
                </>
              )}
            </div>
          )}
          <div className="hero-overlay" />
          <div className="hero-grid-overlay" aria-hidden="true" />
        </div>

        <div className="hero-content">
          <h1 className="hero-title">
            <span>Transform Your Body.</span>
            <span>Strengthen Your Mind.</span>
            <span>Build a Healthier Life.</span>
          </h1>
          <p className="hero-sub">
            Personalized coaching that combines fitness, nutrition, psychology, accountability, and longevity to help you build lasting habits and become the healthiest version of yourself.
          </p>
          <div className="hero-cta-wrap">
            <Link to="/booking" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <button className="cta-button">Book a Free Consultation</button>
            </Link>
            <Link to="/about" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}>
              <button className="cta-button-outline">Learn More</button>
            </Link>
          </div>
        </div>

        <div
          className={`hero-scroll-indicator ${scrolledPastHero ? 'hero-scroll-indicator-hidden' : ''}`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      {/* Trust strip */}
      <div className="trust-strip">
        <span className="trust-strip-kicker">Professional Background</span>
        <div className="trust-strip-row">
          <span>Life Time Inc.</span>
          <span className="trust-strip-divider" aria-hidden="true" />
          <span>Philadelphia Union</span>
          <span className="trust-strip-divider" aria-hidden="true" />
          <span>West Chester University</span>
        </div>
      </div>

      {/* ── Section 2: Why All In One? ─────────────────────────── */}
      <AnimatedSection className="why-aio">
        <div className="why-aio-inner">
          <h2>Why 'All-In-One?'</h2>
          <p>Health isn't built by workouts alone.</p>
          <p>Real transformation happens when fitness, nutrition, mindset, accountability, recovery, and lifestyle all work together. That's why I created All-In-One Fitness.</p>
          <p>My coaching isn't about giving you another workout plan. It's about helping you build a lifestyle that keeps you healthy, consistent, strong, and excited to train, all while achieving your dream body and maintaining it for life.</p>
          <p className="why-aio-tagline">Build the body you want, and keep it for life.</p>
        </div>
      </AnimatedSection>

      {/* ── Section 3: What We Build Together ─────────────────── */}
      <AnimatedSection className="what-we-build">
        <div className="section-inner">
          <h2 className="section-heading">What We Build Together</h2>
          <div className="build-grid">
            {BUILD_CARDS.map(({ title, desc, icon }) => (
              <div key={title} className="build-card">
                <span className="build-icon" aria-hidden="true">{icon}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ── Section 4: How Coaching Works ─────────────────────── */}
      <AnimatedSection className="how-it-works">
        <div className="section-inner">
          <h2 className="section-heading">How Coaching Works</h2>
          <div className="steps-timeline">
            {COACHING_STEPS.map((label, i) => (
              <div key={i} className="step">
                <div className="step-circle">{i + 1}</div>
                <p className="step-label">{label}</p>
              </div>
            ))}
          </div>
          <div className="plan-split-label">
            <span className="plan-split-eyebrow">CHOOSE YOUR LEVEL OF SUPPORT</span>
            <p className="plan-split-tagline">Your roadmap is personalized. The level of support is up to you.</p>
          </div>
          <div className="plan-cards">
            <div className="plan-card">
              <span className="plan-card-eyebrow">PERSONALIZED PROGRAMMING</span>
              <h3 className="plan-card-name">Programming+</h3>
              <div className="plan-card-divider" />
              <p className="plan-card-desc">For clients who want a personalized training plan, clear direction, and the structure to train more independently.</p>
              <div className="plan-card-price">$250<span>/month</span></div>
              <Link to="/coaching/apply?package=programming-plus" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}>
                <button className="cta-button-outline">Get Started</button>
              </Link>
            </div>
            <div className="plan-card plan-card--featured">
              <span className="plan-card-eyebrow">COMPLETE COACHING</span>
              <h3 className="plan-card-name">All-In-One Coaching</h3>
              <div className="plan-card-divider" />
              <p className="plan-card-desc">For clients who want to go further with ongoing coaching across training, nutrition, mindset, recovery, lifestyle, and accountability.</p>
              <div className="plan-card-price">$500<span>/month</span></div>
              <Link to="/coaching/apply?package=aio-coaching" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}>
                <button className="cta-button">Apply Now</button>
              </Link>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ── Section 5: Meet Everett ────────────────────────────── */}
      <AnimatedSection className="focus-panel">
        <div className="focus-panel-image">
          <div className="focus-panel-media" ref={focusMediaRef}>
            <div
              className={`focus-panel-photo-layer${focusPhoto ? ' focus-panel-media-photo' : ''}`}
              style={focusPhoto ? { backgroundImage: `url(${focusPhoto})` } : undefined}
            >
              {!focusPhoto && <div className="focus-panel-stripes" />}
            </div>
            <div className="focus-panel-cover" />
          </div>
        </div>

        <div
          ref={focusTextRef}
          className={`focus-panel-content animate-fade-in-left ${focusTextInView ? 'in-view' : ''}`}
        >
          <div className="focus-panel-content-lag" ref={focusLagRef}>
            <span className="focus-panel-kicker">Meet Your Coach</span>
            <h2>Meet Everett</h2>
            <p className="focus-panel-lead">
              I wasn't always confident in my body. Growing up, I was bullied because of how I looked and struggled with anorexia, graduating high school at just 105 pounds.
            </p>
            <p>
              Strength training changed everything. Over the following years I gained more than 60 pounds, transformed my body, rebuilt my confidence, and discovered that fitness is about far more than appearance.
            </p>
            <p>
              That journey inspired me to earn degrees in Exercise Science and Sport &amp; Exercise Psychology and dedicate my career to helping others experience the same transformation.
            </p>
            <Link to="/about" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })} className="focus-panel-link">
              Full Story →
            </Link>
          </div>
        </div>
      </AnimatedSection>

      {/* ── Section 8: Education & Experience ─────────────────── */}
      <AnimatedSection className="edu-experience">
        <div className="section-inner">
          <h2 className="section-heading">Education &amp; Experience</h2>
          <div className="edu-columns">

            <div className="edu-col">
              <h3 className="edu-col-heading">Education</h3>
              <div className="edu-degree-grid">
                {DEGREES.map((d) => (
                  <div className="edu-degree-card" key={d.label}>
                    <span className="edu-type">DEGREE</span>
                    <span className="edu-label">{d.label}</span>
                    {d.sub && <span className="edu-sub">{d.sub}</span>}
                  </div>
                ))}
              </div>
              <p className="edu-focus-note">
                <span className="edu-focus-label">ADDITIONAL ACADEMIC FOCUS</span> {EDU_FOCUS}
              </p>
            </div>

            <div className="edu-col">
              <h3 className="edu-col-heading">Certifications</h3>
              <div className="edu-cert-grid">
                {CERTIFICATIONS.map((c) => (
                  <div className="edu-cert-card" key={c}>{c}</div>
                ))}
              </div>
            </div>

            <div className="edu-col">
              <h3 className="edu-col-heading">Coaching Experience</h3>
              <div className="edu-stat-card">
                <span className="edu-stat-number">5,000+</span>
                <span className="edu-stat-label">Professional Coaching Sessions Delivered</span>
                <span className="edu-stat-sub">Across In-Person &amp; Online Coaching</span>
              </div>
              <div className="edu-exp-grid">
                {EXPERIENCE_ITEMS.map((e) => (
                  <div className="edu-exp-card" key={e.label}>
                    <span className="edu-label">{e.label}</span>
                    {e.sub && <span className="edu-sub">{e.sub}</span>}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </AnimatedSection>

      {/* ── Section 9: FAQ preview ─────────────────────────────── */}
      <AnimatedSection className="faq-preview">
        <h2 className="heading-pop">Common Questions</h2>
        {faqPreview.map((item, i) => (
          <div className="faq-item" key={i}>
            <strong>{item.question}</strong>
            <p>{item.answer}</p>
          </div>
        ))}
        <Link to="/faq" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}>View All FAQs →</Link>
      </AnimatedSection>

      {/* ── Section 10: Final CTA ──────────────────────────────── */}
      <AnimatedSection className="home-cta">
        <h2>Ready to Become the Strongest Version of Yourself?</h2>
        <Link to="/booking" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <button className="cta-button">Book a Free Consultation</button>
        </Link>
      </AnimatedSection>

    </main>
  );
}
