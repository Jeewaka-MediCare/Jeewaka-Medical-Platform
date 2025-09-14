import { TrendingUp, Users, Clock, Award } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "10,000+",
    label: "Active Patients",
    description: "Trust Jeewaka for their healthcare needs"
  },
  {
    icon: Award,
    value: "500+",
    label: "Verified Doctors",
    description: "Licensed professionals across all specialties"
  },
  {
    icon: Clock,
    value: "24/7",
    label: "Support Available",
    description: "Round-the-clock customer assistance"
  },
  {
    icon: TrendingUp,
    value: "95%",
    label: "Satisfaction Rate",
    description: "Patients recommend us to family & friends"
  }
];

export default function Statistics() {
  return (
    <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">
            Trusted by Thousands Across Sri Lanka
          </h2>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Join the growing community of patients and doctors who have made healthcare more accessible through Jeewaka.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="text-center group">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 border border-white/20">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="h-8 w-8" />
                  </div>
                  <div className="text-4xl lg:text-5xl font-bold mb-2">{stat.value}</div>
                  <div className="text-xl font-semibold mb-2">{stat.label}</div>
                  <p className="text-primary-foreground/70">{stat.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Testimonial */}
        <div className="mt-16 bg-white/10 backdrop-blur-sm rounded-2xl p-8 lg:p-12 border border-white/20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-4xl mb-6">💬</div>
            <blockquote className="text-xl lg:text-2xl font-medium mb-6 leading-relaxed">
              "Jeewaka has revolutionized how I access healthcare. From finding the right specialist for my condition to booking video consultations with just a few clicks, everything is seamless and professional."
            </blockquote>
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold">S</span>
              </div>
              <div>
                <div className="font-semibold">Sarah Perera</div>
                <div className="text-primary-foreground/70">Patient from Colombo</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}