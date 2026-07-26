import { useNavigate } from 'react-router-dom'

export default function FacebookPage() {
  const navigate = useNavigate()

  return (
    <div className="facebook-page">
      <button className="facebook-page__close" onClick={() => navigate(-1)} aria-label="Close">
        X
      </button>
      <img
        className="facebook-page__image"
        src="/assets/image_75ce9eb35f4d1b73f5f361aab107f894ba4646d5.png"
        alt="Facebook Page"
      />
    </div>
  )
}
