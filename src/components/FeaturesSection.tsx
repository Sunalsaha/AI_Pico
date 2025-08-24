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

      
    </section>
  );
};