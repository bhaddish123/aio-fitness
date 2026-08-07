import { useState } from 'react';
import { useInView } from '../hooks/useInView';
import { SOCIAL_LINKS } from './SocialIcons';

function ChevronIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// Kept short on purpose — Everett's clients are overwhelmingly US-based
// (the business is in Devon, PA), so this covers the realistic range
// without turning a contact form into a full country picker.
const DIAL_CODES = [
  { code: 'US', dial: '+1',  flag: '🇺🇸' },
  { code: 'CA', dial: '+1',  flag: '🇨🇦' },
  { code: 'GB', dial: '+44', flag: '🇬🇧' },
  { code: 'AU', dial: '+61', flag: '🇦🇺' },
];

export default function ContactFormSection() {
  const [sectionRef, sectionInView] = useInView();
  const [dialCode, setDialCode] = useState(DIAL_CODES[0].dial);

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const firstName = form.firstName.value.trim();
    const lastName = form.lastName.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const message = form.message.value.trim();

    const subject = `Message from ${firstName} ${lastName}`;
    const body = `Name: ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${phone ? `${dialCode} ${phone}` : 'n/a'}\n\n${message}`;
    window.location.href = `mailto:everettleefitness@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    form.reset();
    setDialCode(DIAL_CODES[0].dial);
  };

  return (
    <section
      ref={sectionRef}
      className={`contact-form-section animate-fade-in-up ${sectionInView ? 'in-view' : ''}`}
    >
      <div className="contact-form-grid">

        <div className="contact-form-intro">
          <h2 className="contact-form-name">Everett Lee</h2>
          <p className="contact-form-role">Fitness Coach</p>

          <div className="contact-form-details">
            <span>Fort Washington, PA</span>
            <a href="tel:+12159701446">Tel: (215) 970-1446</a>
            <a href="mailto:everettleefitness@gmail.com">everettleefitness@gmail.com</a>
          </div>

          <div className="contact-form-socials">
            {SOCIAL_LINKS.map(({ key, label, href, Icon }) => (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="contact-form-social-btn"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>

        <div className="contact-form-right">
          <h2 className="contact-form-heading">Get In Touch</h2>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-form-field">
              <label htmlFor="cf-firstName">First name <span className="cf-required">*</span></label>
              <input id="cf-firstName" name="firstName" type="text" required />
            </div>

            <div className="contact-form-field">
              <label htmlFor="cf-lastName">Last name <span className="cf-required">*</span></label>
              <input id="cf-lastName" name="lastName" type="text" required />
            </div>

            <div className="contact-form-field">
              <label htmlFor="cf-email">Email <span className="cf-required">*</span></label>
              <input id="cf-email" name="email" type="email" required />
            </div>

            <div className="contact-form-field">
              <label htmlFor="cf-phone">Phone</label>
              <div className="contact-form-phone">
                <span className="contact-form-phone-prefix">
                  <select
                    aria-label="Country dial code"
                    className="contact-form-phone-select"
                    value={dialCode}
                    onChange={(e) => setDialCode(e.target.value)}
                  >
                    {DIAL_CODES.map((c) => (
                      <option key={c.code} value={c.dial}>{c.flag} {c.dial}</option>
                    ))}
                  </select>
                  <ChevronIcon />
                </span>
                <input id="cf-phone" name="phone" type="tel" />
              </div>
            </div>

            <div className="contact-form-field">
              <label htmlFor="cf-message">Message</label>
              <textarea id="cf-message" name="message" rows={4} />
            </div>

            <div className="contact-form-submit-row">
              <button type="submit" className="cta-button contact-form-submit">Submit</button>
            </div>
          </form>
        </div>

      </div>
    </section>
  );
}
