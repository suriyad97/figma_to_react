export default function Footer() {
  return (
    <footer>
      <div className="footer-green">
        <div className="footer-col">
          <p>Global Intercessors</p>
          <p>Address: 58 Alpes Vainona</p>
          <p>Harare, Zimbabwe</p>
        </div>
        <div className="footer-col">
          <p>Global Intercessors</p>
          <p>Phone:+263 77 22 2087</p>
          <p>Email: info@global-intercessors.com</p>
        </div>
      </div>
      <div className="footer-black">
        <p className="footer-follow">Follow Us On:</p>
        <div className="footer-social">
          <a href="#" aria-label="Facebook">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="14" fill="#ffc061"/>
              <path d="M16 8h-2a3 3 0 0 0-3 3v2H9v3h2v6h3v-6h2l1-3h-3v-2a1 1 0 0 1 1-1h2V8z" fill="#fff"/>
            </svg>
          </a>
          <a href="#" aria-label="Twitter">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="14" fill="#ffc061"/>
              <path d="M22 9.5a7 7 0 0 1-2 .6 3.5 3.5 0 0 0 1.5-2 7 7 0 0 1-2.2.9A3.5 3.5 0 0 0 13 12a10 10 0 0 1-7.2-3.7 3.5 3.5 0 0 0 1.1 4.7A3.4 3.4 0 0 1 5.3 12.5v.1a3.5 3.5 0 0 0 2.8 3.4 3.5 3.5 0 0 1-1.6.1 3.5 3.5 0 0 0 3.3 2.4A7 7 0 0 1 5 20a10 10 0 0 0 5.4 1.6c6.4 0 9.9-5.3 9.9-9.9v-.5A7 7 0 0 0 22 9.5z" fill="#fff"/>
            </svg>
          </a>
          <a href="#" aria-label="Instagram">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="14" fill="#ffc061"/>
              <rect x="8" y="8" width="12" height="12" rx="4" stroke="#fff" strokeWidth="1.5" fill="none"/>
              <circle cx="14" cy="14" r="3" stroke="#fff" strokeWidth="1.5" fill="none"/>
              <circle cx="19" cy="9" r="1" fill="#fff"/>
            </svg>
          </a>
        </div>
        <p className="footer-handle">@Global Intercessors</p>
      </div>
    </footer>
  )
}
