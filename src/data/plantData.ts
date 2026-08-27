import { PlantItem, DiseaseItem, CareTask, NotificationItem, UserProfile } from '../types';

export const initialUserProfile: UserProfile = {
  name: 'Aisha Koritum',
  role: 'Plant Enthusiast & Urban Gardener',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvYC7-Xv1UI0i61gMtX_iuxDm5IWUSsOMUmmbX7pTrzcjxhiDUdgymsTgODMoFp3zf4zSAB1iAOwiVBhWDOGLNXICCCIw8_m27hCYZbKA1FRroK3skx0wCb3Hf8PC3UpIdNJqnhENPmbFKGM0Oj9vERBieNWrZegdSertYSNDHeBkSwfniFClf9sk_8x9Z0l-0x_QzCvuumHqRkzU9J0jWz03SWkewRDB8rTbjBccNAoPSvnIvcVdZ',
  plantsCount: 24,
  favoritesCount: 12,
};

export const samplePlants: PlantItem[] = [
  {
    id: 'gladiolus-tristis',
    name: 'Gladiolus tristis',
    scientificName: 'Ever-flowering gladiolus / Evergreen marsh afrikaner',
    category: 'Flowers',
    subType: 'Bulbs',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpPm2myLjHPc55cMriulSmD6saLIWxcyOswwGdn1aUfHuQMsmC2bAFDmY0dkVgcCL4mtUwpjM0ZmNHbZS8L9xGjE6-6kWsGW6l9nwXjufXOvaqp_ClmGKAHfHbX283gBlEBMdD9kSdAu90S2_ow-d55tW3MRtWIe7UIIHIp5b-u5oiYPkBXYieKQ4XawSjopMrIxJRWrveZczyDVjk6dlQ67lz6PmTHD6lQ6toXAZJrE5neYETrbUI',
    sunlight: 'Full to partial sun',
    water: 'Moderate, let dry',
    fertilizing: 'Monthly in spring',
    description: 'Gladiolus tristis is a striking, slender cormous perennial known for its elegant pale yellow to greenish-cream blossoms. It is particularly noted for its powerful, sweet almond or clove-like fragrance that becomes highly pronounced in the late afternoon and evening, making it a spectacular addition to night gardens or patios. Native to winter-rainfall areas, it exhibits a robust vitality when provided with well-draining soil and a dry dormant period during summer months.',
    isFavorite: true,
  },
  {
    id: 'rosa-peace',
    name: "Rosa 'Peace'",
    scientificName: 'Hybrid Tea Rose',
    category: 'Flowers',
    subType: 'Perennials',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0ApbwrY9XGJIbZDMb0JrsGP0CKi2xxyjZI5DThwmptmh0Ugbm2WEhEvVc7TygZWyl6ZOH4cl0fnVHiHwRHY8v6taAQu11Q41awubCjjca6eSl7zApSe6rOjBlIZQ4Xgcc8sP5xlwOjcIDsLaC2XX-Fb4tAxjPExABtaMjq-UVzd3HFLR3jwLYm4r9QDanviC70Q76yh6m3DO48nApxgkxdQCGkI_ZAo0GbfV4ggHRR4JJW-02iiN3',
    sunlight: 'Full Sun',
    water: 'Regular Water',
    fertilizing: 'Every 2 weeks in summer',
    description: 'Rosa "Peace" is a world-famous hybrid tea rose with large, glowing yellow to cream blooms edged in blush pink. It produces a light, fruity scent and thrives in fertile, well-drained soil with deep weekly watering.',
    isFavorite: true,
  },
  {
    id: 'delphinium-elatum',
    name: 'Delphinium elatum',
    scientificName: 'Alpine Delphinium',
    category: 'Flowers',
    subType: 'Perennials',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDECffasTkGCsB2AeeN03wDfMCIkE1HmeGcHjl1vUC7a5olomoTY1_syvclXBcBrK6opMQvyCV1R6lzsBJtVhtGn4M_TjMlsMBx1BaYVW5fnZWJlgrG7qmli1s_tYHLY6xuYQ5w80uBuVmhsCTwbknGwwr3nqcAKx9559R2YS1WzVy2j83T3WmA2R-ROl9tYAxvvUz9m87BbV7S4t4FTUYGnISn5dVKkfbX9gMWKxXG7EzLISzTMtuv',
    sunlight: 'Full Sun',
    water: 'Regular Water',
    fertilizing: 'Monthly during growing season',
    description: 'Delphinium elatum produces grand spikes of saturated cobalt blue florets that make dramatic vertical focal points in gardens. They love cool summers, moist compost-rich soil, and shelter from strong winds.',
    isFavorite: false,
  },
  {
    id: 'monstera-deliciosa',
    name: 'Monstera Deliciosa',
    scientificName: 'Swiss Cheese Plant',
    category: 'Leaf Plant',
    subType: 'Indoor',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvzt0Dsv6xVrTl3N-ReQ21WFP2dZn3zMibk_-T1s_1yLYzqa-7NOXg-Hdm8WfC0UM0tEy-5HXwoPnZsf5k-yfWXMpBvRLWqAwizkiAJTb-cbu1qeU4B64_qCJ7SVA1rcnxcIC8TUy_fJCQvJadQUAMShEPZv8Rpm3ccHS1j5ElLeuptDyWZ_7DjpDZ0LnZtv4-eyGaD3q6LMRtVS_fc8GYaap1UtDkx8yfwsnqey120xDsRdH4zCJr',
    sunlight: 'Bright Indirect Light',
    water: 'Weekly when top 2 inches dry',
    fertilizing: 'Bi-weekly during spring & summer',
    description: 'The iconic Monstera Deliciosa is prized for its dramatic fenestrated foliage. It brings an architectural jungle vibe to interiors and prefers elevated humidity with support from a moss pole.',
    isFavorite: true,
  },
  {
    id: 'sansevieria-trifasciata',
    name: 'Snake Plant',
    scientificName: 'Sansevieria trifasciata',
    category: 'Succulents',
    subType: 'Indoor',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNx1c3ZE7n2cLzYqO3QSJjIg7MOkeoA1n5VJ22Sj8RaypfvBsHgY-T1qotqan7LCJMtbOauvnSBMJfyK_bGmJnvzvcGO8oscq3tAw8vGX9Bk4Xh2BdKtJ-y1itRYu6gOSh-aaufqLTseLFma0a4X0Gr8KN9S9EMqZ7gcJQJjJRWwW8_g-9fUiXSzCDv0b-7xIZqugcosrXRQMr0tYAOcdiW-VHIeIFjH80kuRAlRVAGuv1HaT8W6ot',
    sunlight: 'Low to Bright Light',
    water: 'Every 2-3 weeks',
    fertilizing: 'Once per season',
    description: 'Virtually indestructible and air-purifying, the Snake Plant has upright, sword-like foliage with yellow and dark green marbling. Perfect for low maintenance modern spaces.',
    isFavorite: false,
  }
];

export const sampleDiseases: Record<string, DiseaseItem> = {
  chlorosis: {
    id: 'chlorosis',
    name: 'Chlorosis',
    commonName: 'Yellow Leaves',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWXfQpFamARZxZgmKx4mpdJp099A4Ond-dv-snHak4mHjwehuzo5osr28BGpTOsR34w14E8i6M7dgz7SBNcA-pyoKIF9VI1Lp_uj62KUXbAIdwaDp5D2nPTZXDJBYBlGqO94JeoCwpjWe6jMFuxUjBzdRXCyEK9iV3aiL_CJ1HZWBcItPBKWkFZIkGj1VC0DRF_QpjzvPnNACIGHnmgyissBlJxiZ_9TMn53zAOsRaeFEqk7XY7EZb',
    severity: 'High',
    spreadRate: 'Moderate',
    affectedArea: 'Foliage',
    confidenceScore: 96,
    description: 'Chlorosis is a condition in which leaves produce insufficient chlorophyll. As chlorophyll is responsible for the green color of leaves, chlorotic leaves are pale, yellow, or yellow-white.',
    secondaryDescription: 'This is typically a symptom of an underlying issue rather than a disease itself. The most common cause is a nutrient deficiency, specifically iron, but it can also be triggered by poor drainage, damaged roots, compacted roots, high alkalinity, or nutrient deficiencies in the soil.',
    causes: [
      { title: 'Overwatering', subtitle: 'Root suffocation', icon: 'water_drop' },
      { title: 'Nutrient Def.', subtitle: 'Lack of Iron/Nitrogen', icon: 'science' },
      { title: 'Poor Light', subtitle: 'Inadequate synthesis', icon: 'light_mode' },
      { title: 'Pest Damage', subtitle: 'Sap-sucking insects', icon: 'bug_report' },
    ],
    treatmentSteps: [
      {
        step: 1,
        title: 'Assess Moisture Levels',
        description: 'Check the soil before watering. Ensure the top 2 inches are dry. Improve drainage if the soil remains soggy for extended periods.',
      },
      {
        step: 2,
        title: 'Adjust Fertilization',
        description: 'Apply a balanced, water-soluble fertilizer with micronutrients (especially iron, magnesium, and zinc). Avoid over-fertilizing.',
      },
      {
        step: 3,
        title: 'Prune Severely Affected Leaves',
        description: "Remove completely yellow or dead leaves to redirect the plant's energy to healthy growth. Use sterilized shears.",
      },
    ],
    urgency: 'Treat within 48h',
    tags: ['Nutrient Deficiency', 'Soil Health', 'Pruning Required'],
  },
  wilting: {
    id: 'wilting',
    name: 'Wilting Leaves',
    commonName: 'Limp & Drooping Foliage',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAq90eBIYoNnwlUkM5CRcl_UT4IqL_sz1y9YtnyQY3r1a-biIgu1PUD0I_2SjRskXDp8etaNeeiP2tBU4GeutDkcBVo8me5Ij1gE8OkRgFZzVVymqpWcB9mYvsOFZm5AT8OJGteJGf8QVBUhEzhbVHy6eGBPUSO7FEdsJ5vguHu3RLOO2P8EqmqNVjlQbrqLBuPwnQR1X2H-4FH5vOCy2gW_cKZwhrARcm_RmR7DYbFSybvolauJToa',
    severity: 'Medium',
    spreadRate: 'Moderate',
    affectedArea: 'Stems & Leaves',
    confidenceScore: 94,
    description: 'Wilting is a primary indicator of water stress in plants. The leaves lose turgor pressure, causing them to droop, fold, or appear limp. While often associated with under-watering, it can also paradoxically indicate over-watering leading to root rot, which prevents water uptake. Environmental factors like sudden temperature drops or extreme heat drafts can also induce temporary wilting as a protective mechanism.',
    causes: [
      { title: 'Under-watering', subtitle: 'Dry root ball', icon: 'water_drop' },
      { title: 'Heat Stress', subtitle: 'Excess transpiration', icon: 'thermostat' },
      { title: 'Root Damage', subtitle: 'Restricted uptake', icon: 'science' },
      { title: 'Cold Drafts', subtitle: 'Shock from A/C or vents', icon: 'wind' },
    ],
    treatmentSteps: [
      {
        step: 1,
        title: 'Assess Soil Moisture',
        description: 'Insert finger 2 inches into soil. If bone dry, under-watering is confirmed. If wet and mushy, suspect root rot.',
      },
      {
        step: 2,
        title: 'Emergency Hydration',
        description: 'If dry, bottom-water the plant by placing its nursery pot in a bowl of room-temperature water for 30 minutes until topsoil feels moist.',
      },
      {
        step: 3,
        title: 'Optimize Environment',
        description: 'Move away from direct heat sources or cold drafts. Mist lightly if ambient humidity is below 40%.',
      },
    ],
    urgency: 'Treat within 24h',
    tags: ['Under-watering', 'Heat Stress', 'Root Damage'],
  },
  rust: {
    id: 'rust',
    name: 'Rust',
    commonName: 'Pucciniales Fungal Spots',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAb1Vx30vFpO5dVNCz2d1CJHE3_gQ8J5FVONvhAe77TPlMrAyMnOILQ8tR_aZ_P-UkBAa38vlZWSfxXyvwIdprJkTDPiragmDmFOopu1hJTMnLUW3igp1HixXwS9tBykdKozxX0gGbQICDaHg7tvhCySLdWFqAQSX__dIl8eNH1bIO9QD6Xrn7--hLmzU_B-LYhtX6LTJdYDa9Isnn8P-63MIx5ogicEs_5wOmrX4c6HyYNh2rNfctt',
    severity: 'High',
    spreadRate: 'Rapid',
    affectedArea: 'Leaf Surface',
    confidenceScore: 92,
    description: 'Fungal disease appearing as powdery yellow, orange, or reddish-brown spots primarily on the underside of foliage and stems.',
    secondaryDescription: 'Rust fungi thrive in humid, damp air and propagate by airborne spores. If left untreated, spores spread to neighboring leaves causing premature leaf drop and stunting growth.',
    causes: [
      { title: 'High Humidity', subtitle: 'Overcrowded foliage', icon: 'water_drop' },
      { title: 'Fungal Spores', subtitle: 'Airborne pathogen', icon: 'bug_report' },
      { title: 'Overhead Watering', subtitle: 'Leaves remaining wet', icon: 'water_drop' },
      { title: 'Poor Airflow', subtitle: 'Stagnant pockets', icon: 'wind' },
    ],
    treatmentSteps: [
      {
        step: 1,
        title: 'Isolate & Remove Infected Foliage',
        description: 'Immediately snip off heavily infected leaves with sterilized shears and dispose of them in sealed bags (do not compost).',
      },
      {
        step: 2,
        title: 'Apply Organic Fungicide',
        description: 'Spray the plant with copper fungicide or neem oil solution every 7 to 10 days, coating both tops and bottoms of leaves.',
      },
      {
        step: 3,
        title: 'Adjust Watering Technique',
        description: 'Water at the soil base only. Keep foliage completely dry and increase airflow around the plant.',
      },
    ],
    urgency: 'Treat within 12h',
    tags: ['High Risk', 'Fungal', 'Airflow Required'],
  },
  'powdery-mildew': {
    id: 'powdery-mildew',
    name: 'Powdery Mildew',
    commonName: 'White Fungal Coating',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpuqUnpZEF8-AiC_aixFaEB1gQMFyKMFIQuXn3b0PTncUNrwlsRcuxRJAdtYOkZSd5VcLIx9gcuVScg0hmbRtKGfcn8CuwFbm21IN-f8jef3F80ohefWYdgO9-bmBICktpzfdWtKhCYtEjrUq2Tw8iMXp701dUfLnypNjKIHN4eWFYc8oByQN4nWUrWHUcb0m51hTT6X1HoA3hhfozPH8GaTJ-ya4fpgaWl77wvHl4M3Bt52YrJCEE',
    severity: 'Medium',
    spreadRate: 'Moderate',
    affectedArea: 'Leaves and Stems',
    confidenceScore: 89,
    description: 'White, powdery fungal spots that can cover entire leaves and stems, reducing photosynthetic capability and distorting new shoots.',
    secondaryDescription: 'Common in warm, dry climates with high relative humidity at night. Unlike most fungi, powdery mildew does not require water on the leaf surface to germinate.',
    causes: [
      { title: 'Shade & Dry Soil', subtitle: 'Weakened immunity', icon: 'light_mode' },
      { title: 'High Ambient Humidity', subtitle: 'Spore germination', icon: 'water_drop' },
      { title: 'Poor Airflow', subtitle: 'Dense canopy', icon: 'wind' },
      { title: 'Excess Nitrogen', subtitle: 'Tender susceptible growth', icon: 'science' },
    ],
    treatmentSteps: [
      {
        step: 1,
        title: 'Wipe & Prune',
        description: 'Gently wipe infected leaves with a damp cloth or prune overcrowded inner branches to enhance sunlight penetration.',
      },
      {
        step: 2,
        title: 'Baking Soda or Neem Spray',
        description: 'Mix 1 tsp baking soda and 1/2 tsp liquid soap per 1 liter of water, or apply horticultural neem oil spray.',
      },
      {
        step: 3,
        title: 'Relocate to Brighter Area',
        description: 'Provide more bright indirect light and improve ventilation to prevent spore germination.',
      },
    ],
    urgency: 'Treat within 3 days',
    tags: ['Treatable', 'Foliage Care', 'Low Risk'],
  },
};

export const initialCareTasks: CareTask[] = [
  { id: 'task-1', plantName: 'Monstera Deliciosa', taskType: 'Water', dueDate: 'Today, 4:00 PM', completed: false },
  { id: 'task-2', plantName: 'Gladiolus tristis', taskType: 'Fertilize', dueDate: 'Tomorrow', completed: false },
  { id: 'task-3', plantName: "Rosa 'Peace'", taskType: 'Mist', dueDate: 'Saturday', completed: true },
  { id: 'task-4', plantName: 'Snake Plant', taskType: 'Water', dueDate: 'In 4 days', completed: false },
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Watering Reminder',
    message: 'Time to water your Monstera Deliciosa! Top 2 inches are dry.',
    time: '10m ago',
    read: false,
    type: 'care',
  },
  {
    id: 'notif-2',
    title: 'Diagnosis Alert',
    message: 'Scan results confirmed: Chlorosis detected on Monstera leaf.',
    time: '2h ago',
    read: false,
    type: 'alert',
  },
  {
    id: 'notif-3',
    title: 'Weekly Garden Health',
    message: 'All 24 plants are hydrated and flourishing this week.',
    time: '1d ago',
    read: true,
    type: 'system',
  },
];

export const sampleProfile: UserProfile = {
  name: 'Aisha Koritum',
  role: 'Plant Enthusiast & Urban Gardener',
  avatar:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  plantsCount: 24,
  favoritesCount: 12,
};

