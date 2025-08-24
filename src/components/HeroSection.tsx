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
      {/* Ambient Background Elements - More Dynamic */}
      <div className="absolute inset-0 opacity-20">
        {/* Animated Grid Lines */}
        <div className="absolute inset-0"
             style={{
               backgroundImage: `
                 linear-gradient(90deg, transparent 98%, rgba(0, 255, 255, 0.1) 100%),
                 linear-gradient(0deg, transparent 98%, rgba(0, 255, 255, 0.1) 100%)
               `,
               backgroundSize: '50px 50px',
               animation: 'gridMove 20s linear infinite'
             }}>
        </div>
        
        {/* Moving Data Streams */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={`stream-${i}`}
              className="absolute w-px bg-gradient-to-b from-transparent via-neon-cyan/40 to-transparent"
              style={{
                left: `${i * 12.5}%`,
                height: '100%',
                animation: `dataStream ${3 + i * 0.5}s linear infinite`,
                animationDelay: `${i * 0.8}s`
              }}
            />
          ))}
        </div>
        
        {/* Floating Geometric Shapes */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={`geo-${i}`}
              className="absolute border border-neon-purple/20 animate-float"
              style={{
                left: `${20 + (i * 15)}%`,
                top: `${10 + (i % 3) * 30}%`,
                width: `${30 + (i % 3) * 20}px`,
                height: `${30 + (i % 3) * 20}px`,
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${8 + (i % 3) * 2}s`,
                transform: `rotate(${i * 15}deg)`,
                animation: `geometricFloat ${8 + i}s ease-in-out infinite`
              }}
            />
          ))}
        </div>
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
          <div className="relative inline-block perspective-1000">
            {/* 3D Emergence Effects */}
            {isListening && (
              <>
                {/* Screen Break Effect */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 bg-gradient-to-t from-neon-cyan to-transparent opacity-70"
                      style={{
                        left: `${10 + (i * 7)}%`,
                        top: '-20px',
                        height: `${60 + Math.sin(i) * 40}px`,
                        transform: `rotate(${-15 + i * 3}deg)`,
                        animation: `emerge ${2 + (i % 3) * 0.5}s ease-in-out infinite alternate`,
                        animationDelay: `${i * 0.1}s`,
                        boxShadow: '0 0 10px currentColor'
                      }}
                    />
                  ))}
                </div>

                {/* Data Stream Effects */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={`stream-${i}`}
                      className="absolute text-xs font-mono text-neon-blue/60 animate-float"
                      style={{
                        left: `${15 + (i * 15)}%`,
                        top: `${20 + (i % 3) * 25}%`,
                        animationDelay: `${i * 0.4}s`,
                        animationDuration: `${4 + (i % 2)}s`
                      }}
                    >
                      {['01101', '11010', '10110', '01011', '11001', '10101'][i]}
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {/* 3D Robot Container */}
            <div className={`relative transform-gpu transition-all duration-1000 ${
              isListening 
                ? 'scale-110 translate-z-20 rotate-x-5 rotate-y-2' 
                : 'scale-100 translate-z-0'
            }`} 
            style={{
              transform: isListening 
                ? 'scale(1.1) translateZ(20px) rotateX(5deg) rotateY(2deg)' 
                : 'scale(1) translateZ(0px)',
              filter: isListening ? 'drop-shadow(0 20px 40px rgba(0, 255, 255, 0.3))' : 'none'
            }}>
              
              {/* Holographic Grid Behind Robot */}
              {isListening && (
                <div className="absolute inset-0 opacity-30 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent animate-pulse"
                       style={{
                         backgroundImage: `
                           linear-gradient(90deg, transparent 0%, rgba(0, 255, 255, 0.1) 50%, transparent 100%),
                           repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(0, 255, 255, 0.1) 10px, rgba(0, 255, 255, 0.1) 12px),
                           repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(0, 255, 255, 0.1) 10px, rgba(0, 255, 255, 0.1) 12px)
                         `
                       }}>
                  </div>
                </div>
              )}

              {/* Robot Image with 3D Effect */}
              <img 
                src={robotAvatar} 
                alt="AI Robot Companion" 
                className={`relative z-10 w-64 h-64 mx-auto transition-all duration-1000 ${
                  isListening ? 'brightness-125 contrast-110' : 'brightness-100'
                }`}
                style={{
                  filter: isListening 
                    ? 'brightness(1.25) contrast(1.1) drop-shadow(0 0 30px rgba(0, 255, 255, 0.8))' 
                    : 'brightness(1)'
                }}
              />
            </div>
            
            {/* Enhanced Listening Indicators */}
            {isListening && (
              <>
                {/* 3D Audio Wave Visualization */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2" 
                     style={{ perspective: '200px' }}>
                  <div className="flex items-end space-x-1">
                    {audioLevels.map((level, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-t from-neon-cyan via-neon-blue to-neon-purple rounded-full transition-all duration-100"
                        style={{
                          width: '4px',
                          height: `${level * 40 + 10}px`,
                          boxShadow: `0 0 15px hsl(var(--neon-cyan)/0.8)`,
                          transform: `rotateX(45deg) translateZ(${level * 10}px)`
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Matrix-style Floating Data */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(15)].map((_, i) => (
                    <div
                      key={`matrix-${i}`}
                      className="absolute text-xs font-mono text-neon-cyan/40 animate-float"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${i * 0.2}s`,
                        animationDuration: `${3 + Math.random() * 2}s`,
                        textShadow: '0 0 5px currentColor'
                      }}
                    >
                      {Math.random() > 0.5 ? '1' : '0'}
                    </div>
                  ))}
                </div>

                {/* Status Text with 3D Effect */}
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
                  <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-md rounded-full px-6 py-3 border border-neon-cyan/40"
                       style={{ 
                         transform: 'translateZ(10px)',
                         boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 255, 255, 0.3)'
                       }}>
                    <div className="w-3 h-3 bg-neon-cyan rounded-full animate-pulse"
                         style={{ boxShadow: '0 0 10px currentColor' }}></div>
                    <span className="text-sm font-orbitron text-neon-cyan font-medium">
                      Neural Network Active
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