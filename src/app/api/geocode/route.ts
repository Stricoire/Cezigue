import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json(
      { error: 'Les paramètres lat et lon sont requis.' },
      { status: 400 }
    );
  }

  try {
    // Échographie Administrative via geo.api.gouv.fr
    // On extrait le code INSEE (code), le code département et la région.
    const response = await fetch(
      `https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lon}&fields=code,codeDepartement,codeRegion,nom,codesPostaux`,
      {
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(`Gouv API responded with status: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Aucune commune trouvée pour ces coordonnées (Point Zéro hors périmètre).' },
        { status: 404 }
      );
    }

    // Le premier résultat est la commune la plus proche
    const commune = data[0];

    return NextResponse.json({
      inseeCommune: commune.code,
      inseeDepartement: commune.codeDepartement,
      inseeRegion: commune.codeRegion,
      nom: commune.nom,
      codesPostaux: commune.codesPostaux
    });

  } catch (error) {
    console.error('[Geocode API Error]:', error);
    return NextResponse.json(
      { error: "Erreur lors de l'échographie administrative (geo.api.gouv.fr).", details: String(error) },
      { status: 500 }
    );
  }
}
