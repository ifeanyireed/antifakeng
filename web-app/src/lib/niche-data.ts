import { NicheId } from "@/components/ahnara/NicheContext";

export interface NicheData {
  id: NicheId;
  name: string;
  heroTitle: string;
  colorClass: string;
  darkColorClass: string;
  personality: string;
  subServices: string[];
  products: { name: string; price: string; image: string }[];
  parentNicheId?: string; // To link back to main niche if it's a subgroup
}

export const NICHE_DETAILS: Record<string, NicheData> = {
  "home-services": {
    id: "home-services",
    name: "Home & Maintenance",
    heroTitle: "Reliable Help for Your Home",
    colorClass: "bg-home",
    darkColorClass: "dark:bg-home",
    personality: "Reliable, hands-on, functional",
    subServices: ["Plumber Finder", "Electrician Finder", "Carpenter Finder", "Painter Finder", "Tiler Finder", "Welder Finder"],
    products: [
      { name: "Premium Emulsion Paint", price: "₦45,000", image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400" },
      { name: "Heavy Duty Drill", price: "₦120,000", image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=400" }
    ]
  },
  "handyman-finders": {
    id: "home-services",
    name: "Handyman Finders",
    heroTitle: "Expert Handymen for Every Task",
    colorClass: "bg-home",
    darkColorClass: "dark:bg-home",
    personality: "Reliable, hands-on, functional",
    subServices: ["Plumber Finder", "Electrician Finder", "Carpenter Finder", "Painter Finder", "Tiler Finder", "Welder Finder"],
    products: [
      { name: "Heavy Duty Drill", price: "₦120,000", image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=400" }
    ],
    parentNicheId: "home-services"
  },
  "specialist-finders": {
    id: "home-services",
    name: "Specialist Finders",
    heroTitle: "Highly Skilled Technical Specialists",
    colorClass: "bg-home",
    darkColorClass: "dark:bg-home",
    personality: "Technical, specialized, expert",
    subServices: ["Solar Installer Finder", "Generator Repairer Finder", "AC Technician Finder", "Borehole Driller Finder", "Inverter Repairer Finder"],
    products: [
      { name: "Solar Inverter 5KVA", price: "₦850,000", image: "https://images.unsplash.com/photo-1509391366360-feaffa648bd8?auto=format&fit=crop&q=80&w=400" }
    ],
    parentNicheId: "home-services"
  },
  "sanitation-finders": {
    id: "home-services",
    name: "Sanitation Finders",
    heroTitle: "Professional Cleaning & Hygiene",
    colorClass: "bg-home",
    darkColorClass: "dark:bg-home",
    personality: "Clean, thorough, reliable",
    subServices: ["Home Cleaner Finder", "Fumigator (Pest Control) Finder", "Waste Disposal Finder", "Water Tank Cleaner Finder"],
    products: [
      { name: "Industrial Vacuum Cleaner", price: "₦75,000", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6958?auto=format&fit=crop&q=80&w=400" }
    ],
    parentNicheId: "home-services"
  },
  "fashion-grooming": {
    id: "fashion",
    name: "Fashion & Grooming",
    heroTitle: "Style & Personal Care",
    colorClass: "bg-fashion",
    darkColorClass: "dark:bg-fashion",
    personality: "Stylish, aspirational, personal",
    subServices: ["Tailor (Bespoke) Finder", "Hairdresser (Braider) Finder", "Barber Finder", "Makeup Artist Finder", "Manicurist (Nail Tech) Finder"],
    products: [
      { name: "Bespoke Suit Fabric", price: "₦85,000", image: "https://images.unsplash.com/photo-1594932224828-b4b059b6f68d?auto=format&fit=crop&q=80&w=400" },
      { name: "Organic Hair Serum", price: "₦12,500", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400" }
    ]
  },
  "style-finders": {
    id: "fashion",
    name: "Style Finders",
    heroTitle: "Premium Fashion & Beauty Experts",
    colorClass: "bg-fashion",
    darkColorClass: "dark:bg-fashion",
    personality: "Stylish, aspirational, personal",
    subServices: ["Tailor (Bespoke) Finder", "Hairdresser (Braider) Finder", "Barber Finder", "Makeup Artist Finder", "Manicurist (Nail Tech) Finder"],
    products: [
      { name: "Bespoke Suit Fabric", price: "₦85,000", image: "https://images.unsplash.com/photo-1594932224828-b4b059b6f68d?auto=format&fit=crop&q=80&w=400" }
    ],
    parentNicheId: "fashion-grooming"
  },
  "wardrobe-finders": {
    id: "fashion",
    name: "Wardrobe Finders",
    heroTitle: "Care for Your Apparel",
    colorClass: "bg-fashion",
    darkColorClass: "dark:bg-fashion",
    personality: "Meticulous, organized, helpful",
    subServices: ["Laundry Finder", "Dry Cleaner Finder", "Personal Shopper Finder", "Cobbler (Shoe Repair) Finder"],
    products: [
      { name: "Premium Leather Polish", price: "₦3,500", image: "https://images.unsplash.com/photo-1614786413234-73d1576d91d4?auto=format&fit=crop&q=80&w=400" }
    ],
    parentNicheId: "fashion-grooming"
  },
  "professional-services": {
    id: "professionals",
    name: "Professional Services",
    heroTitle: "Expert Business Solutions",
    colorClass: "bg-professionals",
    darkColorClass: "dark:bg-professionals",
    personality: "Authoritative, trusted, corporate",
    subServices: ["Web Developer Finder", "App Developer Finder", "UI/UX Designer Finder", "SEO Expert Finder", "Cybersecurity Consultant Finder"],
    products: [
      { name: "Business Consultation", price: "₦50,000/hr", image: "https://images.unsplash.com/photo-1454165833767-027ffea9e77b?auto=format&fit=crop&q=80&w=400" }
    ]
  },
  "tech-finders": {
    id: "professionals",
    name: "Tech Finders",
    heroTitle: "Innovative Digital Solutions",
    colorClass: "bg-professionals",
    darkColorClass: "dark:bg-professionals",
    personality: "Cutting-edge, precise, innovative",
    subServices: ["Web Developer Finder", "App Developer Finder", "UI/UX Designer Finder", "SEO Expert Finder", "Cybersecurity Consultant Finder"],
    products: [
      { name: "Software Development Kit", price: "₦150,000", image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400" }
    ],
    parentNicheId: "professional-services"
  },
  "corporate-finders": {
    id: "professionals",
    name: "Corporate Finders",
    heroTitle: "Trusted Business Advisors",
    colorClass: "bg-professionals",
    darkColorClass: "dark:bg-professionals",
    personality: "Corporate, reliable, professional",
    subServices: ["Lawyer Finder", "Accountant Finder", "Tax Consultant Finder", "Business Consultant Finder", "Grant Writer Finder"],
    products: [
      { name: "Corporate Legal Template", price: "₦25,000", image: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&q=80&w=400" }
    ],
    parentNicheId: "professional-services"
  },
  "content-finders": {
    id: "professionals",
    name: "Content Finders",
    heroTitle: "Creative Content Creators",
    colorClass: "bg-professionals",
    darkColorClass: "dark:bg-professionals",
    personality: "Creative, visual, engaging",
    subServices: ["Copywriter Finder", "Social Media Manager Finder", "Graphic Designer Finder", "Video Editor Finder", "Translator Finder"],
    products: [
      { name: "Vlog Lighting Set", price: "₦45,000", image: "https://images.unsplash.com/photo-1594465919760-441fe5908ab0?auto=format&fit=crop&q=80&w=400" }
    ],
    parentNicheId: "professional-services"
  },
  "talent-finders": {
    id: "professionals",
    name: "Talent Finders",
    heroTitle: "Connecting You with Top Talent",
    colorClass: "bg-professionals",
    darkColorClass: "dark:bg-professionals",
    personality: "Charismatic, professional, diverse",
    subServices: ["Model Finder", "Actor Finder", "Voice-Over Artist Finder"],
    products: [
      { name: "Professional Headshot Session", price: "₦35,000", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400" }
    ],
    parentNicheId: "professional-services"
  },
  "education-skills": {
    id: "education",
    name: "Education & Skills",
    heroTitle: "Learn and Grow",
    colorClass: "bg-education",
    darkColorClass: "dark:bg-education",
    personality: "Inspiring, growth-oriented, warm",
    subServices: ["Home Tutor Finder", "Music Instructor Finder", "Language Teacher Finder", "Exam Prep Tutor Finder", "School Finder"],
    products: [
      { name: "Piano Lesson Book", price: "₦5,000", image: "https://images.unsplash.com/photo-1520529611443-d220497235d7?auto=format&fit=crop&q=80&w=400" }
    ]
  },
  "academic-finders": {
    id: "education",
    name: "Academic Finders",
    heroTitle: "Excellence in Learning",
    colorClass: "bg-education",
    darkColorClass: "dark:bg-education",
    personality: "Academic, focused, nurturing",
    subServices: ["Home Tutor Finder", "Music Instructor Finder", "Language Teacher Finder", "Exam Prep Tutor Finder", "School Finder"],
    products: [
      { name: "Mathematics Textbook", price: "₦4,500", image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400" }
    ],
    parentNicheId: "education-skills"
  },
  "vocational-finders": {
    id: "education",
    name: "Vocational Finders",
    heroTitle: "Master New Skills",
    colorClass: "bg-education",
    darkColorClass: "dark:bg-education",
    personality: "Practical, skill-focused, empowering",
    subServices: ["Driving School Instructor Finder", "Tech Skill Trainer Finder", "Fashion School Instructor Finder", "Catering School Instructor Finder"],
    products: [
      { name: "Beginner Design Kit", price: "₦15,000", image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=400" }
    ],
    parentNicheId: "education-skills"
  },
  "events-entertainment": {
    id: "events",
    name: "Events & Entertainment",
    heroTitle: "Celebrate Life's Moments",
    colorClass: "bg-events",
    darkColorClass: "dark:bg-events",
    personality: "Vibrant, celebratory, energetic",
    subServices: ["Event Planner Finder", "Decorator Finder", "Souvenir Vendor Finder", "Ushering Agency Finder"],
    products: [
      { name: "Party Lighting Kit", price: "₦250,000", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=400" }
    ]
  },
  "planning-finders": {
    id: "events",
    name: "Planning Finders",
    heroTitle: "Perfectly Orchestrated Events",
    colorClass: "bg-events",
    darkColorClass: "dark:bg-events",
    personality: "Organized, creative, reliable",
    subServices: ["Event Planner Finder", "Decorator Finder", "Souvenir Vendor Finder", "Ushering Agency Finder"],
    products: [
      { name: "Event Planning Guide", price: "₦10,000", image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=400" }
    ],
    parentNicheId: "events-entertainment"
  },
  "entertainment-finders": {
    id: "events",
    name: "Entertainment Finders",
    heroTitle: "Unforgettable Event Entertainment",
    colorClass: "bg-events",
    darkColorClass: "dark:bg-events",
    personality: "Vibrant, energetic, entertaining",
    subServices: ["DJ Finder", "MC Finder", "Photographer Finder", "Videographer Finder", "Drone Pilot Finder", "Live Band / Musician Finder"],
    products: [
      { name: "Premium Party Speaker", price: "₦150,000", image: "https://images.unsplash.com/photo-1545454671-1b3a02766039?auto=format&fit=crop&q=80&w=400" }
    ],
    parentNicheId: "events-entertainment"
  },
  "health-wellness": {
    id: "health",
    name: "Health & Wellness",
    heroTitle: "Your Well-being First",
    colorClass: "bg-health",
    darkColorClass: "dark:bg-health",
    personality: "Clean, clinical, trustworthy",
    subServices: ["Private Nurse Finder", "Physiotherapist Finder", "Dentist Finder", "Optician Finder", "Pharmacy Finder"],
    products: [
      { name: "Yoga Mat Pro", price: "₦18,000", image: "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&q=80&w=400" }
    ]
  },
  "medical-finders": {
    id: "health",
    name: "Medical Finders",
    heroTitle: "Professional Medical Care",
    colorClass: "bg-health",
    darkColorClass: "dark:bg-health",
    personality: "Clinical, professional, caring",
    subServices: ["Private Nurse Finder", "Physiotherapist Finder", "Dentist Finder", "Optician Finder", "Pharmacy Finder"],
    products: [
      { name: "First Aid Kit", price: "₦12,000", image: "https://images.unsplash.com/photo-1603398938378-e54eab446ddd?auto=format&fit=crop&q=80&w=400" }
    ],
    parentNicheId: "health-wellness"
  },
  "wellness-finders": {
    id: "health",
    name: "Wellness Finders",
    heroTitle: "Holistic Health & Vitality",
    colorClass: "bg-health",
    darkColorClass: "dark:bg-health",
    personality: "Zen, rejuvenating, calm",
    subServices: ["Gym Instructor Finder", "Yoga Teacher Finder", "Nutritionist Finder", "Massage Therapist Finder"],
    products: [
      { name: "Essential Oil Set", price: "₦8,500", image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=400" }
    ],
    parentNicheId: "health-wellness"
  },
  "care-finders": {
    id: "health",
    name: "Care Finders",
    heroTitle: "Compassionate Care Services",
    colorClass: "bg-health",
    darkColorClass: "dark:bg-health",
    personality: "Caring, responsible, warm",
    subServices: ["Nanny Finder", "Elderly Companion Finder", "Pet Sitter Finder"],
    products: [
      { name: "Nanny Selection Guide", price: "₦5,000", image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=400" }
    ],
    parentNicheId: "health-wellness"
  },
  "logistics-transport": {
    id: "logistics",
    name: "Logistics & Transport",
    heroTitle: "Move Anything, Anywhere",
    colorClass: "bg-logistics",
    darkColorClass: "dark:bg-logistics",
    personality: "Fast, direct, operational",
    subServices: ["Professional Driver Finder", "Towing Van Finder", "Car Rental Finder", "Bus Hire Finder"],
    products: [
      { name: "Heavy Duty Packing Boxes", price: "₦2,500", image: "https://images.unsplash.com/photo-1524514587686-e2909d726e9b?auto=format&fit=crop&q=80&w=400" }
    ]
  },
  "delivery-finders": {
    id: "logistics",
    name: "Delivery Finders",
    heroTitle: "Fast & Reliable Deliveries",
    colorClass: "bg-logistics",
    darkColorClass: "dark:bg-logistics",
    personality: "Swift, efficient, trackable",
    subServices: ["Dispatch Rider (Logistics) Finder", "Errand Runner Finder", "Moving / Relocation Service Finder"],
    products: [
      { name: "Protective Bubble Wrap", price: "₦4,000", image: "https://images.unsplash.com/photo-1530543787849-128d94430c6a?auto=format&fit=crop&q=80&w=400" }
    ],
    parentNicheId: "logistics-transport"
  },
  "transport-finders": {
    id: "logistics",
    name: "Transport Finders",
    heroTitle: "Seamless Travel Solutions",
    colorClass: "bg-logistics",
    darkColorClass: "dark:bg-logistics",
    personality: "Mobile, reliable, widespread",
    subServices: ["Professional Driver Finder", "Towing Van Finder", "Car Rental Finder", "Bus Hire Finder"],
    products: [
      { name: "Travel Organizer", price: "₦6,500", image: "https://images.unsplash.com/photo-1553913861-c0fddf2619ee?auto=format&fit=crop&q=80&w=400" }
    ],
    parentNicheId: "logistics-transport"
  },
  "automotive-services": {
    id: "auto",
    name: "Automotive Services",
    heroTitle: "Keep Your Wheels Turning",
    colorClass: "bg-auto",
    darkColorClass: "dark:bg-auto",
    personality: "Technical, masculine, mechanical",
    subServices: ["Car Mechanic Finder", "Vulcanizer Finder", "Panel Beater Finder", "Auto Electrician Finder"],
    products: [
      { name: "Synthetic Engine Oil", price: "₦15,000", image: "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&q=80&w=400" }
    ]
  },
  "repair-finders": {
    id: "auto",
    name: "Repair Finders",
    heroTitle: "Expert Auto Repairs",
    colorClass: "bg-auto",
    darkColorClass: "dark:bg-auto",
    personality: "Technical, mechanical, reliable",
    subServices: ["Car Mechanic Finder", "Vulcanizer Finder", "Panel Beater Finder", "Auto Electrician Finder"],
    products: [
      { name: "Diagnostic Scan Tool", price: "₦45,000", image: "https://images.unsplash.com/photo-1544265852-a41551cb418b?auto=format&fit=crop&q=80&w=400" }
    ],
    parentNicheId: "automotive-services"
  },
  "auto-care-finders": {
    id: "auto",
    name: "Auto Care Finders",
    heroTitle: "Pristine Auto Maintenance",
    colorClass: "bg-auto",
    darkColorClass: "dark:bg-auto",
    personality: "Detailed, protective, aesthetic",
    subServices: ["Mobile Car Wash Finder", "Car Tracker Installer Finder", "CCTV / Security Installer Finder"],
    products: [
      { name: "Premium Car Wax", price: "₦12,000", image: "https://images.unsplash.com/photo-1563911194472-50974b6094fe?auto=format&fit=crop&q=80&w=400" }
    ],
    parentNicheId: "automotive-services"
  },
  "food-agribusiness": {
    id: "food",
    name: "Food & Agribusiness",
    heroTitle: "Farm to Table",
    colorClass: "bg-food",
    darkColorClass: "dark:bg-food",
    personality: "Warm, appetising, community",
    subServices: ["Private Chef Finder", "Caterer Finder", "Cake Baker Finder", "Bulk Food Supplier Finder"],
    products: [
      { name: "Fresh Basket of Yam", price: "₦12,000", image: "https://images.unsplash.com/photo-1590779033100-9f60705a2f3b?auto=format&fit=crop&q=80&w=400" }
    ]
  },
  "culinary-finders": {
    id: "food",
    name: "Culinary Finders",
    heroTitle: "Exquisite Tastes & Catering",
    colorClass: "bg-food",
    darkColorClass: "dark:bg-food",
    personality: "Gourmet, professional, delicious",
    subServices: ["Private Chef Finder", "Caterer Finder", "Cake Baker Finder", "Bulk Food Supplier Finder"],
    products: [
      { name: "Chef's Knife Set", price: "₦55,000", image: "https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&q=80&w=400" }
    ],
    parentNicheId: "food-agribusiness"
  },
  "agro-finders": {
    id: "food",
    name: "Agro Finders",
    heroTitle: "Sustainable Farming & Produce",
    colorClass: "bg-food",
    darkColorClass: "dark:bg-food",
    personality: "Earth, productive, vital",
    subServices: ["Farm Manager Finder", "Agro-Processor Finder", "Veterinary Doctor Finder", "Pet Groomer Finder", "Poultry Farmer Finder", "Fish Farmer Finder"],
    products: [
      { name: "Organic Fertilizer", price: "₦8,000", image: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=400" }
    ],
    parentNicheId: "food-agribusiness"
  },
  "real-estate-construction": {
    id: "realestate",
    name: "Real Estate & Construction",
    heroTitle: "Build Your Dream",
    colorClass: "bg-realestate",
    darkColorClass: "dark:bg-realestate",
    personality: "Earthy, aspirational, solid",
    subServices: ["Estate Agent Finder", "Facility Manager Finder", "Surveyor Finder", "Quantity Surveyor Finder"],
    products: [
      { name: "Architectural Blueprint", price: "₦150,000", image: "https://images.unsplash.com/photo-1503387762-592dea58ef23?auto=format&fit=crop&q=80&w=400" }
    ]
  },
  "property-finders": {
    id: "realestate",
    name: "Property Finders",
    heroTitle: "Find Your Perfect Space",
    colorClass: "bg-realestate",
    darkColorClass: "dark:bg-realestate",
    personality: "Professional, knowledgeable, direct",
    subServices: ["Estate Agent Finder", "Facility Manager Finder", "Surveyor Finder", "Quantity Surveyor Finder"],
    products: [
      { name: "Property Valuation Report", price: "₦40,000", image: "https://images.unsplash.com/photo-1560514196-46c8242ad059?auto=format&fit=crop&q=80&w=400" }
    ],
    parentNicheId: "real-estate-construction"
  },
  "building-finders": {
    id: "realestate",
    name: "Building Finders",
    heroTitle: "Expert Construction Partners",
    colorClass: "bg-realestate",
    darkColorClass: "dark:bg-realestate",
    personality: "Solid, technical, creative",
    subServices: ["Architect Finder", "Bricklayer Finder", "Aluminum Fitter Finder", "POP Ceiling Installer Finder"],
    products: [
      { name: "Construction Safety Helmet", price: "₦5,500", image: "https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fit=crop&q=80&w=400" }
    ],
    parentNicheId: "real-estate-construction"
  }
};

export const SPECIALTY_TO_NICHE_MAP: Record<string, string> = {
    "fashion": "fashion-grooming",
    "professionals": "professional-services",
    "education": "education-skills",
    "events": "events-entertainment",
    "health": "health-wellness",
    "logistics": "logistics-transport",
    "auto": "automotive-services",
    "food": "food-agribusiness",
    "realestate": "real-estate-construction",

    // Home Services
    "plumber": "home-services",
    "electrician": "home-services",
    "carpenter": "home-services",
    "painter": "home-services",
    "tiler": "home-services",
    "welder": "home-services",
    "solar-installer": "home-services",
    "generator-repairer": "home-services",
    "ac-technician": "home-services",
    "borehole-driller": "home-services",
    "inverter-repairer": "home-services",
    "home-cleaner": "home-services",
    "fumigator": "home-services",

    // Fashion
    "tailor": "fashion-grooming",
    "barber": "fashion-grooming",
    "hairdresser": "fashion-grooming",
    "makeup-artist": "fashion-grooming",
    "manicurist": "fashion-grooming",

    // Professionals
    "web-developer": "professional-services",
    "uiux-designer": "professional-services",
    "lawyer": "professional-services",
    "accountant": "professional-services",
    "copywriter": "professional-services",
    "social-media-manager": "professional-services",
    "model": "professional-services",
    "voiceover-artist": "professional-services",
    "voice-over-artist": "professional-services",

    // Education
    "home-tutor": "education-skills",
    "music-instructor": "education-skills",
    "driving-school": "education-skills",
    "tech-skill-trainer": "education-skills",

    // Events
    "event-planner": "events-entertainment",
    "decorator": "events-entertainment",
    "dj": "events-entertainment",
    "photographer": "events-entertainment",

    // Health
    "private-nurse": "health-wellness",
    "physiotherapist": "health-wellness",
    "gym-instructor": "health-wellness",
    "yoga-teacher": "health-wellness",
    "nanny": "health-wellness",
    "elderly-companion": "health-wellness",

    // Logistics
    "professional-driver": "logistics-transport",
    "towing-van": "logistics-transport",
    "dispatch-rider": "logistics-transport",
    "moving-service": "logistics-transport",

    // Auto
    "car-mechanic": "automotive-services",
    "vulcanizer": "automotive-services",
    "mobile-car-wash": "automotive-services",
    "car-tracker-installer": "automotive-services",

    // Food
    "private-chef": "food-agribusiness",
    "cake-maker": "food-agribusiness",
    "cake-baker": "food-agribusiness",
    "farm-manager": "food-agribusiness",
    "veterinary-doctor": "food-agribusiness",

    // Real Estate
    "estate-agent": "real-estate-construction",
    "facility-manager": "real-estate-construction",
    "architect": "real-estate-construction",
    "bricklayer": "real-estate-construction"
};

export function getNicheData(slug: string): NicheData {
  const targetKey = SPECIALTY_TO_NICHE_MAP[slug] || slug;
  return NICHE_DETAILS[targetKey] || NICHE_DETAILS["home-services"];
}

export function getAllNicheSlugs(): string[] {
  const shortSlugs = [
    "fashion",
    "professionals",
    "education",
    "events",
    "health",
    "logistics",
    "auto",
    "food",
    "realestate"
  ];
  return Array.from(new Set([
    ...Object.keys(NICHE_DETAILS),
    ...shortSlugs,
    ...Object.keys(SPECIALTY_TO_NICHE_MAP)
  ]));
}

