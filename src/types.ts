export type ScreenType =
  | 'splash'
  | 'onboarding_1'
  | 'onboarding_2'
  | 'onboarding_3'
  | 'login'
  | 'signup'
  | 'home'
  | 'category_flowers'
  | 'category_leaf'
  | 'category_succulents'
  | 'category_trees'
  | 'plant_detail'
  | 'scan'
  | 'diagnosis'
  | 'profile'
  | 'notifications'
  | 'care_schedule'
  | 'settings';

export interface PlantItem {
  id: string;
  name: string;
  scientificName: string;
  category: 'Flowers' | 'Leaf Plant' | 'Succulents' | 'Trees';
  subType?: 'Perennials' | 'Annuals' | 'Bulbs' | 'Indoor' | 'Outdoor';
  image: string;
  sunlight: string;
  water: string;
  fertilizing: string;
  description: string;
  isFavorite?: boolean;
}

export interface DiseaseItem {
  id: string;
  name: string;
  commonName: string;
  image: string;
  severity: 'High' | 'Medium' | 'Low';
  spreadRate: 'Rapid' | 'Moderate' | 'Slow';
  affectedArea: string;
  confidenceScore?: number;
  description: string;
  secondaryDescription?: string;
  causes: {
    title: string;
    subtitle: string;
    icon: 'water_drop' | 'science' | 'light_mode' | 'bug_report' | 'thermostat' | 'wind';
  }[];
  treatmentSteps: {
    step: number;
    title: string;
    description: string;
  }[];
  urgency?: string;
  tags?: string[];
}

export interface CareTask {
  id: string;
  plantName: string;
  taskType: 'Water' | 'Fertilize' | 'Prune' | 'Mist';
  dueDate: string;
  completed: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'alert' | 'care' | 'system' | 'warning';
}

export type PlantNotification = NotificationItem;

export interface UserProfile {
  name: string;
  role: string;
  avatar: string;
  plantsCount: number;
  favoritesCount: number;
}
