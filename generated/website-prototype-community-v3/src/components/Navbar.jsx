import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/home" className="navbar__logo">
        <img src="/assets/image_a71d460802780a24b2a9a7dec5b3f180672f184c.png" alt="Global Intercessors" />
      </Link>
      <ul className="navbar__links">
        <li><Link to="/home">Home</Link></li>
        <li><Link to="/about-us">About Us</Link></li>
        <li><Link to="/news-updates">News &amp; Update</Link></li>
        <li><Link to="/events">Events</Link></li>
        <li><a href="#">Resources</a></li>
        <li><Link to="/contact-us">Contact</Link></li>
      </ul>
      <Link to="/joining-the-session" className="navbar__cta">Be Part of the Intercessors</Link>
    </nav>
  )
}
