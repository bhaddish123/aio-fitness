export default function Footer() {
  return (
    <div className="rd">
      <footer className="footer">
        <div className="footer-stack">
          <p>Based in PA &middot; Offered online &middot; Offered worldwide</p>
          <p>&copy; {new Date().getFullYear()} AIO Fitness. All rights reserved.</p>
          <p>
            Developed by{' '}
            <a href="https://www.linkedin.com/in/bereket-haddish-1225132b5/" target="_blank" rel="noopener noreferrer">Bereket</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
