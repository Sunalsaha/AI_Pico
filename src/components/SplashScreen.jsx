import { useState, useEffect } from 'react';

export const SplashScreen = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [typedText, setTypedText] = useState('');
  const [showSubText, setShowSubText] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  // NEW: Audio unlock state
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const mainText = "INITIALIZING PICO";
  const subText = "AI System Loading...";

  // Fixed audio function
  const playAudioSequence = async () => {
    try {
      // ✅ FIXED: Main startup sound
      const startupAudio = new Audio('/sounds/ai-startup.mp3');
      startupAudio.volume = 0.7; // Valid range 0.0-1.0
      await startupAudio.play();
      console.log('✅ Startup sound playing');

      // ✅ FIXED: Typing sound
      setTimeout(async () => {
        try {
          const typingAudio = new Audio('/sounds/typing.mp3');
          typingAudio.volume = 0.3; // ✅ FIXED: Was 100 (invalid), now 0.3
          typingAudio.loop = true;
          await typingAudio.play();
          console.log('✅ Typing sound playing');
          
          setTimeout(() => {
            typingAudio.pause();
            typingAudio.currentTime = 0;
          }, mainText.length * 100 + 500);
        } catch (error) {
          console.warn('Typing audio failed:', error);
        }
      }, 500);

      // Success sound
      setTimeout(async () => {
        try {
          const successAudio = new Audio('/sounds/success.mp3');
          successAudio.volume = 0.5;
          await successAudio.play();
          console.log('✅ Success sound playing');
        } catch (error) {
          console.warn('Success audio failed:', error);
        }
      }, 3000);

    } catch (error) {
      console.error('❌ Audio failed:', error);
    }
  };

  // ✅ FIXED: Add user interaction to unlock audio
  useEffect(() => {
    const handleUserInteraction = async () => {
      if (!audioUnlocked) {
        setAudioUnlocked(true);
        await playAudioSequence();
        console.log('🔓 Audio unlocked and playing');
      }
    };

    // Listen for any user interaction
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [audioUnlocked]);

  // Typing animation (unchanged)
  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= mainText.length) {
        setTypedText(mainText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setTimeout(() => setShowSubText(true), 500);
        
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            setIsVisible(false);
            if (onFinish) onFinish();
          }, 1000);
        }, 2500);
      }
    }, 100);

    return () => clearInterval(typingInterval);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Small audio hint (fades after 3 seconds) */}
      {!audioUnlocked && (
        <div 
          className="fixed top-4 right-4 z-[60] bg-cyan-400/20 text-cyan-400 px-3 py-1 rounded text-xs backdrop-blur-sm border border-cyan-400/30"
          style={{ animation: 'fadeOut 3s ease-in-out forwards' }}
        >
          🔊 Click for sound
        </div>
      )}

      {/* Your existing UI - COMPLETELY UNCHANGED */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden transition-opacity duration-1000 select-none ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(135deg, #000000 0%, #0a0a1a 50%, #000000 100%)'
      }}>
        
        {/* All your existing visual elements stay exactly the same */}
        <div className="absolute inset-0 opacity-15 sm:opacity-20">
          <div className="absolute inset-0" 
               style={{
                 backgroundImage: `
                   linear-gradient(90deg, transparent 98%, rgba(0, 255, 255, 0.1) 100%),
                   linear-gradient(0deg, transparent 98%, rgba(0, 255, 255, 0.1) 100%)
                 `,
                 backgroundSize: typeof window !== 'undefined' 
                   ? window.innerWidth < 640 ? '30px 30px' 
                   : window.innerWidth < 1024 ? '40px 40px' 
                   : '50px 50px' 
                   : '50px 50px',
                 animation: 'gridPulse 4s ease-in-out infinite'
               }}>
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(typeof window !== 'undefined' && window.innerWidth < 640 ? 8 : typeof window !== 'undefined' && window.innerWidth < 1024 ? 10 : 12)].map((_, i) => (
            <div
              key={i}
              className="absolute text-xs font-mono text-cyan-400/20 select-none"
              style={{
                left: `${i * (100 / (typeof window !== 'undefined' && window.innerWidth < 640 ? 8 : typeof window !== 'undefined' && window.innerWidth < 1024 ? 10 : 12))}%`,
                animation: `matrixRain ${3 + Math.random() * 2}s linear infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            >
              {Array(typeof window !== 'undefined' && window.innerWidth < 640 ? 15 : 20).fill(0).map((_, j) => (
                <div key={j} className="mb-1">
                  {Math.random() > 0.5 ? '1' : '0'}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {[...Array(typeof window !== 'undefined' && window.innerWidth < 640 ? 3 : 4)].map((_, i) => (
              <div
                key={i}
                className="absolute border border-cyan-400/20 rounded-full"
                style={{
                  width: typeof window !== 'undefined' && window.innerWidth < 640 
                    ? `${120 + i * 60}px` 
                    : typeof window !== 'undefined' && window.innerWidth < 1024 
                    ? `${160 + i * 80}px` 
                    : `${200 + i * 100}px`,
                  height: typeof window !== 'undefined' && window.innerWidth < 640 
                    ? `${120 + i * 60}px` 
                    : typeof window !== 'undefined' && window.innerWidth < 1024 
                    ? `${160 + i * 80}px` 
                    : `${200 + i * 100}px`,
                  left: typeof window !== 'undefined' && window.innerWidth < 640 
                    ? `${-60 - i * 30}px` 
                    : typeof window !== 'undefined' && window.innerWidth < 1024 
                    ? `${-80 - i * 40}px` 
                    : `${-100 - i * 50}px`,
                  top: typeof window !== 'undefined' && window.innerWidth < 640 
                    ? `${-60 - i * 30}px` 
                    : typeof window !== 'undefined' && window.innerWidth < 1024 
                    ? `${-80 - i * 40}px` 
                    : `${-100 - i * 50}px`,
                  animation: `ripple ${3 + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 text-center px-4 sm:px-6 md:px-8 w-full max-w-4xl mx-auto">
          <div className="mb-6 sm:mb-8 relative">
            <div className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 mx-auto mb-3 sm:mb-4 relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 opacity-80 animate-spin-slow"></div>
              <div className="absolute inset-1 sm:inset-2 rounded-full bg-black flex items-center justify-center">
                
              </div>
            </div>
            
            {showSubText && [...Array(typeof window !== 'undefined' && window.innerWidth < 640 ? 4 : 6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-400 rounded-full opacity-70"
                style={{
                  left: `${30 + Math.random() * 40}%`,
                  top: `${20 + Math.random() * 60}%`,
                  animation: `float ${2 + Math.random()}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 2}s`
                }}
              />
            ))}
          </div>

          <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 md:mb-6 relative select-none leading-tight"
              style={{
                background: 'linear-gradient(45deg, #00ffff, #0080ff, #8000ff)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'gradientMove 3s ease-in-out infinite',
                textShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
              }}>
            {typedText}
            {typedText.length < mainText.length && (
              <span className="animate-pulse text-cyan-400">|</span>
            )}
          </h1>

          {showSubText && (
            <div className="animate-fade-in-up">
              <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-cyan-400/80 mb-4 sm:mb-6 md:mb-8 select-none">
                {subText}
              </p>
              
              <div className="w-48 xs:w-56 sm:w-64 md:w-72 lg:w-80 h-0.5 sm:h-1 bg-gray-800 rounded-full mx-auto mb-3 sm:mb-4 md:mb-6 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full animate-loading-bar"></div>
              </div>
              
              <div className="flex justify-center space-x-1.5 sm:space-x-2 md:space-x-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 bg-cyan-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {isExiting && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-full bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent animate-glitch"></div>
          </div>
        )}
      </div>

      {/* All your existing CSS */}
      <style jsx>{`
        @keyframes gridPulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.4; }
        }
        
        @keyframes matrixRain {
          0% { transform: translateY(-100vh); opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.5; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        
        @keyframes ripple {
          0% { 
            transform: scale(0.8); 
            opacity: 1;
          }
          100% { 
            transform: scale(1.2); 
            opacity: 0;
          }
        }
        
        @keyframes gradientMove {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
        }
        
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        
        @keyframes glitch {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-2px); }
          40% { transform: translateX(2px); }
          60% { transform: translateX(-1px); }
          80% { transform: translateX(1px); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeOut {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        .animate-spin-slow { animation: spin-slow 3s linear infinite; }
        .animate-loading-bar { animation: loading-bar 2s ease-in-out infinite; }
        .animate-glitch { animation: glitch 0.5s ease-in-out infinite; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out; }

        @media (max-width: 640px) {
          .animate-loading-bar { animation: loading-bar 1.5s ease-in-out infinite; }
        }
      `}</style>
    </>
  );
};

export default SplashScreen;
