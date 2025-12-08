import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronDown, 
  ArrowRightLeft, 
  Search, 
  X, 
  Calendar,
  Send,
  Bot,
  User,
  Loader,
  Sparkles,
  TrendingDown,
  Tag
} from 'lucide-react';
import { PiAirplaneTiltFill } from "react-icons/pi";
import { IoIosBed } from "react-icons/io";
import { IoCarSharp } from "react-icons/io5";
import { FaUmbrellaBeach } from "react-icons/fa6";
import { HiSparkles } from "react-icons/hi2";
import axios from 'axios';

const AI_AGENT_URL = 'http://localhost:8000';

export default function AIMode() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tripType, setTripType] = useState('Round-trip');
  const [bags, setBags] = useState('0 bags');
  const [origin, setOrigin] = useState('From?');
  const [dest, setDest] = useState('To?');
  const [dates, setDates] = useState('Sun 12/14  —  Thu 12/18');
  const [travelersInfo, setTravelersInfo] = useState('1 adult, Economy');
  
  // AI Chat State
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your AI travel assistant. I can help you find the best flight and hotel deals, plan trips, and answer questions. Try asking me something like 'Find me a cheap flight to Miami' or 'I need a weekend trip under $1000'.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [deals, setDeals] = useState([]);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [searchContext, setSearchContext] = useState({ origin: null, destination: null });
  const [watches, setWatches] = useState([]);
  const [trackingDeal, setTrackingDeal] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const wsRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket connection for notifications
  useEffect(() => {
    const userId = localStorage.getItem('userId') || 'guest_' + Date.now();
    localStorage.setItem('userId', userId);
    
    const connectWebSocket = () => {
      const ws = new WebSocket(`ws://localhost:8000/ws/events?user_id=${userId}`);
      
      ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        setWsConnected(true);
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('📨 WebSocket message:', data);
        
        if (data.type === 'watch_alert') {
          // Add notification
          const notification = {
            id: Date.now(),
            type: 'watch_alert',
            title: '🔔 Price Alert!',
            message: data.message,
            deal_id: data.deal_id,
            deal_title: data.deal_title,
            timestamp: new Date(data.timestamp)
          };
          setNotifications(prev => [notification, ...prev]);
          
          // Show in chat
          const alertMessage = {
            role: 'assistant',
            content: data.message,
            timestamp: new Date(),
            isAlert: true
          };
          setMessages(prev => [...prev, alertMessage]);
          
          // Browser notification
          if (Notification.permission === 'granted') {
            new Notification('Kayak Price Alert', {
              body: `${data.deal_title} - ${data.reasons.join(', ')}`,
              icon: '/kayak-logo.png'
            });
          }
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setWsConnected(false);
      };
      
      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setWsConnected(false);
        // Reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };
      
      wsRef.current = ws;
    };
    
    connectWebSocket();
    
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async (origin = null, destination = null, bidirectional = false) => {
    try {
      setLoadingDeals(true);
      console.log('🔄 Fetching deals from:', `${AI_AGENT_URL}/api/ai/deals`);
      let url = `${AI_AGENT_URL}/api/ai/deals?limit=6&deal_type=all`;
      
      // Add filters if available
      if (origin) url += `&origin=${encodeURIComponent(origin)}`;
      if (destination) url += `&destination=${encodeURIComponent(destination)}`;
      
      console.log('📡 Full URL:', url, bidirectional ? '(bidirectional)' : '');
      const response = await axios.get(url);
      console.log('✅ Deals received:', response.data.length, 'deals');
      
      // If filtered search returns few results and bidirectional, try reverse
      if (bidirectional && response.data.length < 3 && destination) {
        console.log('🔄 Trying reverse direction for more deals...');
        const reverseUrl = `${AI_AGENT_URL}/api/ai/deals?limit=6&deal_type=all&origin=${encodeURIComponent(destination)}`;
        const reverseResponse = await axios.get(reverseUrl);
        const combined = [...response.data, ...reverseResponse.data];
        const unique = combined.filter((deal, index, self) => 
          index === self.findIndex(d => d.deal_id === deal.deal_id)
        );
        console.log('✅ Combined deals:', unique.length);
        setDeals(unique);
      } else if (response.data.length === 0 && (origin || destination)) {
        console.log('⚠️ No filtered deals found, fetching all deals...');
        const fallbackResponse = await axios.get(`${AI_AGENT_URL}/api/ai/deals?limit=6&deal_type=all`);
        console.log('✅ Fallback deals:', fallbackResponse.data.length);
        setDeals(fallbackResponse.data);
      } else {
        setDeals(response.data);
      }
    } catch (error) {
      console.error('❌ Error fetching deals:', error);
      console.error('Error details:', error.response || error.message);
      // Set empty array on error so UI shows "no deals"
      setDeals([]);
    } finally {
      setLoadingDeals(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const userId = localStorage.getItem('userId') || 'guest_' + Date.now();
      localStorage.setItem('userId', userId);

      const response = await axios.post(`${AI_AGENT_URL}/api/ai/chat`, {
        user_id: userId,
        message: input,
        conversation_history: messages.slice(-5).map(m => ({
          role: m.role,
          content: m.content
        }))
      }, {
        timeout: 60000  // 60 second timeout for LLM responses
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        intent: response.data.intent,
        confidence: response.data.confidence,
        entities: response.data.entities,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If we have origin/destination entities, update deals with filters
      const entities = response.data.entities || {};
      const intent = response.data.intent || '';
      
      // For hotel searches, show hotels from that city + general deals
      const isHotelSearch = intent.includes('hotel') || intent.includes('stay') || intent.includes('accommodation');
      
      // For flight searches, expand NY airports to show all NY deals
      // For hotel searches, keep the specific destination to filter by city
      const NY_AIRPORTS = ['JFK', 'LGA', 'EWR'];
      const expandedDestination = !isHotelSearch && entities.destination && NY_AIRPORTS.includes(entities.destination) 
        ? null  // Don't filter by specific airport for flights, just fetch all deals
        : entities.destination;
      
      // Fetch deals for search, find, or plan_trip intents with entities
      if (entities.origin || entities.destination) {
        setSearchContext({ origin: entities.origin, destination: entities.destination });
        // Use bidirectional search for trip planning to find flights both TO and FROM destination
        const isTripPlanning = intent.includes('plan_trip');
        // For hotel searches, only filter by destination (not origin)
        fetchDeals(isHotelSearch ? null : entities.origin, expandedDestination, isTripPlanning);
      } else if (intent.includes('search') || intent.includes('find') || intent.includes('plan_trip')) {
        // Fallback: refresh deals without filters
        fetchDeals();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      let errorText = "I'm sorry, I'm having trouble connecting right now. ";
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorText = "⏰ The AI is taking longer than usual to respond. This is normal for complex queries. Please try again or simplify your question.";
      } else if (error.response) {
        errorText = `Error ${error.response.status}: ${error.response.data?.detail || 'Something went wrong'}`;
      } else if (error.request) {
        errorText = "Cannot reach the AI service. Please make sure the AI Agent is running on port 8000.";
      }
      
      const errorMessage = {
        role: 'assistant',
        content: errorText,
        timestamp: new Date(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleExplainDeal = async (deal) => {
    try {
      const response = await axios.get(
        `${AI_AGENT_URL}/api/ai/deals/${deal.deal_id}/explain`
      );
      
      if (response.data) {
        const explanationMessage = {
          role: 'assistant',
          content: `**${deal.title}**\n\n${response.data.explanation}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, explanationMessage]);
        
        // Auto-scroll to bottom
        setTimeout(() => {
          const chatContainer = document.querySelector('.overflow-y-auto');
          if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error explaining deal:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I couldn\'t explain that deal right now. Please try again.',
        error: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleTrackDeal = async (deal) => {
    try {
      setTrackingDeal(deal.deal_id);
      
      const userId = localStorage.getItem('userId') || 'guest_' + Date.now();
      const payload = {
        user_id: userId,
        deal_id: deal.deal_id,
        price_threshold: deal.price * 1.10, // Alert if price is below 110% (will trigger immediately for testing)
        inventory_threshold: 50 // Higher threshold to trigger more easily
      };
      
      const response = await axios.post(
        `${AI_AGENT_URL}/api/ai/watch/create`,
        payload
      );
      
      if (response.data) {
        setWatches(prev => [...prev, response.data]);
        
        // Add success message to chat
        const successMessage = {
          role: 'assistant',
          content: `✅ Now tracking "${deal.title}"! I'll notify you when:\n• Price changes\n• Limited availability\n• Deal is about to expire\n\nYou'll see notifications here and in the top-right corner within 30 seconds!`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMessage]);
      }
    } catch (error) {
      console.error('Error creating watch:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I couldn\'t set up tracking for that deal. Please try again.',
        error: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setTrackingDeal(null);
    }
  };

  const handleUntrackDeal = async (deal) => {
    try {
      setTrackingDeal(deal.deal_id);
      
      // Find the watch for this deal
      const watch = watches.find(w => w.deal_id === deal.deal_id);
      if (!watch) return;
      
      await axios.delete(
        `${AI_AGENT_URL}/api/ai/watch/${watch.watch_id}`
      );
      
      // Remove from watches list
      setWatches(prev => prev.filter(w => w.watch_id !== watch.watch_id));
      
      // Add success message to chat
      const successMessage = {
        role: 'assistant',
        content: `✅ Stopped tracking "${deal.title}". You will no longer receive alerts for this deal.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMessage]);
    } catch (error) {
      console.error('Error deleting watch:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I couldn\'t stop tracking that deal. Please try again.',
        error: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setTrackingDeal(null);
    }
  };

  return (
    <main className="mt-4 md:mt-8 mb-8">
      {/* Notification Banner */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
          {notifications.slice(0, 3).map(notif => (
            <div 
              key={notif.id}
              className="bg-gradient-to-r from-[#FF690F] to-[#ff8534] text-white p-4 rounded-lg shadow-2xl animate-slide-in-right flex items-start gap-3"
            >
              <div className="text-2xl">🔔</div>
              <div className="flex-1">
                <h4 className="font-bold text-sm">{notif.title}</h4>
                <p className="text-sm opacity-90 mt-1 whitespace-pre-line">{notif.message}</p>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Full-width gray background card */}
      <div className="w-full bg-[#edf0f3] dark:bg-gray-800 py-6 md:py-8">
        {/* Constrained content inside */}
        <div className="max-w-[1200px] mx-auto px-2 md:px-3 lg:px-4">
          
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-3 leading-tight tracking-tight dark:text-white flex items-center gap-3">
              <Sparkles className="w-10 h-10 text-[#FF690F]" />
              AI Travel Assistant<span className="text-[#FF690F]">.</span>
              {wsConnected && (
                <span className="text-sm font-normal text-green-600 dark:text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Live
                </span>
              )}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Chat with our AI to find the best deals, plan trips, and get personalized recommendations
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-6 mb-6">
            <NavTab icon={<PiAirplaneTiltFill />} label="Flights" active={location.pathname === '/'} link="/" />
            <NavTab icon={<IoIosBed />} label="Stays" active={location.pathname === '/stays'} link="/stays" />
            <NavTab icon={<IoCarSharp />} label="Cars" active={location.pathname === '/cars'} link="/cars" />
            <NavTab icon={<HiSparkles />} label="AI Mode" active={location.pathname === '/ai-mode'} link="/ai-mode" />
          </div>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: AI Chat */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden h-[600px] flex flex-col">
                
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-[#FF690F] to-[#ff8534] p-4 text-white flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Kayak AI Assistant</h3>
                    <p className="text-sm opacity-90">Powered by Ollama AI</p>
                  </div>
                </div>

                {/* Messages Area */}
                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900"
                >
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0 w-8 h-8 bg-[#FF690F] rounded-full flex items-center justify-center">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-[#FF690F] text-white'
                            : message.error
                            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 border border-red-300'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {message.intent && (
                          <div className="mt-2 text-xs opacity-75 flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {message.intent} • {Math.round(message.confidence * 100)}% confident
                          </div>
                        )}
                      </div>
                      {message.role === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#FF690F] rounded-full flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 border border-gray-200 dark:border-gray-700">
                        <Loader className="w-5 h-5 animate-spin text-[#FF690F]" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about travel, deals, or trip planning..."
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF690F] dark:bg-gray-700 dark:text-white"
                      disabled={loading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={loading || !input.trim()}
                      className="px-6 py-3 bg-[#FF690F] hover:bg-[#d6570c] text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Quick Refinement Buttons */}
                  {messages.length > 1 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        onClick={() => setInput('Show me cheaper options')}
                        className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full transition-colors"
                      >
                        💰 Cheaper options
                      </button>
                      <button
                        onClick={() => setInput('Show direct flights only')}
                        className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full transition-colors"
                      >
                        ✈️ Direct flights
                      </button>
                      <button
                        onClick={() => setInput('Show morning flights')}
                        className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full transition-colors"
                      >
                        🌅 Morning flights
                      </button>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Try: "Find cheap flights to Miami" or "Plan a weekend trip under $800"
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Top Deals */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sticky top-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="w-6 h-6 text-[#FF690F]" />
                  <h3 className="font-bold text-xl dark:text-white">Top Deals</h3>
                </div>
                
                {loadingDeals ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader className="w-8 h-8 animate-spin text-[#FF690F]" />
                  </div>
                ) : deals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="mb-2">No deals available yet</p>
                    <p className="text-sm">Check back in a few minutes!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[520px] overflow-y-auto">
                    {deals.map((deal, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          if (deal.type === 'flight') {
                            navigate('/');
                          } else {
                            navigate('/stays');
                          }
                        }}
                        className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 hover:border-[#FF690F] hover:shadow-lg transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {deal.type === 'flight' ? (
                              <PiAirplaneTiltFill className="w-5 h-5 text-[#FF690F]" />
                            ) : (
                              <IoIosBed className="w-5 h-5 text-[#FF690F]" />
                            )}
                            <span className="font-semibold text-sm dark:text-white">{deal.title}</span>
                          </div>
                          <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-md text-xs font-bold">
                            {deal.score}/100
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {deal.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-bold text-[#FF690F]">
                              ${deal.price}
                            </span>
                            {deal.original_price > deal.price && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 line-through ml-2">
                                ${deal.original_price}
                              </span>
                            )}
                          </div>
                          {deal.discount_percent > 0 && (
                            <span className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 px-2 py-1 rounded-md text-xs font-semibold">
                              {deal.discount_percent}% OFF
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExplainDeal(deal);
                            }}
                            className="text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-3 py-1 rounded-full font-semibold transition-colors flex items-center gap-1 flex-1"
                          >
                            💡 Explain
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const isTracked = watches.some(w => w.deal_id === deal.deal_id);
                              if (isTracked) {
                                handleUntrackDeal(deal);
                              } else {
                                handleTrackDeal(deal);
                              }
                            }}
                            disabled={trackingDeal === deal.deal_id}
                            className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 flex-1 ${
                              watches.some(w => w.deal_id === deal.deal_id)
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-[#FF690F] hover:bg-[#ff5500] text-white'
                            }`}
                          >
                            {trackingDeal === deal.deal_id ? (
                              <>
                                <Loader className="w-3 h-3 animate-spin" />
                                {watches.some(w => w.deal_id === deal.deal_id) ? 'Untracking...' : 'Tracking...'}
                              </>
                            ) : watches.some(w => w.deal_id === deal.deal_id) ? (
                              '✓ Untrack'
                            ) : (
                              '🔔 Track'
                            )}
                          </button>
                        </div>
                        {deal.tags && deal.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {deal.tags.slice(0, 3).map((tag, i) => (
                              <span
                                key={i}
                                className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Navigation Tab Component
function NavTab({ icon, label, active, link }) {
  const navigate = useNavigate();
  
  return (
    <div 
      className="flex flex-col items-center gap-1.5 cursor-pointer select-none"
      onClick={() => link && navigate(link)}
    >
      <div className={`
        w-14 h-14 rounded-lg flex items-center justify-center shadow-sm transition-all
        ${active ? 'bg-[#FF690F] text-white' : 'bg-white dark:bg-gray-700 text-black dark:text-white border border-gray-200 dark:border-gray-600'}
      `}>
        <div className="text-2xl">
          {icon}
        </div>
      </div>
      <span className={`font-medium text-xs ${active ? 'text-[#FF690F]' : 'text-gray-900 dark:text-white'}`}>
        {label}
      </span>
    </div>
  );
}
