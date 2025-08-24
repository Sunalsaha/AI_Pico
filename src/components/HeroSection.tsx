import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export const HeroSection = () => {
  const [isListening, setIsListening] = useState(false);
  const [isConversing, setIsConversing] = useState(false);
  const [titleHasBeenHidden, setTitleHasBeenHidden] = useState(false);
  const [audioLevels, setAudioLevels] = useState([0.3, 0.7, 0.5, 0.9, 0.4, 0.8, 0.2]);
  
  // NEW: Typing animation states
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Spline loading states
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [splineError, setSplineError] = useState(false);

  const fullText = "Hello! I'm Pico. How can I assist you today?";

  useEffect(() => {
    const interval = setInterval(() => {
      setIsListening(prev => !prev);
      
      if (isListening) {
        setTimeout(() => {
          setIsConversing(true);
          setTitleHasBeenHidden(true);
          // Start typing animation
          setIsTyping(true);
          setTypedText('');
          
          setTimeout(() => {
            setIsConversing(false);
            setIsTyping(false);
          }, 3000);
        }, 1000);
      }
    }, 4000);
    
    return () => clearInterval(interval);
  }, [isListening]);

  // NEW: Typing animation effect
  useEffect(() => {
    if (isTyping && isConversing) {
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setTypedText(fullText.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          setIsTyping(false);
        }
      }, 50); // Typing speed: 50ms per character

      return () => clearInterval(typingInterval);
    }
  }, [isTyping, isConversing, fullText]);

  useEffect(() => {
    let animationFrame: number;
    
    if (isListening || isConversing) {
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
  }, [isListening, isConversing]);

  const onSplineLoad = () => {
    setSplineLoaded(true);
    setSplineError(false);
  };

  const onSplineError = () => {
    setSplineError(true);
  };

  return (
    <>
      {/* CSS for Speech Bubble */}
      <style jsx>{`
        .speech-bubble::after {
          content: '';
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 15px solid transparent;
          border-right: 15px solid transparent;
          border-top: 12px solid rgba(128, 0, 255, 0.3);
          filter: drop-shadow(0 2px 4px rgba(128, 0, 255, 0.2));
        }
        
        .speech-bubble-cyan::after {
          border-top-color: rgba(0, 255, 255, 0.25);
          filter: drop-shadow(0 2px 4px rgba(0, 255, 255, 0.2));
        }
        
        .speech-bubble {
          position: relative;
          animation: speechBubbleFloat 3s ease-in-out infinite;
        }
        
        @keyframes speechBubbleFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-3px) scale(1.02); }
        }

        /* Custom font for title */
        .cyber-font {
          font-family: 'Courier New', 'Monaco', 'Menlo', 'Consolas', monospace;
          font-weight: 900;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          font-style: normal;
        }
      `}</style>

      <section 
        className={`fixed inset-0 w-screen h-screen flex items-center justify-center overflow-hidden animated-bg transition-all duration-1000 select-none cursor-none ${
          isListening || isConversing 
            ? 'brightness-110 contrast-110' 
            : 'brightness-100'
        }`} 
        style={{ 
          transformOrigin: 'center center',
          maxWidth: '100vw',
          maxHeight: '100vh',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          WebkitTouchCallout: 'none',
          cursor: 'none'
        }}
      >
        {/* Enhanced Ambient Background Elements - ANIMATED */}
        <div className={`absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none transition-opacity duration-1000 ${
          isListening || isConversing ? 'opacity-30 sm:opacity-40' : 'opacity-15 sm:opacity-20'
        }`}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          cursor: 'none'
        }}>
          {/* Background grid */}
          <div className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none"
               style={{
                 backgroundImage: `
                   linear-gradient(90deg, transparent 98%, rgba(0, 255, 255, 0.1) 100%),
                   linear-gradient(0deg, transparent 98%, rgba(0, 255, 255, 0.1) 100%)
                 `,
                 backgroundSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '50px 50px' : typeof window !== 'undefined' && window.innerWidth < 1024 ? '60px 60px' : '70px 70px',
                 animation: `gridMove ${isListening || isConversing ? '8s' : '15s'} linear infinite`,
                 userSelect: 'none',
                 cursor: 'none'
               }}>
          </div>
          
          {/* Data streams */}
          <div className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none">
            {[...Array(typeof window !== 'undefined' && window.innerWidth < 640 ? 6 : typeof window !== 'undefined' && window.innerWidth < 1024 ? 8 : 10)].map((_, i) => (
              <div
                key={`stream-${i}`}
                className={`absolute w-px overflow-hidden select-none pointer-events-none bg-gradient-to-b from-transparent via-neon-cyan/40 to-transparent transition-all duration-500 ${
                  isListening || isConversing ? 'via-neon-cyan/70 sm:via-neon-cyan/80' : 'via-neon-cyan/30 sm:via-neon-cyan/40'
                }`}
                style={{
                  left: `${i * (100 / (typeof window !== 'undefined' && window.innerWidth < 640 ? 6 : typeof window !== 'undefined' && window.innerWidth < 1024 ? 8 : 10))}%`,
                  height: '100vh',
                  maxHeight: '100vh',
                  animation: `dataStream ${isListening || isConversing ? (2 + i * 0.2) : (3 + i * 0.4)}s linear infinite`,
                  animationDelay: `${i * 0.3}s`,
                  userSelect: 'none',
                  cursor: 'none'
                }}
              />
            ))}
          </div>
          
          {/* Geometric shapes */}
          <div className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none">
            {[...Array(typeof window !== 'undefined' && window.innerWidth < 640 ? 3 : typeof window !== 'undefined' && window.innerWidth < 1024 ? 4 : 6)].map((_, i) => (
              <div
                key={`geo-${i}`}
                className={`absolute border overflow-hidden select-none pointer-events-none transition-all duration-700 ${
                  isListening || isConversing 
                    ? 'border-neon-purple/40 animate-pulse' 
                    : 'border-neon-purple/20'
                }`}
                style={{
                  left: `${15 + (i * 12)}%`,
                  top: `${15 + (i % 3) * 20}%`,
                  width: `${15 + (i % 3) * 8}px`,
                  height: `${15 + (i % 3) * 8}px`,
                  maxWidth: '35px',
                  maxHeight: '35px',
                  animationDelay: `${i * 0.4}s`,
                  animationDuration: `${5 + (i % 3) * 2}s`,
                  transform: `rotate(${i * 25}deg)`,
                  animation: `geometricFloat ${isListening || isConversing ? (5 + i) : (7 + i)}s ease-in-out infinite`,
                  userSelect: 'none',
                  cursor: 'none'
                }}
              />
            ))}
          </div>
        </div>

        <div className={`w-full h-full max-w-full max-h-full px-3 sm:px-4 md:px-6 lg:px-8 text-center relative z-10 transition-all duration-1000 flex flex-col justify-center items-center overflow-hidden`} 
             style={{ 
               transformOrigin: 'center center'
             }}>
          
          {/* Title - PERMANENTLY HIDDEN after first conversation */}
          {!titleHasBeenHidden && (
            <div className={`animate-fade-in-up transition-all duration-1000 mb-1 sm:mb-2 md:mb-3 overflow-hidden select-none ${
              isListening ? 'text-glow-enhanced' : ''
            } ${isConversing ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
                 style={{ 
                   userSelect: 'none',
                   WebkitUserSelect: 'none',
                   cursor: 'default'
                 }}>
              <h1 className={`cyber-font text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl leading-tight transition-all duration-700 overflow-hidden select-none ${
                isListening 
                  ? 'text-glow-enhanced' 
                  : 'text-glow'
              }`} style={{ 
                transformOrigin: 'center center',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                cursor: 'default'
              }}>
                HI I AM PICO
              </h1>
            </div>
          )}

          {/* Speech Bubble Conversation Area */}
          {titleHasBeenHidden && (
            <div className={`animate-fade-in-up transition-all duration-1000 mb-4 sm:mb-5 md:mb-6 overflow-visible ${
              isConversing ? 'opacity-100 translate-y-0' : 'opacity-100 translate-y-0'
            }`}>
              <div className={`speech-bubble ${!isConversing ? 'speech-bubble-cyan' : ''} bg-gradient-to-r backdrop-blur-sm rounded-2xl p-4 sm:p-5 md:p-6 border max-w-lg mx-auto transition-all duration-700 overflow-hidden ${
                isConversing 
                  ? 'from-neon-purple/20 to-neon-blue/20 border-neon-purple/40 shadow-lg' 
                  : 'from-neon-cyan/15 to-neon-blue/15 border-neon-cyan/35 shadow-md'
              }`}
              style={{ 
                cursor: 'default',
                boxShadow: isConversing 
                  ? '0 8px 32px rgba(128, 0, 255, 0.3), 0 0 20px rgba(128, 0, 255, 0.2)' 
                  : '0 8px 32px rgba(0, 255, 255, 0.25), 0 0 20px rgba(0, 255, 255, 0.15)'
              }}>
                {isConversing ? (
                  <div className="select-none">
                    {/* TYPING ANIMATION TEXT - ONLY THIS IS SELECTABLE */}
                    <p className="text-sm sm:text-base font-orbitron text-neon-purple/95 leading-relaxed overflow-hidden select-text font-medium"
                       style={{ 
                         cursor: 'text',
                         userSelect: 'text',
                         WebkitUserSelect: 'text',
                         MozUserSelect: 'text',
                         textShadow: '0 0 10px rgba(128, 0, 255, 0.3)'
                       }}>
                      "{typedText}
                      {isTyping && (
                        <span className="animate-pulse text-neon-purple ml-1">|</span>
                      )}"
                    </p>
                  </div>
                ) : (
                  <div className="select-none">
                    {/* PICO'S READY MESSAGE - STYLED AS SPEECH BUBBLE */}
                    <p className="text-sm sm:text-base font-orbitron text-neon-cyan/95 leading-relaxed overflow-hidden select-text font-medium"
                       style={{ 
                         cursor: 'text',
                         userSelect: 'text',
                         WebkitUserSelect: 'text',
                         MozUserSelect: 'text',
                         textShadow: '0 0 10px rgba(0, 255, 255, 0.3)'
                       }}>
                      "Ready for your next question..."
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Robot Avatar Container - BIGGER SIZE */}
          <div className={`relative mb-1 sm:mb-2 md:mb-3 overflow-visible select-none ${
            isConversing ? 'scale-105' : titleHasBeenHidden ? 'scale-102' : 'scale-100'
          }`} style={{ 
            width: '850px',
            height: '800px',
            maxWidth: '95vw',
            maxHeight: '70vh',
            transform: 'translateY(20px)',
            transformOrigin: 'center center',
            transition: 'transform 0.3s ease'
          }}>
            
            {/* Animated Background Layer Behind Spline Scene */}
            {(isListening || isConversing) && (
              <div 
                className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
                style={{
                  background: `radial-gradient(circle at center, rgba(${isConversing ? '128, 0, 255' : '0, 255, 255'}, 0.15), transparent 70%)`,
                  animation: 'floating 4s ease-in-out infinite',
                  borderRadius: '50%',
                  transform: 'scale(1.2)',
                  filter: `blur(20px)`
                }}
              />
            )}

            {/* Data Stream Effects */}
            {(isListening || isConversing) && (
              <div className="absolute inset-0 z-1 pointer-events-none overflow-hidden select-none">
                {[...Array(typeof window !== 'undefined' && window.innerWidth < 640 ? 6 : 8)].map((_, i) => (
                  <div
                    key={`stream-${i}`}
                    className={`absolute text-xs sm:text-sm font-mono animate-float overflow-hidden select-none pointer-events-none ${
                      isConversing ? 'text-neon-purple/70' : 'text-neon-blue/60 sm:text-neon-blue/70'
                    }`}
                    style={{
                      left: `${10 + (i * 8)}%`,
                      top: `${10 + (i % 4) * 20}%`,
                      animationDelay: `${i * 0.25}s`,
                      animationDuration: `${2.5 + (i % 3) * 0.5}s`,
                      textShadow: '0 0 8px currentColor',
                      userSelect: 'none',
                      cursor: 'none'
                    }}
                  >
                    {isConversing 
                      ? ['TALK', 'CHAT', 'CONV', 'RESP', 'WORD', 'SPEAK'][i] || 'AI'
                      : [][i] || ""
                    }
                  </div>
                ))}
              </div>
            )}
            
            {/* Spline 3D Robot Scene with iframe - BIGGER */}
            <div className="relative z-10 w-full h-full">
              {!splineError ? (
                <>
                  <iframe
                    src="https://my.spline.design/genkubgreetingrobot-PWk9MxwXWbi6djM02Z2cOte5/"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{
                      border: 'none',
                      backgroundColor: 'transparent',
                      borderRadius: '100%',
                      overflow: 'hidden'
                    }}
                    title="Pico 3D Robot"
                    onLoad={onSplineLoad}
                    onError={onSplineError}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                  
                  {/* Loading indicator */}
                  {!splineLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-transparent">
                      <div className="text-neon-cyan font-orbitron text-sm animate-pulse">
                        Loading Pico...
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Fallback when Spline fails to load - BIGGER */
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-96 h-96 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border-2 border-neon-cyan/30 flex items-center justify-center backdrop-blur-sm">
                    <span className="text-neon-cyan font-orbitron text-4xl font-bold animate-pulse">PICO</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Audio Wave Visualization */}
            {(isListening || isConversing) && (
              <div className="absolute -bottom-3 sm:-bottom-4 left-1/2 transform -translate-x-1/2 overflow-hidden select-none pointer-events-none z-20" 
                   style={{ 
                     perspective: '200px',
                     maxWidth: '200px'
                   }}>
                <div className="flex items-end justify-center space-x-1 sm:space-x-2 overflow-hidden select-none">
                  {audioLevels.slice(0, 7).map((level, index) => (
                    <div
                      key={index}
                      className={`rounded-full transition-all duration-100 overflow-hidden select-none pointer-events-none ${
                        isConversing 
                          ? 'bg-gradient-to-t from-neon-purple via-neon-blue to-neon-cyan' 
                          : 'bg-gradient-to-t from-neon-cyan via-neon-blue to-neon-purple'
                      }`}
                      style={{
                        width: '3px',
                        height: `${level * 30 + 10}px`,
                        maxHeight: '45px',
                        boxShadow: `0 0 10px hsl(var(${isConversing ? '--neon-purple' : '--neon-cyan'})/0.8)`,
                        userSelect: 'none',
                        cursor: 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Status Indicator - MOVED DOWN */}
          <div className={`flex items-center justify-center space-x-2 animate-fade-in-up transition-all duration-500 overflow-hidden select-none ${
            isListening || isConversing ? 'scale-102 sm:scale-105' : 'scale-100'
          }`} style={{ 
            animationDelay: '0.9s',
            cursor: 'default',
            transform: 'translateY(20px)',
            marginTop: '10px'
          }}>
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-500 overflow-hidden select-none ${
              isConversing ? 'bg-neon-purple pulse-glow-enhanced' :
              isListening ? 'bg-neon-cyan pulse-glow-enhanced' : 'bg-neon-cyan pulse-glow'
            }`}></div>
            <span className={`text-xs sm:text-sm font-orbitron transition-all duration-500 overflow-hidden select-none ${
              isConversing ? 'text-neon-purple font-bold' :
              isListening ? 'text-neon-cyan font-bold' : 'text-neon-cyan'
            }`}
            style={{ cursor: 'default' }}>
              {isConversing ? 'Pico Speaking...' : isListening ? 'Pico Listening...' : 'Pico System Online'}
            </span>
          </div>
        </div>
      </section>
    </>
  );
};
