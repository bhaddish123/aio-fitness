import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../utils/constants';
import { Arrow } from '../components/RedesignBits';

const DEFAULT_BIO =
  "I wasn't always confident in my body. Growing up, I was bullied and struggled with anorexia, " +
  "graduating high school at just 105 pounds. Strength training changed everything — and that " +
  "transformation is why I became a coach.";

const PHOTO_CACHE_KEY = 'aio_fitness_trainer_photo';

const JOURNEY = [
  "I wasn't always confident in my body. Growing up, I was bullied because of how I looked and struggled with anorexia, graduating high school at just 105 pounds.",
  "I hated taking my shirt off and wore hoodies and long sleeves for years because I was embarrassed by my body. I felt weak, had little confidence, low energy, and didn't understand nutrition or how to improve my health. More than anything, I felt stuck and helpless.",
  'Strength training changed everything. Over the following years I gained more than 60 pounds, transformed my body, rebuilt my confidence, and discovered that fitness is about far more than appearance. It improves your energy, mindset, resilience, relationships, and quality of life.',
  'That journey inspired me to earn degrees in Exercise Science and Sport & Exercise Psychology and dedicate my career to helping others experience the same transformation.',
  'Today my mission is simple: Help people become stronger, healthier, more confident, and live longer by building habits that last for life.',
];

const PHILOSOPHY = [
  { title: 'More Than Muscle', body: "My goal isn't simply to help you lose weight or build muscle. It's to help you create a lifestyle where taking care of yourself becomes part of who you are." },
  { title: 'Fitness as a Lifestyle', body: 'When fitness becomes a lifestyle, everything else improves — energy, confidence, relationships, resilience, and quality of life.' },
  { title: 'Lasting Transformation', body: "I don't coach quick fixes. I coach sustainable change — building habits and systems that keep you healthy, active, and confident for decades." },
];

export default function About() {
  const [bio, setBio]     = useState(DEFAULT_BIO);
  const [photo, setPhoto] = useState(() => localStorage.getItem(PHOTO_CACHE_KEY) || '');

  useEffect(() => {
    fetch(`${API_BASE_URL}/content`)
      .then((r) => r.json())
      .then((data) => {
        if (data['about.bio']) setBio(data['about.bio']);
        if (data['about.photo']) {
          setPhoto(data['about.photo']);
          localStorage.setItem(PHOTO_CACHE_KEY, data['about.photo']);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <main className="rd page">
      <section className="split-hero">
        <div className={`meet-photo${photo ? ' has-photo' : ''}`}>
          {photo ? (
            <>
              <img className="photo" src={photo} alt="Everett Lee" />
              <div className="photo-shade" aria-hidden="true" />
            </>
          ) : (
            <div className="stripes" aria-hidden="true" />
          )}
          <div className="curtain" aria-hidden="true" />
        </div>
        <div className="split-copy">
          <div className="hero-grid" aria-hidden="true" />
          <span className="kicker">About Me</span>
          <h1>
            <span className="line"><span>Everett</span></span>
            <span className="line"><span className="gold-text">Lee</span></span>
          </h1>
          <p className="hero-sub" style={{ marginTop: 6 }}>{bio}</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap" style={{ maxWidth: 860 }}>
          <div className="head head-center reveal">
            <h2 className="display">My <span className="gold-text">Journey</span></h2>
          </div>
          <div className="chapters">
            {JOURNEY.map((text, i) => (
              <div key={i} className={`chapter${i === JOURNEY.length - 1 ? ' final-ch' : ''} reveal`}><p>{text}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt lined">
        <div className="wrap">
          <div className="head head-center reveal" style={{ marginBottom: 28 }}>
            <h2 className="display">My <span className="gold-text">Philosophy</span></h2>
          </div>
          <div className="philo-leads reveal">
            <p className="lead" style={{ fontSize: 'clamp(24px, 2.4vw, 32px)' }}>Exercise can change lives.</p>
            <p className="lead">It improves physical health, mental health, confidence, energy, independence, and longevity.</p>
          </div>
          <div className="philo-grid reveal-stagger">
            {PHILOSOPHY.map(({ title, body }, i) => (
              <article key={title} className="philo-card">
                <h3>{title}</h3>
                <p>{body}</p>
                <span className="bghost" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="final">
        <div className="final-glow" aria-hidden="true" />
        <div className="final-rings" aria-hidden="true"><i /><i /><i /></div>
        <h2 className="reveal" style={{ fontSize: 'clamp(42px, 6vw, 92px)' }}>
          Ready to Transform Your <span className="gold-text">Body, Mindset,</span> and Lifestyle?
        </h2>
        <div className="final-ctas reveal">
          <Link to="/booking" className="btn btn-gold btn-lg" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}>
            <span className="pulse-dot" aria-hidden="true" />Book a Free Consultation<Arrow />
          </Link>
        </div>
      </section>
    </main>
  );
}
