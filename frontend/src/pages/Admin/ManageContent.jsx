import { useEffect, useState, useCallback, useRef } from 'react';
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
  { label: 'Free',   value: null },
  { label: '1 : 1',  value: 1 },
  { label: '4 : 3',  value: 4 / 3 },
  { label: '3 : 4',  value: 3 / 4 },
  { label: '16 : 9', value: 16 / 9 },
];

const MAX_HERO_VIDEO_BYTES        = 8  * 1024 * 1024; // 8MB — hero loads on every page visit
const MAX_TRANSFORM_VIDEO_BYTES   = 50 * 1024 * 1024; // 50MB — transformation clips

function formatDuration(seconds) {
  if (seconds == null || !isFinite(seconds)) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

async function extractFrames(src, count = 10) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    canvas.width = 80; canvas.height = 60;
    const ctx = canvas.getContext('2d');
    const frames = [];
    let i = 0;
    video.onloadedmetadata = () => {
      const dur = video.duration;
      const next = () => {
        if (i >= count) { resolve({ frames, duration: dur }); return; }
        video.currentTime = count === 1 ? dur / 2 : (i / (count - 1)) * dur;
      };
      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, 80, 60);
        frames.push(canvas.toDataURL('image/jpeg', 0.5));
        i++;
        next();
      };
      next();
    };
    video.onerror = () => resolve({ frames: [], duration: 0 });
    video.src = src;
    video.load();
  });
}

function VideoTrimmer({ src, initialStart = 0, initialEnd = null, onTrimChange }) {
  const [totalDuration, setTotalDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(initialStart);
  const [trimEnd, setTrimEnd] = useState(10);
  const [frames, setFrames] = useState([]);
  const [loadingFrames, setLoadingFrames] = useState(true);
  const filmstripRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    setLoadingFrames(true);
    extractFrames(src, 10).then(({ frames: f, duration: d }) => {
      if (cancelled) return;
      const start = initialStart ?? 0;
      const end = initialEnd ?? d-.5;
      setTotalDuration(d);
      setTrimStart(start);
      setTrimEnd(end);
      setFrames(f);
      setLoadingFrames(false);
      onTrimChange(start, end);
    });
    return () => { cancelled = true; };
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !totalDuration) return;
    const onTime = () => {
      if (video.currentTime < trimStart || video.currentTime >= trimEnd) {
        video.currentTime = trimStart;
      }
    };
    video.currentTime = trimStart;
    video.addEventListener('timeupdate', onTime);
    return () => video.removeEventListener('timeupdate', onTime);
  }, [trimStart, trimEnd, totalDuration]);

  const startPct = totalDuration ? (trimStart / totalDuration) * 100 : 0;
  const endPct   = totalDuration ? (trimEnd   / totalDuration) * 100 : 100;

  const makeDragHandlers = (side) => ({
    onPointerDown: (e) => { e.currentTarget.setPointerCapture(e.pointerId); },
    onPointerMove: (e) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      const rect = filmstripRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
      const time = ratio * totalDuration;
      if (side === 'start') setTrimStart(Math.min(time, trimEnd - 0.5));
      else                  setTrimEnd(Math.max(time, trimStart + 0.5));
    },
    onPointerUp: (e) => {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setTrimStart((s) => { setTrimEnd((en) => { onTrimChange(s, en); return en; }); return s; });
    },
  });

  return (
    <div className="video-trimmer">
      <video ref={videoRef} src={src} className="trimmer-video-preview" muted autoPlay playsInline />
      {loadingFrames && <p className="trimmer-loading">Loading filmstrip…</p>}
      {!loadingFrames && frames.length > 0 && (
        <div className="trimmer-filmstrip-wrap" ref={filmstripRef}>
          <div className="trimmer-frames">
            {frames.map((f, idx) => (
              <img key={idx} src={f} className="trimmer-frame" alt="" aria-hidden="true" />
            ))}
          </div>
          <div className="trimmer-mask-left"  style={{ width: `${startPct}%` }} />
          <div className="trimmer-mask-right" style={{ width: `${100 - endPct}%` }} />
          <div className="trimmer-selection"  style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }} />
          <div className="trimmer-handle trimmer-handle--start" style={{ left: `${startPct}%` }} {...makeDragHandlers('start')} />
          <div className="trimmer-handle trimmer-handle--end"   style={{ left: `${endPct}%`   }} {...makeDragHandlers('end')}   />
        </div>
      )}
      <div className="trimmer-info">
        <span className="trimmer-times">{formatDuration(trimStart)} → {formatDuration(trimEnd)}</span>
        <span className="trimmer-duration">{formatDuration(trimEnd - trimStart)}</span>
      </div>
    </div>
  );
}

function VideoWithFallback({ src, className, ...props }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className={`video-format-error ${className || ''}`}>Video unavailable — unsupported format</div>;
  return <video src={src} className={className} onError={() => setFailed(true)} {...props} />;
}

const EMPTY_TRANSFORM_FORM = { media: '', mediaType: '', name: '', caption: '', trimStart: 0, trimEnd: 0 };

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

  // Focus panel photo
  const [focusPhoto, setFocusPhoto]               = useState('');
  const [focusPhotoPreview, setFocusPhotoPreview] = useState('');
  const [savingFocusPhoto, setSavingFocusPhoto]   = useState(false);

  // Hero video
  const [heroVideo, setHeroVideo]             = useState('');
  const [savingHeroVideo, setSavingHeroVideo] = useState(false);

  // Crop modal — shared by all photo uploaders
  const [cropTarget, setCropTarget]               = useState(null);
  const [cropSrc, setCropSrc]                     = useState(null);
  const [crop, setCrop]                           = useState({ x: 0, y: 0 });
  const [zoom, setZoom]                           = useState(1);
  const [aspectIdx, setAspectIdx]                 = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropRotation, setCropRotation]           = useState(0);

  // Transformations
  const [transformations, setTransformations]         = useState([]);
  const [showAddTransform, setShowAddTransform]       = useState(false);
  const [addTransformForm, setAddTransformForm]       = useState(EMPTY_TRANSFORM_FORM);
  const [addTransformPreviewUrl, setAddTransformPreviewUrl] = useState('');
  const [editingTransformId, setEditingTransformId]   = useState(null);
  const [editTransformForm, setEditTransformForm]     = useState(EMPTY_TRANSFORM_FORM);
  const [editTransformPreviewUrl, setEditTransformPreviewUrl] = useState('');
  const [savingTransform, setSavingTransform]         = useState(false);

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
        if (data['hero.video'])  setHeroVideo(data['hero.video']);
        if (data['home.focusPhoto']) { setFocusPhoto(data['home.focusPhoto']); setFocusPhotoPreview(data['home.focusPhoto']); }
        if (data['home.transformations']) {
          try { setTransformations(JSON.parse(data['home.transformations'])); } catch {}
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
        setHeroPhoto(cropped); setHeroPhotoPreview(cropped);
      } else if (cropTarget === 'focus') {
        setFocusPhoto(cropped); setFocusPhotoPreview(cropped);
      } else if (cropTarget === 'transformation-new') {
        setAddTransformForm((p) => ({ ...p, media: cropped, mediaType: 'image' }));
      } else if (cropTarget === 'transformation-edit') {
        setEditTransformForm((p) => ({ ...p, media: cropped, mediaType: 'image' }));
      } else {
        setPhoto(cropped); setPhotoPreview(cropped);
      }
      resetCrop();
    } catch {
      showToast('Failed to crop image.', 'error');
    }
  };

  const cropModalTitle = () => {
    if (cropTarget === 'hero') return 'Crop Hero Photo';
    if (cropTarget === 'focus') return 'Crop Train with Everett Photo';
    if (cropTarget === 'transformation-new' || cropTarget === 'transformation-edit') return 'Crop Transformation Photo';
    return 'Crop About Photo';
  };

  /* ── Individual photo save/delete ───────────────────────── */

  const savePhoto = async () => {
    if (!photo) return;
    setSavingPhoto(true);
    try {
      await contentService.updateContent('about.photo', photo);
      showToast('About photo saved.');
    } catch { showToast('Failed to save photo.', 'error'); }
    finally { setSavingPhoto(false); }
  };

  const deleteAboutPhoto = async () => {
    if (!window.confirm('Remove the about photo? The About page will show no trainer photo.')) return;
    try {
      await contentService.deleteContent('about.photo');
      localStorage.removeItem('aio_fitness_trainer_photo');
      setPhoto(''); setPhotoPreview('');
      showToast('About photo removed.');
    } catch (err) { showToast(err?.response?.data?.error || err?.message || 'Failed to remove about photo.', 'error'); }
  };

  const saveHeroPhoto = async () => {
    if (!heroPhoto) return;
    setSavingHeroPhoto(true);
    try {
      await contentService.updateContent('hero.photo', heroPhoto);
      localStorage.setItem('aio_fitness_hero_photo', heroPhoto);
      showToast('Hero photo saved.');
    } catch { showToast('Failed to save hero photo.', 'error'); }
    finally { setSavingHeroPhoto(false); }
  };

  const deleteHeroPhoto = async () => {
    if (!window.confirm('Remove the hero photo? The home page will revert to its default gradient background.')) return;
    try {
      await contentService.deleteContent('hero.photo');
      localStorage.removeItem('aio_fitness_hero_photo');
      setHeroPhoto(''); setHeroPhotoPreview('');
      showToast('Hero photo removed.');
    } catch (err) { showToast(err?.response?.data?.error || err?.message || 'Failed to remove hero photo.', 'error'); }
  };

  const saveFocusPhoto = async () => {
    if (!focusPhoto) return;
    setSavingFocusPhoto(true);
    try {
      await contentService.updateContent('home.focusPhoto', focusPhoto);
      localStorage.setItem('aio_fitness_focus_photo', focusPhoto);
      showToast('Train with Everett photo saved.');
    } catch { showToast('Failed to save photo.', 'error'); }
    finally { setSavingFocusPhoto(false); }
  };

  const deleteFocusPhoto = async () => {
    if (!window.confirm('Remove the "Train with Everett" photo? The home page section will revert to its default background.')) return;
    try {
      await contentService.deleteContent('home.focusPhoto');
      localStorage.removeItem('aio_fitness_focus_photo');
      setFocusPhoto(''); setFocusPhotoPreview('');
      showToast('Photo removed.');
    } catch (err) { showToast(err?.response?.data?.error || err?.message || 'Failed to remove photo.', 'error'); }
  };

  /* ── Hero video ──────────────────────────────────────────── */

  const onHeroVideoSelected = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_HERO_VIDEO_BYTES) { showToast('Video must be under 8MB. Please compress it and try again.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => setHeroVideo(reader.result);
    reader.readAsDataURL(file);
  };

  const saveHeroVideo = async () => {
    if (!heroVideo) return;
    setSavingHeroVideo(true);
    try {
      await contentService.updateContent('hero.video', heroVideo);
      localStorage.setItem('aio_fitness_hero_video', heroVideo);
      showToast('Hero video saved.');
    } catch { showToast('Failed to save hero video.', 'error'); }
    finally { setSavingHeroVideo(false); }
  };

  const deleteHeroVideo = async () => {
    if (!window.confirm('Remove the hero video? The home page will revert to the hero photo or default background.')) return;
    try {
      await contentService.deleteContent('hero.video');
      localStorage.removeItem('aio_fitness_hero_video');
      setHeroVideo('');
      showToast('Hero video removed.');
    } catch (err) { showToast(err?.response?.data?.error || err?.message || 'Failed to remove hero video.', 'error'); }
  };

  /* ── Bio ─────────────────────────────────────────────────── */

  const saveBio = async () => {
    setSavingBio(true);
    try {
      await contentService.updateContent('about.bio', bio);
      showToast('Bio saved.');
    } catch { showToast('Failed to save bio.', 'error'); }
    finally { setSavingBio(false); }
  };

  /* ── Transformations ─────────────────────────────────────── */

  const onTransformMediaSelected = async (e, isEdit = false) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.type.startsWith('video/')) {
      const supported = ['video/mp4', 'video/webm'];
      if (!supported.includes(file.type)) {
        showToast(
          'Please upload MP4 or WebM video for website compatibility — QuickTime (.mov) files often won\'t play in browsers. Convert using QuickTime Player (File › Export As) or an online converter.',
          'error'
        );
        return;
      }
      if (file.size > MAX_TRANSFORM_VIDEO_BYTES) { showToast('Video must be under 50MB.', 'error'); return; }
      // Show preview immediately — don't wait for base64 encoding
      const previewUrl = URL.createObjectURL(file);
      if (isEdit) setEditTransformPreviewUrl(previewUrl);
      else        setAddTransformPreviewUrl(previewUrl);
      // Encode as base64 in background for storage
      const reader = new FileReader();
      reader.onload = () => {
        const update = { media: reader.result, mediaType: 'video' };
        if (isEdit) setEditTransformForm((p) => ({ ...p, ...update }));
        else        setAddTransformForm((p)  => ({ ...p, ...update }));
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setCropTarget(isEdit ? 'transformation-edit' : 'transformation-new');
        setCropSrc(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const persistTransformations = async (list) => {
    setSavingTransform(true);
    try {
      await contentService.updateContent('home.transformations', JSON.stringify(list));
      setTransformations(list);
      showToast('Transformations saved.');
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.error || err?.message || '';
      showToast(`Failed to save (${status ?? 'network error'}${msg ? ': ' + msg : ''})`, 'error');
      throw err; // keep the form open so the user doesn't lose their work
    } finally { setSavingTransform(false); }
  };

  const addTransformation = async () => {
    if (!addTransformForm.media) return;
    const item = {
      id: crypto.randomUUID(),
      media: addTransformForm.media,
      mediaType: addTransformForm.mediaType,
      trimStart: addTransformForm.trimStart,
      trimEnd: addTransformForm.trimEnd,
      name: addTransformForm.name.trim(),
      caption: addTransformForm.caption.trim(),
    };
    await persistTransformations([...transformations, item]);
    setAddTransformForm(EMPTY_TRANSFORM_FORM);
    setAddTransformPreviewUrl('');
    setShowAddTransform(false);
  };

  const saveTransformEdit = async () => {
    const updated = transformations.map((t) =>
      t.id === editingTransformId
        ? { ...t, media: editTransformForm.media, mediaType: editTransformForm.mediaType, trimStart: editTransformForm.trimStart, trimEnd: editTransformForm.trimEnd, name: editTransformForm.name.trim(), caption: editTransformForm.caption.trim() }
        : t
    );
    await persistTransformations(updated);
    setEditTransformPreviewUrl('');
    setEditingTransformId(null);
  };

  const deleteTransformation = async (id) => {
    if (!window.confirm('Delete this transformation?')) return;
    await persistTransformations(transformations.filter((t) => t.id !== id));
  };

  /* ── FAQs ────────────────────────────────────────────────── */

  const persistFaqs = async (list) => {
    setSavingFaq(true);
    try {
      await contentService.updateContent('faqs', JSON.stringify(list));
      setFaqs(list);
      showToast('FAQs saved.');
    } catch { showToast('Failed to save FAQs.', 'error'); }
    finally { setSavingFaq(false); }
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

  /* ── Render ──────────────────────────────────────────────── */

  if (loading) return <LoadingSpinner />;

  return (
    <main className="manage-content">
      <Link to="/admin/dashboard" style={{ fontSize: 14, color: 'var(--blue)', textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>← Back</Link>
      <h1>Manage <span>Content</span></h1>

      {fetchError && <p className="error-message">{fetchError}</p>}

      <div className="content-tabs">
        {[
          { key: 'about',           label: 'About'           },
          { key: 'transformations', label: 'Transformations' },
          { key: 'faq',             label: 'FAQ'             },
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
            <h2>{cropModalTitle()}</h2>

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

            <div className="crop-controls">
              <label className="crop-slider-label">
                Zoom
                <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
              </label>
              <label className="crop-slider-label">
                Rotate
                <input type="range" min={-180} max={180} step={1} value={cropRotation} onChange={(e) => setCropRotation(Number(e.target.value))} />
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

          <h2>Home Page Hero Photo</h2>
          <p>Displayed as the background image on the home page hero section.</p>
          <div className="photo-upload-area">
            {heroPhotoPreview
              ? <img src={heroPhotoPreview} alt="Hero preview" className="photo-preview" />
              : <div className="photo-placeholder">No hero photo uploaded yet</div>}
            <div className="photo-upload-controls">
              <label className="photo-upload-btn">
                {heroPhotoPreview ? 'Change Photo' : 'Choose Photo'}
                <input type="file" accept="image/*" onChange={(e) => openCropFor(e, 'hero')} style={{ display: 'none' }} />
              </label>
              {heroPhotoPreview && (
                <>
                  <button className="btn-cancel" onClick={() => { setCropTarget('hero'); setCropSrc(heroPhotoPreview); }}>Edit Crop</button>
                  <button className="btn-save" onClick={saveHeroPhoto} disabled={savingHeroPhoto}>{savingHeroPhoto ? 'Saving…' : 'Save Hero Photo'}</button>
                  <button className="btn-delete" onClick={deleteHeroPhoto}>Delete Photo</button>
                </>
              )}
            </div>
          </div>

          <h2 style={{ marginTop: 40 }}>Home Page Hero Video</h2>
          <p>Optional background video for the home page hero (takes priority over the hero photo when set). MP4 recommended, muted/looping, under 8MB.</p>
          <div className="photo-upload-area">
            {heroVideo
              ? <video src={heroVideo} className="photo-preview" muted loop autoPlay playsInline />
              : <div className="photo-placeholder">No hero video uploaded yet</div>}
            <div className="photo-upload-controls">
              <label className="photo-upload-btn">
                {heroVideo ? 'Change Video' : 'Choose Video'}
                <input type="file" accept="video/mp4,video/webm" onChange={onHeroVideoSelected} style={{ display: 'none' }} />
              </label>
              {heroVideo && (
                <>
                  <button className="btn-save" onClick={saveHeroVideo} disabled={savingHeroVideo}>{savingHeroVideo ? 'Saving…' : 'Save Hero Video'}</button>
                  <button className="btn-delete" onClick={deleteHeroVideo}>Delete Video</button>
                </>
              )}
            </div>
          </div>

          <h2 style={{ marginTop: 40 }}>Train with Everett Hero Photo</h2>
          <p>Displayed in the "Train With Everett" panel on the home page. Separate from the About page photo.</p>
          <div className="photo-upload-area">
            {focusPhotoPreview
              ? <img src={focusPhotoPreview} alt="Train with Everett preview" className="photo-preview" />
              : <div className="photo-placeholder">No photo uploaded yet</div>}
            <div className="photo-upload-controls">
              <label className="photo-upload-btn">
                {focusPhotoPreview ? 'Change Photo' : 'Choose Photo'}
                <input type="file" accept="image/*" onChange={(e) => openCropFor(e, 'focus')} style={{ display: 'none' }} />
              </label>
              {focusPhotoPreview && (
                <>
                  <button className="btn-cancel" onClick={() => { setCropTarget('focus'); setCropSrc(focusPhotoPreview); }}>Edit Crop</button>
                  <button className="btn-save" onClick={saveFocusPhoto} disabled={savingFocusPhoto}>{savingFocusPhoto ? 'Saving…' : 'Save Photo'}</button>
                  <button className="btn-delete" onClick={deleteFocusPhoto}>Delete Photo</button>
                </>
              )}
            </div>
          </div>

          <h2 style={{ marginTop: 40 }}>About Page Photo</h2>
          <p>Displayed on the About page hero section.</p>
          <div className="photo-upload-area">
            {photoPreview
              ? <img src={photoPreview} alt="Trainer preview" className="photo-preview" />
              : <div className="photo-placeholder">No photo uploaded yet</div>}
            <div className="photo-upload-controls">
              <label className="photo-upload-btn">
                {photoPreview ? 'Change Photo' : 'Choose Photo'}
                <input type="file" accept="image/*" onChange={(e) => openCropFor(e, 'about')} style={{ display: 'none' }} />
              </label>
              {photoPreview && (
                <>
                  <button className="btn-cancel" onClick={() => { setCropTarget('about'); setCropSrc(photoPreview); }}>Edit Crop</button>
                  <button className="btn-save" onClick={savePhoto} disabled={savingPhoto}>{savingPhoto ? 'Saving…' : 'Save Photo'}</button>
                  <button className="btn-delete" onClick={deleteAboutPhoto}>Delete Photo</button>
                </>
              )}
            </div>
          </div>

          <h2 style={{ marginTop: 32 }}>Bio</h2>
          <p>Displayed as the intro paragraph on the About page.</p>
          <div className="form-group">
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={6} placeholder="Enter your bio…" />
          </div>
          <button className="btn-save" onClick={saveBio} disabled={savingBio}>{savingBio ? 'Saving…' : 'Save Bio'}</button>

        </section>
      )}

      {/* ── Transformations ───────────────────────────────────── */}
      {activeTab === 'transformations' && (
        <section className="content-section">
          <div className="day-modal-header" style={{ marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0 }}>Client Transformations</h2>
              {transformations.length > 0 && (
                <span className="transform-counter">{transformations.length} uploaded</span>
              )}
            </div>
            <button
              className="btn-add-slot"
              onClick={() => { setShowAddTransform(!showAddTransform); setEditingTransformId(null); setAddTransformForm(EMPTY_TRANSFORM_FORM); setAddTransformPreviewUrl(''); }}
            >
              {showAddTransform ? 'Cancel' : '+ Add Transformation'}
            </button>
          </div>

          {showAddTransform && (
            <div className="content-item-form transform-add-form">
              <div className="transform-media-row">
                {addTransformForm.mediaType === 'image' && (
                  <div className="transform-preview-wrap">
                    {addTransformForm.media
                      ? <img src={addTransformForm.media} className="transform-preview" alt="Preview" />
                      : <div className="transform-preview-empty">No media selected</div>}
                  </div>
                )}
                <div className="transform-media-controls">
                  <label className="photo-upload-btn">
                    {(addTransformPreviewUrl || addTransformForm.media) ? 'Change Photo / Video' : 'Choose Photo or Video'}
                    <input type="file" accept="image/*,video/*" onChange={(e) => onTransformMediaSelected(e, false)} style={{ display: 'none' }} />
                  </label>
                  {addTransformForm.media && addTransformForm.mediaType === 'image' && (
                    <button className="btn-cancel" onClick={() => { setCropTarget('transformation-new'); setCropSrc(addTransformForm.media); }}>
                      Edit Crop
                    </button>
                  )}
                  <p className="transform-media-hint">Photos or short videos. 50MB max for video.</p>
                </div>
              </div>
              {addTransformForm.mediaType === 'video' && (addTransformPreviewUrl || addTransformForm.media) && (
                <VideoTrimmer
                  src={addTransformPreviewUrl || addTransformForm.media}
                  onTrimChange={(s, e) => setAddTransformForm((p) => ({ ...p, trimStart: s, trimEnd: e }))}
                />
              )}
              <div className="form-group">
                <label>Client Name <span className="optional-label">(optional)</span></label>
                <input
                  type="text"
                  value={addTransformForm.name}
                  onChange={(e) => setAddTransformForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. John D."
                />
              </div>
              <div className="form-group">
                <label>Caption <span className="optional-label">(optional)</span></label>
                <textarea
                  value={addTransformForm.caption}
                  onChange={(e) => setAddTransformForm((p) => ({ ...p, caption: e.target.value }))}
                  rows={2}
                  placeholder="e.g. Lost 30 lbs in 6 months"
                />
              </div>
              <div className="slot-edit-actions">
                <button className="btn-save" onClick={addTransformation} disabled={savingTransform || !addTransformForm.media}>
                  {savingTransform ? 'Saving…' : 'Add'}
                </button>
              </div>
            </div>
          )}

          {transformations.length === 0 && !showAddTransform && (
            <p style={{ color: 'var(--gray-500)', marginTop: 8 }}>No transformations uploaded yet. Click "+ Add Transformation" to get started.</p>
          )}

          {transformations.length > 0 && (
            <div className="transform-thumb-grid">
              {transformations.map((t) => (
                <div key={t.id} className={`transform-thumb-card${editingTransformId === t.id ? ' transform-thumb-card--editing' : ''}`}>
                  {editingTransformId === t.id ? (
                    <div className="content-item-form" style={{ margin: 0, borderRadius: 'var(--radius)' }}>
                      <div className="transform-media-row">
                        {editTransformForm.mediaType === 'image' && (
                          <div className="transform-preview-wrap">
                            <img src={editTransformForm.media} className="transform-preview" alt="Preview" />
                          </div>
                        )}
                        <div className="transform-media-controls">
                          <label className="photo-upload-btn">
                            Change Photo / Video
                            <input type="file" accept="image/*,video/*" onChange={(e) => onTransformMediaSelected(e, true)} style={{ display: 'none' }} />
                          </label>
                          {editTransformForm.mediaType === 'image' && (
                            <button className="btn-cancel" onClick={() => { setCropTarget('transformation-edit'); setCropSrc(editTransformForm.media); }}>
                              Edit Crop
                            </button>
                          )}
                        </div>
                      </div>
                      {editTransformForm.mediaType === 'video' && (
                        <VideoTrimmer
                          src={editTransformPreviewUrl || editTransformForm.media}
                          initialStart={editTransformForm.trimStart || 0}
                          initialEnd={editTransformForm.trimEnd || null}
                          onTrimChange={(s, e) => setEditTransformForm((p) => ({ ...p, trimStart: s, trimEnd: e }))}
                        />
                      )}
                      <div className="form-group">
                        <label>Client Name <span className="optional-label">(optional)</span></label>
                        <input
                          type="text"
                          value={editTransformForm.name}
                          onChange={(e) => setEditTransformForm((p) => ({ ...p, name: e.target.value }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Caption <span className="optional-label">(optional)</span></label>
                        <textarea
                          value={editTransformForm.caption}
                          onChange={(e) => setEditTransformForm((p) => ({ ...p, caption: e.target.value }))}
                          rows={2}
                        />
                      </div>
                      <div className="slot-edit-actions">
                        <button className="btn-save" onClick={saveTransformEdit} disabled={savingTransform}>
                          {savingTransform ? 'Saving…' : 'Save'}
                        </button>
                        <button className="btn-cancel" onClick={() => { setEditingTransformId(null); setEditTransformPreviewUrl(''); }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="transform-thumb-media">
                        {t.mediaType === 'video'
                          ? <VideoWithFallback src={t.media} className="transform-thumb-img" muted loop autoPlay playsInline />
                          : <img src={t.media} className="transform-thumb-img" alt={t.name || 'Transformation'} />}
                        {t.mediaType === 'video' && (t.trimEnd != null || t.duration) && (
                          <span className="transform-duration-badge">
                            {t.trimEnd != null
                              ? formatDuration(t.trimEnd - (t.trimStart ?? 0))
                              : typeof t.duration === 'number' ? formatDuration(t.duration) : t.duration}
                          </span>
                        )}
                      </div>
                      {(t.name || t.caption) && (
                        <div className="transform-thumb-meta">
                          {t.name && <span className="transform-thumb-name">{t.name}</span>}
                          {t.caption && <span className="transform-thumb-caption">{t.caption}</span>}
                        </div>
                      )}
                      <div className="transform-thumb-actions">
                        <button
                          className="btn-save"
                          onClick={() => {
                            setEditingTransformId(t.id);
                            setEditTransformForm({ media: t.media, mediaType: t.mediaType, trimStart: t.trimStart ?? 0, trimEnd: t.trimEnd ?? 0, name: t.name || '', caption: t.caption || '' });
                            setShowAddTransform(false);
                          }}
                        >
                          Edit
                        </button>
                        <button className="btn-delete" onClick={() => deleteTransformation(t.id)} disabled={savingTransform}>
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
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
                <button className="btn-save" onClick={addFaq} disabled={savingFaq}>{savingFaq ? 'Saving…' : 'Add FAQ'}</button>
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
                    <input type="text" value={editFaqForm.question} onChange={(e) => setEditFaqForm((p) => ({ ...p, question: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Answer</label>
                    <textarea value={editFaqForm.answer} onChange={(e) => setEditFaqForm((p) => ({ ...p, answer: e.target.value }))} rows={3} />
                  </div>
                  <div className="slot-edit-actions">
                    <button className="btn-save" onClick={saveFaqEdit} disabled={savingFaq}>{savingFaq ? 'Saving…' : 'Save'}</button>
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
                    <button className="btn-save" onClick={() => { setEditingFaqId(f.id); setEditFaqForm({ question: f.question, answer: f.answer }); setShowAddFaq(false); }}>Edit</button>
                    <button className="btn-delete" onClick={() => deleteFaq(f.id)} disabled={savingFaq}>Delete</button>
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
