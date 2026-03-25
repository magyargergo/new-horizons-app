export interface ShipBay {
  id: string;
  name: string;
  description: string;
  image: string;
  /** Normalized position (0-1) relative to layer SVG */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ShipLayer {
  id: string;
  name: string;
  zIndex: number;
  color: string;
  bays: ShipBay[];
}

export interface ShipData {
  name: string;
  class: string;
  description: string;
  layers: ShipLayer[];
}
