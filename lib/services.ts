export type Service = {
  slug: string;
  name: string;
  jobs: string;
  phrase: string;
  subs: string[];
};

export const SERVICES: Service[] = [
  { slug: "ac", name: "AC service", jobs: "Gas refill, deep cleaning, split and window units", phrase: "an AC technician",
    subs: ["AC cleaning and service", "Gas refill", "Split AC installation", "Window AC repair", "Duct cleaning"] },
  { slug: "plumbing", name: "Plumbing", jobs: "Leaks, blocked drains, water heaters", phrase: "a plumber",
    subs: ["Leak repair", "Tap and mixer installation", "Drain unblocking", "Water heater repair", "Toilet repair"] },
  { slug: "electrical", name: "Electrical", jobs: "Wiring, sockets, lights, breakers", phrase: "an electrician",
    subs: ["Wiring fault", "Lights and ceiling fans", "Switches and sockets", "Distribution board", "Breaker keeps tripping"] },
  { slug: "cleaning", name: "Home cleaning", jobs: "Deep cleaning, move-in and move-out", phrase: "home cleaning",
    subs: ["Deep home cleaning", "Sofa and carpet shampoo", "Kitchen deep clean", "Move-out cleaning"] },
  { slug: "painting", name: "Painting", jobs: "Rooms, walls, touch-ups", phrase: "a painter",
    subs: ["Room painting", "Full villa painting", "Touch-up and patching", "Roof waterproofing"] },
  { slug: "carpentry", name: "Carpentry", jobs: "Doors, cabinets, furniture assembly", phrase: "a carpenter",
    subs: ["Furniture assembly", "Door and lock repair", "Kitchen cabinets", "Curtain fitting"] },
  { slug: "appliance", name: "Appliance repair", jobs: "Washing machines, fridges, ovens", phrase: "appliance repair",
    subs: ["Washing machine", "Refrigerator", "Oven and stove", "Dishwasher"] },
  { slug: "pest", name: "Pest control", jobs: "Cockroaches, bed bugs, termites", phrase: "pest control",
    subs: ["Cockroach treatment", "Bed bugs", "Termites", "Rodents"] },
  { slug: "moving", name: "Moving", jobs: "Furniture moving within the city", phrase: "movers",
    subs: ["Apartment move", "Furniture only", "Packing and wrapping"] },
];

export const ROOMS: Service = {
  slug: "rooms",
  name: "Room rental",
  jobs: "Rooms and studios from verified landlords",
  phrase: "a room",
  subs: ["Room viewing"],
};

export const ALL_SERVICES = [...SERVICES, ROOMS];

export function findService(slug: string | null) {
  return ALL_SERVICES.find((s) => s.slug === slug);
}

export const CITIES = ["Riyadh", "Dammam"] as const;

export const DISTRICTS: Record<string, string[]> = {
  Riyadh: ["Al Olaya", "Al Malqa", "Al Yasmin", "Al Nakheel", "Al Sulimaniyah", "Al Rawdah", "Al Naseem", "Al Aziziyah"],
  Dammam: ["Al Faisaliyah", "Al Shati", "Al Nuzha", "Al Mazruiyah", "Al Rakah", "Al Adamah", "Al Khobar Al Shamalia", "Al Badiyah"],
};

export const SLOTS = [
  { name: "Morning", hours: "8 am to 12 pm" },
  { name: "Afternoon", hours: "12 to 4 pm" },
  { name: "Evening", hours: "4 to 9 pm" },
];

export const PAY_METHODS = ["Cash", "mada card", "Apple Pay", "STC Pay"];

export const PROVIDER_TYPES = ["Individual technician", "Company", "Landlord / room owner"];

/** Documents each provider type needs for verification: [name, required] */
export const REQUIRED_DOCS: Record<string, [string, boolean][]> = {
  "Individual technician": [["Iqama or national ID", true], ["Trade or skill certificate", false]],
  Company: [["Commercial Registration (CR)", true], ["Municipality licence (Baladi)", true], ["VAT registration certificate", false]],
  "Landlord / room owner": [["Iqama or national ID", true], ["Title deed or Ejar lease contract", true]],
};
