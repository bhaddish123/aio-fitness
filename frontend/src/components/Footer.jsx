export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-bottom">
        <p>Based in PA &middot; Offered online &middot; Offered worldwide</p>
        <p>&copy; {new Date().getFullYear()} AIO Fitness. All rights reserved.</p>
        <p>Developed by <a href="https://www.linkedin.com/in/bereket-haddish-1225132b5/" target="_blank" rel="noopener noreferrer" className="footer-dev-link">Bereket</a></p>
      </div>
    </footer>
  );
}
