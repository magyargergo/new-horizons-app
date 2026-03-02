export interface Allegiance {
  name: string;
  color: string;
  logo: string; // path relative to /public, e.g. "/factions/ashford_logo.png"
}

export const ALLEGIANCES: Record<string, Allegiance> = {
  ashford: {
    name: "House Ashford",
    color: "#4A7FBF",
    logo: "/factions/ashford_logo.png",
  },
  fairfield: {
    name: "House Fairfield",
    color: "#F59E0B",
    logo: "/factions/fairfield_logo.png",
  },
  feyrose: {
    name: "House Feyrose",
    color: "#EC4899",
    logo: "/factions/feyrose_logo.png",
  },
};
