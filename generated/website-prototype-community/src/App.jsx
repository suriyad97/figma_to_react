import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './screens/Home'
import AboutUs from './screens/AboutUs'
import NewsUpdates from './screens/NewsUpdates'
import Events from './screens/Events'
import ContactUs from './screens/ContactUs'
import ThankYouNote from './screens/ThankYouNote'
import JoiningTheSession from './screens/JoiningTheSession'
import ZoomPage from './screens/ZoomPage'
import FacebookPage from './screens/FacebookPage'
import PrayerRequestForm from './screens/PrayerRequestForm'
import PrayerRequestThanks from './screens/PrayerRequestThanks'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/news-updates" element={<NewsUpdates />} />
        <Route path="/events" element={<Events />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/thank-you-note" element={<ThankYouNote />} />
        <Route path="/joining-the-session" element={<JoiningTheSession />} />
        <Route path="/zoom-page" element={<ZoomPage />} />
        <Route path="/facebook-page" element={<FacebookPage />} />
        <Route path="/prayer-request-form" element={<PrayerRequestForm />} />
        <Route path="/prayer-request-thanks" element={<PrayerRequestThanks />} />
      </Routes>
    </BrowserRouter>
  )
}
