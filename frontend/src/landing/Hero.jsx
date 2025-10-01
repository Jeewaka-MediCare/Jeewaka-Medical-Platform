import { Search, Play, Star, Clock, Shield, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export default function Hero() {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Top Bar: Logo left, Login/Sign Up right */}
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23059669%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      
      <div className="relative container mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                🇱🇰 Built for Sri Lanka
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Jeewaka
                <span className="text-primary block">Your Health, Simplified</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                Find trusted doctors, book appointments instantly, and get personalized care through video consultations. Healthcare made accessible.
              </p>
            </div>

            {/* Search Bar */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input 
                    placeholder="Search by symptoms, specialty, or doctor name..."
                    className="pl-10 py-6 text-lg border-2 border-border focus:border-primary"
                  />
                </div>
                <Button size="lg" className="bg-primary hover:bg-primary/90 px-8 py-6 text-lg">
                  Find Doctor
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Try: "headache", "cardiology", or "Dr. Silva"
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Verified Doctors</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">Happy Patients</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Available Support</div>
              </div>
            </div>
          </div>

          {/* Right Content - Feature Cards */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                    <Video className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Video Consultations</h3>
                  <p className="text-sm text-muted-foreground">Connect with doctors from anywhere</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-accent/20 hover:border-accent/40 transition-colors">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto">
                    <Clock className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold">Instant Booking</h3>
                  <p className="text-sm text-muted-foreground">Book appointments in real-time</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center mx-auto">
                    <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-semibold">Secure & Private</h3>
                  <p className="text-sm text-muted-foreground">Your health data is protected</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-yellow-500/20 hover:border-yellow-500/40 transition-colors">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mx-auto">
                    <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h3 className="font-semibold">Verified Doctors</h3>
                  <p className="text-sm text-muted-foreground">Only qualified professionals</p>
                </CardContent>
              </Card>
            </div>

            {/* Demo Video Card */}
            <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-1">See How Jeewaka Works</h3>
                    <p className="text-sm text-muted-foreground">2-minute overview of our platform</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-white">
                    <Play className="h-4 w-4 mr-2" />
                    Watch Demo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}