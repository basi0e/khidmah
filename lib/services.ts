export type Service = {
  slug: string;
  name: string;
  jobs: string;
  phrase: string;
};

export const SERVICES: Service[] = [
  { slug: "ac", name: "AC service", jobs: "Gas refill, deep cleaning, split and window units", phrase: "an AC technician" },
  { slug: "plumbing", name: "Plumbing", jobs: "Leaks, blocked drains, water heaters", phrase: "a plumber" },
  { slug: "electrical", name: "Electrical", jobs: "Wiring, sockets, lights, breakers", phrase: "an electrician" },
  { slug: "cleaning", name: "Home cleaning", jobs: "Deep cleaning, move-in and move-out", phrase: "home cleaning" },
  { slug: "painting", name: "Painting", jobs: "Rooms, walls, touch-ups", phrase: "a painter" },
  { slug: "carpentry", name: "Carpentry", jobs: "Doors, cabinets, furniture assembly", phrase: "a carpenter" },
  { slug: "appliances", name: "Appliance repair", jobs: "Washing machines, fridges, ovens", phrase: "appliance repair" },
  { slug: "pest", name: "Pest control", jobs: "Cockroaches, bed bugs, termites", phrase: "pest control" },
  { slug: "moving", name: "Moving", jobs: "Furniture moving within the city", phrase: "movers" },
];

export const ROOMS: Service = {
  slug: "rooms",
  name: "Room rental",
  jobs: "Rooms and studios from verified landlords",
  phrase: "a room",
};

export function findService(slug: string | null) {
  return [...SERVICES, ROOMS].find((s) => s.slug === slug);
}
