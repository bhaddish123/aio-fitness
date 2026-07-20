import { Link } from 'react-router-dom';
import { useInView } from '../hooks/useInView';

function AnimatedSection({ className = '', as: Tag = 'section', delay, children, ...props }) {
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

const TIERS = [
  {
    id: 'monthly',
    badge: 'Most Popular',
    name: 'Monthly Online Coaching',
    price: '$300',
    per: '/month*',
    tagline: 'Ongoing coaching, accountability, and support — fully remote.',
    includes: [
      'Fully customized training program',
      'Program updates and adjustments as needed',
      'Video form review and technique feedback',
      'Messaging support for questions, accountability, and guidance',
      'Basic nutrition guidance and habit coaching',
      '1 monthly 30-minute Zoom or FaceTime check-in',
      'Exercise substitutions based on injuries, equipment, or travel',
      'Progress tracking and accountability support',
      'Recovery, intensity, progression, and deload guidance',
    ],
    bonus: 'First virtual personal training session free ($100 value)',
    cta: 'Start Monthly Coaching',
    ctaHref: '/coaching/apply?package=monthly',
    highlight: true,
  },
  {
    id: 'virtual',
    badge: null,
    name: 'Virtual Personal Training',
    price: '$100',
    per: '/hour',
    tagline: 'Live 1-on-1 coaching via Zoom or FaceTime — train from anywhere.',
    includes: [
      '1-on-1 live coaching',
      'Real-time exercise corrections and cueing',
      'Workout guidance and pacing',
      'Exercise substitutions when needed',
      'Flexible training from home, hotel gyms, or commercial gyms',
    ],
    bonus: null,
    cta: 'Book a Virtual Session',
    ctaHref: '/booking',
    highlight: false,
  },
  {
    id: 'program',
    badge: null,
    name: 'One-Time Customized Program',
    price: '$150',
    per: ' one-time',
    tagline: 'A complete, structured training plan built around your goals.',
    includes: [
      'Customized workout split and exercise selection',
      'Sets, reps, intensity, and progression guidance',
      'Exercise substitutions if needed',
      'Warm-up and mobility recommendations',
      'Basic coaching notes and training instructions',
    ],
    bonus: null,
    cta: 'Get Your Program',
    ctaHref: '/coaching/apply?package=program',
    highlight: false,
  },
];

export default function OnlineCoaching() {
  return (
    <main className="coaching-page">

      <AnimatedSection className="coaching-hero">
        <span className="coaching-eyebrow">100% Remote</span>
        <h1>Online Coaching</h1>
        <p className="coaching-hero-sub">
          Science-backed, fully remote coaching designed to build strength, improve
          health, and create long-term sustainable results — regardless of where you
          train.
        </p>
      </AnimatedSection>

      <AnimatedSection className="coaching-tiers">
        <h2 className="heading-pop">Coaching Options &amp; Pricing</h2>
        <div className="coaching-tier-grid">
          {TIERS.map((tier) => (
            <div key={tier.id} className={`coaching-tier-card ${tier.highlight ? 'coaching-tier-card--featured' : ''}`}>
              {tier.badge && <span className="coaching-tier-badge">{tier.badge}</span>}
              <h3 className="coaching-tier-name">{tier.name}</h3>
              <div className="coaching-tier-price">
                <span className="coaching-tier-amount">{tier.price}</span>
                <span className="coaching-tier-per">{tier.per}</span>
              </div>
              <p className="coaching-tier-tagline">{tier.tagline}</p>
              <ul className="coaching-tier-includes">
                {tier.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {tier.bonus && (
                <p className="coaching-tier-bonus">
                  <strong>Bonus:</strong> {tier.bonus}
                </p>
              )}
              <Link to={tier.ctaHref} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <button className="cta-button coaching-tier-cta">{tier.cta}</button>
              </Link>
            </div>
          ))}
        </div>
        <p className="coaching-pricing-note">* Monthly coaching pricing is being finalized. Reach out directly for current rates.</p>
      </AnimatedSection>

      <AnimatedSection className="coaching-philosophy">
        <h2>Coaching Philosophy</h2>
        <p>
          The goal of coaching is not simply to provide workouts. The goal is to create
          structure, consistency, accountability, education, and long-term progress.
          Every client has different goals, limitations, schedules, and lifestyles — which
          is why every program is individualized rather than generic.
        </p>
        <p>
          Whether you are traveling, training remotely, transitioning away from in-person
          sessions, or simply looking for guidance and accountability outside of the gym,
          online coaching provides a structured and flexible way to keep progressing.
        </p>
        <p className="coaching-philosophy-cta-row">
          Interested in getting started?{' '}
          <Link to="/coaching/apply" className="coaching-inline-link" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Reach out directly
          </Link>{' '}
          to discuss your goals and find the right fit.
        </p>
      </AnimatedSection>

    </main>
  );
}
