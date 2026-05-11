'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Bot, Loader2, Code2, CheckCircle2, Mic, MicOff, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

const LIBRARY_IMAGES = [
  '/library/mobility_family.png',
  '/library/mobility_eco_street.png',
  '/library/mobility_smart_hub.png',
  '/library/mobility_rural.png',
  '/library/mobility_logistics.png'
];

export function ChatClient({ initialEditService }: { initialEditService?: any }) {
  const [prompt, setPrompt] = useState('');
  
  // Si on est en mode édition, on affiche un message d'accueil spécifique et on précharge la config
  const initialMessages = initialEditService 
    ? [{
        role: 'assistant' as const,
        content: `Vous modifiez actuellement le service "${initialEditService.title}". Dites-moi ce que vous souhaitez changer (ex: "ajoute les restaurants au filtre" ou "agrandis le rayon à 10km").`,
        draftConfig: {
          title: initialEditService.title,
          description: initialEditService.description,
          config_json: initialEditService.config_json
        }
      }]
    : [{
        role: 'assistant' as const,
        content: 'Bonjour ! Décrivez-moi le service métier que vous souhaitez créer. Par exemple : "Une carte qui affiche les bornes de recharge électrique à moins de 20km".'
      }];

  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string, serviceId?: string, draftConfig?: any}[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [editServiceId] = useState<string | null>(initialEditService?.id || null);
  
  const recognitionRef = useRef<any>(null);
  const basePromptRef = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const reco = new SpeechRecognition();
        reco.continuous = true; // Enregistrement continu jusqu'à arrêt manuel
        reco.interimResults = true;
        reco.lang = 'fr-FR';

        reco.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          if (finalTranscript) {
             basePromptRef.current = (basePromptRef.current + ' ' + finalTranscript).trim();
          }
          
          setPrompt((basePromptRef.current + ' ' + interimTranscript).trim());
        };

        reco.onend = () => {
          // Si l'utilisateur n'a pas cliqué sur stop, et que continuous s'arrête (ex: timeout), on peut redémarrer ou laisser tel quel.
          // Ici, on respecte le stop manuel. Si ça coupe tout seul (bug navigateur), on met à jour l'UI.
          setIsRecording(false);
        };

        reco.onerror = (event: any) => {
          if (event.error !== 'no-speech') {
            console.warn('Speech recognition error:', event.error);
          }
          setIsRecording(false);
        };

        recognitionRef.current = reco;
      }
    }
  }, []);

  const toggleRecording = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      basePromptRef.current = prompt;
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Impossible de démarrer le micro", err);
      }
    }
  };

  const handlePublish = async (draftConfig: any, imageUrl: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat-to-build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'PUBLISH', draftConfig, imageUrl, editServiceId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: editServiceId 
          ? `C'est prêt ! Votre micro-service "${draftConfig.title}" a été mis à jour avec succès.`
          : `C'est prêt ! Votre micro-service "${draftConfig.title}" a été publié avec succès.`,
        serviceId: data.service.id
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Erreur : ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
    
    if (!prompt.trim() || loading) return;

    const userMsg = prompt.trim();
    setPrompt('');
    basePromptRef.current = '';
    
    const newMessages = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat-to-build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CHAT', prompt: userMsg, history: newMessages })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de génération");

      const responsePayload = data.response;
      if (responsePayload.type === 'config_ready') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: responsePayload.content,
          draftConfig: responsePayload.config
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: responsePayload.content
        }]);
      }

    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Erreur : ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[65vh] min-h-[500px] border border-border/40 bg-card rounded-2xl shadow-sm overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            
            <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted/50 text-foreground rounded-tl-none border border-border/40'}`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              
              {/* Galerie d'images si config_ready */}
              {msg.draftConfig && !msg.serviceId && (
                <div className="mt-6 space-y-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Choisissez une illustration :</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {LIBRARY_IMAGES.map((img, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => handlePublish(msg.draftConfig, img)}
                        disabled={loading}
                        className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-transparent hover:border-primary transition-all group"
                      >
                        <img src={img} alt="Illustration" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </button>
                    ))}
                    <button 
                      onClick={() => alert("Fonction Upload à venir !")}
                      className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-dashed border-border/60 hover:border-primary/60 hover:bg-muted/50 flex flex-col items-center justify-center gap-2 text-muted-foreground transition-all"
                    >
                      <ImageIcon className="w-6 h-6" />
                      <span className="text-xs font-medium">Uploader</span>
                    </button>
                  </div>
                </div>
              )}

              {msg.serviceId && (
                <div className="mt-4 p-4 bg-background rounded-xl border border-border flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" /> Micro-service publié !
                  </div>
                  <Link 
                    href={`/dashboard/mes-services/${msg.serviceId}`}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-foreground text-background rounded-lg text-sm font-bold hover:bg-foreground/90 transition-colors"
                  >
                    <Code2 className="w-4 h-4" />
                    Ouvrir le service
                  </Link>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center shrink-0 font-bold text-xs mt-1">
                VOUS
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-muted/50 text-muted-foreground rounded-2xl rounded-tl-none p-4 flex items-center gap-2 border border-border/40">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Je réfléchis...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-background border-t border-border/40">
        <form onSubmit={handleSubmit} className="flex gap-2 relative">
          <input
            type="text"
            value={prompt}
            onChange={e => {
              setPrompt(e.target.value);
              basePromptRef.current = e.target.value;
            }}
            placeholder="Décrivez votre besoin (ou utilisez le micro)..."
            className="flex-1 bg-muted/50 border border-border/50 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={loading}
          />
          <button
            type="button"
            onClick={toggleRecording}
            className={`absolute right-16 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors ${isRecording ? 'text-red-500 bg-red-100 animate-pulse' : 'text-muted-foreground hover:bg-muted'}`}
            title="Dicter à l'oral"
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button
            type="submit"
            disabled={(!prompt.trim() && !isRecording) || loading}
            className="bg-primary text-primary-foreground p-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
