import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "en" | "ta";

export const translations = {
  en: {
    nav: {
      home: "Home",
      packages: "Packages",
      destinations: "Destinations",
      reviews: "Reviews",
      contact: "Contact",
      admin: "Admin",
      bookNow: "Book Now",
    },
    ticker: [
      "🏛️ Madurai Meenakshi Temple", "🌊 Rameshwaram Pilgrimage", "🌅 Kanyakumari Sunrise",
      "🦅 Jatayu Earth Center", "🏖️ Kovalam Beach", "📞 8110806339", "🚗 AC Innova & Crysta Fleet",
      "✅ Safe & Comfortable Travel", "⭐ 4.9 Customer Rating", "🕍 Dhanushkodi Land's End",
    ],
    hero: {
      badge: "Trusted by 5000+ Happy Travellers",
      tagline: '"Your Journey, Our Responsibility"',
      desc: "Premium pilgrimage tours, family trips & outstation cab services across Tamil Nadu and Kerala.",
      book: "Book Your Trip",
      scroll: "Scroll",
    },
    stats: [
      { v: "5000+", l: "Happy Travellers" },
      { v: "10+", l: "Years of Service" },
      { v: "50+", l: "Destinations" },
      { v: "4.9★", l: "Customer Rating" },
    ],
    destinations: {
      eyebrow: "Where We Take You",
      heading: "Our Tour Destinations",
      sub: "Handpicked pilgrimage sites, beaches and heritage landmarks across South India.",
    },
    destCards: [
      { name: "Madurai", tagline: "Temple City of Culture and Heritage" },
      { name: "Rameshwaram", tagline: "Sacred Island of Lord Ramanathaswamy" },
      { name: "Dhanushkodi", tagline: "The Land End – Where History Meets the Sea" },
      { name: "Kanyakumari", tagline: "Where the Sun Rises and Sets in Glory" },
      { name: "Kovalam Beach", tagline: "Relax & Unwind at the Famous Beach Paradise" },
      { name: "Trivandrum", tagline: "Spiritual Bliss at the Divine Temples" },
      { name: "Jatayu Earth Center", tagline: "World's Largest Bird Sculpture" },
    ],
    packages: {
      eyebrow: "Best Value Trips",
      heading: "Featured Tour Packages",
      sub: "All-inclusive packages with transport, stay & guide.",
      callBtn: "Call to Customise",
      from: "Starting from",
      days: "Days",
      book: "Book",
      noPackages: "No packages available. Please check back later.",
    },
    whyUs: {
      eyebrow: "Why Travellers Trust Us",
      heading: "The Madurai SMT\nTravels Promise",
      desc: "Over a decade of taking families, pilgrims and corporate groups safely across South India's most iconic destinations. We don't just arrange travel — we craft memories.",
      bullets: [
        "10+ years of trusted service in South India",
        "Fleet of well-maintained AC vehicles",
        "Experienced, licensed & courteous drivers",
        "Transparent pricing — no hidden charges",
        "Customised itineraries for groups & families",
        "Pilgrimage expertise: Madurai · Rameshwaram · Kanyakumari",
      ],
      call: "Call Now",
      enquire: "Send Enquiry",
    },
    services: {
      eyebrow: "What We Offer",
      heading: "Our Services",
      sub: "Everything for a safe, comfortable and memorable South India journey.",
      items: [
        { label: "Family Tours", desc: "Tailored packages for families of all sizes" },
        { label: "Pilgrimage Trips", desc: "Sacred journeys to holy temples & sites" },
        { label: "Safe Travel", desc: "Experienced drivers & insured vehicles" },
        { label: "24/7 Support", desc: "Always available for bookings & help" },
        { label: "Airport Transfer", desc: "Pickup & drop from any airport" },
        { label: "Outstation Cab", desc: "Comfortable cabs for long distance travel" },
      ],
    },
    cta: {
      heading: "Ready to Plan Your\nDream Journey?",
      sub: "Call us now for instant bookings and customised tour packages. We're available 24/7.",
      enquire: "Send Enquiry",
      tagline: '"Your Journey, Our Responsibility" — Madurai SMT Travels',
    },
    footer: {
      tagline: "Safe • Comfortable • Reliable Travel Service across Tamil Nadu, Kerala and beyond.",
      destinations: "Destinations",
      services: "Services",
      quickLinks: "Quick Links",
      home: "Home",
      tourPackages: "Tour Packages",
      contactUs: "Contact Us",
      adminLogin: "Admin Login",
      copyright: "Madurai SMT Travels. All rights reserved.",
      footerTagline: '"Your Journey, Our Responsibility"',
      serviceItems: ["Family Tours", "Pilgrimage Trips", "Tourist Packages", "Airport Pickup & Drop", "Outstation Cab", "24/7 Support"],
      destItems: ["Madurai", "Rameshwaram", "Kanyakumari", "Kovalam Beach", "Trivandrum", "Dhanushkodi"],
    },
  },
  ta: {
    nav: {
      home: "முகப்பு",
      packages: "தொகுப்புகள்",
      destinations: "இடங்கள்",
      reviews: "மதிப்புரைகள்",
      contact: "தொடர்பு",
      admin: "நிர்வாகம்",
      bookNow: "முன்பதிவு",
    },
    ticker: [
      "🏛️ மதுரை மீனாட்சி கோயில்", "🌊 இராமேஸ்வரம் திருத்தலம்", "🌅 கன்னியாகுமரி சூரியோதயம்",
      "🦅 ஜடாயு பூமி மையம்", "🏖️ கோவளம் கடற்கரை", "📞 8110806339", "🚗 AC இன்னோவா & கிரிஸ்டா",
      "✅ பாதுகாப்பான பயணம்", "⭐ 4.9 மதிப்பீடு", "🕍 தனுஷ்கோடி நிலத்தின் முனை",
    ],
    hero: {
      badge: "5000+ மகிழ்ச்சியான பயணிகளின் நம்பிக்கை",
      tagline: '"உங்கள் பயணம், எங்கள் பொறுப்பு"',
      desc: "தமிழ்நாடு மற்றும் கேரளா முழுவதும் திருத்தல பயணங்கள், குடும்ப சுற்றுலாக்கள் & அவுட்ஸ்டேஷன் கேப் சேவைகள்.",
      book: "பயணம் முன்பதிவு செய்யுங்கள்",
      scroll: "கீழே",
    },
    stats: [
      { v: "5000+", l: "மகிழ்ச்சியான பயணிகள்" },
      { v: "10+", l: "சேவை வருடங்கள்" },
      { v: "50+", l: "சுற்றுலா இடங்கள்" },
      { v: "4.9★", l: "வாடிக்கையாளர் மதிப்பீடு" },
    ],
    destinations: {
      eyebrow: "நாங்கள் அழைத்துச் செல்லும் இடங்கள்",
      heading: "எங்கள் சுற்றுலா இடங்கள்",
      sub: "தென் இந்தியாவின் புகழ்பெற்ற திருத்தலங்கள், கடற்கரைகள் மற்றும் பாரம்பரிய தலங்கள்.",
    },
    destCards: [
      { name: "மதுரை", tagline: "கலாச்சாரம் மற்றும் பாரம்பரியத்தின் கோயில் நகரம்" },
      { name: "இராமேஸ்வரம்", tagline: "இராமநாதசுவாமி பகவானின் புனித தீவு" },
      { name: "தனுஷ்கோடி", tagline: "நிலத்தின் முனை - வரலாறும் கடலும் சங்கமிக்கும் இடம்" },
      { name: "கன்னியாகுமரி", tagline: "சூரியன் உதிக்கும் மற்றும் மறையும் புகழ்பெற்ற இடம்" },
      { name: "கோவளம் கடற்கரை", tagline: "புகழ்பெற்ற கடற்கரை சொர்க்கம் — நிம்மதி மற்றும் இளைப்பாறல்" },
      { name: "திருவனந்தபுரம்", tagline: "திருவனந்தபுரத்தின் புனித கோயில்களில் ஆன்மீக ஆனந்தம்" },
      { name: "ஜடாயு பூமி மையம்", tagline: "உலகின் மிகப்பெரிய பறவை சிற்பம்" },
    ],
    packages: {
      eyebrow: "சிறந்த விலையில் பயணங்கள்",
      heading: "சிறப்பு சுற்றுலா தொகுப்புகள்",
      sub: "போக்குவரத்து, தங்குமிடம் & வழிகாட்டி உட்பட அனைத்தும் அடங்கிய தொகுப்புகள்.",
      callBtn: "தனிப்பயனாக்க அழையுங்கள்",
      from: "தொடக்க விலை",
      days: "நாட்கள்",
      book: "முன்பதிவு",
      noPackages: "தொகுப்புகள் இல்லை. தயவுசெய்து பிறகு பாருங்கள்.",
    },
    whyUs: {
      eyebrow: "பயணிகள் ஏன் நம்புகிறார்கள்",
      heading: "மதுரை SMT டிராவல்ஸ்\nவாக்குறுதி",
      desc: "கடந்த பத்தாண்டுகளாக குடும்பங்கள், திருத்தல பயணிகள் மற்றும் கார்ப்பரேட் குழுக்களை தென் இந்தியாவின் புகழ்பெற்ற தலங்களுக்கு பாதுகாப்பாக அழைத்துச் செல்கிறோம்.",
      bullets: [
        "தென் இந்தியாவில் 10+ ஆண்டுகால நம்பகமான சேவை",
        "நன்கு பராமரிக்கப்பட்ட AC வாகன தொகுப்பு",
        "அனுபவமிக்க, உரிமம் பெற்ற & கண்ணியமான ஓட்டுனர்கள்",
        "வெளிப்படையான விலை நிர்ணயம் — மறைமுக கட்டணங்கள் இல்லை",
        "குழுக்கள் & குடும்பங்களுக்கான தனிப்பயன் பயண திட்டங்கள்",
        "திருத்தல நிபுணத்துவம்: மதுரை · இராமேஸ்வரம் · கன்னியாகுமரி",
      ],
      call: "இப்போது அழையுங்கள்",
      enquire: "விசாரணை அனுப்புங்கள்",
    },
    services: {
      eyebrow: "எங்கள் சேவைகள்",
      heading: "நாங்கள் வழங்குவது",
      sub: "பாதுகாப்பான, வசதியான மற்றும் மறக்க முடியாத தென் இந்தியா பயணத்திற்கு அனைத்தும்.",
      items: [
        { label: "குடும்ப சுற்றுலாக்கள்", desc: "எல்லா அளவிலான குடும்பங்களுக்கும் தனிப்பயன் தொகுப்புகள்" },
        { label: "திருத்தல யாத்திரைகள்", desc: "புனித கோயில்கள் & தலங்களுக்கு ஆன்மீக பயணங்கள்" },
        { label: "பாதுகாப்பான பயணம்", desc: "அனுபவமிக்க ஓட்டுனர்கள் & காப்பீடு செய்யப்பட்ட வாகனங்கள்" },
        { label: "24/7 ஆதரவு", desc: "முன்பதிவு & உதவிக்கு எப்போதும் கிடைக்கும்" },
        { label: "விமான நிலைய பரிமாற்றம்", desc: "எந்த விமான நிலையத்திலிருந்தும் ஏற்று விடுதல்" },
        { label: "அவுட்ஸ்டேஷன் கேப்", desc: "நீண்ட தூர பயணத்திற்கு வசதியான கேப்கள்" },
      ],
    },
    cta: {
      heading: "உங்கள் கனவு பயணத்தை\nதிட்டமிட தயாரா?",
      sub: "உடனடி முன்பதிவு மற்றும் தனிப்பயன் சுற்றுலா தொகுப்புகளுக்கு இப்போது அழையுங்கள். நாங்கள் 24/7 கிடைக்கிறோம்.",
      enquire: "விசாரணை அனுப்புங்கள்",
      tagline: '"உங்கள் பயணம், எங்கள் பொறுப்பு" — மதுரை SMT டிராவல்ஸ்',
    },
    footer: {
      tagline: "தமிழ்நாடு, கேரளா முழுவதும் பாதுகாப்பான • வசதியான • நம்பகமான பயண சேவை.",
      destinations: "இடங்கள்",
      services: "சேவைகள்",
      quickLinks: "விரைவு இணைப்புகள்",
      home: "முகப்பு",
      tourPackages: "சுற்றுலா தொகுப்புகள்",
      contactUs: "தொடர்பு கொள்ளுங்கள்",
      adminLogin: "நிர்வாக உள்நுழைவு",
      copyright: "மதுரை SMT டிராவல்ஸ். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
      footerTagline: '"உங்கள் பயணம், எங்கள் பொறுப்பு"',
      serviceItems: ["குடும்ப சுற்றுலாக்கள்", "திருத்தல யாத்திரைகள்", "சுற்றுலா தொகுப்புகள்", "விமான நிலைய சேவை", "அவுட்ஸ்டேஷன் கேப்", "24/7 ஆதரவு"],
      destItems: ["மதுரை", "இராமேஸ்வரம்", "கன்னியாகுமரி", "கோவளம் கடற்கரை", "திருவனந்தபுரம்", "தனுஷ்கோடி"],
    },
  },
} as const;

type Translations = typeof translations.en;

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const LangContext = createContext<LangContextType | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const t = translations[lang] as Translations;
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside LangProvider");
  return ctx;
}
