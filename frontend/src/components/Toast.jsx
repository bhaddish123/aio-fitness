import { useEffect } from 'react';

/**
 * Auto-dismissing toast notification.
 * Props: message (string), type ('success'|'error'), onDismiss (fn)
 */
export default function Toast({ message, type = 'success', onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className={`toast toast-${type}`}>
      <span>{message}</span>
      <button className="toast-close" onClick={onDismiss}>✕</button>
    </div>
  );
}
