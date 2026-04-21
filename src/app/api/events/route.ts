import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const insee = searchParams.get('insee');

  if (!insee) {
    return NextResponse.json({ error: 'Code INSEE manquant pour la recherche Datatourisme' }, { status: 400 });
  }

  try {
    const DATATOURISME_API_KEY = process.env.DATATOURISME_API_KEY;
    if (!DATATOURISME_API_KEY) {
      console.warn("Clé API Datatourisme absente, on renvoie une liste vide.");
      return NextResponse.json({ insee, events: [] });
    }

    // Le backend Datatourisme attend une requête POST GraphQL
    const query = `
      query {
        poi(
          filters: [
            { allowedTypes: ["EntertainmentAndEvent"] },
            { isLocatedAt: { schema_address: { hasAddressCity: { insee: { _eq: "${insee}" } } } } }
          ]
          size: 15
        ) {
          results {
            dc_title
            rdfs_comment
            schema_startDate
            schema_endDate
            isLocatedAt {
               schema_address {
                  schema_addressLocality
               }
            }
          }
        }
      }
    `;

    const res = await fetch(`https://api.datatourisme.fr/api/queries?apikey=${DATATOURISME_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });

    if (!res.ok) {
      throw new Error(`Erreur réseau Datatourisme: ${res.statusText}`);
    }

    const data = await res.json();
    const results = data.data?.poi?.results || [];

    // Transformation du payload complexe de Datatourisme en objet LocalEvent plat
    const events = results.map((r: any, idx: number) => ({
      id: `event-${insee}-${idx}`,
      title: r.dc_title?.[0] || 'Événement local',
      type: 'Événement & Loisir',
      date: r.schema_startDate?.[0] ? new Date(r.schema_startDate[0]).toLocaleDateString('fr-FR') : 'Date à préciser',
      distance: r.isLocatedAt?.[0]?.schema_address?.[0]?.schema_addressLocality?.[0] || 'Dans votre secteur',
      icon: '🎟️'
    }));

    return NextResponse.json({ insee, events });

  } catch (error) {
    console.error('Erreur API Datatourisme:', error);
    return NextResponse.json({ error: 'Échec de la récupération des événements Locaux' }, { status: 500 });
  }
}
