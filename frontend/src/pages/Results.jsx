import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../utils/constants';
import TrimmedVideo from '../utils/TrimmedVideo';

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
          } catch (_) {}
        }
      })
      .catch(() => {});
  }, []);

  return (
    <main className="results-page">
      <div className="results-hero">
        <h1>Client Results</h1>
        <p className="results-sub">Real transformations. Real people. Real results.</p>
      </div>

      <div className="section-inner">
        {transformations.length > 0 ? (
          <div className="transformation-gallery">
            {transformations.map((t) => (
              <div key={t.id} className="transformation-item">
                <div className="transformation-media">
                  {t.mediaType === 'video' ? (
                    <TrimmedVideo src={t.media} trimStart={t.trimStart} trimEnd={t.trimEnd} muted autoPlay playsInline />
                  ) : (
                    <img src={t.media} alt={t.name || 'Client transformation'} />
                  )}
                </div>
                {(t.name || t.caption) && (
                  <div className="transformation-meta">
                    {t.name && <span className="transformation-name">{t.name}</span>}
                    {t.caption && <p className="transformation-caption">{t.caption}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="transformations-placeholder">
            <p className="transformations-placeholder-label">Before &amp; afters · Milestone wins · Client stories</p>
            <p className="transformations-placeholder-sub">Real results coming soon.</p>
          </div>
        )}
      </div>
    </main>
  );
}
