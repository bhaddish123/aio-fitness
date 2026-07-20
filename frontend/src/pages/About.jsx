import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../utils/constants';
import { useInView } from '../hooks/useInView';

const DEFAULT_BIO =
  "Everett Lee, M.S. in Sports Science & Exercise Psychology. Trained at Life Time Inc., one of " +
  "the country's most respected fitness brands, with additional experience supporting elite " +
  "athletes at the Philadelphia Union, I bring evidence-based, science-backed remote programming " +
  "to clients worldwide — independently, on my own terms.";

const DEFAULT_TESTIMONIALS = [
  { id: '1', quote: "Everett's approach is unlike any trainer I've worked with before.", author: 'Sarah M.' },
  { id: '2', quote: 'Lost 30 lbs and kept it off. This changed my life.',            author: 'Marcus T.' },
  { id: '3', quote: 'I finally feel confident in the gym thanks to Everett.',            author: 'Priya K.'  },
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

function Animated({ as: Tag = 'section', className = '', delay, children, ...props }) {
  const [ref, inView] = useInView();
  return (
    <Tag
      ref={ref}
      className={`${className} animate-fade-in-up ${inView ? 'in-view' : ''} ${delay ? `delay-${delay}` : ''}`}
      {...props}
    >
      {children}
    </Tag>
  );
}

const PHOTO_CACHE_KEY = 'aio_fitness_trainer_photo';

export default function About() {
  const [bio, setBio]                   = useState(DEFAULT_BIO);
  const [photo, setPhoto]               = useState(() => localStorage.getItem(PHOTO_CACHE_KEY) || '');
  const [testimonials, setTestimonials] = useState(DEFAULT_TESTIMONIALS);
  const introLagRef = useRef(null);

  // Counter-parallax "lag" on the text column — settles down and fades
  // in slower than the image's peekaboo reveal beside it, as the hero
  // transits the viewport. Same bounded-progress approach as Home's
  // focus-panel lag: driven by the element's own getBoundingClientRect
  // top, not window.scrollY, so it stays correct regardless of how much
  // page scroll happened before this section came into view.
  useEffect(() => {
    const allowParallax = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && window.innerWidth >= 768;
    if (!allowParallax) return;

    let rafId = null;
    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        if (introLagRef.current) {
          const rect = introLagRef.current.getBoundingClientRect();
          const progress = Math.min(Math.max((window.innerHeight - rect.top) / window.innerHeight, 0), 1);
          introLagRef.current.style.transform = `translateY(${progress * 60}px)`;
          introLagRef.current.style.opacity = 0.7 + progress * 0.3;
        }
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
        if (data['about.bio'])   setBio(data['about.bio']);
        if (data['about.photo']) {
          setPhoto(data['about.photo']);
          localStorage.setItem(PHOTO_CACHE_KEY, data['about.photo']);
        }
        if (data.testimonials) {
          try {
            const parsed = JSON.parse(data.testimonials);
            if (parsed.length) setTestimonials(parsed);
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  return (
    <main className="about">

      <Animated className="about-hero">
        <div className="about-hero-image">
          <div className="about-hero-photo-layer">
            {photo
              ? <img src={photo} alt="Everett" className="trainer-photo" />
              : <div className="image-placeholder">[Trainer Photo]</div>
            }
          </div>
          <div className="about-hero-cover" />
        </div>
        <div className="about-intro">
          <div className="about-intro-lag" ref={introLagRef}>
            <p className="about-eyebrow">About Me</p>
            <h1>Everett Lee</h1>
            <p className="about-bio">{bio}</p>
          </div>
        </div>
      </Animated>

      <Animated className="my-journey">
        <h2>My Journey</h2>
        <p>
          My path into coaching started with formal training — an M.S. in Sports
          Science &amp; Exercise Psychology, hands-on experience at Life Time Inc.,
          and time spent supporting elite athletes with the Philadelphia Union.
          That foundation is what I now bring independently to every client, fully
          remote.
        </p>
        <p>
          Today I work with clients of all fitness levels — from beginners to
          competitive athletes — crafting individualized programs that get real results.
        </p>
      </Animated>

      <Animated className="training-philosophy">
        <h2>Coaching Methodology</h2>
        <div className="philosophy-points">
          <Animated as="div" className="philosophy-item" delay="1">
            <h3>Data-Driven</h3>
            <p>Programming based on physiology and performance metrics.</p>
          </Animated>
          <Animated as="div" className="philosophy-item" delay="2">
            <h3>Sustainable</h3>
            <p>Focused on long-term habit change.</p>
          </Animated>
          <Animated as="div" className="philosophy-item" delay="3">
            <h3>Personalized</h3>
            <p>Tailored nutrition and training plans for your specific lifestyle.</p>
          </Animated>
        </div>
      </Animated>

      <Animated className="client-testimonials">
        <h2>Client Testimonials</h2>
        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <Animated as="div" key={i} className="testimonial-card" delay={i + 1}>
              <p>"{t.quote}"</p>
              <div className="testimonial-author-row">
                <span className="testimonial-avatar" aria-hidden="true">{getInitials(t.author)}</span>
                <span className="testimonial-author-name">{t.author}</span>
              </div>
            </Animated>
          ))}
        </div>
      </Animated>

      <Animated className="about-cta">
        <h2>Ready to Start?</h2>
        <a href="/booking">
          <button className="cta-button">Book a Session</button>
        </a>
      </Animated>

    </main>
  );
}
