import { SOCIAL_LINKS } from './SocialIcons';

export default function StickySocialSidebar() {
  return (
    <div className="rd">
      <div className="rail" aria-label="Social links">
        {SOCIAL_LINKS.map(({ key, label, href, Icon }) => (
          <a key={key} href={href} target="_blank" rel="noreferrer" aria-label={label}>
            <Icon />
          </a>
        ))}
      </div>
    </div>
  );
}
