import { Stethoscope, Users, TrendingUp, Shield, Calendar, Star, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const doctorBenefits = [
  {
    icon: Users,
    title: "Expand Your Patient Base",
    description: "Connect with patients across Sri Lanka and grow your practice digitally."
  },
  {
    icon: Calendar,
    title: "Flexible Scheduling",
    description: "Manage your appointments efficiently with our smart scheduling system."
  },
  {
    icon: TrendingUp,
    title: "Increase Revenue",
    description: "Add video consultations to your services and maximize your earning potential."
  },
  {
    icon: Brain,
    title: "AI-Powered Pre-Consultation",
    description: "Leverage intelligent pre-consultation services from our AI agent to save time and improve outcomes."
  }
];

export default function DoctorSignup() {
  const navigate = useNavigate();
  return (
    <section className="py-20 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div>
              <Badge variant="secondary" className="bg-accent/10 text-accent mb-4">
                For Healthcare Professionals
              </Badge>
              <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
                Join Sri Lanka's Leading
                <span className="text-accent block">Healthcare Platform</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Expand your practice, reach more patients, and provide quality care through 
                our secure telehealth platform. Join over 500 verified doctors already on Jeewaka.
              </p>
            </div>

            <div className="grid gap-6">
              {doctorBenefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{benefit.title}</h3>
                      <p className="text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-white px-8"
                onClick={() => navigate('/sign-up')}
              >
                Join as Doctor
              </Button>
              
            </div>
          </div>

          {/* Right Content - Stats Cards */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Stethoscope className="h-5 w-5 text-primary" />
                  </div>
                  <span>Doctor Success Stories</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Average monthly consultations</span>
                  <span className="font-bold text-2xl text-primary">150+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Patient satisfaction rate</span>
                  <span className="font-bold text-2xl text-primary">98%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Average revenue increase</span>
                  <span className="font-bold text-2xl text-primary">40%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-accent">DR</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Dr. Rajesh Fernando</h4>
                    <p className="text-sm text-muted-foreground">Cardiologist, Colombo</p>
                  </div>
                  <div className="flex items-center ml-auto">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="ml-1 text-sm font-medium">4.9</span>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  "Jeewaka has transformed my practice. I can now reach patients who couldn't 
                  visit my clinic in person, and the video consultation feature is excellent."
                </p>
              </CardContent>
            </Card>

            <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-2xl p-6 border border-accent/20">
              <h3 className="font-semibold mb-3">Quick Setup Process</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <span className="text-sm">Submit your medical credentials</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <span className="text-sm">Get verified within 24 hours</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <span className="text-sm">Start accepting patients immediately</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}