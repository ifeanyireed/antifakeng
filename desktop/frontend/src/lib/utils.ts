import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getProImage(specialty: string, subService: string): string {
  const images: Record<string, string> = {
    // Handyman & Home Services
    plumb: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=80",
    electr: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80",
    carpen: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&auto=format&fit=crop&q=80",
    paint: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=500&auto=format&fit=crop&q=80",
    ac: "https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=500&auto=format&fit=crop&q=80",
    solar: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=500&auto=format&fit=crop&q=80",
    clean: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=80",
    fumigat: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=500&auto=format&fit=crop&q=80",
    
    // Fashion
    barber: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop&q=80",
    tailor: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=500&auto=format&fit=crop&q=80",
    laundr: "https://images.unsplash.com/photo-1545173168-9f1947eebd01?w=500&auto=format&fit=crop&q=80",
    shop: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&auto=format&fit=crop&q=80",
    
    // Tech & Creative
    develop: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&auto=format&fit=crop&q=80",
    design: "https://images.unsplash.com/photo-1561070791-26c113006238?w=500&auto=format&fit=crop&q=80",
    copywrit: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=500&auto=format&fit=crop&q=80",
    social: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=80",
    model: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
    voice: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=500&auto=format&fit=crop&q=80",
    
    // Corporate & Professional
    lawyer: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80",
    legal: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80",
    account: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80",
    audit: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80",

    // Education & Lessons
    tutor: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&auto=format&fit=crop&q=80",
    music: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=500&auto=format&fit=crop&q=80",
    driv: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500&auto=format&fit=crop&q=80",
    train: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=500&auto=format&fit=crop&q=80",

    // Events
    plan: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500&auto=format&fit=crop&q=80",
    decor: "https://images.unsplash.com/photo-1478812954026-9c750f0e89fc?w=500&auto=format&fit=crop&q=80",
    dj: "https://images.unsplash.com/photo-1516873240891-4bf014598ab4?w=500&auto=format&fit=crop&q=80",
    photo: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=80",

    // Medical & Wellness
    nurse: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=500&auto=format&fit=crop&q=80",
    physio: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&auto=format&fit=crop&q=80",
    gym: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&auto=format&fit=crop&q=80",
    yoga: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&auto=format&fit=crop&q=80",
    nanny: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=500&auto=format&fit=crop&q=80",
    elderly: "https://images.unsplash.com/photo-1576765608622-467ae4d0c242?w=500&auto=format&fit=crop&q=80",

    // Auto
    mechanic: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&auto=format&fit=crop&q=80",
    vulcan: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=500&auto=format&fit=crop&q=80",
    wash: "https://images.unsplash.com/photo-1520340356584-f9917d1ecc69?w=500&auto=format&fit=crop&q=80",
    track: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&auto=format&fit=crop&q=80",

    // Culinary & Agro
    chef: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=500&auto=format&fit=crop&q=80",
    bake: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80",
    farm: "https://images.unsplash.com/photo-1500937386664-56d159f87b81?w=500&auto=format&fit=crop&q=80",
    vet: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=500&auto=format&fit=crop&q=80",

    // Real Estate
    agent: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&auto=format&fit=crop&q=80",
    facility: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&auto=format&fit=crop&q=80",
    architect: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&auto=format&fit=crop&q=80",
    brick: "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?w=500&auto=format&fit=crop&q=80",
  };

  const combined = `${specialty || ""} ${subService || ""}`.toLowerCase();
  const key = Object.keys(images).find(k => combined.includes(k));

  return key ? images[key] : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80";
}

export function slugify(text: string): string {
  return (text || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function getProSlug(pro: any): string {
  if (pro.slug || pro.Slug) return pro.slug || pro.Slug;
  if (pro.id || pro.ID) return `business-${pro.id || pro.ID}`;
  const name = pro.user?.name || pro.businessName || pro.BusinessName || "professional";
  return slugify(name);
}

export function getArticleSlug(article: any): string {
  return `${slugify(article.title)}-article-${article.id}`;
}

export function getProLink(pro: any): string {
  const specialties = pro.specialties || pro.Specialties;
  const niche = pro.niche || pro.Niche;
  const city = pro.city || pro.City;
  const area = pro.area || pro.Area;
  
  const service = slugify((specialties ? specialties.split(",")[0] : null) || niche || "service");
  const state = slugify(city || "state");
  const lga = slugify(area || "lga");
  const slug = getProSlug(pro);
  return `/${service}/${state}/${lga}/${slug}`;
}
