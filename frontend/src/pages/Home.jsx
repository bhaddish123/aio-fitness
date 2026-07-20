import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useInView } from '../hooks/useInView';
import { API_BASE_URL } from '../utils/constants';

const PHOTO_CACHE_KEY = 'aio_fitness_hero_photo';
const VIDEO_CACHE_KEY = 'aio_fitness_hero_video';
const FOCUS_PHOTO_CACHE_KEY = 'aio_fitness_focus_photo';

// Same defaults as About.jsx's DEFAULT_TESTIMONIALS — both pages render
// from the same admin-editable `testimonials` content key, so this list
// is what shows before the fetch resolves and stays in sync with About
// once it does (same fix as the earlier FAQ home/page mismatch).
const DEFAULT_TESTIMONIALS = [
  { id: '1', quote: "Everett's approach is unlike any trainer I've worked with before.", author: 'Sarah M.' },
  { id: '2', quote: 'Lost 30 lbs and kept it off. This changed my life.', author: 'Marcus T.' },
  { id: '3', quote: 'I finally feel confident in the gym thanks to Everett.', author: 'Priya K.' },
];

// First 3 of FAQ.jsx's DEFAULT_FAQ_ITEMS — same `faqs` content key, so
// editing FAQs in the admin panel updates this preview too instead of
// it silently drifting from the real /faq page.
const DEFAULT_FAQ_PREVIEW = [
  { id: '1', question: 'How does online coaching work?', answer: 'You get a personalized programming plan delivered through a digital dashboard, with remote check-ins to track progress and adjust as you go.' },
  { id: '2', question: 'Do I need a specific gym membership?', answer: "No — programs are built around the equipment you actually have access to, whether that's a full gym, a home setup, or just the basics." },
  { id: '3', question: 'How do we track progress?', answer: 'Through app-based tracking and regular check-ins, so your plan keeps adapting to real results, not guesswork.' },
];

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function AnimatedSection({ className, children, delay }) {
  const [ref, inView] = useInView();
  return (
    <section
      ref={ref}
      className={`${className} animate-fade-in-up ${inView ? 'in-view' : ''} ${delay ? `delay-${delay}` : ''}`}
    >
      {children}
    </section>
  );
}

export default function Home() {
  const [heroPhoto, setHeroPhoto] = useState(
    () => localStorage.getItem(PHOTO_CACHE_KEY) || ''
  );
  const [heroVideo, setHeroVideo] = useState(
    () => localStorage.getItem(VIDEO_CACHE_KEY) || ''
  );
  const [heroVideoError, setHeroVideoError] = useState(false);
  const [focusPhoto, setFocusPhoto] = useState(
    () => localStorage.getItem(FOCUS_PHOTO_CACHE_KEY) || ''
  );
  const [testimonials, setTestimonials] = useState(DEFAULT_TESTIMONIALS);
  const [faqPreview, setFaqPreview] = useState(DEFAULT_FAQ_PREVIEW);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const heroMediaRef = useRef(null);
  const focusMediaRef = useRef(null);
  const focusLagRef = useRef(null);
  const [focusTextRef, focusTextInView] = useInView();

  // Parallax — hero media drifts at 0.5x scroll speed, the "Train With
  // Everett" panel media at 0.3x, and its text column lags/fades in the
  // opposite sense (asymmetric two-speed effect). All driven by each
  // element's own getBoundingClientRect().top (viewport-relative), NOT
  // window.scrollY. scrollY is the total page scroll — for a section
  // several screens down the page it's already huge by the time that
  // section first becomes visible, so offsetting by scrollY * factor
  // shoves content hundreds of pixels out of its own frame on the very
  // first visible frame. rect.top is naturally bounded to roughly the
  // viewport height while a section is anywhere near visible, regardless
  // of how much page scroll happened before it. Both ancestors (.hero,
  // .focus-panel) already clip with overflow:hidden where needed.
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
            // 0 when the element's top is at the bottom of the viewport,
            // 1 once it has reached the top — bounded regardless of total
            // page scroll, same fix as the media parallax above.
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

      <section className="hero">
        <div className="hero-media" ref={heroMediaRef}>
          {heroVideo && !heroVideoError ? (
            <video
              className="hero-video"
              src={heroVideo}
              poster={heroPhoto || undefined}
              autoPlay
              loop
              muted
              playsInline
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
          <h1 className="hero-title"><span>Everett</span><span>Lee</span></h1>
          <p className="hero-credentials">M.S. Sports Science &amp; Exercise Psychology | CPT - Nutrition &amp; Life Coach</p>
          <div className="hero-cta-wrap">
            <Link to="/booking" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <button className="cta-button">Book a Session</button>
            </Link>
          </div>
        </div>
        <div className={`hero-scroll-indicator ${scrolledPastHero ? 'hero-scroll-indicator-hidden' : ''}`} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

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

      <AnimatedSection className="metrics-band">
        <div className="metrics-header">
          <h2 className="heading-pop">The AIO Standard</h2>
        </div>
        <div className="metrics-grid">
          <div className="metric-block">
            <span className="metric-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15.5 14" />
              </svg>
            </span>
            <span className="metric-value">10+</span>
            <span className="metric-label">Years of Experience</span>
          </div>
          <div className="metric-block">
            <span className="metric-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="8" r="3.5" />
                <path d="M3.5 19.5c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" />
                <path d="M16 8.5a3 3 0 1 1 0 6" />
                <path d="M16 14.2c2.2.4 4 2.3 4 4.6" />
              </svg>
            </span>
            <span className="metric-value">1:1</span>
            <span className="metric-label">Personalized Training</span>
          </div>
          <div className="metric-block">
            <span className="metric-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 3h6" />
                <path d="M10 3v6.2L5.5 17a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9.2V3" />
                <path d="M7.5 15h9" />
              </svg>
            </span>
            <span className="metric-value">100%</span>
            <span className="metric-label">Science-Backed Programming</span>
          </div>
          <div className="metric-block">
            <span className="metric-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18" />
                <path d="M12 3a13 13 0 0 1 0 18" />
                <path d="M12 3a13 13 0 0 0 0 18" />
              </svg>
            </span>
            <span className="metric-value">Digital Platform</span>
            <span className="metric-label">Science-Backed Remote Coaching</span>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="testimonials-preview">
        <h2 className="heading-pop">What Clients Say</h2>
        <div className="testimonials-grid">
          {testimonials.map((t, index) => (
            <div className="testimonial-card" key={index}>
              <p>"{t.quote}"</p>
              <div className="testimonial-author-row">
                <span className="testimonial-avatar" aria-hidden="true">{getInitials(t.author)}</span>
                <span className="testimonial-author-name">{t.author}</span>
              </div>
            </div>
          ))}
        </div>
      </AnimatedSection>

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
            <h2>Train With Everett</h2>
            <p className="focus-panel-lead">
              Trained at Life Time Inc., one of the country's most respected fitness brands, Everett now brings that same premium standard directly to you — independently, one-on-one, fully online.
            </p>
            <p>
              Everett Lee, M.S. in Sports Science &amp; Exercise Psychology. Shaped by his training at
              Life Time Inc., with additional experience supporting elite athletes at the Philadelphia
              Union, he specializes in evidence-based, sustainable body transformation.
            </p>

            <span className="focus-panel-pedigree-label">Professional Pedigree</span>
            <dl className="focus-panel-pedigree">
              <div className="focus-panel-pedigree-item">
                <dt>Premier Training</dt>
                <dd>Life Time Inc.</dd>
              </div>
              <div className="focus-panel-pedigree-item">
                <dt>Elite Performance</dt>
                <dd>Philadelphia Union (Assistant Strength &amp; Conditioning Coach)</dd>
              </div>
              <div className="focus-panel-pedigree-item">
                <dt>Education</dt>
                <dd>M.S. Sports &amp; Exercise Psychology, West Chester University</dd>
              </div>
            </dl>

            <Link to="/about" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })} className="focus-panel-link">Learn More →</Link>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="faq-preview">
        <h2 className="heading-pop">Common Questions</h2>
        {faqPreview.map((item, index) => (
          <div className="faq-item" key={index}>
            <strong>{item.question}</strong>
            <p>{item.answer}</p>
          </div>
        ))}
        <Link to="/faq" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}>View All FAQs →</Link >
      </AnimatedSection>

    </main>
  );
}
