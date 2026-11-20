import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../utils/constants';
import { Link } from 'react-router-dom';
import { Arrow } from '../components/RedesignBits';

const DEFAULT_FAQ_ITEMS = [
  {
    id: '1',
    question: 'How does online coaching work?',
    answer: 'You get a personalized programming plan delivered through a digital dashboard, with remote check-ins to track progress and adjust as you go.',
  },
  {
    id: '2',
    question: 'Do I need a specific gym membership?',
    answer: "No — programs are built around the equipment you actually have access to, whether that's a full gym, a home setup, or just the basics.",
  },
  {
    id: '3',
    question: 'How do we track progress?',
    answer: 'Through app-based tracking and regular check-ins, so your plan keeps adapting to real results, not guesswork.',
  },
  {
    id: '4',
    question: 'How do I get started?',
    answer: 'Click "Free Consultation" in the navigation, pick a time that works for you, and fill out a short intake form. The consultation is completely free — no payment required. After your call, Everett will follow up with a personalized coaching recommendation.',
  },
  {
    id: '5',
    question: 'Can I train from anywhere?',
    answer: 'Yes — coaching is fully remote, so you can train from anywhere with an internet connection.',
  },
  {
    id: '6',
    question: 'What is your cancellation policy?',
    answer: 'For paid sessions like Virtual Personal Training, cancel more than 24 hours before your scheduled call for a full refund. Cancellations within 24 hours are non-refundable. No-shows are non-refundable. The free consultation has no cancellation fee.',
  },
  {
    id: '7',
    question: 'How far in advance can I book?',
    answer: 'Sessions must be booked at least 6 hours in advance.',
  },
  {
    id: '8',
    question: 'What happens after I book?',
    answer: "You'll receive a confirmation email with your appointment details. After your free consultation, Everett will reach out with a coaching recommendation. Paid coaching clients get access to the Trainerize app where your program, exercise library, and progress tracking live.",
  },
  {
    id: '9',
    question: 'Does coaching include nutrition guidance?',
    answer: 'Yes — All-In-One Coaching includes nutrition guidance as part of the monthly package. This covers dietary recommendations, eating habits, and adjustments as your goals evolve. Programming + focuses on training; nutrition guidance is available as a separate add-on.',
  },
  {
    id: '10',
    question: "I'm a complete beginner — is this right for me?",
    answer: "Absolutely. Coaching is built around your current starting point, whether that's day one or year ten. Beginners get detailed onboarding, exercise guidance with form cues, and a program designed to build safely from the ground up.",
  },
  {
    id: '11',
    question: 'How do I communicate with my coach between sessions?',
    answer: 'All-In-One Coaching clients have direct messaging access to Everett for questions, form checks, and check-ins throughout the month, plus two scheduled coaching calls per month. Programming + clients can reach out via email for onboarding questions.',
  },
];

function FaqItem({ n, question, answer, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`qa${open ? ' is-open' : ''}`}>
      <button type="button" className="qa-btn" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="qn">{String(n).padStart(2, '0')}</span>
        <span className="qt">{question}</span>
        <span className="plus" aria-hidden="true" />
      </button>
      {open && <p className="qa-a">{answer}</p>}
    </div>
  );
}

export default function FAQ() {
  // Always start from the current code's defaults; only a genuine
  // admin-set override from the content API replaces them.
  const [faqItems, setFaqItems] = useState(DEFAULT_FAQ_ITEMS);

  useEffect(() => {
    fetch(`${API_BASE_URL}/content`)
      .then((r) => r.json())
      .then((data) => {
        if (data.faqs) {
          try {
            const parsed = JSON.parse(data.faqs);
            if (parsed.length) {
              setFaqItems(parsed);
            }
          } catch {
            // Bad JSON from the admin field — keep the defaults.
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <main className="rd page">
      <section className="page-hero center" style={{ textAlign: 'center', paddingBottom: 80 }}>
        <div className="glow-top" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />
        <h1>
          <span className="line"><span>Frequently Asked</span></span>
          <span className="line"><span className="gold-text">Questions</span></span>
        </h1>
      </section>

      <section className="section" style={{ paddingTop: 72 }}>
        <div className="faq-col">
          <div className="faq-tools reveal">
            <span>{faqItems.length} questions</span>
            <Link to="/booking" className="text-link" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}>
              Book a Free Consultation<Arrow />
            </Link>
          </div>
          <div className="reveal-stagger">
            {faqItems.map((item, index) => (
              <FaqItem key={item.id || index} n={index + 1} question={item.question} answer={item.answer} defaultOpen={index === 0} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
