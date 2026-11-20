import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../utils/constants';
import logo from '../assets/A1_logo_transparent.png';
import { Arrow, Check, XMark, spotlight } from '../components/RedesignBits';

const PHOTO_CACHE_KEY       = 'aio_fitness_hero_photo';
const VIDEO_CACHE_KEY       = 'aio_fitness_hero_video';
const FOCUS_PHOTO_CACHE_KEY = 'aio_fitness_focus_photo';

const ICONS = {
  body: <><path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11" /></>,
  mind: <><path d="M12 3a7 7 0 0 0-4 12.7V19h8v-3.3A7 7 0 0 0 12 3z" /><path d="M9.5 22h5M12 8v4l2 2" /></>,
  habit: <><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M16 2v4M8 2v4M3 10h18M8 15l2.5 2.5L16 13" /></>,
  health: <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z" /><path d="M3.5 12h4l2-3 3 6 2-3h6" /></>,
  coach: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
  nutrition: <><path d="M12 7c-1.5-2.5-6-2.6-7 1.5-1 4 1.5 11.5 5 12.5 1 .3 1.5-.5 2-.5s1 .8 2 .5c3.5-1 6-8.5 5-12.5-1-4.1-5.5-4-7-1.5z" /><path d="M12 7c0-2 1-4 3-5" /></>,
};

const BUILD_CARDS = [
  { icon: 'body',      title: 'Body Transformation',       desc: 'Build muscle, lose fat, become stronger, move with less pain, and improve performance.' },
  { icon: 'mind',      title: 'Mindset & Confidence',      desc: 'Develop confidence, resilience, discipline, and a healthier relationship with exercise.' },
  { icon: 'habit',     title: 'Lifestyle & Habits',        desc: 'Create routines that fit your life and make consistency feel achievable.' },
  { icon: 'health',    title: 'Health & Longevity',        desc: 'Increase energy, build resilience, reduce injury risk, and support your long-term health.' },
  { icon: 'coach',     title: 'Coaching & Accountability', desc: 'Stay focused, supported, and accountable through every stage of your journey.' },
  { icon: 'nutrition', title: 'Nutrition & Recovery',      desc: 'Build sustainable nutrition and recovery habits that support your goals without taking over your life.' },
];

const COACHING_STEPS = [
  'Complimentary Consultation',
  'Assessment & Goal Setting',
  'Personalized Roadmap',
  'Implement, Adjust & Progress',
  'Build Results That Last',
];

const COMMON_FEATURES = ['Personalized Workout Program', 'Personalized Program Adjustments', null, 'Progress & Habit Tracking', 'Nutrition Guidelines & Resources', 'Exercise Library & Form Checks'];
const EXTRA_FEATURES = ['Personalized Nutrition Coaching', 'Lifestyle & Mindset Coaching', 'Accountability Coaching'];

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

function PlanFeatures({ calls, featured }) {
  const items = [
    ...COMMON_FEATURES.map((f) => ({ text: f || calls, kind: 'yes' })),
    ...EXTRA_FEATURES.map((f) => ({ text: f, kind: featured ? 'excl' : 'no' })),
  ];
  return (
    <ul className="checks">
      {items.map(({ text, kind }) => (
        <li key={text} className={kind === 'yes' ? undefined : kind}>
          {kind === 'no' ? <XMark /> : <Check />}{text}
        </li>
      ))}
    </ul>
  );
}

const toTop = () => window.scrollTo({ top: 0, behavior: 'instant' });

export default function Home() {
  const [heroPhoto, setHeroPhoto]           = useState(() => localStorage.getItem(PHOTO_CACHE_KEY)       || '');
  const [heroVideo, setHeroVideo]           = useState(() => localStorage.getItem(VIDEO_CACHE_KEY)       || '');
  const [heroVideoError, setHeroVideoError] = useState(false);
  const [focusPhoto, setFocusPhoto]         = useState(() => localStorage.getItem(FOCUS_PHOTO_CACHE_KEY) || '');

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
      })
      .catch(() => {});
  }, []);

  return (
    <main className="rd page">

      {/* 1 · Hero */}
      <section className="hero">
        <div className="hero-media" aria-hidden="true">
          {heroVideo && !heroVideoError ? (
            <video
              src={heroVideo}
              poster={heroPhoto || undefined}
              autoPlay loop muted playsInline
              onError={() => setHeroVideoError(true)}
            />
          ) : heroPhoto ? (
            <div className="hero-photo" style={{ backgroundImage: `url(${heroPhoto})` }} />
          ) : null}
        </div>
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-beam" aria-hidden="true" />
        {!heroVideo && !heroPhoto && <img className="hero-mark" src={logo} alt="" aria-hidden="true" />}
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-content solo">
          <div>
            <h1 className="hero-title">
              <span className="line"><span>Transform Your Body.</span></span>
              <span className="line"><span>Strengthen Your Mind.</span></span>
              <span className="line"><span className="gold-text">Build a Healthier Life.</span></span>
            </h1>
            <p className="hero-sub">
              Personalized coaching that combines fitness, nutrition, psychology, accountability, and longevity to help you build lasting habits and become the healthiest version of yourself.
            </p>
            <div className="hero-ctas">
              <Link to="/booking" className="btn btn-gold btn-lg" onClick={toTop}>Book a Free Consultation<Arrow /></Link>
              <Link to="/about" className="btn btn-ghost btn-lg" onClick={toTop}>Learn More</Link>
            </div>
          </div>
        </div>
        <div className="scroll-cue" aria-hidden="true"><span className="mouse"><i /></span></div>
      </section>

      {/* Trust strip */}
      <div className="trust">
        <span className="trust-kicker">Professional Background</span>
        <div className="trust-row">
          <span>Life Time Inc.</span><i className="diamond" aria-hidden="true" />
          <span>Philadelphia Union</span><i className="diamond" aria-hidden="true" />
          <span>West Chester University</span>
        </div>
      </div>

      {/* 2 · Why All-In-One */}
      <section className="section">
        <div className="why-center reveal">
          <h2 className="display">Why &apos;<span className="gold-text">All-In-One?</span>&apos;</h2>
          <p className="lead">Health isn&apos;t built by workouts alone.</p>
          <p className="body">Real transformation happens when fitness, nutrition, mindset, accountability, recovery, and lifestyle all work together. That&apos;s why I created All-In-One Fitness.</p>
          <p className="body">My coaching isn&apos;t about giving you another workout plan. It&apos;s about helping you build a lifestyle that keeps you healthy, consistent, strong, and excited to train, all while achieving your dream body and maintaining it for life.</p>
          <p className="why-tagline gold-text">Build the body you want, and keep it for life.</p>
        </div>
      </section>

      {/* 3 · What We Build Together */}
      <section className="section alt lined">
        <div className="wrap">
          <div className="head head-center reveal">
            <h2 className="display">What We Build <span className="gold-text">Together</span></h2>
          </div>
          <div className="build-grid reveal-stagger">
            {BUILD_CARDS.map(({ icon, title, desc }, i) => (
              <article key={title} className="bcard" onMouseMove={spotlight}>
                <span className="bghost" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <div className="bcard-top">
                  <span className="bicon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ICONS[icon]}</svg>
                  </span>
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4 · How Coaching Works + plans */}
      <section className="section lined">
        <div className="wrap">
          <div className="head head-center reveal">
            <h2 className="display">How Coaching <span className="gold-text">Works</span></h2>
          </div>
          <div className="steps plain reveal">
            <div className="track" aria-hidden="true"><span className="track-fill" /><span className="track-spark" /></div>
            {COACHING_STEPS.map((label, i) => (
              <div key={label} className="step">
                <span className="step-node" style={{ '--i': i }}>{i + 1}</span>
                <div className="step-card"><b>{label}</b></div>
              </div>
            ))}
          </div>
          <div className="plan-split reveal">
            <span className="kicker">Choose Your Level of Support</span>
            <p>Your roadmap is personalized. The level of support is up to you.</p>
          </div>
          <div className="plan-grid reveal-stagger">
            <article className="price">
              <span className="plan-eyebrow">Personalized Programming</span>
              <h3 className="plan-name">Programming+</h3>
              <div className="plan-divider" />
              <PlanFeatures calls="1 Coaching Call/Month (30 min)" />
              <Link to="/coaching/apply?package=programming-plus" className="btn btn-line btn-block" onClick={toTop}>Get Started</Link>
            </article>
            <article className="price featured">
              <span className="plan-eyebrow">Complete Coaching</span>
              <h3 className="plan-name gold-text">All-In-One Coaching</h3>
              <div className="plan-divider" />
              <PlanFeatures calls="2 Coaching Calls/Month (30 min each)" featured />
              <Link to="/coaching/apply?package=aio-coaching" className="btn btn-gold btn-block" onClick={toTop}>Apply Now<Arrow /></Link>
            </article>
          </div>
        </div>
      </section>

      {/* 5 · Meet Everett */}
      <section className="meet">
        <div className={`meet-photo${focusPhoto ? ' has-photo' : ''}`}>
          {focusPhoto ? (
            <>
              <img className="photo" src={focusPhoto} alt="Everett Lee" />
              <div className="photo-shade" aria-hidden="true" />
            </>
          ) : (
            <div className="stripes" aria-hidden="true" />
          )}
          <div className="curtain" aria-hidden="true" />
        </div>
        <div className="meet-copy reveal">
          <span className="kicker">Meet Your Coach</span>
          <h2 className="display">Meet <span className="gold-text">Everett</span></h2>
          <p className="lead">I wasn&apos;t always confident in my body. Growing up, I was bullied because of how I looked and struggled with anorexia, graduating high school at just 105 pounds.</p>
          <p className="body">Strength training changed everything. Over the following years I gained more than 60 pounds, transformed my body, rebuilt my confidence, and discovered that fitness is about far more than appearance.</p>
          <p className="body">That journey inspired me to earn degrees in Exercise Science and Sport &amp; Exercise Psychology and dedicate my career to helping others experience the same transformation.</p>
          <div><Link to="/about" className="text-link" onClick={toTop}>Full Story<Arrow /></Link></div>
        </div>
      </section>

      {/* 6 · Education & Experience */}
      <section className="section">
        <div className="wrap">
          <div className="head head-center reveal">
            <h2 className="display">Education &amp; <span className="gold-text">Experience</span></h2>
          </div>
          <div className="edu-stat reveal">
            <span className="edu-stat-num gold-text">5,000+</span>
            <div className="edu-stat-text">
              <b>Professional Coaching Sessions Delivered</b>
              <span>Across In-Person &amp; Online Coaching</span>
            </div>
          </div>
          <div className="edu-cols reveal-stagger">
            <div className="edu-col">
              <h3>Education</h3>
              {DEGREES.map((d) => (
                <div className="degree" key={d.label}>
                  <small>DEGREE</small><b>{d.label}</b>{d.sub && <span>{d.sub}</span>}
                </div>
              ))}
              <p className="edu-focus"><b>ADDITIONAL ACADEMIC FOCUS</b>{EDU_FOCUS}</p>
            </div>
            <div className="edu-col">
              <h3>Certifications</h3>
              <ul className="certs">
                {CERTIFICATIONS.map((c) => <li key={c}><Check />{c}</li>)}
              </ul>
            </div>
            <div className="edu-col">
              <h3>Coaching Experience</h3>
              <ol className="timeline">
                {EXPERIENCE_ITEMS.map((e) => (
                  <li key={e.label}><b>{e.label}</b>{e.sub && <span>{e.sub}</span>}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* 7 · Final CTA */}
      <section className="final">
        <div className="final-glow" aria-hidden="true" />
        <div className="final-rings" aria-hidden="true"><i /><i /><i /></div>
        <h2 className="reveal">Ready to Become the <span className="gold-text">Strongest Version</span> of Yourself?</h2>
        <div className="final-ctas reveal">
          <Link to="/booking" className="btn btn-gold btn-lg" onClick={toTop}>
            <span className="pulse-dot" aria-hidden="true" />Book a Free Consultation<Arrow />
          </Link>
        </div>
      </section>

    </main>
  );
}
