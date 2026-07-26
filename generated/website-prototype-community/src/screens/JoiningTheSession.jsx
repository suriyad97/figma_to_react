import { Link, useNavigate } from 'react-router-dom'

export default function JoiningTheSession() {
  const navigate = useNavigate()
  return (
    <div className="joining-page">
      <div className="joining-options">
        <Link to="/zoom-page" className="joining-option-light">Pray with us on Zoom</Link>
        <Link to="/facebook-page" className="joining-option-amber">Watch a recorded session</Link>
      </div>
      <button className="close-btn-circle" onClick={() => navigate(-1)} aria-label="Close">X</button>
    </div>
  )
}
