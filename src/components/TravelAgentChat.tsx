"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Compass } from 'lucide-react';

interface TravelAgentChatProps {
  onFiltersChange: (filters: any) => void;
  context: {
    routeInfo: string;
    poisCount: number;
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  quickReplies?: string[];
}

export default function TravelAgentChat({ onFiltersChange, context }: TravelAgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      handleSend("Bonjour, je cherche le meilleur arrêt pour mon trajet.", true);
    }
  }, []);

  const handleSend = async (text: string, isInitial = false) => {
    if (!text.trim()) return;

    const newMessages = isInitial ? [] : [...messages, { id: crypto.randomUUID(), role: 'user', content: text } as Message];
    
    if (!isInitial) {
      setMessages(newMessages);
      setInputValue('');
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/travel-planner/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: isInitial ? [{ role: 'user', content: text }] : newMessages,
          context: context
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorMsg = data.error || "Erreur de communication avec l'IA";
        // Si c'est un 503 ou un message d'overload Gemini, on affiche gentiment sans throw d'erreur fatale
        if (response.status === 503 || response.status === 500 || errorMsg.includes("503") || errorMsg.includes("overloaded")) {
           setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: "L'intelligence artificielle est actuellement très sollicitée par d'autres utilisateurs. Veuillez réessayer dans un instant." }]);
           setIsLoading(false);
           return; // Stop execution without throwing
        }
        throw new Error(errorMsg);
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        quickReplies: data.quickReplies
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Met à jour les filtres de la carte (Generative UI)
      if (data.activeFilters) {
        onFiltersChange(data.activeFilters);
      }

    } catch (error: any) {
      // On utilise console.warn au lieu de console.error pour éviter l'overlay rouge bloquant de Next.js
      console.warn("Chat API warning:", error);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: "Oups, une petite erreur réseau est survenue. Pouvez-vous répéter ?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("La reconnaissance vocale n'est pas supportée sur ce navigateur.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      handleSend(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech Error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleQuickReply = (reply: string) => {
    handleSend(reply);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-neutral-100 flex items-center gap-3 bg-emerald-50/50">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
          <Compass className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-neutral-900 text-sm">Agent de Voyage IA</h3>
          <p className="text-xs text-neutral-500">Toujours prêt à vous guider</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/30">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
              msg.role === 'user' 
                ? 'bg-neutral-900 text-white rounded-tr-sm' 
                : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-sm shadow-sm'
            }`}>
              {msg.content}
            </div>
            
            {/* Quick Replies below assistant message */}
            {msg.role === 'assistant' && msg.quickReplies && msg.quickReplies.length > 0 && msg.id === messages[messages.length - 1].id && (
              <div className="flex flex-wrap gap-2 mt-3 w-full pl-2">
                {msg.quickReplies.map((reply, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleQuickReply(reply)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-full text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-neutral-400 text-sm pl-2">
            <div className="flex gap-1">
               <div className="w-2 h-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: '0ms' }} />
               <div className="w-2 h-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: '150ms' }} />
               <div className="w-2 h-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-neutral-100 bg-white">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }}
          className="flex items-center gap-2 bg-neutral-100 rounded-full p-1 pl-4"
        >
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Je cherche plutôt..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-neutral-800 placeholder-neutral-400"
            disabled={isLoading || isListening}
          />
          <button 
            type="button"
            onClick={startVoiceInput}
            className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200'}`}
          >
            <Mic className="w-5 h-5" />
          </button>
          <button 
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="p-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
