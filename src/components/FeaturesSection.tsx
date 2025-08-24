import { Brain, MessageCircle, Zap, Shield, Eye, Cpu } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Brain,
    title: "Advanced Learning",
    description: "Continuously learns from interactions to provide personalized responses and recommendations.",
    color: "neon-purple"
  },
  {
    icon: MessageCircle,
    title: "Natural Conversation",
    description: "Engage in fluid, contextual conversations that feel natural and human-like.",
    color: "neon-blue"
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Instant responses powered by cutting-edge AI technology and optimized algorithms.",
    color: "neon-cyan"
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your data is encrypted and secure with enterprise-grade privacy protection.",
    color: "neon-pink"
  },
  {
    icon: Eye,
    title: "Visual Understanding",
    description: "Analyze and understand images, documents, and visual content with precision.",
    color: "neon-purple"
  },
  {
    icon: Cpu,
    title: "Multi-Modal AI",
    description: "Process text, voice, images, and data seamlessly across multiple formats.",
    color: "neon-blue"
  }
];

export const FeaturesSection = () => {
  return (
    <section className="py-20 px-6 relative">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-32 h-32 border border-neon-blue/30 rounded-full animate-spin" style={{ animationDuration: '20s' }}></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 border border-neon-purple/30 rounded-full animate-spin" style={{ animationDuration: '25s', animationDirection: 'reverse' }}></div>
      </div>

      <div className="container mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-4xl md:text-6xl font-orbitron font-bold mb-6 text-glow">
            <span className="bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-purple bg-clip-text text-transparent">
              AI Capabilities
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover the advanced features that make our AI companion the most sophisticated digital assistant available.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="holographic-border hover-lift animate-fade-in-up bg-transparent border-0 group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-8 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-${feature.color}/20 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-8 h-8 text-${feature.color}`} />
                  </div>
                  
                  <h3 className="text-xl font-orbitron font-semibold mb-4 text-foreground">
                    {feature.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Interactive Demo Section */}
        <div className="mt-20 text-center animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <div className="holographic-border inline-block p-8 glass">
            <h3 className="text-2xl font-orbitron font-semibold mb-4 text-glow">
              Ready to Experience the Future?
            </h3>
            <p className="text-lg text-muted-foreground mb-6">
              Join thousands of users already exploring the possibilities
            </p>
            <div className="flex items-center justify-center space-x-6">
              <div className="text-center">
                <div className="text-3xl font-orbitron font-bold text-neon-cyan">50K+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div className="text-center">
                <div className="text-3xl font-orbitron font-bold text-neon-purple">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div className="text-center">
                <div className="text-3xl font-orbitron font-bold text-neon-blue">24/7</div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};