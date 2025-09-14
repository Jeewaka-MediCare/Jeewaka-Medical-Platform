import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function LandingHeader() {
  const navigate = useNavigate();
  return (
    <div className="w-full flex items-center justify-between py-4 px-24">
      <span className="font-bold text-6xl text-primary tracking-tight select-none">Jeewaka.</span>
      <Button
        size="lg"
        className="bg-primary hover:bg-primary/90 px-8 py-6 text-lg"
        onClick={() => navigate('/login')}
      >
        Login / Sign Up
      </Button>
    </div>
  );
}
