import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/home" className="navbar-logo">
        <svg className="logo-icon" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="22" cy="22" r="20" stroke="#d89025" strokeWidth="2" fill="none"/>
          <ellipse cx="22" cy="22" rx="10" ry="20" stroke="#d89025" strokeWidth="1.5" fill="none"/>
          <line x1="2" y1="22" x2="42" y2="22" stroke="#d89025" strokeWidth="1.5"/>
          <circle cx="22" cy="22" r="4" fill="#d89025"/>
        </svg>
        <div>
          <div className="logo-text">GL<span>☯</span>BAL</div>
          <div className="logo-text" style={{fontSize:'9px', letterSpacing:'2px'}}>INTERCESSORS</div>
        </div>
      </Link>

      <ul className="navbar-links">
        <li><Link to="/home">Home</Link></li>
        <li><Link to="/about-us">About Us</Link></li>
        <li><Link to="/news-updates">News &amp; Update</Link></li>
        <li><Link to="/events">Events</Link></li>
        <li><a href="#">Resources</a></li>
        <li><Link to="/contact-us">Contact</Link></li>
      </ul>

      <Link to="/contact-us" className="navbar-cta">Be Part of the Intercessors</Link>
    </nav>
  )
}
