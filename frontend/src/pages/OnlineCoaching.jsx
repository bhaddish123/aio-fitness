import { Link } from 'react-router-dom';
import { Check, XMark } from '../components/RedesignBits';

const TIERS = [
  {
    id: 'aio-coaching',
    badge: 'Most Popular',
    name: 'All-In-One Coaching',
    tagline: 'For clients who want to go further with ongoing coaching across training, nutrition, mindset, recovery, lifestyle, and accountability.',
    includes: [
      { text: 'Full All-In-One Fitness App Access',                            yes: true },
      { text: 'Personalized Workout Program',                                  yes: true },
      { text: 'Personalized Program Adjustments',                              yes: true },
      { text: '2 Coaching Calls/Month (30 min each)',                          yes: true },
      { text: 'Progress Tracking',                                             yes: true },
      { text: 'Habit Tracking',                                                yes: true },
      { text: 'Private Client Community',                                      yes: true },
      { text: 'Nutrition Guidelines & Resources',                              yes: true },
      { text: 'Exercise, Program, Nutrition & Lifestyle Coaching Support',     yes: true },
      { text: 'Exercise Video Library',                                        yes: true },
      { text: 'Form Video Checks',                                             yes: true },
      { text: 'Personalized Nutrition Coaching',                               yes: true, exclusive: true },
      { text: 'Lifestyle & Mindset Coaching',                                  yes: true, exclusive: true },
      { text: 'Accountability Coaching',                                       yes: true, exclusive: true },
    ],
    cta: 'Apply Now',
    ctaHref: '/coaching/apply?package=aio-coaching',
    highlight: true,
  },
  {
    id: 'programming-plus',
    badge: null,
    name: 'Programming+',
    tagline: 'For clients who want a personalized training plan, clear direction, and the structure to train more independently.',
    includes: [
      { text: 'Full All-In-One Fitness App Access',                            yes: true },
      { text: 'Personalized Workout Program',                                  yes: true },
      { text: 'Personalized Program Adjustments',                              yes: true },
      { text: '1 Coaching Call/Month (30 min)',                                yes: true },
      { text: 'Progress Tracking',                                             yes: true },
      { text: 'Habit Tracking',                                                yes: true },
      { text: 'Private Client Community',                                      yes: true },
      { text: 'Nutrition Guidelines & Resources',                              yes: true },
      { text: 'Exercise & Program Coaching Support',                           yes: true },
      { text: 'Exercise Video Library',                                        yes: true },
      { text: 'Form Video Checks',                                             yes: true },
      { text: 'Personalized Nutrition Coaching',                               yes: false },
      { text: 'Lifestyle & Mindset Coaching',                                  yes: false },
      { text: 'Accountability Coaching',                                       yes: false },
    ],
    cta: 'Get Started',
    ctaHref: '/coaching/apply?package=programming-plus',
    highlight: false,
  },
  {
    id: 'consultation',
    badge: null,
    name: 'Free Consultation',
    tagline: 'Not sure where to start? Book a complimentary call to talk through your goals and see if coaching is the right fit.',
    includes: [
      { text: '30-Minute Video or Phone Call',      yes: true },
      { text: 'Goals & Lifestyle Assessment',       yes: true },
      { text: 'Personalized Recommendations',       yes: true },
      { text: 'No Payment Required',                yes: true },
      { text: 'No Obligation to Continue',          yes: true },
    ],
    cta: 'Book Free Consultation',
    ctaHref: '/booking',
    highlight: false,
  },
];

const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

export default function OnlineCoaching() {
  return (
    <main className="rd page">
      <section className="page-hero center" style={{ textAlign: 'center' }}>
        <div className="glow-top" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />
        <span className="kicker">100% Remote</span>
        <h1><span className="line"><span>Online <span className="gold-text">Coaching</span></span></span></h1>
        <p className="hero-sub">
          Science-backed, fully remote coaching designed to build strength, improve health, and create long-term sustainable results — regardless of where you train.
        </p>
      </section>

      <section className="section alt" id="tiers">
        <div className="wrap">
          <div className="head head-center reveal">
            <h2 className="display">Coaching <span className="gold-text">Options</span></h2>
          </div>
          <div className="price-grid three reveal-stagger" style={{ paddingTop: 16 }}>
            {TIERS.map((tier) => (
              <article key={tier.id} className={`price${tier.highlight ? ' featured' : ''}`}>
                {tier.badge && (
                  <span className="badge">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" fill="currentColor" /></svg>
                    {tier.badge}
                  </span>
                )}
                <h3 className={`plan-name${tier.highlight ? ' gold-text' : ''}`}>{tier.name}</h3>
                <p className="tagline">{tier.tagline}</p>
                <div className="plan-divider" />
                <ul className="checks">
                  {tier.includes.map((item) => (
                    <li key={item.text} className={item.exclusive ? 'excl' : item.yes ? undefined : 'no'}>
                      {item.yes ? <Check /> : <XMark />}{item.text}
                    </li>
                  ))}
                </ul>
                <Link to={tier.ctaHref} className={tier.highlight ? 'btn btn-gold btn-block' : 'btn btn-line btn-block'} onClick={toTop}>
                  {tier.cta}
                </Link>
              </article>
            ))}
          </div>
          <div className="addons reveal">
            <span className="ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            </span>
            <div>
              <h3>Additional Services</h3>
              <p>
                30-minute coaching calls, nutrition plan add-ons, and single session packages are available.{' '}
                <a className="inline-link" href="mailto:everettleefitness@gmail.com">Reach out directly</a> to discuss what fits your needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section lined">
        <div className="philo-block reveal">
          <h2 className="display">Coaching <span className="gold-text">Philosophy</span></h2>
          <p className="body">
            The goal of coaching is not simply to provide workouts. The goal is to create structure, consistency, accountability, education, and long-term progress. Every client has different goals, limitations, schedules, and lifestyles — which is why every program is individualized rather than generic.
          </p>
          <p className="body">
            Whether you are traveling, training remotely, transitioning away from in-person sessions, or simply looking for guidance and accountability outside of the gym, online coaching provides a structured and flexible way to keep progressing.
          </p>
          <p className="body" style={{ color: '#f5f3ee' }}>
            Interested in getting started?{' '}
            <Link to="/coaching/apply" className="inline-link" onClick={toTop}>Reach out directly</Link>{' '}
            to discuss your goals and find the right fit.
          </p>
        </div>
      </section>
    </main>
  );
}
