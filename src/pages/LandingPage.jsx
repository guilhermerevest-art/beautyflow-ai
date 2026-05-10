import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import HowItWorks from '../components/HowItWorks'
import Features from '../components/Features'
import Differentials from '../components/Differentials'
import Testimonials from '../components/Testimonials'
import Pricing from '../components/Pricing'
import CtaBanner from '../components/CtaBanner'
import Footer from '../components/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <Differentials />
      <Testimonials />
      <Pricing />
      <CtaBanner />
      <Footer />
    </div>
  )
}
