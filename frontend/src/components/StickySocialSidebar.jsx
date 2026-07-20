import { SOCIAL_LINKS } from './SocialIcons';

export default function StickySocialSidebar() {
  return (
    <div className="sticky-social-sidebar">
      {SOCIAL_LINKS.map(({ key, label, href, Icon }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className="sticky-social-icon"
        >
          <Icon />
        </a>
      ))}
    </div>
  );
}
