import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import robotAvatar from '@/assets/robot-avatar.png';

export const HeroSection = () => {
  const [isListening, setIsListening] = useState(false);
  const [audioLevels, setAudioLevels] = useState([0.3, 0.7, 0.5, 0.9, 0.4, 0.8, 0.2]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsListening(prev => !prev);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  // Simulate audio levels when listening
  useEffect(() => {
    let animationFrame: number;
    
    if (isListening) {
      const animateAudio = () => {
        setAudioLevels(prev => 
          prev.map(() => Math.random() * 0.8 + 0.2)
        );
        animationFrame = requestAnimationFrame(animateAudio);
      };
      animateAudio();
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isListening]);

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
            {/* Outer Ripple Effects */}
            {isListening && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-neon-cyan/30 animate-ping scale-150"></div>
                <div className="absolute inset-0 rounded-full border-2 border-neon-blue/20 animate-ping scale-125" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute inset-0 rounded-full border-2 border-neon-purple/15 animate-ping scale-175" style={{ animationDelay: '1s' }}></div>
              </>
            )}
            
            {/* Main Glow */}
            <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${
              isListening 
                ? 'shadow-[0_0_60px_hsl(var(--neon-cyan)/0.8),0_0_100px_hsl(var(--neon-blue)/0.6),0_0_140px_hsl(var(--neon-purple)/0.4)] scale-110' 
                : 'neon-glow scale-100'
            }`}></div>
            
            {/* Robot Image */}
            <img 
              src={robotAvatar} 
              alt="AI Robot Companion" 
              className={`relative z-10 w-64 h-64 mx-auto float transition-all duration-1000 ${
                isListening ? 'scale-110 brightness-110' : 'scale-100'
              }`}
            />
            
            {/* Enhanced Listening Indicators */}
            {isListening && (
              <>
                {/* Audio Wave Visualization */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-end space-x-1">
                    {audioLevels.map((level, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-t from-neon-cyan via-neon-blue to-neon-purple rounded-full transition-all duration-100"
                        style={{
                          width: '4px',
                          height: `${level * 40 + 10}px`,
                          boxShadow: `0 0 10px hsl(var(--neon-cyan)/0.8)`
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Floating Particles */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-neon-cyan rounded-full opacity-60 animate-float"
                      style={{
                        left: `${20 + (i * 10)}%`,
                        top: `${30 + (i % 3) * 20}%`,
                        animationDelay: `${i * 0.3}s`,
                        animationDuration: `${3 + (i % 2)}s`,
                        boxShadow: '0 0 6px currentColor'
                      }}
                    />
                  ))}
                </div>

                {/* Status Text */}
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
                  <div className="flex items-center space-x-2 bg-black/20 backdrop-blur-sm rounded-full px-4 py-2 border border-neon-cyan/30">
                    <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse"></div>
                    <span className="text-sm font-orbitron text-neon-cyan font-medium">
                      AI is listening...
                    </span>
                  </div>
                </div>
              </>
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