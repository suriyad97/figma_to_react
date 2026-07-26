import { useNavigate } from 'react-router-dom'

export default function ZoomPage() {
  const navigate = useNavigate()

  return (
    <div className="zoom-page">
      <button className="zoom-page__close" onClick={() => navigate(-1)} aria-label="Close">
        X
      </button>
      <span className="zoom-page__logo">zoom</span>
    </div>
  )
}
