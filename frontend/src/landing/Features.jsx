import { Stethoscope, Calendar, Video, FileText, Search, Star, Clock, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Search,
    title: "Smart Doctor Search",
    description: "Find doctors by symptoms, specialty, location, or name. Our intelligent search understands your health needs.",
    color: "text-primary bg-primary/10"
  },
  {
    icon: Calendar,
    title: "Instant Appointments",
    description: "Book physical or video consultations with real-time availability. Choose your preferred time slot.",
    color: "text-accent bg-accent/10"
  },
  {
    icon: Video,
    title: "Telehealth Consultations",
    description: "Connect with doctors through secure video calls. Get quality care from the comfort of your home.",
    color: "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900"
  },
  {
    icon: FileText,
    title: "Medical Records",
    description: "Receive electronic prescriptions instantly. Access your medical records anytime, anywhere.",
    color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900"
  },
  {
    icon: Star,
    title: "Doctor Reviews & Ratings",
    description: "Make informed decisions with genuine patient reviews and comprehensive doctor profiles.",
    color: "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900"
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your health data is encrypted and secure. We follow international healthcare privacy standards.",
    color: "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900"
  }
];

export default function Features() {
  return (
    <section className="py-20 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
            Everything You Need for
            <span className="text-primary block">Better Healthcare</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Jeewaka brings together all aspects of healthcare management into one seamless platform, 
            designed specifically for Sri Lankan patients and doctors.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={index} 
                className="border-2 border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg group"
              >
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4 ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Feature Highlight */}
        <div className="mt-16 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-8 lg:p-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl lg:text-3xl font-bold mb-4">
                Symptom-Based Doctor Search
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                Don't know which specialist to see? Simply describe your symptoms, and our smart system 
                will recommend the most suitable doctors and specialties for your condition.
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Instant Results</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Stethoscope className="h-5 w-5 text-accent" />
                  <span className="text-sm font-medium">AI-Powered Matching</span>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">"I have persistent headaches and nausea"</span>
                </div>
                <div className="ml-5 pl-4 border-l-2 border-primary/20">
                  <p className="text-sm text-muted-foreground">→ Neurologists near you</p>
                  <p className="text-sm text-muted-foreground">→ General practitioners available today</p>
                  <p className="text-sm text-muted-foreground">→ Eye specialists (possible migraine)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}