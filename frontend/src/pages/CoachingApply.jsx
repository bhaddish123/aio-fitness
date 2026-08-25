import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../utils/constants';

const PACKAGES = [
  {
    id: 'programming-plus',
    label: 'Programming Plus',
    note: null,
  },
  {
    id: 'aio-coaching',
    label: 'All-In-One Coaching',
    note: null,
  },
];

const initialForm = {
  packageId: 'programming-plus',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  goals: '',
  questions: '',
};

export default function CoachingApply() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(() => ({
    ...initialForm,
    packageId: searchParams.get('package') || 'monthly',
  }));
  const [errors, setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const selectedPkg = PACKAGES.find((p) => p.id === form.packageId) || PACKAGES[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.clientName.trim())  errs.clientName  = 'Name is required.';
    if (!form.clientEmail.trim()) errs.clientEmail = 'Email is required.';
    if (!form.goals.trim())       errs.goals       = 'Please share your goals.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    setServerError('');

    try {
      const res = await fetch(`${API_BASE_URL}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageName: selectedPkg.label,
          clientName:  form.clientName,
          clientEmail: form.clientEmail,
          clientPhone: form.clientPhone,
          goals:       form.goals,
          questions:   form.questions,
        }),
      });
      let data = {};
      const text = await res.text();
      if (text) { try { data = JSON.parse(text); } catch (_) {} }
      if (!res.ok) throw new Error(data.error || 'Submission failed.');
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="apply-page">
        <div className="apply-success">
          <span className="apply-success-icon">✓</span>
          <h1>You're all set.</h1>
          <p>
            Everett will review your information and reach out to{' '}
            <strong>{form.clientEmail}</strong> shortly to discuss your goals and next steps.
          </p>
          <p style={{ marginTop: '12px', fontSize: '15px', opacity: 0.8 }}>
            In the meantime, feel free to book your free consultation to get on the calendar.
          </p>
          <Link to="/booking" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}>
            <button className="cta-button">Book a Free Consultation</button>
          </Link>
          <Link to="/coaching" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })} style={{ display: 'block', marginTop: '14px', fontSize: '14px', color: 'var(--gray-400)', textDecoration: 'none' }}>
            ← Back to Coaching
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="apply-page">
      <div className="apply-header">
        <Link to="/coaching" className="apply-back-link" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}>
          ← Back to Coaching
        </Link>
        <h1>Get Started</h1>
        <p className="apply-sub">
          Fill out the form below and Everett will be in touch to discuss your goals,
          answer questions, and get you set up.
        </p>
      </div>

      <form className="apply-form" onSubmit={handleSubmit} noValidate>

        <fieldset className="apply-fieldset">
          <legend className="apply-legend">Which package are you interested in?</legend>
          <div className="apply-package-grid">
            {PACKAGES.map((pkg) => (
              <label
                key={pkg.id}
                className={`apply-package-card ${form.packageId === pkg.id ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="packageId"
                  value={pkg.id}
                  checked={form.packageId === pkg.id}
                  onChange={handleChange}
                />
                <span className="apply-package-name">{pkg.label}</span>
              </label>
            ))}
          </div>
          {selectedPkg.note && (
            <p className="apply-package-note">{selectedPkg.note}</p>
          )}
        </fieldset>

        <fieldset className="apply-fieldset">
          <legend className="apply-legend">Your Information</legend>

          <div className="apply-field">
            <label htmlFor="clientName">Full Name <span className="apply-required">*</span></label>
            <input
              id="clientName" name="clientName" type="text"
              value={form.clientName} onChange={handleChange}
              placeholder="John Watkins"
            />
            {errors.clientName && <p className="field-error">{errors.clientName}</p>}
          </div>

          <div className="apply-field">
            <label htmlFor="clientEmail">Email <span className="apply-required">*</span></label>
            <input
              id="clientEmail" name="clientEmail" type="email"
              value={form.clientEmail} onChange={handleChange}
              placeholder="john@example.com"
            />
            {errors.clientEmail && <p className="field-error">{errors.clientEmail}</p>}
          </div>

          <div className="apply-field">
            <label htmlFor="clientPhone">Phone <span className="apply-optional">(optional)</span></label>
            <input
              id="clientPhone" name="clientPhone" type="tel"
              value={form.clientPhone} onChange={handleChange}
              placeholder="(555) 000-0000"
            />
          </div>
        </fieldset>

        <fieldset className="apply-fieldset">
          <legend className="apply-legend">Tell Everett About Yourself</legend>

          <div className="apply-field">
            <label htmlFor="goals">
              What are your goals? <span className="apply-required">*</span>
            </label>
            <p className="apply-field-hint">
              Where are you now, where do you want to be, and what's been holding you back?
            </p>
            <textarea
              id="goals" name="goals" rows={5}
              value={form.goals} onChange={handleChange}
              placeholder="e.g. I want to lose 20 lbs and build consistent habits. I've tried on my own but always fall off after a few weeks..."
            />
            {errors.goals && <p className="field-error">{errors.goals}</p>}
          </div>

          <div className="apply-field">
            <label htmlFor="questions">
              Any questions for Everett? <span className="apply-optional">(optional)</span>
            </label>
            <textarea
              id="questions" name="questions" rows={3}
              value={form.questions} onChange={handleChange}
              placeholder="e.g. Do you work with beginners? How does check-in work?"
            />
          </div>
        </fieldset>

        {serverError && <p className="error-message">{serverError}</p>}

        <div className="apply-submit-row">
          <button type="submit" className="cta-button" disabled={submitting}>
            {submitting ? 'Sending…' : 'Submit Inquiry'}
          </button>
        </div>

        <div className="apply-consult-row">
          <p>Not sure which plan fits you?</p>
          <Link to="/booking" onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}>
            <button type="button" className="cta-button">Book a Free Consultation</button>
          </Link>
        </div>

      </form>
    </main>
  );
}
