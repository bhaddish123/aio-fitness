import { useState } from 'react';
import { SOCIAL_LINKS } from './SocialIcons';

// Kept short on purpose — Everett's clients are overwhelmingly US-based,
// so this covers the realistic range without a full country picker.
const DIAL_CODES = [
  { code: 'US', dial: '+1' },
  { code: 'CA', dial: '+1' },
  { code: 'GB', dial: '+44' },
  { code: 'AU', dial: '+61' },
];

const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></svg>
);
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" /></svg>
);
const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M22 7l-10 6L2 7" /></svg>
);

export default function ContactFormSection() {
  const [dialCode, setDialCode] = useState(DIAL_CODES[0].code);

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const firstName = form.firstName.value.trim();
    const lastName = form.lastName.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const message = form.message.value.trim();
    const dial = DIAL_CODES.find((c) => c.code === dialCode)?.dial || '+1';

    const subject = `Message from ${firstName} ${lastName}`;
    const body = `Name: ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${phone ? `${dial} ${phone}` : 'n/a'}\n\n${message}`;
    window.location.href = `mailto:everettleefitness@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    form.reset();
    setDialCode(DIAL_CODES[0].code);
  };

  return (
    <div className="rd">
      <section className="section lined">
        <div className="wrap contact-grid">
          <div className="contact-intro reveal">
            <h2>Everett <span className="gold-text">Lee</span></h2>
            <p className="role">Fitness, Nutrition, and Life Coach</p>
            <div className="contact-lines">
              <span><span className="ico"><PinIcon /></span>Based in PA, Online offered worldwide</span>
              <a href="tel:+12159701446"><span className="ico"><PhoneIcon /></span>Tel: (215) 970-1446</a>
              <a href="mailto:everettleefitness@gmail.com"><span className="ico"><MailIcon /></span>everettleefitness@gmail.com</a>
            </div>
            <div className="social">
              {SOCIAL_LINKS.map(({ key, label, href, Icon }) => (
                <a key={key} href={href} target="_blank" rel="noreferrer" aria-label={label}><Icon /></a>
              ))}
            </div>
          </div>

          <div className="form-card reveal">
            <h3>Get In <span className="gold-text">Touch</span></h3>
            <form className="form-grid" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="cf-firstName">First name <i>*</i></label>
                <input className="input" id="cf-firstName" name="firstName" type="text" autoComplete="given-name" required />
              </div>
              <div className="field">
                <label htmlFor="cf-lastName">Last name <i>*</i></label>
                <input className="input" id="cf-lastName" name="lastName" type="text" autoComplete="family-name" required />
              </div>
              <div className="field full">
                <label htmlFor="cf-email">Email <i>*</i></label>
                <input className="input" id="cf-email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="field full">
                <label htmlFor="cf-phone">Phone</label>
                <div className="phone">
                  <select className="input" aria-label="Country dial code" value={dialCode} onChange={(e) => setDialCode(e.target.value)}>
                    {DIAL_CODES.map((c) => <option key={c.code} value={c.code}>{c.code} {c.dial}</option>)}
                  </select>
                  <input className="input" id="cf-phone" name="phone" type="tel" autoComplete="tel" />
                </div>
              </div>
              <div className="field full">
                <label htmlFor="cf-message">Message</label>
                <textarea className="input" id="cf-message" name="message" rows={4} />
              </div>
              <div className="field full">
                <div className="form-foot">
                  <small><i className="req">*</i> Required</small>
                  <button className="btn btn-gold" type="submit">Submit</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
