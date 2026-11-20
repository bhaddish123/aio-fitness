import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../utils/constants';
import TrimmedVideo from '../utils/TrimmedVideo';

function PlaceholderFrame({ delay }) {
  return (
    <div className="ba" style={{ '--d': delay }}>
      <div className="ba-before">
        <svg className="figure" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><circle cx="12" cy="6" r="3.2" /><path d="M6 22v-6.5a6 6 0 0 1 12 0V22" /></svg>
      </div>
      <div className="ba-after">
        <svg className="figure" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><circle cx="12" cy="6" r="3.2" /><path d="M5 22v-6.5c0-4 3-6.3 7-6.3s7 2.3 7 6.3V22" /></svg>
      </div>
      <div className="ba-handle" aria-hidden="true" />
    </div>
  );
}

export default function Results() {
  const [transformations, setTransformations] = useState([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    fetch(`${API_BASE_URL}/content`)
      .then((r) => r.json())
      .then((data) => {
        if (data['home.transformations']) {
          try {
            setTransformations(JSON.parse(data['home.transformations']));
          } catch {
            // Bad JSON from the admin field — keep the placeholder.
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <main className="rd page">
      <section className="page-hero center compact" style={{ textAlign: 'center' }}>
        <div className="glow-top" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />
        <h1><span className="line"><span>Client <span className="gold-text">Results</span></span></span></h1>
      </section>

      <section className="section">
        {transformations.length > 0 ? (
          <div className="wrap results reveal-stagger">
            {transformations.map((t) => (
              <figure key={t.id} className="ba-card" style={{ margin: 0 }}>
                <div className="ba-real">
                  {t.mediaType === 'video' ? (
                    <TrimmedVideo src={t.media} trimStart={t.trimStart} trimEnd={t.trimEnd} muted autoPlay playsInline />
                  ) : (
                    <img src={t.media} alt={t.name || 'Client transformation'} />
                  )}
                </div>
                {(t.name || t.caption) && (
                  <figcaption className="ba-meta">
                    {t.name && <b>{t.name}</b>}
                    {t.caption && <span>{t.caption}</span>}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        ) : (
          <div className="results-empty reveal">
            <div className="ba-row" aria-hidden="true">
              <PlaceholderFrame delay="0s" />
              <PlaceholderFrame delay="-2.3s" />
              <PlaceholderFrame delay="-4.6s" />
            </div>
            <b>Before &amp; afters · Milestone wins · Client stories</b>
            <span>Real results coming soon.</span>
          </div>
        )}
      </section>
    </main>
  );
}
