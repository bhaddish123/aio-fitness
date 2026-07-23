import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useInView } from '../hooks/useInView';
import { API_BASE_URL } from '../utils/constants';

const PHOTO_CACHE_KEY      = 'aio_fitness_hero_photo';
const VIDEO_CACHE_KEY      = 'aio_fitness_hero_video';
const FOCUS_PHOTO_CACHE_KEY = 'aio_fitness_focus_photo';

const DEFAULT_FAQ_PREVIEW = [
  { id: '1', question: 'How does online coaching work?',       answer: 'You get a personalized programming plan delivered through a digital dashboard, with remote check-ins to track progress and adjust as you go.' },
  { id: '2', question: 'Do I need a specific gym membership?', answer: "No — programs are built around the equipment you actually have access to, whether that's a full gym, a home setup, or just the basics." },
  { id: '3', question: 'How do we track progress?',            answer: 'Through app-based tracking and regular check-ins, so your plan keeps adapting to real results, not guesswork.' },
];

const BUILD_CARDS = [
  {
    title: 'Body Transformation',
    desc:  'Build muscle, lose fat, become stronger, move pain-free and improve performance.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5h11M6 10h12M8 14h8M10 18h4"/><rect x="3" y="3" width="18" height="18" rx="2"/>
      </svg>
    ),
  },
  {
    title: 'Mindset & Confidence',
    desc:  'Develop confidence, resilience, discipline, and a healthier relationship with exercise.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
    ),
  },
  {
    title: 'Lifestyle & Habits',
    desc:  'Create routines that fit your life and finally become consistent.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
      </svg>
    ),
  },
  {
    title: 'Health & Longevity',
    desc:  'Increase energy, reduce disease risk, prevent injuries, and improve quality of life for years to come.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    title: 'Coaching & Accountability',
    desc:  'Stay hopeful, motivated, supported, and accountable through every stage of your journey.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
];

const COACHING_STEPS = [
  'Complimentary Consultation',
  'Assessment & Goal Setting',
  'Personalized Roadmap',
  'Ongoing Coaching & Accountability',
  'Long-Term Lifestyle Transformation',
];

const EDU_ITEMS = [
  { type: 'Degree',        label: "Master's in Sport & Exercise Psychology",    sub: 'West Chester University' },
  { type: 'Degree',        label: "Bachelor's in Exercise Science",              sub: null },
  { type: 'Degree',        label: "Associate's in Exercise Science & Wellness",  sub: null },
  { type: 'Minor',         label: 'Nutrition',                                   sub: null },
  { type: 'Minor',         label: 'Athletic Coaching',                           sub: null },
  { type: 'Certification', label: 'ACSM Certified Personal Trainer',             sub: null },
  { type: 'Certification', label: 'Pain-Free Performance Specialist',            sub: null },
  { type: 'Experience',    label: 'Assistant Strength & Conditioning Coach',     sub: 'Philadelphia Union' },
  { type: 'Experience',    label: 'Personal Trainer & Online Coach',             sub: 'Life Time Inc.' },
];

function getInitials(name) {
  return name.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

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
  const [testimonials, setTestimonials]     = useState([]);
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
        if (data.testimonials) {
          try {
            const parsed = JSON.parse(data.testimonials);
            if (parsed.length) setTestimonials(parsed);
          } catch {}
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
          <h2>Why 'All In One?'</h2>
          <p>Health isn't built by workouts alone.</p>
          <p>Real transformation happens when fitness, nutrition, mindset, accountability, recovery, and lifestyle all work together. That's why I created All In One Fitness.</p>
          <p>My coaching isn't about giving you another workout plan. It's about helping you build a lifestyle that allows you to stay healthy, energetic, confident, and active for decades.</p>
          <p className="why-aio-tagline">Fitness is the vehicle. Transformation is the destination.</p>
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
        </div>
      </AnimatedSection>

      {/* ── Section 5: Coaching Services ──────────────────────── */}
      <AnimatedSection className="services-preview">
        <div className="section-inner">
          <h2 className="section-heading">Coaching Services</h2>
          <div className="services-grid">

            <div className="service-card">
              <h3>Custom Training Program</h3>
              <div className="service-price">
                <span className="service-price-amount">$200</span>
                <span className="service-price-period">one-time</span>
              </div>
              <ul className="service-features">
                <li>Personalized program</li>
                <li>Trainerize app</li>
                <li>Exercise library</li>
                <li>Onboarding</li>
              </ul>
              <Link to="/about" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}>
                <button className="cta-button-outline svc-btn">Learn More</button>
              </Link>
            </div>

            <div className="service-card featured">
              <span className="service-badge">Most Popular</span>
              <h3>All In One Coaching</h3>
              <div className="service-price">
                <span className="service-price-amount">$500</span>
                <span className="service-price-period">/month</span>
              </div>
              <ul className="service-features">
                <li>Customized programming</li>
                <li>Program updates</li>
                <li>Two coaching calls/month</li>
                <li>Accountability</li>
                <li>Nutrition guidance</li>
                <li>Messaging</li>
                <li>Form review</li>
                <li>Community</li>
                <li>Complimentary virtual workout</li>
              </ul>
              <Link to="/booking" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <button className="cta-button svc-btn">Apply Now</button>
              </Link>
            </div>

          </div>
        </div>
      </AnimatedSection>

      {/* ── Section 6: Client Transformations ─────────────────── */}
      <AnimatedSection className="client-transformations">
        <div className="section-inner">
          <h2 className="section-heading">Client Transformations</h2>
          {testimonials.length > 0 ? (
            <div className="testimonials-grid">
              {testimonials.map((t, i) => (
                <div className="testimonial-card" key={i}>
                  <p>"{t.quote}"</p>
                  <div className="testimonial-author-row">
                    <span className="testimonial-avatar" aria-hidden="true">{getInitials(t.author)}</span>
                    <span className="testimonial-author-name">{t.author}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="transformations-placeholder">
              <p className="transformations-placeholder-label">Before &amp; afters · Milestone wins · Client stories</p>
              <p className="transformations-placeholder-sub">Real results coming soon.</p>
            </div>
          )}
        </div>
      </AnimatedSection>

      {/* ── Section 7: Meet Everett ────────────────────────────── */}
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
          <div className="edu-grid">
            {EDU_ITEMS.map(({ type, label, sub }) => (
              <div key={label} className="edu-item">
                <span className="edu-type">{type}</span>
                <span className="edu-label">{label}</span>
                {sub && <span className="edu-sub">{sub}</span>}
              </div>
            ))}
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
