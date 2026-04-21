"use client";

import { useEffect, useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";

interface LocalEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  distance: string;
  icon: string;
}

export default function LocalEventsRadar({ insee, maximized = false }: { insee: string, maximized?: boolean }) {
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!insee) return;

    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/events?insee=${insee}`);
        const data = await res.json();
        setEvents(data.events || []);
      } catch (e) {
        console.error("Erreur LocalEventsRadar:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [insee]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-purple-50/30 rounded-xl border border-purple-100 animate-pulse">
         <CalendarDays className="w-8 h-8 text-purple-300 mb-4 animate-bounce" />
         <p className="text-purple-500 font-medium">Sondage des fêtes et marchés locaux (DATAtourisme)...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-neutral-50 rounded-xl">
         <p className="text-neutral-500 font-medium">Aucun événement identifié dans un rayon proche.</p>
      </div>
    );
  }

  return (
    <div className={`w-full flex-1 flex flex-col overflow-hidden ${maximized ? 'h-full' : 'max-h-96'}`}>
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {events.map(ev => (
          <div key={ev.id} className="bg-white border border-neutral-100 p-4 rounded-xl flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-2xl shrink-0">
               {ev.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-neutral-900 truncate">{ev.title}</h4>
              <p className="text-sm font-medium text-purple-600 mb-1">{ev.type}</p>
              <div className="flex items-center text-xs text-neutral-500 gap-3">
                <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3"/> {ev.date}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {ev.distance}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
