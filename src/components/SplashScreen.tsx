import React, { useEffect, useState, useRef } from 'react';
import './SplashScreen.css';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  useEffect(() => {
    // Create Web Audio Context - sometimes bypasses restrictions
    const createAudioContext = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
        return ctx;
      } catch (e) {
        console.log('Web Audio not supported');
        return null;
      }
    };

    const audioCtx = createAudioContext();
    
    // Multiple audio strategies running simultaneously
    const strategies = [
      // Strategy 1: Traditional HTML Audio with all tricks
      () => {
        const audio = new Audio('/sounds/ai-startup.mp3');
        audio.preload = 'auto';
        audio.loop = false;
        audio.volume = 0.01; // Start very low
        audioRef.current = audio;

        // Try immediate play
        audio.play().then(() => {
          // Gradually increase volume
          const volumeUp = () => {
            if (audio.volume < 1.0) {
              audio.volume = Math.min(audio.volume + 0.1, 1.0);
              setTimeout(volumeUp, 100);
            }
          };
          volumeUp();
        }).catch(() => {
          // Fallback: muted autoplay
          audio.muted = true;
          audio.play().then(() => {
            setTimeout(() => {
              audio.muted = false;
              audio.volume = 1.0;
            }, 500);
          }).catch(console.log);
        });
      },

      // Strategy 2: Web Audio API
      () => {
        if (!audioCtx) return;
        
        fetch('/sounds/ai-startup.mp3')
          .then(response => response.arrayBuffer())
          .then(data => audioCtx.decodeAudioData(data))
          .then(audioBuffer => {
            const source = audioCtx.createBufferSource();
            const gainNode = audioCtx.createGain();
            
            source.buffer = audioBuffer;
            gainNode.gain.value = 1.0;
            
            source.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            // Resume context if suspended
            if (audioCtx.state === 'suspended') {
              audioCtx.resume().then(() => source.start()).catch(console.log);
            } else {
              source.start();
            }
          })
          .catch(console.log);
      },

      // Strategy 3: Multiple hidden audio elements
      () => {
        const audioElements = [];
        for (let i = 0; i < 3; i++) {
          const audio = document.createElement('audio');
          audio.src = '/sounds/ai-startup.mp3';
          audio.preload = 'auto';
          audio.volume = i === 0 ? 1.0 : 0;
          audio.style.display = 'none';
          document.body.appendChild(audio);
          audioElements.push(audio);
          
          audio.play().catch(() => {
            audio.muted = true;
            audio.play().then(() => {
              if (i === 0) {
                setTimeout(() => {
                  audio.muted = false;
                  audio.volume = 1.0;
                }, 200);
              }
            }).catch(console.log);
          });
        }
      }
    ];

    // Execute all strategies
    strategies.forEach((strategy, index) => {
      setTimeout(() => strategy(), index * 200);
    });

    // Continuous retry every 2 seconds
    const retryInterval = setInterval(() => {
      if (audioRef.current?.paused) {
        audioRef.current.play().catch(console.log);
      }
      
      if (audioCtx?.state === 'suspended') {
        audioCtx.resume().catch(console.log);
      }
    }, 2000);

   // Simulate user interactions to trigger audio
const simulateInteractions = () => {
  // Dispatch various events that might unlock audio
  const events = [];
  events.forEach(eventType => {
    const event = new Event(eventType, { bubbles: true });
    document.dispatchEvent(event);
  });
};

// Run automatically when the page is opened (after DOM is ready)
document.addEventListener('DOMContentLoaded', simulateInteractions);


    // Try simulation multiple times
    setTimeout(simulateInteractions, 100);
    setTimeout(simulateInteractions, 500);
    setTimeout(simulateInteractions, 1000);

    // Progress animation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    return () => {
      clearInterval(interval);
      clearInterval(retryInterval);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (audioCtx) {
        audioCtx.close();
      }
    };
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      setTimeout(() => {
        onFinish();
      }, 500);
    }
  }, [progress, onFinish]);

  return (
    <div className="splash-screen">
      {/* Multiple audio elements for maximum compatibility */}
      <audio 
        ref={audioRef}
        src="/sounds/ai-startup.mp3" 
        preload="auto" 
        autoPlay 
        style={{ display: 'none' }}
      />
      <audio 
        src="/sounds/ai-startup.mp3" 
        preload="auto" 
        autoPlay 
        muted 
        style={{ display: 'none' }}
      />
      <audio 
        src="/sounds/ai-startup.mp3" 
        preload="auto" 
        autoPlay 
        loop 
        volume={0.01}
        style={{ display: 'none' }}
      />
      
      <div className="chat-container">
        <div className="chat-box">
          <div className="chat-message">
            <div className="message-bubble">
              Just a second my friend 😊
            </div>
          </div>
        </div>
      </div>

      <div className="center-content">
        <div className="spline-container">
          <iframe 
            src="https://my.spline.design/genkubgreetingrobot-PWk9MxwXWbi6djM02Z2cOte5/?hideUI=true&hideControls=true"
            width="100%"
            height="100%"
            frameBorder="0"
            title="Genku Greeting Robot"
            style={{ pointerEvents: 'none', cursor: 'none' }}
          />
          <div className="iframe-overlay"></div>
        </div>

        <div className="loading-container">
          <div className="loading-bar">
            <div 
              className="loading-progress" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="loading-text">{progress}%</div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
