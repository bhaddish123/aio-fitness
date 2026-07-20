export const FacebookIcon = () => (
  <svg width="13" height="18" viewBox="0 0 13 18" fill="currentColor" aria-hidden="true">
    <path d="M11 1H8.5C6 1 4.3 2.7 4.3 5.3V8H1.5v3h2.8v9H8v-9h2.6l.4-3H8V5.3c0-.6.5-1.1 1.1-1.1H11V1z"/>
  </svg>
);

export const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5"/>
    <circle cx="12" cy="12" r="4.5"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

export const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

export const SOCIAL_LINKS = [
  { key: 'facebook', label: 'Follow on Facebook', href: 'https://www.facebook.com/profile.php?id=100087637025380', Icon: FacebookIcon },
  { key: 'instagram', label: 'Follow on Instagram', href: 'https://www.instagram.com/everettxlee/?hl=en', Icon: InstagramIcon },
  { key: 'linkedin', label: 'Connect on LinkedIn', href: 'https://www.linkedin.com/in/everett-lee-661a56172/', Icon: LinkedInIcon },
];
