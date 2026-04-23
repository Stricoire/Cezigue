'use server'

import { createClient } from "@supabase/supabase-js";

export async function getLatestNewsAndIdeas() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch latest raw news (last 5)
  const { data: news } = await supabase
    .from('articles_veille')
    .select('id, titre, source_nom, source_url')
    .order('created_at', { ascending: false })
    .limit(8);

  // Fetch latest ideas from Marina (last 3 unique insights)
  const { data: ideasData } = await supabase
    .from('articles_veille')
    .select('id, marlowe_insight_premium, marlowe_insight')
    .not('marlowe_insight_premium', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20);

  // Extract unique ideas
  const uniqueIdeasMap = new Map();
  if (ideasData) {
    ideasData.forEach(d => {
      if (d.marlowe_insight_premium && !uniqueIdeasMap.has(d.marlowe_insight)) {
        uniqueIdeasMap.set(d.marlowe_insight, d);
      }
    });
  }
  const topIdeas = Array.from(uniqueIdeasMap.values()).slice(0, 3);

  const mixedItems = [
    ...(news || []).map(n => ({ type: 'news', title: n.titre, source: n.source_nom, url: n.source_url })),
    ...topIdeas.map(i => {
      const title = i.marlowe_insight_premium.split('|||')[0] || "Nouvelle Opportunité";
      return { type: 'idea', title, source: 'Marina (IA)', url: '/studio?idea=' + i.id };
    })
  ];

  // Shuffle or interleave them
  return mixedItems.sort(() => 0.5 - Math.random());
}
