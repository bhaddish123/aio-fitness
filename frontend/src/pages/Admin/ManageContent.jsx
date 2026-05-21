import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import contentService from '../../services/contentService';
import LoadingSpinner from '../../components/LoadingSpinner';
import Toast from '../../components/Toast';

async function getCroppedImg(src, pixelCrop) {
  const image = new Image();
  image.src = src;
  await new Promise((res) => { image.onload = res; });
  const canvas = document.createElement('canvas');
  canvas.width  = pixelCrop.width;
  canvas.height = pixelCrop.height;
  canvas.getContext('2d').drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height,
  );
  return canvas.toDataURL('image/jpeg', 0.92);
}

const ASPECTS = [
  { label: 'Free',  value: null },
  { label: '1 : 1', value: 1 },
  { label: '4 : 3', value: 4 / 3 },
  { label: '3 : 4', value: 3 / 4 },
  { label: '16 : 9', value: 16 / 9 },
];

export default function ManageContent() {
  const [activeTab, setActiveTab]   = useState('about');
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [toast, setToast]           = useState(null);

  // About
  const [bio, setBio]             = useState('');
  const [savingBio, setSavingBio] = useState(false);
  const [photo, setPhoto]         = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [savingPhoto, setSavingPhoto]   = useState(false);

  // Hero photo
  const [heroPhoto, setHeroPhoto]               = useState('');
  const [heroPhotoPreview, setHeroPhotoPreview] = useState('');
  const [savingHeroPhoto, setSavingHeroPhoto]   = useState(false);

  // Crop modal — shared by both photo uploaders
  const [cropTarget, setCropTarget]             = useState(null); // 'about' | 'hero'
  const [cropSrc, setCropSrc]                   = useState(null);
  const [crop, setCrop]                         = useState({ x: 0, y: 0 });
  const [zoom, setZoom]                         = useState(1);
  const [aspectIdx, setAspectIdx]               = useState(0);   // default Free
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropRotation, setCropRotation]         = useState(0);

  // Testimonials
  const [testimonials, setTestimonials]     = useState([]);
  const [editingTestId, setEditingTestId]   = useState(null);
  const [editTestForm, setEditTestForm]     = useState({ quote: '', author: '' });
  const [showAddTest, setShowAddTest]       = useState(false);
  const [addTestForm, setAddTestForm]       = useState({ quote: '', author: '' });
  const [savingTest, setSavingTest]         = useState(false);

  // FAQs
  const [faqs, setFaqs]                   = useState([]);
  const [editingFaqId, setEditingFaqId]   = useState(null);
  const [editFaqForm, setEditFaqForm]     = useState({ question: '', answer: '' });
  const [showAddFaq, setShowAddFaq]       = useState(false);
  const [addFaqForm, setAddFaqForm]       = useState({ question: '', answer: '' });
  const [savingFaq, setSavingFaq]         = useState(false);

  useEffect(() => {
    contentService.getAllContent()
      .then((data) => {
        if (data['about.bio'])    setBio(data['about.bio']);
        if (data['about.photo']) { setPhoto(data['about.photo']); setPhotoPreview(data['about.photo']); }
        if (data['hero.photo'])  { setHeroPhoto(data['hero.photo']); setHeroPhotoPreview(data['hero.photo']); }
        if (data.testimonials) {
          try { setTestimonials(JSON.parse(data.testimonials)); } catch {}
        }
        if (data.faqs) {
          try { setFaqs(JSON.parse(data.faqs)); } catch {}
        }
      })
      .catch(() => setFetchError('Failed to load content.'))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (message, type = 'success') => setToast({ message, type });

  /* ── Photo (shared crop flow) ────────────────────────────── */

  const openCropFor = (e, target) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setCropTarget(target); setCropSrc(reader.result); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const resetCrop = () => {
    setCropSrc(null);
    setCropTarget(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropRotation(0);
  };

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleCropConfirm = async () => {
    try {
      const cropped = await getCroppedImg(cropSrc, croppedAreaPixels);
      if (cropTarget === 'hero') {
        setHeroPhoto(cropped);
        setHeroPhotoPreview(cropped);
      } else {
        setPhoto(cropped);
        setPhotoPreview(cropped);
      }
      resetCrop();
    } catch {
      showToast('Failed to crop image.', 'error');
    }
  };

  const savePhoto = async () => {
    if (!photo) return;
    setSavingPhoto(true);
    try {
      await contentService.updateContent('about.photo', photo);
      showToast('About photo saved.');
    } catch {
      showToast('Failed to save photo.', 'error');
    } finally {
      setSavingPhoto(false);
    }
  };

  const saveHeroPhoto = async () => {
    if (!heroPhoto) return;
    setSavingHeroPhoto(true);
    try {
      await contentService.updateContent('hero.photo', heroPhoto);
      localStorage.setItem('a3fit_hero_photo', heroPhoto);
      showToast('Hero photo saved.');
    } catch {
      showToast('Failed to save hero photo.', 'error');
    } finally {
      setSavingHeroPhoto(false);
    }
  };

  const deleteHeroPhoto = async () => {
    if (!window.confirm('Remove the hero photo? The home page will revert to its default gradient background.')) return;
    try {
      await contentService.deleteContent('hero.photo');
      localStorage.removeItem('a3fit_hero_photo');
      setHeroPhoto('');
      setHeroPhotoPreview('');
      showToast('Hero photo removed.');
    } catch (err) {
      showToast(err?.response?.data?.error || err?.message || 'Failed to remove hero photo.', 'error');
    }
  };

  const deleteAboutPhoto = async () => {
    if (!window.confirm('Remove the about photo? The About page will show no trainer photo.')) return;
    try {
      await contentService.deleteContent('about.photo');
      localStorage.removeItem('a3fit_trainer_photo');
      setPhoto('');
      setPhotoPreview('');
      showToast('About photo removed.');
    } catch (err) {
      showToast(err?.response?.data?.error || err?.message || 'Failed to remove about photo.', 'error');
    }
  };

  /* ── Bio ──────────────────────────────────────────────────── */

  const saveBio = async () => {
    setSavingBio(true);
    try {
      await contentService.updateContent('about.bio', bio);
      showToast('Bio saved.');
    } catch {
      showToast('Failed to save bio.', 'error');
    } finally {
      setSavingBio(false);
    }
  };

  /* ── Testimonials ─────────────────────────────────────────── */

  const persistTestimonials = async (list) => {
    setSavingTest(true);
    try {
      await contentService.updateContent('testimonials', JSON.stringify(list));
      setTestimonials(list);
      showToast('Testimonials saved.');
    } catch {
      showToast('Failed to save testimonials.', 'error');
    } finally {
      setSavingTest(false);
    }
  };

  const addTestimonial = async () => {
    if (!addTestForm.quote.trim() || !addTestForm.author.trim()) return;
    const item = { id: crypto.randomUUID(), quote: addTestForm.quote.trim(), author: addTestForm.author.trim() };
    await persistTestimonials([...testimonials, item]);
    setAddTestForm({ quote: '', author: '' });
    setShowAddTest(false);
  };

  const saveTestimonialEdit = async () => {
    const updated = testimonials.map((t) =>
      t.id === editingTestId ? { ...t, quote: editTestForm.quote.trim(), author: editTestForm.author.trim() } : t
    );
    await persistTestimonials(updated);
    setEditingTestId(null);
  };

  const deleteTestimonial = async (id) => {
    if (!window.confirm('Delete this testimonial?')) return;
    await persistTestimonials(testimonials.filter((t) => t.id !== id));
  };

  /* ── FAQs ─────────────────────────────────────────────────── */

  const persistFaqs = async (list) => {
    setSavingFaq(true);
    try {
      await contentService.updateContent('faqs', JSON.stringify(list));
      setFaqs(list);
      showToast('FAQs saved.');
    } catch {
      showToast('Failed to save FAQs.', 'error');
    } finally {
      setSavingFaq(false);
    }
  };

  const addFaq = async () => {
    if (!addFaqForm.question.trim() || !addFaqForm.answer.trim()) return;
    const item = { id: crypto.randomUUID(), question: addFaqForm.question.trim(), answer: addFaqForm.answer.trim() };
    await persistFaqs([...faqs, item]);
    setAddFaqForm({ question: '', answer: '' });
    setShowAddFaq(false);
  };

  const saveFaqEdit = async () => {
    const updated = faqs.map((f) =>
      f.id === editingFaqId ? { ...f, question: editFaqForm.question.trim(), answer: editFaqForm.answer.trim() } : f
    );
    await persistFaqs(updated);
    setEditingFaqId(null);
  };

  const deleteFaq = async (id) => {
    if (!window.confirm('Delete this FAQ item?')) return;
    await persistFaqs(faqs.filter((f) => f.id !== id));
  };

  /* ── Render ───────────────────────────────────────────────── */

  if (loading) return <LoadingSpinner />;

  return (
    <main className="manage-content">
      <Link to="/admin/dashboard" style={{ fontSize: 14, color: 'var(--blue)', textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>← Back</Link>
      <h1>Manage Content</h1>

      {fetchError && <p className="error-message">{fetchError}</p>}

      <div className="content-tabs">
        {[
          { key: 'about',        label: 'About'        },
          { key: 'testimonials', label: 'Testimonials' },
          { key: 'faq',          label: 'FAQ'          },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`content-tab-btn ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Crop Modal ────────────────────────────────────────── */}
      {cropSrc && (
        <div className="modal-overlay" onClick={resetCrop}>
          <div className="modal-card crop-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{cropTarget === 'hero' ? 'Crop Hero Photo' : 'Crop About Photo'}</h2>

            {/* Aspect ratio selector */}
            <div className="crop-aspect-row">
              {ASPECTS.map((a, i) => (
                <button
                  key={a.label}
                  className={`crop-aspect-btn${aspectIdx === i ? ' active' : ''}`}
                  onClick={() => setAspectIdx(i)}
                >
                  {a.label}
                </button>
              ))}
            </div>

            {/* Cropper canvas */}
            <div className="crop-container">
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                rotation={cropRotation}
                aspect={ASPECTS[aspectIdx].value ?? undefined}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Zoom & rotate sliders */}
            <div className="crop-controls">
              <label className="crop-slider-label">
                Zoom
                <input
                  type="range" min={1} max={3} step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
              </label>
              <label className="crop-slider-label">
                Rotate
                <input
                  type="range" min={-180} max={180} step={1}
                  value={cropRotation}
                  onChange={(e) => setCropRotation(Number(e.target.value))}
                />
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn-save" onClick={handleCropConfirm}>Apply Crop</button>
              <button className="btn-cancel" onClick={resetCrop}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── About ─────────────────────────────────────────────── */}
      {activeTab === 'about' && (
        <section className="content-section">

          {/* Home Hero Photo */}
          <h2>Home Page Hero Photo</h2>
          <p>Displayed as the background image on the home page hero section.</p>
          <div className="photo-upload-area">
            {heroPhotoPreview ? (
              <img src={heroPhotoPreview} alt="Hero preview" className="photo-preview" />
            ) : (
              <div className="photo-placeholder">No hero photo uploaded yet</div>
            )}
            <div className="photo-upload-controls">
              <label className="photo-upload-btn">
                {heroPhotoPreview ? 'Change Photo' : 'Choose Photo'}
                <input type="file" accept="image/*" onChange={(e) => openCropFor(e, 'hero')} style={{ display: 'none' }} />
              </label>
              {heroPhotoPreview && (
                <>
                  <button className="btn-cancel" onClick={() => { setCropTarget('hero'); setCropSrc(heroPhotoPreview); }}>
                    Edit Crop
                  </button>
                  <button className="btn-save" onClick={saveHeroPhoto} disabled={savingHeroPhoto}>
                    {savingHeroPhoto ? 'Saving…' : 'Save Hero Photo'}
                  </button>
                  <button className="btn-delete" onClick={deleteHeroPhoto}>
                    Delete Photo
                  </button>
                </>
              )}
            </div>
          </div>

          {/* About Page Photo */}
          <h2 style={{ marginTop: 40 }}>About Page Photo</h2>
          <p>Displayed on the About page hero section.</p>
          <div className="photo-upload-area">
            {photoPreview ? (
              <img src={photoPreview} alt="Trainer preview" className="photo-preview" />
            ) : (
              <div className="photo-placeholder">No photo uploaded yet</div>
            )}
            <div className="photo-upload-controls">
              <label className="photo-upload-btn">
                {photoPreview ? 'Change Photo' : 'Choose Photo'}
                <input type="file" accept="image/*" onChange={(e) => openCropFor(e, 'about')} style={{ display: 'none' }} />
              </label>
              {photoPreview && (
                <>
                  <button className="btn-cancel" onClick={() => { setCropTarget('about'); setCropSrc(photoPreview); }}>
                    Edit Crop
                  </button>
                  <button className="btn-save" onClick={savePhoto} disabled={savingPhoto}>
                    {savingPhoto ? 'Saving…' : 'Save Photo'}
                  </button>
                  <button className="btn-delete" onClick={deleteAboutPhoto}>
                    Delete Photo
                  </button>
                </>
              )}
            </div>
          </div>

          <h2 style={{ marginTop: 32 }}>Bio</h2>
          <p>Displayed as the intro paragraph on the About page.</p>
          <div className="form-group">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={6}
              placeholder="Enter your bio…"
            />
          </div>
          <button className="btn-save" onClick={saveBio} disabled={savingBio}>
            {savingBio ? 'Saving…' : 'Save Bio'}
          </button>
        </section>
      )}

      {/* ── Testimonials ──────────────────────────────────────── */}
      {activeTab === 'testimonials' && (
        <section className="content-section">
          <div className="day-modal-header" style={{ marginBottom: 20 }}>
            <h2 style={{ margin: 0 }}>Testimonials</h2>
            <button
              className="btn-add-slot"
              onClick={() => { setShowAddTest(!showAddTest); setEditingTestId(null); }}
            >
              {showAddTest ? 'Cancel' : '+ Add Testimonial'}
            </button>
          </div>

          {showAddTest && (
            <div className="content-item-form">
              <div className="form-group">
                <label>Quote</label>
                <textarea
                  value={addTestForm.quote}
                  onChange={(e) => setAddTestForm((p) => ({ ...p, quote: e.target.value }))}
                  rows={3}
                  placeholder='"Drew changed my life completely."'
                />
              </div>
              <div className="form-group">
                <label>Author</label>
                <input
                  type="text"
                  value={addTestForm.author}
                  onChange={(e) => setAddTestForm((p) => ({ ...p, author: e.target.value }))}
                  placeholder="e.g. Sarah M."
                />
              </div>
              <div className="slot-edit-actions">
                <button className="btn-save" onClick={addTestimonial} disabled={savingTest}>
                  {savingTest ? 'Saving…' : 'Add Testimonial'}
                </button>
              </div>
            </div>
          )}

          {testimonials.length === 0 && !showAddTest && (
            <p style={{ color: 'var(--gray-500)', marginTop: 8 }}>No testimonials yet.</p>
          )}

          {testimonials.map((t) => (
            <div key={t.id} className="content-item">
              {editingTestId === t.id ? (
                <div className="content-item-form">
                  <div className="form-group">
                    <label>Quote</label>
                    <textarea
                      value={editTestForm.quote}
                      onChange={(e) => setEditTestForm((p) => ({ ...p, quote: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>Author</label>
                    <input
                      type="text"
                      value={editTestForm.author}
                      onChange={(e) => setEditTestForm((p) => ({ ...p, author: e.target.value }))}
                    />
                  </div>
                  <div className="slot-edit-actions">
                    <button className="btn-save" onClick={saveTestimonialEdit} disabled={savingTest}>
                      {savingTest ? 'Saving…' : 'Save'}
                    </button>
                    <button className="btn-cancel" onClick={() => setEditingTestId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="content-item-view">
                  <div className="content-item-body">
                    <p className="content-quote">"{t.quote}"</p>
                    <span className="content-author">— {t.author}</span>
                  </div>
                  <div className="content-item-actions">
                    <button
                      className="btn-save"
                      onClick={() => {
                        setEditingTestId(t.id);
                        setEditTestForm({ quote: t.quote, author: t.author });
                        setShowAddTest(false);
                      }}
                    >
                      Edit
                    </button>
                    <button className="btn-delete" onClick={() => deleteTestimonial(t.id)} disabled={savingTest}>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* ── FAQ ───────────────────────────────────────────────── */}
      {activeTab === 'faq' && (
        <section className="content-section">
          <div className="day-modal-header" style={{ marginBottom: 20 }}>
            <h2 style={{ margin: 0 }}>FAQ Items</h2>
            <button
              className="btn-add-slot"
              onClick={() => { setShowAddFaq(!showAddFaq); setEditingFaqId(null); }}
            >
              {showAddFaq ? 'Cancel' : '+ Add FAQ'}
            </button>
          </div>

          {showAddFaq && (
            <div className="content-item-form">
              <div className="form-group">
                <label>Question</label>
                <input
                  type="text"
                  value={addFaqForm.question}
                  onChange={(e) => setAddFaqForm((p) => ({ ...p, question: e.target.value }))}
                  placeholder="e.g. What should I bring?"
                />
              </div>
              <div className="form-group">
                <label>Answer</label>
                <textarea
                  value={addFaqForm.answer}
                  onChange={(e) => setAddFaqForm((p) => ({ ...p, answer: e.target.value }))}
                  rows={3}
                  placeholder="e.g. Comfortable workout clothes and water."
                />
              </div>
              <div className="slot-edit-actions">
                <button className="btn-save" onClick={addFaq} disabled={savingFaq}>
                  {savingFaq ? 'Saving…' : 'Add FAQ'}
                </button>
              </div>
            </div>
          )}

          {faqs.length === 0 && !showAddFaq && (
            <p style={{ color: 'var(--gray-500)', marginTop: 8 }}>No FAQ items yet.</p>
          )}

          {faqs.map((f) => (
            <div key={f.id} className="content-item">
              {editingFaqId === f.id ? (
                <div className="content-item-form">
                  <div className="form-group">
                    <label>Question</label>
                    <input
                      type="text"
                      value={editFaqForm.question}
                      onChange={(e) => setEditFaqForm((p) => ({ ...p, question: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Answer</label>
                    <textarea
                      value={editFaqForm.answer}
                      onChange={(e) => setEditFaqForm((p) => ({ ...p, answer: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="slot-edit-actions">
                    <button className="btn-save" onClick={saveFaqEdit} disabled={savingFaq}>
                      {savingFaq ? 'Saving…' : 'Save'}
                    </button>
                    <button className="btn-cancel" onClick={() => setEditingFaqId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="content-item-view">
                  <div className="content-item-body">
                    <p className="content-question">{f.question}</p>
                    <p className="content-answer">{f.answer}</p>
                  </div>
                  <div className="content-item-actions">
                    <button
                      className="btn-save"
                      onClick={() => {
                        setEditingFaqId(f.id);
                        setEditFaqForm({ question: f.question, answer: f.answer });
                        setShowAddFaq(false);
                      }}
                    >
                      Edit
                    </button>
                    <button className="btn-delete" onClick={() => deleteFaq(f.id)} disabled={savingFaq}>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </main>
  );
}
