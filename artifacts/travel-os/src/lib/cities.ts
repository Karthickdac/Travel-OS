// Live city lookup via the server-side geocoding proxy. Returns [] on any
// failure so callers can fall back to the static POPULAR_DESTINATIONS list.
export async function fetchCitySuggestions(query: string): Promise<string[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const res = await fetch(`/api/v1/public/geocode?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { suggestions?: string[] };
    return Array.isArray(data.suggestions) ? data.suggestions : [];
  } catch {
    return [];
  }
}

// Popular Indian travel cities & destinations used for enquiry autocomplete.
// South India / Tamil Nadu first (primary market), then major national spots.
export const POPULAR_DESTINATIONS = [
  // Tamil Nadu
  "Madurai",
  "Chennai",
  "Coimbatore",
  "Tiruchirappalli (Trichy)",
  "Rameshwaram",
  "Kanyakumari",
  "Kodaikanal",
  "Ooty (Udhagamandalam)",
  "Thanjavur",
  "Tirunelveli",
  "Salem",
  "Vellore",
  "Tuticorin",
  "Dindigul",
  "Pollachi",
  "Yercaud",
  "Velankanni",
  "Chidambaram",
  "Kumbakonam",
  "Mahabalipuram",
  "Pondicherry (Puducherry)",
  // Kerala
  "Munnar",
  "Thekkady",
  "Alleppey (Alappuzha)",
  "Kochi (Cochin)",
  "Kovalam",
  "Wayanad",
  "Thiruvananthapuram",
  "Guruvayur",
  // Karnataka
  "Bengaluru (Bangalore)",
  "Mysuru (Mysore)",
  "Coorg (Madikeri)",
  "Chikmagalur",
  "Hampi",
  "Udupi",
  "Mangaluru (Mangalore)",
  // Andhra & Telangana
  "Tirupati",
  "Hyderabad",
  "Visakhapatnam",
  "Srisailam",
  // North & West India
  "Goa",
  "Mumbai",
  "Pune",
  "Delhi",
  "Jaipur",
  "Udaipur",
  "Agra",
  "Varanasi",
  "Rishikesh",
  "Haridwar",
  "Shirdi",
  "Ahmedabad",
  "Amritsar",
  // Himalayas & East
  "Manali",
  "Shimla",
  "Darjeeling",
  "Gangtok",
  "Srinagar",
  "Leh (Ladakh)",
];
