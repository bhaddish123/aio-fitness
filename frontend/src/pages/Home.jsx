import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useInView } from '../hooks/useInView';
import { API_BASE_URL } from '../utils/constants';

const PHOTO_CACHE_KEY = 'a3fit_hero_photo';

const LINE1 = 'Train Smarter.';
const LINE2 = 'Live Better.';

function useTypewriter() {
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [phase, setPhase] = useState(0); // 0=typing line1, 1=pause, 2=typing line2, 3=done

  useEffect(() => {
    let timer;
    if (phase === 0) {
      if (line1.length < LINE1.length) {
        timer = setTimeout(() => setLine1(LINE1.slice(0, line1.length + 1)), 65);
      } else {
        timer = setTimeout(() => setPhase(1), 180);
      }
    } else if (phase === 1) {
      timer = setTimeout(() => setPhase(2), 120);
    } else if (phase === 2) {
      if (line2.length < LINE2.length) {
        timer = setTimeout(() => setLine2(LINE2.slice(0, line2.length + 1)), 70);
      } else {
        timer = setTimeout(() => setPhase(3), 800);
      }
    }
    return () => clearTimeout(timer);
  }, [line1, line2, phase]);

  return { line1, line2, done: phase === 3 };
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
  const [heroRef, heroInView] = useInView();
  const { line1, line2, done } = useTypewriter();
  const [heroPhoto, setHeroPhoto] = useState(
    () => localStorage.getItem(PHOTO_CACHE_KEY) || ''
  );

  useEffect(() => {
    fetch(`${API_BASE_URL}/content`)
      .then((r) => r.json())
      .then((data) => {
        if (data['hero.photo']) {
          setHeroPhoto(data['hero.photo']);
          localStorage.setItem(PHOTO_CACHE_KEY, data['hero.photo']);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <main className="home">

      <section
        ref={heroRef}
        className={`hero animate-fade-in-up ${heroInView ? 'in-view' : ''}${heroPhoto ? ' hero-has-photo' : ''}`}
        style={heroPhoto ? { backgroundImage: `url(${heroPhoto})` } : undefined}
      >
        <h1 className="hero-typewriter">
          <span className="typewriter-line">{line1}</span>
          <br />
          <span className={`typewriter-line${done ? ' typewriter-cursor-done' : ' typewriter-cursor'}`}>{line2}</span>
        </h1>
        <p>Personal training tailored to your goals with Drew at A3 Fitness.</p>
        <Link to="/booking" onClick={() => handleNav('/booking')}>
          <button className="cta-button">Book a Session</button>
        </Link>
      </section>

      <AnimatedSection className="testimonials-preview">
        <h2>What Clients Say</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <p>"Drew completely transformed my approach to fitness."</p>
            <span>— Bereket</span>
          </div>
          <div className="testimonial-card">
            <p>"Best investment I've made in my health."</p>
            <span>— Samuel</span>
          </div>
          <div className="testimonial-card">
            <p>"Results in 8 weeks that I couldn't achieve in 2 years on my own."</p>
            <span>— Brandon</span>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="about-preview">
        <h2>About Drew</h2>
        <p>
          With over 10 years of experience in personal training, Drew brings
          science-backed methods and a personalized approach to every session.
        </p>
        <Link to="/about" onClick={() => handleNav('/about')}>Learn More →</Link>
      </AnimatedSection>

      <AnimatedSection className="faq-preview">
        <h2>Common Questions</h2>
        <div className="faq-item">
          <strong>How do I book a session?</strong>
          <p>Click "Book a Session" above and follow the steps.</p>
        </div>
        <div className="faq-item">
          <strong>What is your cancellation policy?</strong>
          <p>Full refund if cancelled more than 24 hours in advance.</p>
        </div>
        <Link to="/faq" onClick={() => handleNav('/faq')}>View All FAQs →</Link>
      </AnimatedSection>

      <AnimatedSection className="contact-info">
        <h2>Get in Touch</h2>
        <p><a href="tel:+12676489095" target="_blank" rel="noreferrer">Phone: (267) 648-9095</a></p>
        <p><a href="mailto:drew.a3fitness@gmail.com" target="_blank" rel="noreferrer"> Email: drew.a3fitness@gmail.com</a></p>
        <p>Location: Devon, PA</p>
      </AnimatedSection>

    </main>
  );
}
