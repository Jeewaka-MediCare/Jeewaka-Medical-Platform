import { useEffect, useMemo, useState } from "react";
import { Download, ArrowUpRight, BookOpen, ChevronRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * ✅ What’s new in this refresh
 * - Cohesive emerald/green theme with soft gradients & subtle glassy cards
 * - Clearer hierarchy (headline > section title > body) with improved spacing
 * - Polished Download CTAs (primary + subtle ghost) w/ focus-visible states
 * - Sticky, scroll-aware Table of Contents (highlights current section)
 * - Accessible semantics (landmarks, aria labels, skip link, reduced motion)
 * - Small perf fixes and a correct public file path (see downloadHref)
 */

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function UserManualPage() {
  // ✅ Make sure the file exists at /public/manuals/jeewaka-user-manual.docx
  const downloadHref = useMemo(() => "/manuals/jeewaka-user-manual.docx", []);

  const sections = [
    {
      id: "introduction",
      title: "Introduction",
      body: (
        <div className="space-y-3">
          <p className="text-slate-600 leading-7">Jeewaka is an all‑in‑one medical platform designed to connect pa...k appointments and manage their healthcare journey in one place.</p>
        </div>
      ),
    },
    {
      id: "key-features",
      title: "Key Features",
      body: (
        <div className="space-y-3">
          <p className="text-slate-600 leading-7">Jeewaka provides a rich set of capabilities for patients, doctors and administrators:</p>
          <p className="text-slate-600 leading-7">Find doctors – search by name, specialization, experience, la...der, or simply describe your symptoms using AI‑powered search.</p>
          <p className="text-slate-600 leading-7">Book appointments – patients can view available sessions, cho...ot and confirm bookings for in‑person or video consultations.</p>
          <p className="text-slate-600 leading-7">Video consultations – secure online video calls with controls ...ist. Users can toggle camera/microphone and switch cameras.</p>
          <p className="text-slate-600 leading-7">Secure & private – end‑to‑end encrypted communications; paymen...g is marked as confirmed only after successful payment.</p>
          <p className="text-slate-600 leading-7">Automatic medical record – upon registration, patients receive a “Medical History” record by default.</p>
          <p className="text-slate-600 leading-7">Dashboards – patient, doctor, and admin dashboards offer views...tics, and actions appropriate to the respective role.</p>
        </div>
      ),
    },
    {
      id: "platform-overview",
      title: "Platform Overview",
      body: (
        <div className="space-y-3">
          <p className="text-slate-600 leading-7">Jeewaka can be accessed via a web browser or mobile application... onboarding carousel with a call‑to‑action to register or sign in.</p>
        </div>
      ),
    },
    {
      id: "user-roles",
      title: "User Roles",
      body: (
        <div className="space-y-3">
          <p className="text-slate-600 leading-7">Three primary roles exist on the platform:</p>
        </div>
      ),
    },
    {
      id: "creating-an-account",
      title: "Creating an Account",
      body: (
        <div className="space-y-3">
          <p className="text-slate-600 leading-7">Open the app or website. The landing page presents “Get Started” and “Sign In” buttons.</p>
          <p className="text-slate-600 leading-7">Choose your role:</p>
          <p className="text-slate-600 leading-7">Patient – select Register as Patient, provide your full name,...l) and allergies. Set a strong password and accept the terms.</p>
          <p className="text-slate-600 leading-7">Doctor – select Register as Doctor. Provide qualifications, s...rification information for admin review, and submit documents.</p>
          <p className="text-slate-600 leading-7">Confirm your email address. Roles and access are handled with Firebase custom claims.</p>
          <p className="text-slate-600 leading-7">Patients automatically receive an initial Medical History record upon successful registration.</p>
        </div>
      ),
    },
    {
      id: "logging-in",
      title: "Logging In",
      body: (
        <div className="space-y-3">
          <p className="text-slate-600 leading-7">Enter your email and password. On success, patients reach the ...verifies credentials prior to granting full access to features.</p>
          <p className="text-slate-600 leading-7">If you forget your password, use “Forgot Password” to receive a reset email and follow the link.</p>
        </div>
      ),
    },
    {
      id: "patient-dashboard",
      title: "Patient Dashboard",
      body: (
        <div className="space-y-3">
          <p className="text-slate-600 leading-7">Search for doctors using advanced filters or AI symptom search...s (in‑person or video) shown in a calendar with fee information.</p>
          <p className="text-slate-600 leading-7">Book appointments after confirming payment via Stripe; receive...ions and (for video) a secure meeting link with join controls.</p>
          <p className="text-slate-600 leading-7">Track upcoming and past appointments, manage your medical reco... and leave ratings and reviews after consultations.</p>
        </div>
      ),
    },
    {
      id: "doctor-dashboard",
      title: "Doctor Dashboard",
      body: (
        <div className="space-y-3">
          <p className="text-slate-600 leading-7">Complete profile and verification details. Create sessions by ... and manage multiple time slots for each session as needed.</p>
          <p className="text-slate-600 leading-7">Update meeting IDs/links for video sessions, monitor booked ap...nformation, and join video consultations from the dashboard.</p>
          <p className="text-slate-600 leading-7">Review your performance statistics and ratings.</p>
        </div>
      ),
    },
    {
      id: "admin-dashboard",
      title: "Admin Dashboard",
      body: (
        <div className="space-y-3">
          <p className="text-slate-600 leading-7">Manage users and roles; verify doctor credentials and maintain platform settings.</p>
          <p className="text-slate-600 leading-7">Create and edit hospital entries; configure fee ranges, specializations, and other system parameters.</p>
          <p className="text-slate-600 leading-7">Monitor sessions, bookings, payments, reports, and analytics to ensure platform health.</p>
        </div>
      ),
    },
    {
      id: "searching-for-doctors",
      title: "Searching for Doctors",
      body: (
        <div className="space-y-3">
          <p className="text-slate-600 leading-7">Use comprehensive filters to find the right doctor for your ne...perience, language, consultation fee range, and gender.</p>
          <p className="text-slate-600 leading-7">Sort results by name, experience, or consultation fee. Results are paginated for easier browsing.</p>
        </div>
      ),
    },
    {
      id: "standard-search",
      title: "Standard Search",
      body: (
        <div className="space-y-3">
          <p className="text-slate-600 leading-7">Filter by name, specialization, sub‑specialization, years of e...nsultation fee, and gender. Apply sorts and review paginated results.</p>
        </div>
      ),
    },
    {
      id: "ai-powered-search",
      title: "AI‑Powered Search",
      body: (
        <div className="space-y-3">
          <p className="text-slate-600 leading-7">Describe your symptoms in plain language. The system maps them...dentified preferences such as language or budget constraints.</p>
        </div>
      ),
    },
    {
      id: "booking-appointments",
      title: "Booking Appointments",
      body: (
        <div className="space-y-3">
          <p className="text-slate-600 leading-7">Choose a session (date & type) from the doctor’s profile. Opti...ented allows additional notes for the doctor before payment.</p>
          <p className="text-slate-600 leading-7">Pay with Stripe. A slot is booked only when payment status is ...ency, and date are stored securely. You’ll see a confirmation.</p>
          <p className="text-slate-600 leading-7">Confirmation is also emailed with appointment details and a vi...o link if applicable. Calendar entries are updated accordingly.</p>
        </div>
      ),
    },
    {
      id: "video-consultations",
      title: "Video Consultations",
      body: (
        <div className="space-y-3">
          <p className="text-slate-600 leading-7">Join and leave the meeting using the on‑screen controls. You c... the participant list to see attendees currently in the room.</p>
          <p className="text-slate-600 leading-7">Use camera/microphone toggles and switch cameras as necessary....e a stable internet connection and grant permissions to proceed.</p>
        </div>
      ),
    },
    {
      id: "managing-medical-records",
      title: "Managing Medical Records",
      body: (
        <div className="space-y-3">
          <p className="text-slate-600 leading-7">View your medical record history with timestamps and version d...tails such as phone, address, blood type, and emergency contact.</p>
          <p className="text-slate-600 leading-7">Records remain private and accessible only to you and authorized care providers.</p>
        </div>
      ),
    },
    {
      id: "ratings-and-reviews",
      title: "Ratings and Reviews",
      body: (
        <div className="space-y-3">
          <p className="text-slate-600 leading-7">After a consultation, rate the doctor from 1 to 5 and add a sh... ratings aggregate into profile averages that guide other patients.</p>
        </div>
      ),
    },
    {
      id: "security-and-privacy",
      title: "Security and Privacy",
      body: (
        <div className="space-y-3">
          <p className="text-slate-600 leading-7">Communications are end‑to‑end encrypted. Payments are processe...otation: the system does not store raw card details.</p>
          <p className="text-slate-600 leading-7">Authentication and access permissions leverage Firebase with role‑based controls.</p>
        </div>
      ),
    },
    {
      id: "troubleshooting-and-faqs",
      title: "Troubleshooting and FAQs",
      body: (
        <div className="space-y-3">
          <p className="text-slate-600 leading-7">Registration – ensure all required fields are completed, email... password strength requirements are met; verify network stability.</p>
          <p className="text-slate-600 leading-7">Verification email – check spam/junk and use “Resend verificat...ted; for persistent issues, contact support through official channels.</p>
          <p className="text-slate-600 leading-7">Payment failed – recheck card details and funds. If payment is ...d. Try again or choose another method once issues are resolved.</p>
          <p className="text-slate-600 leading-7">Video call issues – allow camera/mic access, use toggles, or r...rt or use the provided help resources for further assistance.</p>
        </div>
      ),
    },
    {
      id: "conclusion",
      title: "Conclusion",
      body: (
        <div className="space-y-3">
          <p className="text-slate-600 leading-7">Jeewaka simplifies healthcare by combining AI‑assisted doctor ...d comprehensive records. Use this guide to navigate effectively.</p>
        </div>
      ),
    },
  ];

  /**
   * Scroll‑aware TOC highlighting
   */
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  useEffect(() => {
    const ids = sections.map((s) => s.id);
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) ;

    if (!("IntersectionObserver" in window) || nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Prefer the entry closest to top that's intersecting
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top || 0) - (b.boundingClientRect.top || 0));
        if (visible[0]?.target?.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white selection:bg-emerald-200/60">
      {/* Skip to content */}
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:ring-2 focus:ring-emerald-500"
      >
        Skip to content
      </a>

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b border-emerald-100/60">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-emerald-900">
            Jeewaka – User Manual
          </h1>

          <div className="flex items-center gap-2">
            <a
              href={downloadHref}
              download
              className={classNames(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold",
                "bg-emerald-600 text-white shadow-sm border border-emerald-700/30",
                "hover:bg-emerald-700 active:scale-[.99]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2"
              )}
              aria-label="Download the Jeewaka User Manual (DOCX)"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download DOCX
            </a>

            <a
              href="#conclusion"
              className="hidden sm:inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              Overview
              <ArrowUpRight className="h-4 w-4" />

            </a>
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              Back to HomePage
              <ArrowUpRight className="h-4 w-4" />

            </Link>

          </div>
        </div>
      </header>

      <div id="content" className="mx-auto max-w-6xl px-4 py-8 grid lg:grid-cols-12 gap-8">
        {/* Sidebar TOC */}
        <aside className="lg:col-span-3">
          <nav className="sticky top-20 rounded-2xl border bg-white shadow-sm border-emerald-100/70">
            <div className="border-b border-emerald-100/70 px-4 py-3 flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <p className="text-sm font-semibold text-emerald-800">Contents</p>
            </div>
            <ol className="p-4 space-y-1.5 text-sm">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={classNames(
                      "group flex items-center gap-2 rounded-lg px-2 py-2 transition",
                      activeId === s.id
                        ? "bg-emerald-50 text-emerald-900 ring-1 ring-inset ring-emerald-200"
                        : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-900"
                    )}
                    aria-current={activeId === s.id ? "true" : undefined}
                  >
                    {s.icon ? <s.icon className="h-4 w-4 opacity-80" /> : <ChevronRight className="h-4 w-4 opacity-70" />}
                    <span className="truncate">{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        {/* Main content */}
        <section className="lg:col-span-9 space-y-8">
          {/* Hero card */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm border-emerald-100/70">
            <div className="flex items-start justify-between gap-4">
              <p className="text-slate-700">
                This page summarizes the official user manual and lets you download the full document.
              </p>
              <a
                href={downloadHref}
                download
                className={classNames(
                  "hidden sm:inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium",
                  "border-emerald-200 text-emerald-700 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
                )}
                aria-label="Download the Jeewaka User Manual (DOCX)"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download
              </a>
            </div>
          </div>

          {/* Sections */}
          {sections.map((s) => (
            <article
              key={s.id}
              id={s.id}
              className="scroll-mt-24 rounded-2xl border bg-white p-6 shadow-sm border-emerald-100/70"
            >
              <div className="flex items-center gap-2">
                {s.icon ? (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <s.icon className="h-4 w-4" />
                  </span>
                ) : null}
                <h2 className="text-lg sm:text-xl font-semibold text-emerald-900">{s.title}</h2>
              </div>
              <div className="mt-4 prose prose-slate max-w-none">
                {s.body}
              </div>
            </article>
          ))}

          {/* Bottom download CTA */}
          <div className="rounded-2xl border bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 shadow-sm text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold">Download the full User Manual</h3>
                <p className="text-emerald-100">Get the complete, printable DOCX with all details.</p>
              </div>
              <a
                href={downloadHref}
                download
                className={classNames(
                  "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold",
                  "bg-white text-emerald-800 border-white/10 shadow-sm hover:bg-emerald-50 active:scale-[.99]",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700"
                )}
                aria-label="Download the Jeewaka User Manual (DOCX)"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download DOCX
              </a>
            </div>
          </div>

          {/* Footer */}
          <footer className="py-8 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Jeewaka. All rights reserved.
          </footer>

          {/* Back to top */}
          <div className="fixed bottom-5 right-5">
            <a
              href="#content"
              className="inline-flex items-center justify-center rounded-full border bg-white p-2 shadow-lg border-emerald-200 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label="Back to top"
            >
              <ArrowUpRight className="h-5 w-5 text-emerald-700" />
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
