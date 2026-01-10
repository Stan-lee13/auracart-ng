import { Globe, Shield, Zap, CreditCard, Package, Headphones } from "lucide-react";

const FEATURES = [
  {
    icon: Globe,
    title: "Global Shipping",
    description: "Fast delivery to 150+ countries with real-time tracking"
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description: "Bank-level encryption and fraud protection for every transaction"
  },
  {
    icon: Zap,
    title: "AI-Powered",
    description: "Smart recommendations tailored to your preferences"
  },
  {
    icon: CreditCard,
    title: "Multi-Currency",
    description: "Shop in your local currency with automatic conversion"
  },
  {
    icon: Package,
    title: "Quality Assured",
    description: "Every product verified for authenticity and quality"
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Expert assistance whenever you need it"
  }
];

const Features = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Aura Cart
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience the perfect blend of luxury, technology, and trust
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="glass rounded-2xl p-8 space-y-4 card-lift group"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-sans">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
