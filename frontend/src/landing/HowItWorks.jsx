import { Search, Calendar, Video, FileCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    step: "01",
    icon: Search,
    title: "Search & Discover",
    description: "Find doctors by symptoms, specialty, location, or browse by ratings and reviews.",
    color: "bg-primary text-primary-foreground"
  },
  {
    step: "02",
    icon: Calendar,
    title: "Book Your Appointment",
    description: "Choose between in-person visits or video consultations. Select your preferred time slot.",
    color: "bg-accent text-white"
  },
  {
    step: "03",
    icon: Video,
    title: "Consult with Doctor",
    description: "Meet your doctor virtually or in-person. Discuss your health concerns and get expert advice.",
    color: "bg-emerald-500 text-white"
  },
  {
    step: "04",
    icon: FileCheck,
    title: "Get Digital Prescription",
    description: "Receive your prescription digitally, access your medical records, and schedule follow-ups.",
    color: "bg-blue-500 text-white"
  }
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 to-teal-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
            How Jeewaka Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Getting quality healthcare is now as simple as ordering food. 
            Follow these four easy steps to connect with the right doctor.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary/30 to-accent/30 transform translate-x-4 z-0"></div>
                )}
                
                <Card className="relative z-10 border-2 border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg group bg-white dark:bg-slate-800">
                  <CardContent className="p-8 text-center">
                    {/* Step Number */}
                    <div className="text-6xl font-bold text-muted-foreground/20 absolute top-4 right-4">
                      {step.step}
                    </div>
                    
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${step.color} group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-8 w-8" />
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-xl font-semibold mb-4 text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-4xl mx-auto shadow-lg border border-border">
            <h3 className="text-2xl font-semibold mb-4">Why Choose Jeewaka?</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl mb-2">⚡</div>
                <h4 className="font-semibold mb-2">Instant Access</h4>
                <p className="text-sm text-muted-foreground">No more waiting weeks for appointments. Book consultations instantly.</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🏥</div>
                <h4 className="font-semibold mb-2">Quality Assurance</h4>
                <p className="text-sm text-muted-foreground">All doctors are verified and licensed healthcare professionals.</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">💳</div>
                <h4 className="font-semibold mb-2">Transparent Pricing</h4>
                <p className="text-sm text-muted-foreground">Know exactly what you'll pay upfront. No hidden fees or surprises.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}