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
}

interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectAttempts: number;
}

// Enhanced Weather Widget Component with Better Visibility
const EnhancedWeatherWidget = () => {
  const [activeTab, setActiveTab] = useState('Precipitation');
  const [weatherData, setWeatherData] = useState(null);
  const [location, setLocation] = useState({ lat: null, lon: null, name: '' });
  const [precipitationData, setPrecipitationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showScrollbar, setShowScrollbar] = useState(false);
  const [showContainer, setShowContainer] = useState(true); // Add new state for container visibility

  // Modified useEffect for scrollbar and container management
  useEffect(() => {
    if (['Hourly', 'Daily', 'Precipitation'].includes(activeTab)) {
      setShowScrollbar(true);
      setShowContainer(true); // Show container when tab becomes active
      const timer = setTimeout(() => {
        setShowScrollbar(false); // Hide scrollbar first
        // After scrollbar animation completes, hide the entire container
        setTimeout(() => {
          setShowContainer(false);
        }, 500); // 500ms matches the CSS transition duration
      }, 15000);
      return () => clearTimeout(timer);
    } else {
      // Reset states when switching to other tabs
      setShowContainer(true);
      setShowScrollbar(false);
    }
  }, [activeTab]);

  // Get weather icon based on weather code
  const getWeatherIcon = (weatherCode, isDay = true) => {
    const iconMap = {
      0: isDay ? '☀️' : '🌙', // Clear sky
      1: isDay ? '🌤️' : '🌙', // Mainly clear
      2: '⛅', // Partly cloudy
      3: '☁️', // Overcast
      45: '🌫️', // Fog
      48: '🌫️', // Depositing rime fog
      51: '🌦️', // Light drizzle
      53: '🌦️', // Moderate drizzle
      55: '🌦️', // Dense drizzle
      61: '🌧️', // Slight rain
      63: '🌧️', // Moderate rain
      65: '🌧️', // Heavy rain
      71: '🌨️', // Slight snow
      73: '❄️', // Moderate snow
      75: '❄️', // Heavy snow
      80: '🌦️', // Slight rain showers
      81: '🌧️', // Moderate rain showers
      82: '⛈️', // Violent rain showers
      95: '⛈️', // Thunderstorm
      96: '⛈️', // Thunderstorm with hail
      99: '⛈️', // Thunderstorm with heavy hail
    };
    return iconMap[weatherCode] || '🌤️';
  };

  // Get location name from coordinates
  const getLocationName = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      const data = await response.json();
      return data.city || data.locality || data.principalSubdivision || 'Unknown Location';
    } catch (error) {
      console.error('Error getting location name:', error);
      return 'Unknown Location';
    }
  };

  // Fetch comprehensive weather data
  const fetchWeatherData = async (lat, lon) => {
    try {
      setLoading(true);
      
      // Get location name
      const locationName = await getLocationName(lat, lon);
      
      // Get current and forecast weather
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&hourly=precipitation,temperature_2m&timezone=auto&forecast_days=7`
      );
      
      const data = await response.json();
      
      if (data && data.current_weather) {
        setWeatherData(data);
        setLocation({ lat, lon, name: locationName });
        
        // Process precipitation data for chart
        const dailyPrecipitation = data.daily.precipitation_sum.slice(0, 7).map((precip, index) => ({
          day: ['Today', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'][index] || 'Day',
          amount: precip || 0
        }));
        
        setPrecipitationData(dailyPrecipitation);
        setError(null);
      }
      
    } catch (err) {
      setError('Failed to fetch weather data');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherData(latitude, longitude);
        },
        (error) => {
          setError('Location access denied');
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      setError('Geolocation not supported');
      setLoading(false);
    }
  }, []);

  // Refresh weather data every 10 minutes
  useEffect(() => {
    if (location.lat && location.lon) {
      const interval = setInterval(() => {
        fetchWeatherData(location.lat, location.lon);
      }, 600000); // 10 minutes
      
      return () => clearInterval(interval);
    }
  }, [location.lat, location.lon]);

  if (loading) {
    return (
      <div className="weather-widget-enhanced loading">
        <div className="loading-spinner">📡</div>
        <div>Loading weather...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-widget-enhanced error">
        <div>⚠️ {error}</div>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const currentTemp = weatherData?.current_weather?.temperature;
  const weatherCode = weatherData?.current_weather?.weathercode;
  const isDay = weatherData?.current_weather?.is_day;
  
  // Get next rain prediction
  const getNextRainPrediction = () => {
    if (!weatherData?.daily) return '';
    
    const tomorrow = weatherData.daily;
    const tomorrowPrecip = tomorrow.precipitation_sum[1];
    const tomorrowProbability = tomorrow.precipitation_probability_max[1];
    
    if (tomorrowPrecip > 0 || tomorrowProbability > 30) {
      return `${tomorrowPrecip.toFixed(1)} cm of rain expected on ${new Date(tomorrow.time[1]).toLocaleDateString('en', { weekday: 'long' })}`;
    }
    
    return 'No significant rain expected';
  };

  return (
    <>
      <div className="weather-widget-enhanced">
        {/* Header */}
        <div className="weather-header">
          <div className="location-info">
            <span className="location-icon">📍</span>
            <span className="location-name">{location.name}</span>
          </div>
        </div>

        {/* Main Weather Display */}
        <div className="weather-main">
          <div className="weather-icon-large">
            {getWeatherIcon(weatherCode, isDay)}
          </div>
          <div className="temperature-main">
            {Math.round(currentTemp)}°
          </div>
          <div className="weather-details">
            <div className="rain-prediction">
              <span className="rain-icon">🌧️</span>
              <span className="rain-text">{getNextRainPrediction()}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="weather-tabs">
          {['Hourly', 'Daily', 'Precipitation'].map((tab) => (
            <button
              key={tab}
              className={`weather-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Precipitation Chart - Updated with showContainer condition */}
        {activeTab === 'Precipitation' && showContainer && (
          <div className={`precipitation-chart scrollbar-container ${showScrollbar ? 'show-scrollbar' : 'hide-scrollbar'}`}>
            <div className="chart-container">
              <div className="y-axis">
                <div className="y-label">2.4 cm</div>
                <div className="y-label">1.6 cm</div>
                <div className="y-label">0.8 cm</div>
              </div>
              <div className="chart-bars">
                {precipitationData.map((data, index) => (
                  <div key={index} className="bar-container">
                    <div 
                      className="precipitation-bar"
                      style={{ 
                        height: `${Math.max(data.amount * 3, 1)}px`,
                        backgroundColor: index === 0 ? '#888' : '#50d3ffff'
                      }}
                    />
                    <div className="day-label">{data.day}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Daily Forecast - Updated with showContainer condition */}
        {activeTab === 'Daily' && weatherData?.daily && showContainer && (
          <div className={`daily-forecast scrollbar-container ${showScrollbar ? 'show-scrollbar' : 'hide-scrollbar'}`}>
            {weatherData.daily.time.slice(0, 7).map((date, index) => (
              <div key={index} className="daily-item">
                <div className="day">
                  {index === 0 ? 'Today' : new Date(date).toLocaleDateString('en', { weekday: 'short' })}
                </div>
                <div className="daily-icon">
                  {getWeatherIcon(weatherData.daily.weathercode[index])}
                </div>
                <div className="temps">
                  <span className="high">{Math.round(weatherData.daily.temperature_2m_max[index])}°</span>
                  <span className="low">{Math.round(weatherData.daily.temperature_2m_min[index])}°</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hourly Forecast - Updated with showContainer condition */}
        {activeTab === 'Hourly' && weatherData?.hourly && showContainer && (
          <div className={`hourly-forecast scrollbar-container ${showScrollbar ? 'show-scrollbar' : 'hide-scrollbar'}`}>
            {Array.from({ length: 12 }, (_, i) => {
              const hour = new Date();
              hour.setHours(hour.getHours() + i);
              return (
                <div key={i} className="hourly-item">
                  <div className="hour">
                    {i === 0 ? 'Now' : hour.toLocaleTimeString('en', { hour: '2-digit', hour12: false })}
                  </div>
                  <div className="hourly-temp">
                    {Math.round(weatherData.hourly.temperature_2m[i])}°
                  </div>
                  <div className="hourly-precip">
                    {weatherData.hourly.precipitation[i]?.toFixed(1) || '0.0'}mm
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .weather-widget-enhanced {
          position: fixed;
          bottom: 10px;
          left: 10px;
          width: 320px;
          background: transparent;
          border-radius: 16px;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
          backdrop-filter: blur(25px);
          box-shadow: 0 12px 40px rgba(115, 250, 252, 0.21), 0 0 0 1px rgba(133, 228, 254, 0.1);
          overflow: hidden;
          z-index: 1000;
          border: 2px solid rgb(12, 114, 117);
        }

        .weather-widget-enhanced.loading,
        .weather-widget-enhanced.error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
          background: rgba(40, 40, 45, 0.98);
        }

        .loading-spinner {
          font-size: 24px;
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .weather-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 22px 2px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
        }

        .location-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        }

        .location-icon {
          font-size: 14px;
          filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.5));
        }

        .weather-main {
          padding: 22px;
          display: flex;
          align-items: flex-start;
          gap: 18px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
        }

        .weather-icon-large {
          font-size: 40px;
          min-width: 40px;
          line-height: 1;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
        }

        .temperature-main {
          font-size: 40px;
          font-weight: 300;
          line-height: 1;
          color: #ffffff;
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.7);
        }

        .weather-details {
          flex: 1;
          margin-top: 10px;
        }

        .rain-prediction {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 10px;
          font-weight: 500;
          background: rgba(30, 144, 255, 0.25);
          color: #ffffff;
          padding: 8px 8px;
          border-radius: 22px;
          max-width: 80%;
          border: 1px solid rgba(30, 144, 255, 0.3);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .rain-icon {
          font-size: 14px;
          flex-shrink: 0;
          filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.5));
        }

        .rain-text {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .weather-tabs {
          display: flex;
          padding: 0 22px;
          gap: 3px;
          background: rgba(255, 255, 255, 0.03);
        }

        .weather-tab {
          flex: 1;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          padding: 1px 1px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.3s ease;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .weather-tab.active {
          background: rgba(9, 166, 251, 0.82);
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(13, 123, 197, 0.89);
        }

        .weather-tab:hover:not(.active) {
          background: rgba(6, 56, 95, 0.37);
          color: rgba(255, 255, 255, 0.9);
        }

        /* Data container styles with transition for smooth hiding */
        .precipitation-chart {
          padding: 22px;
          height: 130px;
          background: rgba(255, 255, 255, 0.02);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }

        .daily-forecast {
          padding: 12px 22px 22px;
          max-height: 210px;
          overflow-y: auto;
          background: rgba(255, 255, 255, 0.02);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }

        .hourly-forecast {
          padding: 12px 22px 22px;
          max-height: 210px;
          overflow-y: auto;
          background: rgba(255, 255, 255, 0.02);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }

        .chart-container {
          display: flex;
          height: 100%;
          gap: 14px;
        }

        .y-axis {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: 45px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .chart-bars {
          flex: 1;
          display: flex;
          align-items: end;
          justify-content: space-between;
          padding: 0 12px;
        }

        .bar-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          min-width: 22px;
        }

        .precipitation-bar {
          width: 18px;
          min-height: 6px;
          border-radius: 3px;
          transition: all 0.4s ease;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        .day-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .daily-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .daily-item:last-child {
          border-bottom: none;
        }

        .day {
          font-size: 15px;
          min-width: 65px;
          font-weight: 500;
          color: #ffffff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .daily-icon {
          font-size: 22px;
          flex: 1;
          text-align: center;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .temps {
          display: flex;
          gap: 10px;
          min-width: 65px;
          justify-content: end;
        }

        .high {
          font-weight: 600;
          color: #ffffff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .low {
          color: rgba(255, 255, 255, 0.7);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .hourly-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          font-size: 13px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .hourly-item:last-child {
          border-bottom: none;
        }

        .hour {
          min-width: 45px;
          font-weight: 500;
          color: #ffffff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .hourly-temp {
          min-width: 35px;
          text-align: center;
          font-weight: 500;
          color: #ffffff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .hourly-precip {
          color: #00d4ff;
          font-weight: 600;
          min-width: 45px;
          text-align: right;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        /* Hide scrollbar completely */
        .scrollbar-container::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-container {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        /* Container fade out animation */
        .hide-scrollbar {
          opacity: 0;
          transform: translateY(10px);
          pointer-events: none;
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .weather-widget-enhanced {
            width: 300px;
          }
          
          .temperature-main {
            font-size: 46px;
          }
          
          .weather-icon-large {
            font-size: 44px;
          }
        }
      `}</style>
    </>
  );
};

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
  
  // Image animation states
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(false);
  const [imageAnimationState, setImageAnimationState] = useState<'entering' | 'visible' | 'exiting' | 'hidden'>('hidden');
  const [demoImageStartTime, setDemoImageStartTime] = useState<number | null>(null);
  const imageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
  
  // Clock state
  const [clockTime, setClockTime] = useState('');
  
  // WebSocket refs and constants
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);
  
  const WS_URL = 'ws://localhost:8000/ws';
  const MAX_RECONNECT_ATTEMPTS = 5;
  const HEARTBEAT_INTERVAL = 30000;
  const RECONNECT_INTERVALS = [1000, 2000, 4000, 8000, 16000];

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
    
    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
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

  // Show animated image with proper timeout cleanup and exit animation
  const showAnimatedImage = useCallback((imageUrl: string) => {
    console.log('Starting image animation');
    
    if (imageTimeoutRef.current) {
      clearTimeout(imageTimeoutRef.current);
      imageTimeoutRef.current = null;
    }
    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }

    setGeneratedImage(imageUrl);
    setShowImage(true);
    setImageAnimationState('entering');
    setDemoImageStartTime(Date.now());

    setTimeout(() => {
      console.log('Image visible, starting 10s timer');
      setImageAnimationState('visible');
      
      imageTimeoutRef.current = setTimeout(() => {
        console.log('Starting exit animation');
        setImageAnimationState('exiting');
        
        exitTimeoutRef.current = setTimeout(() => {
          console.log('Hiding image completely');
          setShowImage(false);
          setGeneratedImage(null);
          setImageAnimationState('hidden');
          setDemoImageStartTime(null);
        }, 2000);
      }, 10000);
    }, 2000);
  }, []);

  // Demo function to test image animation
  const triggerDemoImage = useCallback(() => {
    const demoImageUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=face';
    showAnimatedImage(demoImageUrl);
  }, [showAnimatedImage]);

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
    
    if (connectionState.isConnected || connectionState.isConnecting) return;

    setConnectionState(prev => ({ 
      ...prev, 
      isConnecting: true, 
      error: null 
    }));

    try {
      cleanup();
      
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
        sendMessage({ action: 'request_greeting' });
      };

      ws.current.onmessage = (event) => {
        if (isUnmountedRef.current) return;
        
        try {
          const data = JSON.parse(event.data);
          console.log('Received from Pico:', data);
          if (data.type === 'greeting') {
            setPicoData(data);
            setFullText(data.text);
          } else if (data.type === 'pong') {
            console.log('Heartbeat response received');
          } else if (data.type === 'error') {
            console.error('Server error:', data.error);
            setConnectionState(prev => ({ 
              ...prev, 
              error: data.error || 'Unknown server error' 
            }));
          } else if (data.event === 'state') {
            const v = data.value;
            if (v === 'listening') {
              setIsListening(true);
              setIsConversing(false);
              setIsTyping(false);
              setTitleHasBeenHidden(true);
            } else if (v === 'speaking') {
              setIsListening(false);
              setIsConversing(true);
              setIsTyping(true);
              setTypedText('');
              setTitleHasBeenHidden(true);
            } else {
              setIsListening(false);
              setIsConversing(false);
              setIsTyping(false);
            }
          } else if (data.type === 'image_generated' && data.image_url) {
            showAnimatedImage(data.image_url);
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

        setIsListening(false);
        setIsConversing(false);
        setIsTyping(false);

        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

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
        
        setIsListening(false);
        setIsConversing(false);
        setIsTyping(false);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionState(prev => ({ 
        ...prev, 
        isConnecting: false,
        error: 'Failed to create connection' 
      }));
    }
  }, [connectionState.isConnected, connectionState.isConnecting, connectionState.reconnectAttempts, cleanup, startHeartbeat, sendMessage, showAnimatedImage]);

  // Request new greeting from backend
  const requestNewGreeting = useCallback(() => {
    sendMessage({ action: 'request_greeting' });
  }, [sendMessage]);

  // Clock update effect - updates every second
  useEffect(() => {
    const updateClock = () => {
      const time = new Date();
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      const seconds = time.getSeconds().toString().padStart(2, '0');
      setClockTime(`${hours}:${minutes}:${seconds}`);
    };
    
    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    isUnmountedRef.current = false;
    connectWebSocket();

    return () => {
      isUnmountedRef.current = true;
      cleanup();
    };
  }, [connectWebSocket, cleanup]);

  // Auto-refresh greeting every 30 seconds
  useEffect(() => {
    if (!connectionState.isConnected || isConversing) return;

    const interval = setInterval(() => {
      requestNewGreeting();
    }, 30000);

    return () => clearInterval(interval);
  }, [connectionState.isConnected, isConversing, requestNewGreeting]);

  // Effect to hide image after 10 seconds from demo button click
  useEffect(() => {
    if (demoImageStartTime) {
      const timeSinceDemo = Date.now() - demoImageStartTime;
      const timeRemaining = Math.max(0, 10000 - timeSinceDemo);
      
      const timer = setTimeout(() => {
        console.log('Hiding demo image after 10 seconds from click');
        setImageAnimationState('exiting');
        
        exitTimeoutRef.current = setTimeout(() => {
          setShowImage(false);
          setGeneratedImage(null);
          setImageAnimationState('hidden');
          setDemoImageStartTime(null);
        }, 2000);
      }, timeRemaining);
      
      return () => clearTimeout(timer);
    }
  }, [demoImageStartTime]);

  // Typing animation effect - only when connected
  useEffect(() => {
    if (connectionState.isConnected && isTyping && isConversing && fullText) {
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
  }, [connectionState.isConnected, isTyping, isConversing, fullText]);

  // Audio level animation - only when connected
  useEffect(() => {
    let animationFrame: number;
    
    if (connectionState.isConnected && (isListening || isConversing)) {
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
  }, [connectionState.isConnected, isListening, isConversing]);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (imageTimeoutRef.current) {
        clearTimeout(imageTimeoutRef.current);
        imageTimeoutRef.current = null;
      }
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
    };
  }, []);

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
      {/* Enhanced Real-time Clock */}
      <div className="clock">
        {clockTime || '00:00:00'}
      </div>

      {/* Enhanced Weather Widget */}
      <EnhancedWeatherWidget />

      {/* Enhanced CSS with better visibility and contrast */}
      <style jsx>{`
        /* Enhanced Clock styles with better visibility */
        .clock {
          position: fixed;
          top: 12px;
          left: 12px;
          background: rgba(20, 20, 25, 0.98);
          color: #00ffff;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          font-size: 20px;
          padding: 12px 16px;
          border-radius: 12px;
          border: 2px solid rgba(0, 255, 255, 0.4);
          user-select: none;
          z-index: 1100;
          backdrop-filter: blur(25px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 255, 255, 0.2);
          text-shadow: 0 0 12px rgba(0, 255, 255, 0.8), 0 2px 4px rgba(0, 0, 0, 0.8);
        }

        .speech-bubble::after {
          content: '';
          position: absolute;
          bottom: -14px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 18px solid transparent;
          border-right: 18px solid transparent;
          border-top: 14px solid rgba(128, 0, 255, 0.4);
          filter: drop-shadow(0 4px 8px rgba(128, 0, 255, 0.3));
        }
        
        .speech-bubble-cyan::after {
          border-top-color: rgba(0, 255, 255, 0.35);
          filter: drop-shadow(0 4px 8px rgba(0, 255, 255, 0.3));
        }
        
        .speech-bubble {
          position: relative;
          animation: speechBubbleFloat 3s ease-in-out infinite;
        }
        
        @keyframes speechBubbleFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-4px) scale(1.02); }
        }
        
        .cyber-font {
          font-family: 'Courier New', 'Monaco', 'Menlo', 'Consolas', monospace;
          font-weight: 900;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          font-style: normal;
        }
        
        /* Enhanced Connection status indicators */
        .connection-status {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 1000;
          padding: 10px 18px;
          border-radius: 28px;
          font-size: 12px;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          backdrop-filter: blur(25px);
          transition: all 0.3s ease;
          border: 2px solid;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
        
        .status-connected {
          background: rgba(20, 25, 20, 0.95);
          border-color: rgba(0, 255, 0, 0.6);
          color: rgba(0, 255, 0, 0.95);
          text-shadow: 0 0 12px rgba(0, 255, 0, 0.6), 0 2px 4px rgba(0, 0, 0, 0.8);
        }
        
        .status-connecting {
          background: rgba(25, 25, 20, 0.95);
          border-color: rgba(255, 255, 0, 0.6);
          color: rgba(255, 255, 0, 0.95);
          text-shadow: 0 0 12px rgba(255, 255, 0, 0.6), 0 2px 4px rgba(0, 0, 0, 0.8);
          animation: pulse 2s ease-in-out infinite;
        }
        
        .status-error {
          background: rgba(25, 20, 20, 0.95);
          border-color: rgba(255, 100, 100, 0.6);
          color: rgba(255, 100, 100, 0.95);
          text-shadow: 0 0 12px rgba(255, 100, 100, 0.6), 0 2px 4px rgba(0, 0, 0, 0.8);
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.02); }
        }
        
        /* Enhanced Animated Image Container */
        .animated-image-container {
          position: fixed;
          top: 90px;
          right: 24px;
          width: 340px;
          height: auto;
          perspective: 1200px;
          z-index: 9999;
          pointer-events: auto;
        }
        
        .animated-image-container.entering {
          animation: imageEntry 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        .animated-image-container.visible {
          opacity: 1;
          transform: translateZ(0) scale(1) rotateY(0deg) rotateX(0deg);
          filter: blur(0px) brightness(1);
          animation: floatUpDown 3s ease-in-out infinite;
        }
        
        .animated-image-container.exiting {
          animation: imageExit 2s cubic-bezier(0.55, 0.055, 0.675, 0.19) forwards;
        }
        
        @keyframes imageEntry {
          0% {
            opacity: 0;
            transform: translateZ(-1000px) rotateY(50deg) rotateX(30deg) scale(0.2);
            filter: blur(20px) brightness(0.2);
          }
          50% {
            opacity: 0.8;
            transform: translateZ(-250px) rotateY(20deg) rotateX(10deg) scale(0.7);
            filter: blur(8px) brightness(0.7);
          }
          100% {
            opacity: 1;
            transform: translateZ(0) rotateY(0deg) rotateX(0deg) scale(1);
            filter: blur(0px) brightness(1);
          }
        }
        
        @keyframes imageExit {
          0% {
            opacity: 1;
            transform: translateZ(0) rotateY(0deg) rotateX(0deg) scale(1);
            filter: blur(0px) brightness(1);
          }
          50% {
            opacity: 0.8;
            transform: translateZ(-250px) rotateY(-20deg) rotateX(-10deg) scale(0.7);
            filter: blur(8px) brightness(0.7);
          }
          100% {
            opacity: 0;
            transform: translateZ(-1000px) rotateY(-50deg) rotateX(-30deg) scale(0.2);
            filter: blur(20px) brightness(0.2);
          }
        }
        
        @keyframes floatUpDown {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        .animated-image {
          width: 100%;
          height: auto;
          border-radius: 16px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(255, 255, 255, 0.1);
          position: relative;
        }
        
        .download-icon {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 36px;
          height: 36px;
          cursor: pointer;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .download-icon:hover {
          background: rgba(0, 0, 0, 0.9);
          transform: scale(1.15);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
        }
        
        .download-icon:active {
          transform: scale(0.95);
        }
        
        .download-icon svg {
          width: 20px;
          height: 20px;
          fill: white;
        }
        
        /* Enhanced Button Styles */
        .refresh-button {
          position: fixed;
          bottom: 32px;
          right: 32px;
          z-index: 1000;
          padding: 14px 20px;
          border-radius: 28px;
          background: rgba(20, 25, 25, 0.95);
          border: 2px solid rgba(0, 255, 255, 0.4);
          color: rgba(0, 255, 255, 0.95);
          font-size: 11px;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(25px);
          text-shadow: 0 0 8px rgba(0, 255, 255, 0.5), 0 2px 4px rgba(0, 0, 0, 0.8);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
        
        .refresh-button:hover {
          background: rgba(0, 255, 255, 0.15);
          border-color: rgba(0, 255, 255, 0.6);
          transform: scale(1.08);
          box-shadow: 0 12px 40px rgba(0, 255, 255, 0.3), 0 0 20px rgba(0, 255, 255, 0.2);
        }
        
        .demo-button {
          position: fixed;
          bottom: 100px;
          right: 32px;
          z-index: 1000;
          padding: 10px 16px;
          border-radius: 22px;
          background: rgba(25, 20, 25, 0.95);
          border: 2px solid rgba(255, 0, 255, 0.4);
          color: rgba(255, 0, 255, 0.95);
          font-size: 11px;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(25px);
          text-shadow: 0 0 8px rgba(255, 0, 255, 0.5), 0 2px 4px rgba(0, 0, 0, 0.8);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
        
        .demo-button:hover {
          background: rgba(255, 0, 255, 0.15);
          border-color: rgba(255, 0, 255, 0.6);
          transform: scale(1.08);
          box-shadow: 0 12px 40px rgba(255, 0, 255, 0.3), 0 0 20px rgba(255, 0, 255, 0.2);
        }
      `}</style>

      {/* Enhanced Connection Status Indicator */}
      <div className={`connection-status ${
        connectionState.error ? 'status-error' :
        connectionState.isConnecting ? 'status-connecting' :
        connectionState.isConnected ? 'status-connected' : 'status-error'
      }`}>
        {connectionState.error ? '● ERROR' :
         connectionState.isConnecting ? '◐ CONNECTING...' :
         connectionState.isConnected ? '● PICO ONLINE' : '◌ OFFLINE'}
      </div>

      {/* Enhanced Animated Image Container */}
      {showImage && generatedImage && (
        <div className={`animated-image-container ${imageAnimationState}`}>
          <img
            src={generatedImage}
            alt="Generated Image"
            className="animated-image"
          />
          <div
            className="download-icon"
            onClick={() => downloadImage(generatedImage, `generated-image-${Date.now()}.png`)}
            title="Download Image"
          >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    fill="none"/>
            </svg>
          </div>
        </div>
      )}

      <section 
        className={`fixed inset-0 w-screen h-screen flex items-center justify-center overflow-hidden animated-bg transition-all duration-1000 select-none cursor-none ${
          connectionState.isConnected && (isListening || isConversing)
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
          connectionState.isConnected && (isListening || isConversing) ? 'opacity-35 sm:opacity-45' : 'opacity-20 sm:opacity-25'
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
                   linear-gradient(90deg, transparent 97%, rgba(0, 255, 255, 0.15) 100%),
                   linear-gradient(0deg, transparent 97%, rgba(0, 255, 255, 0.15) 100%)
                 `,
                 backgroundSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '50px 50px' : typeof window !== 'undefined' && window.innerWidth < 1024 ? '60px 60px' : '70px 70px',
                 animation: `gridMove ${connectionState.isConnected && (isListening || isConversing) ? '8s' : '15s'} linear infinite`,
                 userSelect: 'none',
                 cursor: 'none'
               }}>
          </div>
          
          {/* Data streams */}
          <div className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none">
            {[...Array(typeof window !== 'undefined' && window.innerWidth < 640 ? 6 : typeof window !== 'undefined' && window.innerWidth < 1024 ? 8 : 10)].map((_, i) => (
              <div
                key={`stream-${i}`}
                className={`absolute w-px overflow-hidden select-none pointer-events-none bg-gradient-to-b from-transparent via-neon-cyan/50 to-transparent transition-all duration-500 ${
                  connectionState.isConnected && (isListening || isConversing) ? 'via-neon-cyan/80 sm:via-neon-cyan/90' : 'via-neon-cyan/40 sm:via-neon-cyan/50'
                }`}
                style={{
                  left: `${i * (100 / (typeof window !== 'undefined' && window.innerWidth < 640 ? 6 : typeof window !== 'undefined' && window.innerWidth < 1024 ? 8 : 10))}%`,
                  height: '100vh',
                  maxHeight: '100vh',
                  animation: `dataStream ${connectionState.isConnected && (isListening || isConversing) ? (2 + i * 0.2) : (3 + i * 0.4)}s linear infinite`,
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
                  connectionState.isConnected && (isListening || isConversing)
                    ? 'border-neon-purple/50 animate-pulse' 
                    : 'border-neon-purple/30'
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
                  animation: `geometricFloat ${connectionState.isConnected && (isListening || isConversing) ? (5 + i) : (7 + i)}s ease-in-out infinite`,
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
          
          {/* Enhanced Title - Only show when not connected or before first conversation */}
          {!connectionState.isConnected || !titleHasBeenHidden ? (
            <div className={`animate-fade-in-up transition-all duration-1000 mb-1 sm:mb-2 md:mb-3 overflow-hidden select-none ${
              connectionState.isConnected && isListening ? 'text-glow-enhanced' : ''
            } ${connectionState.isConnected && isConversing ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
                 style={{ 
                   userSelect: 'none',
                   WebkitUserSelect: 'none',
                   cursor: 'default'
                 }}>
              <h1 className={`cyber-font text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl leading-tight transition-all duration-700 overflow-hidden select-none ${
                connectionState.isConnected && isListening 
                  ? 'text-glow-enhanced' 
                  : 'text-glow'}
              }`} style={{ 
                transformOrigin: 'center center',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                cursor: 'default',
                color: '#ffffff',
                textShadow: '0 0 20px rgba(0, 255, 255, 0.8), 0 4px 8px rgba(0, 0, 0, 0.8)'
              }}>
                HI I AM PICO
              </h1>
            </div>
          ) : null}

          {/* Enhanced Speech Bubble Conversation Area - Only show when connected */}
          {connectionState.isConnected && titleHasBeenHidden && (
            <div className={`animate-fade-in-up transition-all duration-1000 mb-4 sm:mb-5 md:mb-6 overflow-visible ${
              isConversing ? 'opacity-100 translate-y-0' : 'opacity-100 translate-y-0'
            }`}>
              <div className={`speech-bubble ${!isConversing ? 'speech-bubble-cyan' : ''} bg-gradient-to-r backdrop-blur-lg rounded-2xl p-4 sm:p-5 md:p-6 border-2 max-w-lg mx-auto transition-all duration-700 overflow-hidden ${
                isConversing 
                  ? 'from-purple-900/30 to-blue-900/30 border-purple-400/50 shadow-2xl' 
                  : 'from-cyan-900/25 to-blue-900/25 border-cyan-400/40 shadow-xl'
              }`}
              style={{ 
                cursor: 'default',
                backgroundColor: isConversing ? 'rgba(40, 20, 60, 0.3)' : 'rgba(20, 40, 60, 0.25)',
                boxShadow: isConversing 
                  ? '0 12px 40px rgba(128, 0, 255, 0.4), 0 0 30px rgba(128, 0, 255, 0.3)' 
                  : '0 12px 40px rgba(0, 255, 255, 0.35), 0 0 25px rgba(0, 255, 255, 0.25)'
              }}>
                {isConversing ? (
                  <div className="select-none">
                    <p className="text-sm sm:text-base font-orbitron leading-relaxed overflow-hidden select-text font-medium"
                       style={{ 
                         cursor: 'text',
                         userSelect: 'text',
                         WebkitUserSelect: 'text',
                         MozUserSelect: 'text',
                         color: '#ffffff',
                         textShadow: '0 0 15px rgba(128, 0, 255, 0.6), 0 2px 4px rgba(0, 0, 0, 0.8)'
                       }}>
                      "{typedText}
                      {isTyping && (
                        <span className="animate-pulse ml-1" style={{ color: '#ff00ff' }}>|</span>
                      )}"
                    </p>
                    
                    {picoData && (picoData.mood || picoData.user_count) && (
                      <div className="mt-2 text-xs font-mono" style={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)'
                      }}>
                        {picoData.mood && `Mood: ${picoData.mood}`}
                        {picoData.mood && picoData.user_count && ' • '}
                        {picoData.user_count && `Users: ${picoData.user_count}`}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="select-none">
                    <p className="text-sm sm:text-base font-orbitron leading-relaxed overflow-hidden select-text font-medium"
                       style={{ 
                         cursor: 'text',
                         userSelect: 'text',
                         WebkitUserSelect: 'text',
                         MozUserSelect: 'text',
                         color: '#ffffff',
                         textShadow: '0 0 15px rgba(0, 255, 255, 0.6), 0 2px 4px rgba(0, 0, 0, 0.8)'
                       }}>
                      {picoData?.time_greeting 
                        ? `${picoData.time_greeting} Ready for your next question...` 
                        : '"Ready for your next question..."'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Robot Avatar Container - BIGGER SIZE */}
          <div className={`relative mb-1 sm:mb-2 md:mb-3 overflow-visible select-none ${
            connectionState.isConnected && isConversing ? 'scale-105' : connectionState.isConnected && titleHasBeenHidden ? 'scale-102' : 'scale-100'
          }`} style={{ 
            width: '850px',
            height: '800px',
            maxWidth: '95vw',
            maxHeight: '70vh',
            transform: 'translateY(20px)',
            transformOrigin: 'center center',
            transition: 'transform 0.3s ease'
          }}>
            
            {/* Enhanced Animated Background Layer Behind Spline Scene */}
            {connectionState.isConnected && (isListening || isConversing) && (
              <div 
                className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
                style={{
                  background: `radial-gradient(circle at center, rgba(${isConversing ? '128, 0, 255' : '0, 255, 255'}, 0.2), transparent 70%)`,
                  animation: 'floating 4s ease-in-out infinite',
                  borderRadius: '50%',
                  transform: 'scale(1.3)',
                  filter: `blur(25px)`
                }}
              />
            )}

            {/* Enhanced Data Stream Effects */}
            {connectionState.isConnected && (isListening || isConversing) && (
              <div className="absolute inset-0 z-1 pointer-events-none overflow-hidden select-none">
                {[...Array(typeof window !== 'undefined' && window.innerWidth < 640 ? 6 : 8)].map((_, i) => (
                  <div
                    key={`stream-${i}`}
                    className={`absolute text-xs sm:text-sm font-mono animate-float overflow-hidden select-none pointer-events-none ${
                      isConversing ? 'text-purple-300' : 'text-cyan-300'
                    }`}
                    style={{
                      left: `${10 + (i * 8)}%`,
                      top: `${10 + (i % 4) * 20}%`,
                      animationDelay: `${i * 0.25}s`,
                      animationDuration: `${2.5 + (i % 3) * 0.5}s`,
                      textShadow: '0 0 12px currentColor, 0 2px 4px rgba(0, 0, 0, 0.8)',
                      userSelect: 'none',
                      cursor: 'none'
                    }}
                  >
                    {isConversing 
                      ? ['TALK', 'CHAT', 'CONV', 'RESP', 'WORD', 'SPEAK'][i] || 'AI'
                      : ""
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
                  
                  {!splineLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-transparent">
                      <div className="font-orbitron text-sm animate-pulse" style={{
                        color: '#00ffff',
                        textShadow: '0 0 15px rgba(0, 255, 255, 0.8), 0 2px 4px rgba(0, 0, 0, 0.8)'
                      }}>
                        Loading Pico...
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-96 h-96 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-cyan-300/30 flex items-center justify-center backdrop-blur-sm">
                    <span className="font-orbitron text-4xl font-bold animate-pulse" style={{
                      color: '#00ffff',
                      textShadow: '0 0 20px rgba(0, 255, 255, 0.8), 0 4px 8px rgba(0, 0, 0, 0.8)'
                    }}>PICO</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Enhanced Audio Wave Visualization */}
            {connectionState.isConnected && (isListening || isConversing) && (
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
                          ? 'bg-gradient-to-t from-purple-500 via-blue-400 to-cyan-300' 
                          : 'bg-gradient-to-t from-cyan-500 via-blue-400 to-purple-300'
                      }`}
                      style={{
                        width: '4px',
                        height: `${level * 35 + 12}px`,
                        maxHeight: '50px',
                        boxShadow: `0 0 15px ${isConversing ? 'rgba(128, 0, 255, 0.8)' : 'rgba(0, 255, 255, 0.8)'}, 0 2px 6px rgba(0, 0, 0, 0.5)`,
                        userSelect: 'none',
                        cursor: 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Status Indicator - Enhanced with Connection Info */}
          <div className={`flex items-center justify-center space-x-3 animate-fade-in-up transition-all duration-500 overflow-hidden select-none ${
            connectionState.isConnected && (isListening || isConversing) ? 'scale-105 sm:scale-108' : 'scale-100'
          }`} style={{ 
            animationDelay: '0.9s',
            cursor: 'default',
            transform: 'translateY(20px)',
            marginTop: '15px'
          }}>
            <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-500 overflow-hidden select-none ${
              connectionState.isConnected && isConversing ? 'bg-purple-400 pulse-glow-enhanced' :
              connectionState.isConnected && isListening ? 'bg-cyan-400 pulse-glow-enhanced' : 
              connectionState.isConnected ? 'bg-cyan-400 pulse-glow' :
              connectionState.isConnecting ? 'bg-yellow-400 pulse-glow' : 'bg-red-400 pulse-glow'
            }`} style={{
              boxShadow: connectionState.isConnected && isConversing ? '0 0 15px rgba(128, 0, 255, 0.8)' :
                         connectionState.isConnected && isListening ? '0 0 15px rgba(0, 255, 255, 0.8)' :
                         connectionState.isConnected ? '0 0 12px rgba(0, 255, 255, 0.6)' :
                         connectionState.isConnecting ? '0 0 12px rgba(255, 255, 0, 0.6)' : '0 0 12px rgba(255, 0, 0, 0.6)'
            }}></div>
            <span className={`text-sm sm:text-base font-orbitron transition-all duration-500 overflow-hidden select-none font-medium ${
              connectionState.isConnected && isConversing ? 'text-purple-200' :
              connectionState.isConnected && isListening ? 'text-cyan-200' : 
              connectionState.isConnected ? 'text-cyan-300' :
              connectionState.isConnecting ? 'text-yellow-300' : 'text-red-300'
            }`}
            style={{ 
              cursor: 'default',
              textShadow: connectionState.isConnected && isConversing ? '0 0 12px rgba(128, 0, 255, 0.6), 0 2px 4px rgba(0, 0, 0, 0.8)' :
                         connectionState.isConnected && isListening ? '0 0 12px rgba(0, 255, 255, 0.6), 0 2px 4px rgba(0, 0, 0, 0.8)' :
                         connectionState.isConnected ? '0 0 10px rgba(0, 255, 255, 0.5), 0 2px 4px rgba(0, 0, 0, 0.8)' :
                         connectionState.isConnecting ? '0 0 10px rgba(255, 255, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.8)' : 
                         '0 0 10px rgba(255, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.8)'
            }}>
              {connectionState.isConnected && isConversing ? 'Pico Speaking...' : 
               connectionState.isConnected && isListening ? 'Pico Listening...' : 
               connectionState.isConnected ? 'Pico System Online' :
               connectionState.isConnecting ? 'Connecting to Pico...' :
               connectionState.error ? `Connection Error: ${connectionState.error}` : 'Pico Offline'}
            </span>
          </div>
        </div>
      </section>

      {/* Enhanced Manual Refresh Button (only show when connected) */}
      {connectionState.isConnected && (
        <button 
          onClick={requestNewGreeting}
          className="refresh-button"
          title="Request new greeting from Pico"
        >
          ⟲ Refresh Greeting
        </button>
      )}

      {/* Enhanced Demo Image Button for Testing */}
      <button 
        onClick={triggerDemoImage}
        className="demo-button"
        title="Test image animation"
      >
        📷 Test Image
      </button>
    </>
  );
};
