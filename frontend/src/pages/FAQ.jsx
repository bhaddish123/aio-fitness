import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../utils/constants';
import { useInView } from '../hooks/useInView';

const DEFAULT_FAQ_ITEMS = [
  {
    id: '1',
    question: 'How do I book a session?',
    answer: 'Click "Book Now" in the navigation, select your session type, pick a time, fill in your details, and complete payment via Stripe.',
  },
  {
    id: '2',
    question: 'What session types are available?',
    answer: 'We offer 30 and 60-minute personal training sessions. More session types may be added in the future.',
  },
  {
    id: '3',
    question: 'What is your cancellation policy?',
    answer: 'Cancel more than 24 hours before your session for a full refund. Cancellations within 24 hours of the session are non-refundable. No-shows are non-refundable.',
  },
  {
    id: '4',
    question: 'How far in advance can I book?',
    answer: 'Sessions must be booked at least 6 hours in advance.',
  },
  {
    id: '5',
    question: 'What happens after I book?',
    answer: 'You will receive a confirmation email with your session details and a cancellation link.',
  },
  {
    id: '6',
    question: 'Where are sessions held?',
    answer: 'Sessions are held at 123 Main St, Your City, ST 00000.',
  },
  {
    id: '7',
    question: 'Do I need any equipment?',
    answer: 'No equipment needed. Everything is provided at the facility.',
  },
  {
    id: '8',
    question: 'What should I bring?',
    answer: 'Comfortable workout clothes, water, and a positive attitude!',
  },
];

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="faq-item">
      <button className="faq-question" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{question}</span>
        <span>{open ? '−' : '+'}</span>
      </button>
      <div className={`faq-body ${open ? 'faq-body-open' : ''}`}>
        <div className="faq-body-inner">
          <div className="faq-answer">
            <p>{answer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const FAQ_CACHE_KEY = 'a3fit_faq_items';

export default function FAQ() {
  const [faqItems, setFaqItems] = useState(() => {
    try {
      const cached = localStorage.getItem(FAQ_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}
    return DEFAULT_FAQ_ITEMS;
  });
  const [headingRef, headingInView] = useInView();

  useEffect(() => {
    fetch(`${API_BASE_URL}/content`)
      .then((r) => r.json())
      .then((data) => {
        if (data.faqs) {
          try {
            const parsed = JSON.parse(data.faqs);
            if (parsed.length) {
              setFaqItems(parsed);
              localStorage.setItem(FAQ_CACHE_KEY, JSON.stringify(parsed));
              return;
            }
          } catch {}
        }
        setFaqItems(DEFAULT_FAQ_ITEMS);
      })
      .catch(() => {});
  }, []);

  return (
    <main className="faq-page">
      <h1 ref={headingRef} className={`animate-fade-in-up${headingInView ? ' in-view' : ''}`}>Frequently Asked Questions</h1>
      <div className="faq-list">
        {faqItems && faqItems.map((item) => (
          <FaqItem key={item.id} question={item.question} answer={item.answer} />
        ))}
      </div>
    </main>
  );
}
