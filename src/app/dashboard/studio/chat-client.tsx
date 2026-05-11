'use client';

import { useState } from 'react';
import { Send, Bot, Loader2, Code2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export function ChatClient() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string, serviceId?: string}[]>([
    {
      role: 'assistant',
      content: 'Bonjour ! Décrivez-moi le service métier que vous souhaitez créer. Par exemple : "Une carte qui affiche les bornes de recharge électrique à moins de 20km".'
    }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userMsg = prompt.trim();
    setPrompt('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat-to-build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur de génération");
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `C'est prêt ! J'ai généré votre micro-service "${data.service.title}".`,
        serviceId: data.service.id
      }]);

    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Une erreur est survenue : ${err.message}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] max-h-[800px] border border-border/40 bg-card rounded-2xl shadow-sm overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            
            <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted/50 text-foreground rounded-tl-none border border-border/40'}`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              
              {msg.serviceId && (
                <div className="mt-4 p-4 bg-background rounded-xl border border-border flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" /> Micro-service configuré
                  </div>
                  <Link 
                    href={`/dashboard/mes-services/${msg.serviceId}`}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-foreground text-background rounded-lg text-sm font-bold hover:bg-foreground/90 transition-colors"
                  >
                    <Code2 className="w-4 h-4" />
                    Voir mon service
                  </Link>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center shrink-0 font-bold text-xs">
                VOUS
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-muted/50 text-muted-foreground rounded-2xl rounded-tl-none p-4 flex items-center gap-2 border border-border/40">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Génération de la configuration...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-background border-t border-border/40">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Décrivez votre besoin..."
            className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || loading}
            className="bg-primary text-primary-foreground p-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
