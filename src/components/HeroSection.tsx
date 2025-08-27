import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface PicoMessage {
  type: string;
  text: string;
  time_greeting?: string;
  timestamp?: string;
  mood?: string;
  user_count?: number;
  error?: string;
  image_url?: string; // Add support for image responses
  image_prompt?: string;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: string;
}

interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectAttempts: number;
}

export const HeroSection = () => {
  const [isListening, setIsListening] = useState(false);
  const [isConversing, setIsConversing] = useState(false);
  const [titleHasBeenHidden, setTitleHasBeenHidden] = useState(false);
  const [audioLevels, setAudioLevels] = useState([0.3, 0.7, 0.5, 0.9, 0.4, 0.8, 0.2]);
  
  // WebSocket and dynamic text states
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [fullText, setFullText] = useState("Hello! I'm Pico. How can I assist you today?");
  const [picoData, setPicoData] = useState<PicoMessage | null>(null);
  
  // Image generation states
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showImageCorner, setShowImageCorner] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [imageAnimationState, setImageAnimationState] = useState<'entering' | 'showing' | 'exiting' | 'hidden'>('hidden');
  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null);
  
  // Connection management states
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempts: 0
  });
  
  // Spline loading states
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [splineError, setSplineError] = useState(false);
  
  // WebSocket refs and constants
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);
  const imageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const WS_URL = 'ws://localhost:8765';
  const MAX_RECONNECT_ATTEMPTS = 5;
  const HEARTBEAT_INTERVAL = 30000; // 30 seconds
  const RECONNECT_INTERVALS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff

  // Cleanup function
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (imageTimeoutRef.current) {
      clearTimeout(imageTimeoutRef.current);
      imageTimeoutRef.current = null;
    }
    
    if (ws.current) {
      ws.current.onopen = null;
      ws.current.onmessage = null;
      ws.current.onclose = null;
      ws.current.onerror = null;
      
      if (ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
      ws.current = null;
    }
  }, []);

  // Send message to WebSocket
  const sendMessage = useCallback((message: object) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return false;
      }
    }
    return false;
  }, []);

  // Download image function
  const downloadImage = useCallback(async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  }, []);

  // Handle image load and get dimensions
  const handleImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.target as HTMLImageElement;
    const { naturalWidth, naturalHeight } = img;
    setImageDimensions({ width: naturalWidth, height: naturalHeight });
  }, []);

  // UPDATED: Image animation sequence - disappears after 5 seconds
  const startImageAnimation = useCallback((image: GeneratedImage) => {
    setCurrentImage(image);
    setShowImageCorner(true);
    setImageAnimationState('entering');
    setImageDimensions(null); // Reset dimensions

    // After enter animation completes (2s), show for 5s then hide immediately
    setTimeout(() => {
      setImageAnimationState('showing');
      
      // After showing for 5s, hide immediately
      imageTimeoutRef.current = setTimeout(() => {
        setImageAnimationState('hidden');
        setShowImageCorner(false);
        setCurrentImage(null);
        setImageDimensions(null);
      }, 5000); // Changed from 4000 to 5000 milliseconds (5 seconds)
    }, 2000);
  }, []);

  // Start heartbeat mechanism
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (!sendMessage({ type: 'ping' })) {
        console.log('Heartbeat failed, connection may be lost');
      }
    }, HEARTBEAT_INTERVAL);
  }, [sendMessage]);

  // Connect to WebSocket with reconnection logic
  const connectWebSocket = useCallback(() => {
    if (isUnmountedRef.current) return;
    
    // Don't attempt if we're already connected or connecting
    if (connectionState.isConnected || connectionState.isConnecting) return;

    setConnectionState(prev => ({ 
      ...prev, 
      isConnecting: true, 
      error: null 
    }));

    try {
      cleanup(); // Clean up any existing connection
      
      console.log(`Connecting to Pico backend: ${WS_URL}`);
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        if (isUnmountedRef.current) return;
        
        console.log('Connected to Pico backend');
        setConnectionState({
          isConnected: true,
          isConnecting: false,
          error: null,
          reconnectAttempts: 0
        });
        
        startHeartbeat();
        
        // Request initial greeting
        sendMessage({ action: 'request_greeting' });
      };

      ws.current.onmessage = (event) => {
        if (isUnmountedRef.current) return;
        
        try {
          const data: PicoMessage = JSON.parse(event.data);
          console.log('Received from Pico:', data);

          if (data.type === 'greeting') {
            setPicoData(data);
            setFullText(data.text);
            
            // Trigger conversation animation for new greetings
            if (!isConversing && titleHasBeenHidden) {
              startConversationAnimation();
            }
          } else if (data.type === 'image_generated' && data.image_url) {
            // Handle generated image
            const newImage: GeneratedImage = {
              id: Date.now().toString(),
              url: data.image_url,
              prompt: data.image_prompt || 'Generated image',
              timestamp: new Date().toISOString()
            };
            
            setGeneratedImages(prev => [newImage, ...prev]);
            setIsGeneratingImage(false);
            startImageAnimation(newImage);
            
          } else if (data.type === 'image_generating') {
            setIsGeneratingImage(true);
            
          } else if (data.type === 'pong') {
            // Heartbeat response received
            console.log('Heartbeat response received');
          } else if (data.type === 'error') {
            console.error('Server error:', data.error);
            setConnectionState(prev => ({ 
              ...prev, 
              error: data.error || 'Unknown server error' 
            }));
            setIsGeneratingImage(false);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        if (isUnmountedRef.current) return;
        
        console.log(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}`);
        
        setConnectionState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: event.code === 1000 ? null : `Connection closed (${event.code})`
        }));

        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Attempt reconnection if not intentionally closed
        if (event.code !== 1000 && connectionState.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_INTERVALS[Math.min(connectionState.reconnectAttempts, RECONNECT_INTERVALS.length - 1)];
          
          setConnectionState(prev => ({ 
            ...prev, 
            reconnectAttempts: prev.reconnectAttempts + 1 
          }));

          console.log(`Reconnecting in ${delay}ms... (Attempt ${connectionState.reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        }
      };

      ws.current.onerror = (error) => {
        if (isUnmountedRef.current) return;
        
        console.error('WebSocket error:', error);
        setConnectionState(prev => ({ 
          ...prev, 
          isConnecting: false,
          error: 'Connection failed' 
        }));
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionState(prev => ({ 
        ...prev, 
        isConnecting: false,
        error: 'Failed to create connection' 
      }));
    }
  }, [connectionState.isConnected, connectionState.isConnecting, connectionState.reconnectAttempts, cleanup, startHeartbeat, sendMessage, isConversing, titleHasBeenHidden, startImageAnimation]);

  // Start conversation animation
  const startConversationAnimation = useCallback(() => {
    setIsListening(true);
    
    setTimeout(() => {
      setIsConversing(true);
      if (!titleHasBeenHidden) {
        setTitleHasBeenHidden(true);
      }
      setIsTyping(true);
      setTypedText('');
      
      setTimeout(() => {
        setIsConversing(false);
        setIsListening(false);
        setIsTyping(false);
      }, 3000);
    }, 1000);
  }, [titleHasBeenHidden]);

  // Request new greeting from backend
  const requestNewGreeting = useCallback(() => {
    sendMessage({ action: 'request_greeting' });
  }, [sendMessage]);

  // Demo function to test image animation
  const triggerDemoImage = useCallback(() => {
    const demoImage: GeneratedImage = {
      id: Date.now().toString(),
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop&crop=face',
      prompt: 'Demo AI Generated Portrait',
      timestamp: new Date().toISOString()
    };
    startImageAnimation(demoImage);
  }, [startImageAnimation]);

  // Initialize WebSocket connection
  useEffect(() => {
    isUnmountedRef.current = false;
    connectWebSocket();

    return () => {
      isUnmountedRef.current = true;
      cleanup();
    };
  }, []);

  // Auto-refresh greeting every 30 seconds
  useEffect(() => {
    if (!connectionState.isConnected || isConversing) return;

    const interval = setInterval(() => {
      requestNewGreeting();
    }, 30000);

    return () => clearInterval(interval);
  }, [connectionState.isConnected, isConversing, requestNewGreeting]);

  // Original demo animation (reduced frequency since we have backend updates)
  useEffect(() => {
    if (connectionState.isConnected) return; // Skip demo if connected to backend

    const interval = setInterval(() => {
      if (!isConversing) {
        startConversationAnimation();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [connectionState.isConnected, isConversing, startConversationAnimation]);

  // Demo image generation every 15 seconds for testing
  useEffect(() => {
    const interval = setInterval(() => {
      if (!showImageCorner && Math.random() > 0.7) { // 30% chance every 15 seconds
        triggerDemoImage();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [showImageCorner, triggerDemoImage]);

  // Typing animation effect
  useEffect(() => {
    if (isTyping && isConversing && fullText) {
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setTypedText(fullText.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          setIsTyping(false);
        }
      }, 50);

      return () => clearInterval(typingInterval);
    }
  }, [isTyping, isConversing, fullText]);

  // Audio level animation
  useEffect(() => {
    let animationFrame: number;
    
    if (isListening || isConversing || isGeneratingImage) {
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
  }, [isListening, isConversing, isGeneratingImage]);

  // Spline event handlers
  const onSplineLoad = () => {
    setSplineLoaded(true);
    setSplineError(false);
  };

  const onSplineError = () => {
    setSplineError(true);
  };

  return (
    <>
      {/* Updated CSS with NO BLACK BACKGROUNDS */}
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

        .cyber-font {
          font-family: 'Courier New', 'Monaco', 'Menlo', 'Consolas', monospace;
          font-weight: 900;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          font-style: normal;
        }
        
        /* Connection status indicators */
        .connection-status {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          padding: 8px 16px;
          border-radius: 25px;
          font-size: 11px;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          border: 1px solid;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .status-connected {
          background: rgba(0, 255, 0, 0.15);
          border-color: rgba(0, 255, 0, 0.4);
          color: rgba(0, 255, 0, 0.9);
          text-shadow: 0 0 8px rgba(0, 255, 0, 0.3);
        }
        
        .status-connecting {
          background: rgba(255, 255, 0, 0.15);
          border-color: rgba(255, 255, 0, 0.4);
          color: rgba(255, 255, 0, 0.9);
          text-shadow: 0 0 8px rgba(255, 255, 0, 0.3);
          animation: pulse 2s ease-in-out infinite;
        }
        
        .status-error {
          background: rgba(255, 100, 100, 0.15);
          border-color: rgba(255, 100, 100, 0.4);
          color: rgba(255, 100, 100, 0.9);
          text-shadow: 0 0 8px rgba(255, 100, 100, 0.3);
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        /* Image generation indicator */
        .image-generation-indicator {
          position: fixed;
          top: 50px;
          right: 20px;
          z-index: 1000;
          padding: 8px 16px;
          border-radius: 25px;
          font-size: 10px;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          backdrop-filter: blur(10px);
          transition: all 0.5s ease;
          border: 1px solid rgba(255, 0, 255, 0.4);
          background: rgba(255, 0, 255, 0.15);
          color: rgba(255, 0, 255, 0.9);
          text-shadow: 0 0 8px rgba(255, 0, 255, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          animation: imageGenPulse 1.5s ease-in-out infinite;
        }
        
        @keyframes imageGenPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        
        /* Clean Corner Image Container - NO BLACK BACKGROUNDS */
        .corner-image-container {
          position: fixed;
          top: 120px;
          right: 20px;
          z-index: 999;
          pointer-events: auto;
          display: flex;
          justify-content: center;
          align-items: center;
          perspective: 1200px;
          min-width: 200px;
          min-height: 150px;
          max-width: 300px;
          max-height: 450px;
          width: auto;
          height: auto;
          background: none !important; /* Completely removed background */
        }
        
        @media (max-width: 1024px) {
          .corner-image-container {
            max-width: 280px;
            max-height: 420px;
          }
        }
        
        @media (max-width: 768px) {
          .corner-image-container {
            max-width: 250px;
            max-height: 380px;
            top: 100px;
            right: 15px;
          }
        }
        
        @media (max-width: 640px) {
          .corner-image-container {
            max-width: 220px;
            max-height: 340px;
            top: 80px;
            right: 10px;
          }
        }
        
        @media (max-width: 480px) {
          .corner-image-container {
            max-width: 200px;
            max-height: 300px;
            top: 70px;
            right: 8px;
          }
        }
        
        /* Dramatic 3D emergence animations */
        .image-emerge-entering {
          animation: dramaticEmergence 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        .image-emerge-showing {
          opacity: 1;
          transform: translateX(0) translateY(0) translateZ(0) rotateX(0deg) rotateY(0deg) scale(1);
          filter: blur(0px) brightness(1) saturate(1);
          animation: attractiveFloat 4s ease-in-out infinite;
        }
        
        .image-emerge-exiting {
          animation: dramaticReturn 2s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards;
        }
        
        /* Main dramatic emergence animation */
        @keyframes dramaticEmergence {
          0% {
            opacity: 0;
            transform: translateX(120px) translateY(-120px) translateZ(-400px) 
                       rotateX(30deg) rotateY(30deg) rotateZ(10deg) 
                       scale(0.2);
            filter: blur(15px) brightness(0.3) saturate(0.4);
          }
          25% {
            opacity: 0.3;
            transform: translateX(90px) translateY(-90px) translateZ(-300px) 
                       rotateX(20deg) rotateY(20deg) rotateZ(7deg) 
                       scale(0.4);
            filter: blur(10px) brightness(0.5) saturate(0.6);
          }
          50% {
            opacity: 0.6;
            transform: translateX(45px) translateY(-45px) translateZ(-150px) 
                       rotateX(12deg) rotateY(12deg) rotateZ(4deg) 
                       scale(0.7);
            filter: blur(5px) brightness(0.8) saturate(0.9);
          }
          80% {
            opacity: 0.9;
            transform: translateX(10px) translateY(-10px) translateZ(30px) 
                       rotateX(3deg) rotateY(3deg) rotateZ(1deg) 
                       scale(0.95);
            filter: blur(2px) brightness(0.95) saturate(0.98);
          }
          100% {
            opacity: 1;
            transform: translateX(0) translateY(0) translateZ(0) 
                       rotateX(0deg) rotateY(0deg) rotateZ(0deg) 
                       scale(1);
            filter: blur(0px) brightness(1) saturate(1);
          }
        }
        
        /* Dramatic return animation */
        @keyframes dramaticReturn {
          0% {
            opacity: 1;
            transform: translateX(0) translateY(0) translateZ(0) 
                       rotateX(0deg) rotateY(0deg) rotateZ(0deg) 
                       scale(1);
            filter: blur(0px) brightness(1) saturate(1);
          }
          20% {
            opacity: 0.9;
            transform: translateX(-10px) translateY(10px) translateZ(25px) 
                       rotateX(-3deg) rotateY(-3deg) rotateZ(-1deg) 
                       scale(0.95);
            filter: blur(2px) brightness(0.95) saturate(0.98);
          }
          50% {
            opacity: 0.6;
            transform: translateX(-45px) translateY(45px) translateZ(-120px) 
                       rotateX(-12deg) rotateY(-12deg) rotateZ(-4deg) 
                       scale(0.7);
            filter: blur(5px) brightness(0.8) saturate(0.9);
          }
          75% {
            opacity: 0.3;
            transform: translateX(-90px) translateY(90px) translateZ(-250px) 
                       rotateX(-20deg) rotateY(-20deg) rotateZ(-7deg) 
                       scale(0.4);
            filter: blur(10px) brightness(0.5) saturate(0.6);
          }
          100% {
            opacity: 0;
            transform: translateX(-150px) translateY(150px) translateZ(-450px) 
                       rotateX(-35deg) rotateY(-35deg) rotateZ(-12deg) 
                       scale(0.15);
            filter: blur(18px) brightness(0.2) saturate(0.3);
          }
        }
        
        /* Attractive floating animation during display */
        @keyframes attractiveFloat {
          0%, 100% { 
            transform: translateX(0) translateY(0) translateZ(0) 
                       rotateX(0deg) rotateY(0deg) 
                       scale(1); 
          }
          25% { 
            transform: translateX(2px) translateY(-3px) translateZ(8px) 
                       rotateX(0.8deg) rotateY(-0.8deg) 
                       scale(1.015); 
          }
          50% { 
            transform: translateX(0) translateY(-5px) translateZ(12px) 
                       rotateX(0deg) rotateY(0deg) 
                       scale(1.02); 
          }
          75% { 
            transform: translateX(-2px) translateY(-3px) translateZ(8px) 
                       rotateX(-0.8deg) rotateY(0.8deg) 
                       scale(1.015); 
          }
        }
        
        
       
        
        /* COMPLETELY CLEAN IMAGE WRAPPER - NO BACKGROUNDS */
        .image-wrapper {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          flex: 1;
          min-height: 130px;
          padding: 8px 8px 50px 8px;
          overflow: visible;
          background: none !important; /* Completely removed background */
        }
        
        /* Remove any pseudo-elements from image wrapper */
        .image-wrapper::before,
        .image-wrapper::after {
          display: none !important;
        }
        
        /* Clean image display - no backgrounds */
        .image-card img {
          display: block;
          border-radius: 8px;
          max-width: 110%;
          max-height: 110%;
          width: auto;
          height: auto;
          object-fit: contain;
          transition: transform 0.3s ease;
          animation: imageGlow 2.5s ease-in-out infinite alternate;
          transform: scale(1);
          background: none !important; /* Ensure no background on img */
        }
        
        @keyframes imageGlow {
          0% { filter: brightness(1) contrast(1) saturate(1); }
          100% { filter: brightness(1.03) contrast(1.03) saturate(1.05); }
        }
        
        /* White Download Icon positioned at bottom */
        .download-icon {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 32px;
          height: 32px;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.1) !important;
          border: none !important;
          border-radius: 50%;
          padding: 6px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: none !important;
          z-index: 15;
          transform-style: preserve-3d;
          opacity: 0.8;
          backdrop-filter: blur(8px);
        }
        
        .download-icon:hover {
          background: rgba(255, 255, 255, 0.2) !important;
          transform: translateX(-50%) translateY(-2px) scale(1.1);
          opacity: 1;
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3) !important;
        }
        
        .download-icon:active {
          transform: translateX(-50%) translateY(-1px) scale(1.05);
          opacity: 0.9;
        }
        
        .download-icon svg {
          width: 100%;
          height: 100%;
          transition: all 0.3s ease;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }
        
        .download-icon:hover svg {
          animation: downloadBounce 0.6s ease-in-out infinite;
          filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.3));
        }
        
        @keyframes downloadBounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        
        @media (max-width: 768px) {
          .download-icon {
            width: 28px;
            height: 28px;
            padding: 5px;
          }
        }
        
        @media (max-width: 480px) {
          .download-icon {
            width: 26px;
            height: 26px;
            padding: 4px;
          }
        }
        
        .refresh-button {
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 1000;
          padding: 12px 16px;
          border-radius: 50px;
          background: rgba(0, 255, 255, 0.1);
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: rgba(0, 255, 255, 0.9);
          font-size: 10px;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }
        
        .refresh-button:hover {
          background: rgba(0, 255, 255, 0.2);
          border-color: rgba(0, 255, 255, 0.5);
          transform: scale(1.05);
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
        }
        
        /* Demo button for testing */
        .demo-image-button {
          position: fixed;
          bottom: 90px;
          right: 30px;
          z-index: 1000;
          padding: 8px 12px;
          border-radius: 25px;
          background: rgba(255, 0, 255, 0.1);
          border: 1px solid rgba(255, 0, 255, 0.3);
          color: rgba(255, 0, 255, 0.9);
          font-size: 8px;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }
        
        .demo-image-button:hover {
          background: rgba(255, 0, 255, 0.2);
          border-color: rgba(255, 0, 255, 0.5);
          transform: scale(1.05);
        }
      `}</style>

      {/* Connection Status Indicator */}
      <div className={`connection-status ${
        connectionState.error ? 'status-error' :
        connectionState.isConnecting ? 'status-connecting' :
        connectionState.isConnected ? 'status-connected' : 'status-error'
      }`}>
        {connectionState.error ? '● ERROR' :
         connectionState.isConnecting ? '◐ CONNECTING...' :
         connectionState.isConnected ? '● PICO ONLINE' : '◌ OFFLINE'}
      </div>

      {/* Image Generation Indicator */}
      {isGeneratingImage && (
        <div className="image-generation-indicator">
          ◐ GENERATING IMAGE...
        </div>
      )}

      {/* Clean Corner Image Display - NO BLACK BACKGROUNDS */}
      {showImageCorner && currentImage && (
        <div 
          className={`corner-image-container image-emerge-${imageAnimationState}`}
          style={{
            width: imageDimensions ? `${Math.min(Math.max(imageDimensions.width * 0.6, 200), 300)}px` : '300px',
            height: imageDimensions ? `${Math.min(Math.max(imageDimensions.height * 0.6 + 50, 150), 450)}px` : '450px'
          }}
        >
          <div className={`image-card ${imageDimensions && (imageDimensions.width < 200 || imageDimensions.height < 150) ? 'small-image' : ''}`}>
            <div className="image-wrapper">
              <img
                src={currentImage.url}
                alt={currentImage.prompt}
                onLoad={handleImageLoad}
                onError={(e) => {
                  // Fallback image if the original fails to load
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTRweCIgZmlsbD0iIzAwZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdFTkVSQVRFRCBJTUFHRTwvdGV4dD48L3N2Zz4=';
                }}
              />
              
              {/* White Download Icon at Bottom Center */}
              <div 
                className="download-icon"
                onClick={() => downloadImage(currentImage.url, `pico-generated-${currentImage.id}.png`)}
                title="Download Image"
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" 
                    stroke="white" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo button for testing */}
      <button
        className="demo-image-button"
        onClick={triggerDemoImage}
        disabled={showImageCorner}
      >
        TEST IMG
      </button>

      <section 
        className={`fixed inset-0 w-screen h-screen flex items-center justify-center overflow-hidden animated-bg transition-all duration-1000 select-none cursor-none ${
          isListening || isConversing || isGeneratingImage
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
          isListening || isConversing || isGeneratingImage ? 'opacity-30 sm:opacity-40' : 'opacity-15 sm:opacity-20'
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
                 animation: `gridMove ${isListening || isConversing || isGeneratingImage ? '8s' : '15s'} linear infinite`,
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
                  isListening || isConversing || isGeneratingImage ? 'via-neon-cyan/70 sm:via-neon-cyan/80' : 'via-neon-cyan/30 sm:via-neon-cyan/40'
                }`}
                style={{
                  left: `${i * (100 / (typeof window !== 'undefined' && window.innerWidth < 640 ? 6 : typeof window !== 'undefined' && window.innerWidth < 1024 ? 8 : 10))}%`,
                  height: '100vh',
                  maxHeight: '100vh',
                  animation: `dataStream ${isListening || isConversing || isGeneratingImage ? (2 + i * 0.2) : (3 + i * 0.4)}s linear infinite`,
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
                  isListening || isConversing || isGeneratingImage
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
                  animation: `geometricFloat ${isListening || isConversing || isGeneratingImage ? (5 + i) : (7 + i)}s ease-in-out infinite`,
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
              <div className={`speech-bubble ${!isConversing && !isGeneratingImage ? 'speech-bubble-cyan' : ''} bg-gradient-to-r backdrop-blur-sm rounded-2xl p-4 sm:p-5 md:p-6 border max-w-lg mx-auto transition-all duration-700 overflow-hidden ${
                isGeneratingImage
                  ? 'from-neon-purple/25 to-pink-500/25 border-pink-500/50 shadow-lg animate-pulse'
                  : isConversing 
                    ? 'from-neon-purple/20 to-neon-blue/20 border-neon-purple/40 shadow-lg' 
                    : 'from-neon-cyan/15 to-neon-blue/15 border-neon-cyan/35 shadow-md'
              }`}
              style={{ 
                cursor: 'default',
                boxShadow: isGeneratingImage
                  ? '0 8px 32px rgba(255, 0, 255, 0.4), 0 0 20px rgba(255, 0, 255, 0.3)'
                  : isConversing 
                    ? '0 8px 32px rgba(128, 0, 255, 0.3), 0 0 20px rgba(128, 0, 255, 0.2)' 
                    : '0 8px 32px rgba(0, 255, 255, 0.25), 0 0 20px rgba(0, 255, 255, 0.15)'
              }}>
                {isGeneratingImage ? (
                  <div className="select-none">
                    <p className="text-sm sm:text-base font-orbitron text-pink-400/95 leading-relaxed overflow-hidden select-text font-medium animate-pulse"
                       style={{ 
                         cursor: 'text',
                         userSelect: 'text',
                         WebkitUserSelect: 'text',
                         MozUserSelect: 'text',
                         textShadow: '0 0 10px rgba(255, 0, 255, 0.4)'
                       }}>
                      "Creating your image... Please wait..."
                    </p>
                  </div>
                ) : isConversing ? (
                  <div className="select-none">
                    {/* TYPING ANIMATION TEXT FROM BACKEND */}
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
                    
                    {/* Show backend metadata */}
                    {picoData && (picoData.mood || picoData.user_count) && (
                      <div className="mt-2 text-xs text-neon-purple/60 font-mono">
                        {picoData.mood && `Mood: ${picoData.mood}`}
                        {picoData.mood && picoData.user_count && ' • '}
                        {picoData.user_count && `Users: ${picoData.user_count}`}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="select-none">
                    {/* READY MESSAGE WITH DYNAMIC GREETING */}
                    <p className="text-sm sm:text-base font-orbitron text-neon-cyan/95 leading-relaxed overflow-hidden select-text font-medium"
                       style={{ 
                         cursor: 'text',
                         userSelect: 'text',
                         WebkitUserSelect: 'text',
                         MozUserSelect: 'text',
                         textShadow: '0 0 10px rgba(0, 255, 255, 0.3)'
                       }}>
                      {picoData?.time_greeting 
                        ? `"${picoData.time_greeting} Ready for your next question..."` 
                        : connectionState.isConnected 
                          ? '"Ready for your next question..."'
                          : '"Establishing connection..."'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Robot Avatar Container - BIGGER SIZE */}
          <div className={`relative mb-1 sm:mb-2 md:mb-3 overflow-visible select-none ${
            isConversing ? 'scale-105' : isGeneratingImage ? 'scale-110' : titleHasBeenHidden ? 'scale-102' : 'scale-100'
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
            {(isListening || isConversing || isGeneratingImage) && (
              <div 
                className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
                style={{
                  background: `radial-gradient(circle at center, rgba(${isGeneratingImage ? '255, 0, 255' : isConversing ? '128, 0, 255' : '0, 255, 255'}, 0.15), transparent 70%)`,
                  animation: 'floating 4s ease-in-out infinite',
                  borderRadius: '50%',
                  transform: 'scale(1.2)',
                  filter: `blur(20px)`
                }}
              />
            )}

            {/* Data Stream Effects */}
            {(isListening || isConversing || isGeneratingImage) && (
              <div className="absolute inset-0 z-1 pointer-events-none overflow-hidden select-none">
                {[...Array(typeof window !== 'undefined' && window.innerWidth < 640 ? 6 : 8)].map((_, i) => (
                  <div
                    key={`stream-${i}`}
                    className={`absolute text-xs sm:text-sm font-mono animate-float overflow-hidden select-none pointer-events-none ${
                      isGeneratingImage ? 'text-pink-400/80' : isConversing ? 'text-neon-purple/70' : 'text-neon-blue/60 sm:text-neon-blue/70'
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
                    {isGeneratingImage 
                      ? ['IMG', 'GEN', 'ART', 'PIX', 'DRAW', 'CREATE'][i] || 'AI'
                      : isConversing 
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
            {(isListening || isConversing || isGeneratingImage) && (
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
                        isGeneratingImage
                          ? 'bg-gradient-to-t from-pink-500 via-purple-500 to-neon-purple'
                          : isConversing 
                            ? 'bg-gradient-to-t from-neon-purple via-neon-blue to-neon-cyan' 
                            : 'bg-gradient-to-t from-neon-cyan via-neon-blue to-neon-purple'
                      }`}
                      style={{
                        width: '3px',
                        height: `${level * 30 + 10}px`,
                        maxHeight: '45px',
                        boxShadow: `0 0 10px hsl(var(${isGeneratingImage ? '--pink-500' : isConversing ? '--neon-purple' : '--neon-cyan'})/0.8)`,
                        userSelect: 'none',
                        cursor: 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Status Indicator - Enhanced with Connection Info */}
          <div className={`flex items-center justify-center space-x-2 animate-fade-in-up transition-all duration-500 overflow-hidden select-none ${
            isListening || isConversing || isGeneratingImage ? 'scale-102 sm:scale-105' : 'scale-100'
          }`} style={{ 
            animationDelay: '0.9s',
            cursor: 'default',
            transform: 'translateY(20px)',
            marginTop: '10px'
          }}>
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-500 overflow-hidden select-none ${
              isGeneratingImage ? 'bg-pink-500 pulse-glow-enhanced' :
              isConversing ? 'bg-neon-purple pulse-glow-enhanced' :
              isListening ? 'bg-neon-cyan pulse-glow-enhanced' : 
              connectionState.isConnected ? 'bg-neon-cyan pulse-glow' :
              connectionState.isConnecting ? 'bg-yellow-400 pulse-glow' : 'bg-red-400 pulse-glow'
            }`}></div>
            <span className={`text-xs sm:text-sm font-orbitron transition-all duration-500 overflow-hidden select-none ${
              isGeneratingImage ? 'text-pink-500 font-bold' :
              isConversing ? 'text-neon-purple font-bold' :
              isListening ? 'text-neon-cyan font-bold' : 
              connectionState.isConnected ? 'text-neon-cyan' :
              connectionState.isConnecting ? 'text-yellow-400' : 'text-red-400'
            }`}
            style={{ cursor: 'default' }}>
              {isGeneratingImage ? 'Pico Creating Image...' :
               isConversing ? 'Pico Speaking...' : 
               isListening ? 'Pico Listening...' : 
               connectionState.isConnected ? 'Pico System Online' :
               connectionState.isConnecting ? 'Connecting to Pico...' :
               connectionState.error ? `Connection Error: ${connectionState.error}` : 'Pico Offline'}
            </span>
          </div>
        </div>
      </section>
     
    </>
  );
};
