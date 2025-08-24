import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import robotAvatar from '@/assets/robot-avatar.png';

export const HeroSection = () => {
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsListening(prev => !prev);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden animated-bg">
      {/* Ambient Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 neon-blue rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 neon-purple rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 neon-cyan rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="container mx-auto px-6 text-center relative z-10">
        {/* Hero Content */}
        <div className="animate-fade-in-up">
          <h1 className="text-6xl md:text-8xl font-orbitron font-bold mb-6 text-glow">
            Your Intelligent
            <br />
            <span className="bg-gradient-to-r from-neon-blue via-neon-purple to-neon-cyan bg-clip-text text-transparent">
              AI Companion
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Experience the future of AI interaction with our advanced companion that understands, learns, and evolves with you.
          </p>
        </div>

        {/* Robot Avatar */}
        <div className="relative mb-12 animate-scale-in" style={{ animationDelay: '0.3s' }}>
          <div className="relative inline-block">
            <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${
              isListening ? 'neon-glow-cyan scale-110' : 'neon-glow scale-100'
            }`}></div>
            <img 
              src={robotAvatar} 
              alt="AI Robot Companion" 
              className={`relative z-10 w-64 h-64 mx-auto float transition-all duration-1000 ${
                isListening ? 'scale-110' : 'scale-100'
              }`}
            />
            
            {/* Listening Indicator */}
            {isListening && (
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="flex space-x-1">
                  <div className="w-2 h-6 bg-neon-cyan rounded-full animate-pulse"></div>
                  <div className="w-2 h-8 bg-neon-blue rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-6 bg-neon-purple rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-in-left" style={{ animationDelay: '0.6s' }}>
          <Button variant="default" size="lg" className="holographic-border hover-lift px-8 py-4 text-lg font-orbitron neon-glow">
            Start Conversation
          </Button>
          <Button variant="outline" size="lg" className="glass hover-lift px-8 py-4 text-lg border-neon-blue/50 text-neon-blue hover:bg-neon-blue/10">
            Explore Features
          </Button>
        </div>

        {/* Status Indicator */}
        <div className="mt-12 flex items-center justify-center space-x-3 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
          <div className="w-3 h-3 bg-neon-cyan rounded-full pulse-glow"></div>
          <span className="text-sm font-orbitron text-neon-cyan">AI System Online</span>
        </div>
      </div>
    </section>
  );
};