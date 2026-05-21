import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../utils/constants';
import { useInView } from '../hooks/useInView';

const DEFAULT_BIO =
  "I'm Drew, a certified personal trainer with 10+ years of experience " +
  "helping people reach their fitness goals. My mission is simple: give " +
  "every client the tools, knowledge, and support to transform their health.";

const DEFAULT_TESTIMONIALS = [
  { id: '1', quote: "Drew's approach is unlike any trainer I've worked with before.", author: 'Sarah M.' },
  { id: '2', quote: 'Lost 30 lbs and kept it off. This changed my life.',            author: 'Marcus T.' },
  { id: '3', quote: 'I finally feel confident in the gym thanks to Drew.',            author: 'Priya K.'  },
];

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

const PHOTO_CACHE_KEY = 'a3fit_trainer_photo';

export default function About() {
  const [bio, setBio]                   = useState(DEFAULT_BIO);
  const [photo, setPhoto]               = useState(() => localStorage.getItem(PHOTO_CACHE_KEY) || '');
  const [testimonials, setTestimonials] = useState(DEFAULT_TESTIMONIALS);

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
          {photo
            ? <img src={photo} alt="Drew" className="trainer-photo" />
            : <div className="image-placeholder">[Trainer Photo]</div>
          }
        </div>
        <div className="about-intro">
          <h1>About Drew</h1>
          <p>{bio}</p>
        </div>
      </Animated>

      <Animated className="my-journey">
        <h2>My Journey</h2>
        <p>
          I discovered my passion for fitness after overcoming my own health
          challenges. After years of trial and error, I earned my certifications
          and built a practice focused on sustainable, results-driven training.
        </p>
        <p>
          Today I work with clients of all fitness levels — from beginners to
          competitive athletes — crafting individualized programs that get real results.
        </p>
      </Animated>

      <Animated className="training-philosophy">
        <h2>Training Philosophy & Values</h2>
        <div className="philosophy-points">
          <Animated as="div" className="philosophy-item" delay="1">
            <h3>Science-Based</h3>
            <p>Every program is grounded in exercise science and evidence-based practice.</p>
          </Animated>
          <Animated as="div" className="philosophy-item" delay="2">
            <h3>Individualized</h3>
            <p>No cookie-cutter plans. Every client gets a program built for their body and goals.</p>
          </Animated>
          <Animated as="div" className="philosophy-item" delay="3">
            <h3>Sustainable</h3>
            <p>We build habits, not quick fixes. Long-term health is the goal.</p>
          </Animated>
        </div>
      </Animated>

      <Animated className="client-testimonials">
        <h2>Client Testimonials</h2>
        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <Animated as="div" key={t.id} className="testimonial-card" delay={i + 1}>
              <p>"{t.quote}"</p>
              <span>— {t.author}</span>
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
