import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import Hero from "../landing/Hero";
import LandingHeader from "../landing/LandingHeader";
import Features from "../landing/Features";
import HowItWorks from "../landing/HowItWorks";
import Statistics from "../landing/Statistics";
import DoctorSignup from "../landing/DoctorSignup";
import Footer from "../landing/Footer";

export default function LandingPage() {
  useEffect(() => {
    document.title = 'Jeewaka - Find a doctor';
  }, []);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <Hero />
      <Features />
      <HowItWorks />
      <Statistics />
      <DoctorSignup />
      <Footer />
    </div>
  );
}