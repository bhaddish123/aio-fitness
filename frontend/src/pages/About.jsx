import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../utils/constants';
import { useInView } from '../hooks/useInView';

const DEFAULT_BIO =
  "I wasn't always confident in my body. Growing up, I was bullied and struggled with anorexia, " +
  "graduating high school at just 105 pounds. Strength training changed everything — and that " +
  "transformation is why I became a coach.";


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
          I wasn't always confident in my body. Growing up, I was bullied because of how I looked
          and struggled with anorexia, graduating high school at just 105 pounds.
        </p>
        <p>
          I hated taking my shirt off and wore hoodies and long sleeves for years because I was
          embarrassed by my body. I felt weak, had little confidence, low energy, and didn't
          understand nutrition or how to improve my health. More than anything, I felt stuck and
          helpless.
        </p>
        <p>
          Strength training changed everything. Over the following years I gained more than 60
          pounds, transformed my body, rebuilt my confidence, and discovered that fitness is about
          far more than appearance. It improves your energy, mindset, resilience, relationships,
          and quality of life.
        </p>
        <p>
          That journey inspired me to earn degrees in Exercise Science and Sport &amp; Exercise
          Psychology and dedicate my career to helping others experience the same transformation.
        </p>
        <p>
          Today my mission is simple: Help people become stronger, healthier, more confident, and
          live longer by building habits that last for life.
        </p>
      </Animated>

      <Animated className="training-philosophy">
        <h2>My Philosophy</h2>
        <p className="philosophy-lead">Exercise can change lives.</p>
        <p className="philosophy-lead">It improves physical health, mental health, confidence, energy, independence, and longevity.</p>
        <div className="philosophy-points">
          <Animated as="div" className="philosophy-item" delay="1">
            <h3>More Than Muscle</h3>
            <p>My goal isn't simply to help you lose weight or build muscle. It's to help you create a lifestyle where taking care of yourself becomes part of who you are.</p>
          </Animated>
          <Animated as="div" className="philosophy-item" delay="2">
            <h3>Fitness as a Lifestyle</h3>
            <p>When fitness becomes a lifestyle, everything else improves — energy, confidence, relationships, resilience, and quality of life.</p>
          </Animated>
          <Animated as="div" className="philosophy-item" delay="3">
            <h3>Lasting Transformation</h3>
            <p>I don't coach quick fixes. I coach sustainable change — building habits and systems that keep you healthy, active, and confident for decades.</p>
          </Animated>
        </div>
      </Animated>

      <Animated className="about-cta">
        <h2>Ready to Transform Your Body, Mindset, and Lifestyle?</h2>
        <a href="/booking">
          <button className="cta-button">Book a Free Consultation</button>
        </a>
      </Animated>

    </main>
  );
}
