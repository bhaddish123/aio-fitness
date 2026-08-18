import { useEffect, useRef, useState } from 'react';

export default function TrimmedVideo({ src, trimStart, trimEnd, ...props }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onMeta = () => { v.currentTime = trimStart ?? 0; };
    const onTime = () => {
      const end = trimEnd ?? v.duration;
      if (v.currentTime >= end) v.currentTime = trimStart ?? 0;
    };
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('timeupdate', onTime);
    return () => {
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('timeupdate', onTime);
    };
  }, [trimStart, trimEnd]);
  if (failed) return <div className="transformation-video-error">Video unavailable — unsupported format</div>;
  return <video ref={ref} src={src} onError={() => setFailed(true)} {...props} />;
}
