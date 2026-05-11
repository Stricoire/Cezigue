export interface POISubCategory {
  label: string;
  icon: string;
}

export interface POIMetaCategory {
  id: string; // The ID sent to the backend
  label: string;
  icon: string;
  theme: {
    color: string;
    bg: string;
    text: string;
    border: string;
    bgSolid: string;
    ring: string;
  };
  types: Record<string, POISubCategory>;
}

export const POI_TAXONOMY: Record<string, POIMetaCategory> = {
  "Restauration": {
    id: "Restauration",
    label: "Restauration",
    icon: "🍽️",
    theme: { color: "orange", bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300", bgSolid: "bg-orange-500", ring: "ring-orange-200" },
    types: {
      "restaurant": { label: "Restaurant", icon: "🍽️" },
      "michelin_restaurant": { label: "Restaurant Michelin", icon: "⭐" },
      "michelin_starred": { label: "Restaurant étoilé Michelin", icon: "⭐️" },
      "michelin_bib": { label: "Restaurant (Bib Gourmand)", icon: "😋" },
      "relais_routier": { label: "Relais Routier", icon: "🚚" },
      "restauration_rapide": { label: "Restauration rapide", icon: "🍔" },
      "cafe": { label: "Café", icon: "☕" },
      "bar": { label: "Bar & Pub", icon: "🍺" },
      "glacier": { label: "Glacier", icon: "🍦" },
      "aire_de_restauration": { label: "Aire de restauration", icon: "🍱" },
      "restaurant_asian": { label: "Restaurant Asiatique", icon: "🍜" },
      "restaurant_indian": { label: "Restaurant Indien", icon: "🍛" },
      "restaurant_pizza": { label: "Pizzeria", icon: "🍕" },
      "restaurant_burger": { label: "Burger", icon: "🍔" }
    }
  },
  "Commerce de Bouche": {
    id: "Commerce de Bouche",
    label: "Commerce de Bouche",
    icon: "🥖",
    theme: { color: "amber", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300", bgSolid: "bg-amber-500", ring: "ring-amber-200" },
    types: {
      "boulangerie": { label: "Boulangerie", icon: "🥖" },
      "patisserie": { label: "Pâtisserie", icon: "🥐" },
      "supermarche": { label: "Supermarché", icon: "🛒" },
      "superette": { label: "Supérette", icon: "🧺" },
      "boucherie": { label: "Boucherie", icon: "🥩" },
      "poissonnerie": { label: "Poissonnerie", icon: "🐟" },
      "primeur": { label: "Primeur", icon: "🥦" },
      "caviste": { label: "Caviste", icon: "🍷" },
      "fromagerie": { label: "Fromagerie", icon: "🧀" },
      "epicerie_fine": { label: "Épicerie fine", icon: "🍯" },
      "boissons": { label: "Magasin de boissons", icon: "🧃" },
      "chocolaterie": { label: "Chocolaterie", icon: "🍫" },
      "epices": { label: "Épices", icon: "🌶️" },
      "salon_de_the": { label: "Salon de thé", icon: "🫖" },
      "ferme": { label: "Vente à la ferme", icon: "🧑‍🌾" }
    }
  },
  "Tourisme & Culture": {
    id: "Tourisme & Culture",
    label: "Tourisme & Culture",
    icon: "🏰",
    theme: { color: "fuchsia", bg: "bg-fuchsia-100", text: "text-fuchsia-700", border: "border-fuchsia-300", bgSolid: "bg-fuchsia-500", ring: "ring-fuchsia-200" },
    types: {
      "musee": { label: "Musée", icon: "🏛️" },
      "galerie_art": { label: "Galerie d'art", icon: "🖼️" },
      "parc_attractions": { label: "Parc d'attractions", icon: "🎢" },
      "parc_aquatique": { label: "Parc aquatique", icon: "🌊" },
      "monument_historique": { label: "Monument Historique", icon: "🗽" },
      "chateau": { label: "Château", icon: "🏰" },
      "point_de_vue": { label: "Point de vue / Panorama", icon: "🌄" },
      "office_de_tourisme": { label: "Office de Tourisme", icon: "ℹ️" },
      "centre_culturel": { label: "Centre Culturel", icon: "🎭" },
      "cinema": { label: "Cinéma", icon: "🍿" },
      "theatre": { label: "Théâtre", icon: "🎭" },
      "boite_de_nuit": { label: "Boîte de nuit", icon: "🪩" },
      "zoo": { label: "Zoo", icon: "🦓" },
      "aquarium": { label: "Aquarium", icon: "🐠" },
      "attraction_touristique": { label: "Attraction Touristique", icon: "📸" },
      "event": { label: "Événement culturel", icon: "🎟️" }
    }
  },
  "Santé & Soins": {
    id: "Santé & Soins",
    label: "Santé & Soins",
    icon: "🏥",
    theme: { color: "red", bg: "bg-red-100", text: "text-red-700", border: "border-red-300", bgSolid: "bg-red-500", ring: "ring-red-200" },
    types: {
      "pharmacie": { label: "Pharmacie", icon: "⚕️" },
      "hopital": { label: "Hôpital", icon: "🚑" },
      "clinique": { label: "Clinique", icon: "🏥" },
      "medecin": { label: "Médecin", icon: "🩺" },
      "dentiste": { label: "Dentiste", icon: "🦷" },
      "maison_de_retraite": { label: "Maison de retraite", icon: "👵" },
      "centre_social": { label: "Centre social", icon: "🤝" },
      "veterinaire": { label: "Vétérinaire", icon: "🐶" }
    }
  },
  "Services Publics & Pratiques": {
    id: "Services Publics & Pratiques",
    label: "Services Publics & Pratiques",
    icon: "🏛️",
    theme: { color: "slate", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300", bgSolid: "bg-slate-500", ring: "ring-slate-200" },
    types: {
      "mairie": { label: "Mairie", icon: "🇫🇷" },
      "batiment_public": { label: "Bâtiment public", icon: "🏛️" },
      "bureau_de_poste": { label: "Bureau de Poste", icon: "📮" },
      "banque": { label: "Banque", icon: "🏦" },
      "distributeur_automatique": { label: "Distributeur automatique", icon: "💶" },
      "toilettes_publiques": { label: "Toilettes publiques", icon: "🚾" },
      "station_service": { label: "Station Service", icon: "⛽" },
      "station_de_lavage": { label: "Station de lavage", icon: "🧽" },
      "garage_automobile": { label: "Garage automobile", icon: "🚙" },
      "dechetterie": { label: "Déchetterie", icon: "♻️" },
      "poubelle_publique": { label: "Poubelle publique", icon: "🗑️" },
      "police": { label: "Police", icon: "🚓" },
      "pompiers": { label: "Pompiers", icon: "🚒" },
      "tribunal": { label: "Tribunal", icon: "⚖️" },
      "prison": { label: "Prison", icon: "⛓️" },
      "bibliotheque": { label: "Bibliothèque", icon: "📚" },
      "point_de_recyclage": { label: "Point de Recyclage", icon: "♻️" },
      "location_de_voiture": { label: "Location de Voiture", icon: "🚗" },
      "location_de_velos": { label: "Location de Vélos", icon: "🚲" },
      "parking": { label: "Parking", icon: "🅿️" },
      "ecole": { label: "École", icon: "🏫" },
      "creche": { label: "Crèche", icon: "🧸" },
      "universite": { label: "Université", icon: "🎓" },
      "college": { label: "Collège / Lycée", icon: "🎒" },
      "lieu_de_culte": { label: "Lieu de Culte", icon: "⛪" }
    }
  },
  "Boutiques & Services": {
    id: "Boutiques & Services",
    label: "Boutiques & Services",
    icon: "🛍️",
    theme: { color: "indigo", bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-300", bgSolid: "bg-indigo-500", ring: "ring-indigo-200" },
    types: {
      "magasin_de_velos": { label: "Magasin de vélos", icon: "🚲" },
      "boutique_de_vetements": { label: "Boutique de vêtements", icon: "👗" },
      "institut_de_beaute": { label: "Institut de beauté", icon: "💅" },
      "salon_de_coiffure": { label: "Salon de coiffure", icon: "💇" },
      "librairie": { label: "Librairie", icon: "📚" },
      "presse": { label: "Presse / Tabac", icon: "📰" },
      "tabac": { label: "Tabac", icon: "🚬" },
      "bricolage": { label: "Bricolage", icon: "🛠️" },
      "quincaillerie": { label: "Quincaillerie", icon: "🔧" },
      "laverie": { label: "Laverie", icon: "🧺" },
      "pressing": { label: "Pressing", icon: "👔" },
      "cordonnier": { label: "Cordonnier", icon: "👞" },
      "fleuriste": { label: "Fleuriste", icon: "💐" },
      "bijouterie": { label: "Bijouterie", icon: "💍" },
      "animalerie": { label: "Animalerie", icon: "🐾" },
      "telephonie": { label: "Téléphonie", icon: "📱" },
      "electronique": { label: "Électronique", icon: "💻" },
      "opticien": { label: "Opticien", icon: "👓" },
      "magasin_de_chaussures": { label: "Chaussures", icon: "👞" },
      "boutique_de_cadeaux": { label: "Cadeaux", icon: "🎁" },
      "magasin_de_jouets": { label: "Jouets", icon: "🧸" },
      "magasin_de_sport": { label: "Articles de Sport", icon: "⚽" },
      "photographe": { label: "Photographe", icon: "📷" },
      "musique": { label: "Musique / Instruments", icon: "🎸" },
      "papeterie": { label: "Papeterie", icon: "✏️" },
      "boutique_art": { label: "Boutique d'Art", icon: "🎨" },
      "antiquites": { label: "Antiquités", icon: "🕰️" },
      "accessoires_de_mode": { label: "Accessoires de mode", icon: "👜" },
      "horlogerie": { label: "Horlogerie", icon: "⌚" },
      "parfumerie": { label: "Parfumerie", icon: "🧴" },
      "cosmetiques": { label: "Cosmétiques", icon: "💄" },
      "droguerie": { label: "Droguerie", icon: "🧹" },
      "bazar": { label: "Bazar", icon: "🛒" },
      "grand_magasin": { label: "Grand Magasin", icon: "🏢" },
      "centre_commercial": { label: "Centre Commercial", icon: "🛍️" },
      "agence_de_voyage": { label: "Agence de Voyage", icon: "✈️" },
      "tatoueur": { label: "Tatoueur", icon: "🖋️" },
      "salon_de_massage": { label: "Salon de Massage", icon: "💆" }
    }
  },
  "Nature & Activités Sportives": {
    id: "Nature & Activités Sportives",
    label: "Nature & Activités Sportives",
    icon: "🌳",
    theme: { color: "emerald", bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300", bgSolid: "bg-emerald-500", ring: "ring-emerald-200" },
    types: {
      "plage": { label: "Plage", icon: "🏖️" },
      "zone_de_baignade": { label: "Zone de baignade", icon: "🏊" },
      "parc": { label: "Parc & Jardin", icon: "🌲" },
      "jardin": { label: "Jardin", icon: "🌷" },
      "foret": { label: "Forêt", icon: "🌳" },
      "depart_de_randonnee": { label: "Départ de Randonnée", icon: "🥾" },
      "piste_cyclable": { label: "Piste cyclable / Voie verte", icon: "🚴" },
      "piscine": { label: "Piscine", icon: "🥽" },
      "complexe_sportif": { label: "Complexe sportif", icon: "🏆" },
      "salle_de_sport": { label: "Salle de Sport / Fitness", icon: "🏋️" },
      "stade": { label: "Stade", icon: "🏟️" },
      "terrain_de_sport": { label: "Terrain de sport", icon: "⚽" },
      "terrain_de_golf": { label: "Terrain de Golf", icon: "⛳" },
      "aire_de_jeux": { label: "Aire de jeux", icon: "🛝" },
      "parc_canin": { label: "Parc Canin", icon: "🐕" }
    }
  },
  "Autres Services": {
    id: "Autres Services",
    label: "Autres Services",
    icon: "📌",
    theme: { color: "gray", bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300", bgSolid: "bg-gray-500", ring: "ring-gray-200" },
    types: {
      "other": { label: "Service Divers", icon: "📌" },
      "autre": { label: "Autre", icon: "📌" }
    }
  }
};

/**
 * Helper : Retrouve la Méta-Catégorie et les infos d'un type technique.
 * Si le type est inconnu, mais qu'on connait la catégorie DB parente, on le place dans l' "Autre" de cette famille.
 */
export function getTaxonomyInfo(poiType: string, dbCategories: string[] = []) {
  let foundMetaKey = "Autres Services";
  let foundSubKey = "other";
  
  // 1. Chercher d'abord la correspondance exacte du type (ex: 'boulangerie')
  for (const [metaKey, metaData] of Object.entries(POI_TAXONOMY)) {
    if (metaData.types[poiType]) {
      return {
        metaKey,
        metaData,
        subKey: poiType,
        subData: metaData.types[poiType]
      };
    }
  }
  
  // 2. Si le type technique n'est pas répertorié, on essaie de deviner la Méta-Famille à partir de dbCategories
  if (dbCategories && dbCategories.length > 0) {
    const mainDbCat = dbCategories[0]; // e.g., 'Commerce', 'Restauration', 'Santé'
    if (POI_TAXONOMY[mainDbCat]) {
      foundMetaKey = mainDbCat;
    }
  }
  
  return {
    metaKey: foundMetaKey,
    metaData: POI_TAXONOMY[foundMetaKey],
    subKey: "other",
    subData: { label: poiType.replace(/_/g, ' ') || "Autre", icon: "📌" } 
  };
}
