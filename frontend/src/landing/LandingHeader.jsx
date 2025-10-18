import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LifeBuoy , ArrowRight } from "lucide-react";

export default function LandingHeader() {
  const navigate = useNavigate();

  // Keyboard shortcut: press "?" to open the User Manual
  useEffect(() => {
    const onKeyDown = (e) => {
      const isShiftSlash = e.key === "?" || (e.key === "/" && e.shiftKey);
      if (isShiftSlash) {
        e.preventDefault();
        navigate("/user-manual?src=header_shortcut");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  return (
    <div className="w-full flex items-center justify-between py-4 px-6 md:px-24">
      <button
        onClick={() => navigate("/")}
        className="font-bold text-4xl md:text-6xl text-primary tracking-tight select-none"
        aria-label="Go to Jeewaka Home"
      >
        Jeewaka.
      </button>

      <div className="flex items-center gap-3">
        {/* Help / User Manual */}
        <Button
          variant="outline"
          className="
    group inline-flex items-center rounded-2xl
    px-4 py-6 md:px-5 md:py-6
    text-base md:text-lg font-semibold
    border-emerald-300/60 text-emerald-800 bg-white
    shadow-sm hover:shadow-md hover:-translate-y-0.5
    transition-all duration-200
    focus-visible:outline-none
    focus-visible:ring-2 focus-visible:ring-emerald-500/70
    focus-visible:ring-offset-2
  "
          onClick={() => navigate("/user-manual?src=header_help")}
          aria-label="Open User Manual and Help"
          title="User Manual (press ?)"
        >
          <LifeBuoy
            className="mr-2 h-5 w-5 opacity-80 transition-transform group-hover:rotate-6"
            aria-hidden="true"
          />
          <span>Help / User Manual</span>

          {/* keyboard shortcut hint (desktop) */}
          <span className="ml-3 hidden sm:inline-flex items-center gap-1 text-sm text-emerald-700/80">
            <kbd className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-medium">
              ?
            </kbd>
          </span>

          <ArrowRight
            className="ml-2 h-5 w-5 opacity-0 translate-x-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
            aria-hidden="true"
          />
        </Button>

        {/* Login / Sign Up */}
        <Button
          size="lg"
          className="bg-primary hover:bg-primary/90 px-6 md:px-8 py-6 text-base md:text-lg"
          onClick={() => navigate("/login")}
        >
          Login / Sign Up
        </Button>
      </div>
    </div>
  );
}
