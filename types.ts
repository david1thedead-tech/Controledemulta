
export interface Fine {
  id: string; // Internal UUID
  date: string;
  description: string;
  location: string;
  infractionId: string; // Auto de Infração (Official ID)
  points: number | string;
  amount: number;
  isNew?: boolean; // UI flag for comparison
  printed?: boolean; // tracking if the fine was processed/printed
  plate?: string; // The plate this fine belongs to
}

export interface VehicleData {
  plate: string;
  fines: Fine[];
}

export type ProcessingResult = VehicleData[];

export interface SavedVehicle {
  plate: string;
  lastCheck: string;
  fines: Fine[];
}

export type AppStatus = 'idle' | 'loading' | 'success' | 'error';
