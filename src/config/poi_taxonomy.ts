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
      "michelin_starred": { label: "Restaurant étoilé Michelin", icon: "⭐️" },
      "michelin_bib": { label: "Restaurant (Bib Gourmand)", icon: "😋" },
      "relais_routier": { label: "Relais Routier", icon: "🚚" },
      "fast_food": { label: "Restauration rapide", icon: "🍔" },
      "cafe": { label: "Café", icon: "☕" },
      "bar": { label: "Bar", icon: "🍺" },
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
      "bakery": { label: "Boulangerie & Pâtisserie", icon: "🥐" },
      "supermarket": { label: "Supermarché", icon: "🛒" },
      "convenience": { label: "Supérette", icon: "🧺" },
      "butcher": { label: "Boucherie", icon: "🥩" },
      "seafood": { label: "Poissonnerie", icon: "🐟" },
      "greengrocer": { label: "Primeur", icon: "🥦" },
      "wine": { label: "Caviste", icon: "🍷" },
      "cheese": { label: "Fromagerie", icon: "🧀" },
      "deli": { label: "Épicerie fine", icon: "🍯" }
    }
  },
  "Tourisme & Culture": {
    id: "Tourisme & Culture",
    label: "Tourisme & Culture",
    icon: "🏰",
    theme: { color: "fuchsia", bg: "bg-fuchsia-100", text: "text-fuchsia-700", border: "border-fuchsia-300", bgSolid: "bg-fuchsia-500", ring: "ring-fuchsia-200" },
    types: {
      "museum": { label: "Musée", icon: "🏛️" },
      "gallery": { label: "Galerie d'art", icon: "🖼️" },
      "theme_park": { label: "Parc d'attractions", icon: "🎢" },
      "water_park": { label: "Parc aquatique", icon: "🌊" },
      "monument": { label: "Monument Historique", icon: "🗽" },
      "castle": { label: "Château", icon: "🏰" },
      "viewpoint": { label: "Point de vue / Panorama", icon: "🌄" },
      "event": { label: "Événement culturel", icon: "🎟️" },
      "information": { label: "Office de Tourisme", icon: "ℹ️" }
    }
  },
  "Santé & Soins": {
    id: "Santé & Soins",
    label: "Santé & Soins",
    icon: "🏥",
    theme: { color: "red", bg: "bg-red-100", text: "text-red-700", border: "border-red-300", bgSolid: "bg-red-500", ring: "ring-red-200" },
    types: {
      "pharmacy": { label: "Pharmacie", icon: "⚕️" },
      "hospital": { label: "Hôpital", icon: "🚑" },
      "clinic": { label: "Clinique", icon: "🏥" },
      "doctors": { label: "Médecin", icon: "🩺" },
      "dentist": { label: "Dentiste", icon: "🦷" }
    }
  },
  "Services Publics & Pratiques": {
    id: "Services Publics & Pratiques",
    label: "Services Publics & Pratiques",
    icon: "🏛️",
    theme: { color: "slate", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300", bgSolid: "bg-slate-500", ring: "ring-slate-200" },
    types: {
      "townhall": { label: "Mairie & Administration", icon: "🇫🇷" },
      "public_building": { label: "Bâtiment public", icon: "🏛️" },
      "post_office": { label: "Bureau de Poste", icon: "📮" },
      "bank": { label: "Banque", icon: "🏦" },
      "atm": { label: "Distributeur automatique", icon: "💶" },
      "toilets": { label: "Toilettes publiques", icon: "🚾" },
      "gas": { label: "Station Service", icon: "⛽" },
      "car_wash": { label: "Station de lavage", icon: "🧽" },
      "car_repair": { label: "Garage automobile", icon: "🚙" },
      "waste_disposal": { label: "Déchetterie", icon: "♻️" },
      "waste_basket": { label: "Poubelle publique", icon: "🗑️" }
    }
  },
  "Boutiques & Services": {
    id: "Boutiques & Services",
    label: "Boutiques & Services",
    icon: "🛍️",
    theme: { color: "indigo", bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-300", bgSolid: "bg-indigo-500", ring: "ring-indigo-200" },
    types: {
      "bicycle": { label: "Magasin de vélos", icon: "🚲" },
      "clothes": { label: "Boutique de vêtements", icon: "👗" },
      "beauty": { label: "Institut de beauté", icon: "💅" },
      "hairdresser": { label: "Salon de coiffure", icon: "💇" },
      "books": { label: "Librairie", icon: "📚" },
      "newsagent": { label: "Presse / Tabac", icon: "📰" },
      "tobacco": { label: "Tabac", icon: "🚬" },
      "doityourself": { label: "Bricolage", icon: "🛠️" },
      "hardware": { label: "Quincaillerie", icon: "🔧" },
      "laundry": { label: "Laverie", icon: "🧺" },
      "dry_cleaning": { label: "Pressing", icon: "👔" },
      "shoe_repair": { label: "Cordonnier", icon: "👞" },
      "florist": { label: "Fleuriste", icon: "💐" },
      "jewelry": { label: "Bijouterie", icon: "💍" },
      "pet": { label: "Animalerie", icon: "🐾" },
      "mobile_phone": { label: "Téléphonie", icon: "📱" },
      "electronics": { label: "Électronique", icon: "💻" }
    }
  },
  "Nature & Activités Sportives": {
    id: "Nature & Activités Sportives",
    label: "Nature & Activités Sportives",
    icon: "🌳",
    theme: { color: "emerald", bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300", bgSolid: "bg-emerald-500", ring: "ring-emerald-200" },
    types: {
      "beach": { label: "Plage", icon: "🏖️" },
      "swimming_area": { label: "Zone de baignade", icon: "🏊" },
      "park": { label: "Parc & Jardin", icon: "🌲" },
      "forest": { label: "Forêt", icon: "🌳" },
      "hiking": { label: "Départ de Randonnée", icon: "🥾" },
      "cycling": { label: "Piste cyclable / Voie verte", icon: "🚴" },
      "swimming_pool": { label: "Piscine", icon: "🥽" },
      "sports_centre": { label: "Complexe sportif", icon: "⚽" },
      "playground": { label: "Aire de jeux", icon: "🛝" },
      "pitch": { label: "Terrain de sport", icon: "🏀" }
    }
  },
  "Autres Services": {
    id: "Autres Services",
    label: "Autres Services",
    icon: "📌",
    theme: { color: "gray", bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300", bgSolid: "bg-gray-500", ring: "ring-gray-200" },
    types: {
      "other": { label: "Service Divers", icon: "📌" }
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
  
  // 1. Chercher d'abord la correspondance exacte du type (ex: 'bakery')
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
