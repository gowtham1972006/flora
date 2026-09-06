// ─── Flora i18n — Custom lightweight translation system ──────────────────
// No external library needed. Translations are static TS objects.
// Usage: import { useLanguage } from '../hooks/useLanguage';
//        const { T } = useLanguage();
//        <span>{T.nav_home}</span>

export type LangCode = 'en' | 'ta' | 'hi' | 'fr' | 'es';

export interface Translations {
  // App
  appName: string;
  appTagline: string;
  loading: string;
  save: string;
  cancel: string;
  close: string;
  back: string;
  retry: string;
  search: string;
  clearAll: string;
  markAllRead: string;
  noResults: string;
  error: string;
  success: string;
  confirm: string;
  delete: string;
  edit: string;
  add: string;
  done: string;
  today: string;
  tomorrow: string;
  // Nav
  nav_home: string;
  nav_scan: string;
  nav_profile: string;
  nav_settings: string;
  nav_catalog: string;
  nav_watering: string;
  nav_notifications: string;
  nav_dashboard: string;
  // Splash
  splash_getStarted: string;
  splash_haveAccount: string;
  // Onboarding
  onboarding_title1: string;
  onboarding_body1: string;
  onboarding_title2: string;
  onboarding_body2: string;
  onboarding_title3: string;
  onboarding_body3: string;
  onboarding_skip: string;
  onboarding_next: string;
  onboarding_signUp: string;
  onboarding_login: string;
  // Auth
  auth_login: string;
  auth_signup: string;
  auth_email: string;
  auth_password: string;
  auth_name: string;
  auth_rememberMe: string;
  auth_forgotPassword: string;
  auth_googleLogin: string;
  auth_googleSignup: string;
  auth_noAccount: string;
  auth_hasAccount: string;
  auth_welcomeBack: string;
  auth_welcomeBackBody: string;
  auth_accountCreated: string;
  auth_accountCreatedBody: string;
  auth_goHome: string;
  auth_passwordMin: string;
  auth_emailRequired: string;
  auth_passwordRequired: string;
  auth_nameRequired: string;
  auth_checkInbox: string;
  auth_checkInboxBody: string;
  auth_tryDifferentEmail: string;
  auth_backToLogin: string;
  // Home
  home_greeting: string;
  home_subtitle: string;
  home_search: string;
  home_categories: string;
  home_flowers: string;
  home_leafPlants: string;
  home_succulents: string;
  home_trees: string;
  home_scanBanner: string;
  home_scanBannerSub: string;
  home_scanBtn: string;
  home_diseaseLib: string;
  home_diseaseLibSub: string;
  home_viewAll: string;
  home_floraDir: string;
  home_floraDirSub: string;
  home_exploreCatalog: string;
  home_commonProblems: string;
  home_commonProblemsSub: string;
  home_seeAll: string;
  home_highRisk: string;
  home_treatable: string;
  // Weather
  weather_title: string;
  weather_loading: string;
  weather_error: string;
  weather_enableLocation: string;
  weather_humidity: string;
  weather_wind: string;
  weather_feelsLike: string;
  weather_alertHeat: string;
  weather_alertFrost: string;
  weather_alertRain: string;
  weather_alertDrought: string;
  weather_alertWind: string;
  weather_alertHumidity: string;
  weather_good: string;
  weather_goodSub: string;
  weather_lastUpdated: string;
  weather_tapForDetails: string;
  weather_enableBtn: string;
  // Scan
  scan_title: string;
  scan_hint: string;
  scan_gallery: string;
  scan_flip: string;
  scan_analyse: string;
  scan_analysing: string;
  scan_step1: string;
  scan_step2: string;
  scan_step3: string;
  scan_step4: string;
  scan_result_risk: string;
  scan_result_match: string;
  scan_result_topCause: string;
  scan_scanAgain: string;
  scan_viewReport: string;
  scan_cameraUnavailable: string;
  scan_cameraBody: string;
  scan_photoUploaded: string;
  scan_error: string;
  // Diagnosis
  diag_title: string;
  diag_severity: string;
  diag_spreadRate: string;
  diag_affectedArea: string;
  diag_confidence: string;
  diag_causes: string;
  diag_treatment: string;
  diag_addSchedule: string;
  diag_added: string;
  diag_urgency: string;
  // Catalog
  catalog_favorited: string;
  catalog_unfavorited: string;
  catalog_addSchedule: string;
  catalog_noResults: string;
  catalog_resetFilters: string;
  // Care
  care_title: string;
  care_pending: string;
  care_completed: string;
  care_addTask: string;
  care_plantName: string;
  care_taskType: string;
  care_water: string;
  care_fertilize: string;
  care_prune: string;
  care_mist: string;
  care_dueDate: string;
  care_empty: string;
  // Notifications
  notif_title: string;
  notif_empty: string;
  notif_markAll: string;
  notif_clearAll: string;
  // Profile
  profile_title: string;
  profile_plants: string;
  profile_favorites: string;
  profile_careHealth: string;
  profile_editProfile: string;
  profile_editSub: string;
  profile_settings: string;
  profile_settingsSub: string;
  profile_alerts: string;
  profile_alertsSub: string;
  profile_helpCenter: string;
  profile_helpSub: string;
  profile_helpBody: string;
  profile_logout: string;
  profile_name: string;
  profile_role: string;
  // Settings
  settings_title: string;
  settings_language: string;
  settings_languageSub: string;
  settings_weather: string;
  settings_weatherSub: string;
  settings_weatherEnable: string;
  settings_notifications: string;
  settings_notifSub: string;
  settings_careReminders: string;
  settings_careRemindersSub: string;
  settings_theme: string;
  settings_themeSub: string;
  settings_about: string;
  settings_aboutSub: string;
  settings_version: string;
  settings_chooseLanguage: string;
  settings_saved: string;
}

// ─── English (default) ───────────────────────────────────────────────────────
const en: Translations = {
  appName: 'Flora',
  appTagline: 'Botanical Health System',
  loading: 'Loading Flora...',
  save: 'Save',
  cancel: 'Cancel',
  close: 'Close',
  back: 'Back',
  retry: 'Retry',
  search: 'Search',
  clearAll: 'Clear All',
  markAllRead: 'Mark all read',
  noResults: 'No results found',
  error: 'Something went wrong',
  success: 'Success',
  confirm: 'Confirm',
  delete: 'Delete',
  edit: 'Edit',
  add: 'Add',
  done: 'Done',
  today: 'Today',
  tomorrow: 'Tomorrow',
  nav_home: 'Home',
  nav_scan: 'Scan',
  nav_profile: 'Profile',
  nav_settings: 'Settings',
  nav_catalog: 'Plant Catalog',
  nav_watering: 'Watering Schedule',
  nav_notifications: 'Notifications',
  nav_dashboard: 'Dashboard',
  splash_getStarted: 'Get Started',
  splash_haveAccount: 'I already have an account',
  onboarding_title1: 'Welcome to Flora',
  onboarding_body1: 'Your intelligent botanical companion for plant health, disease detection, and care scheduling.',
  onboarding_title2: 'Scan & Diagnose',
  onboarding_body2: 'Point your camera at any leaf — our AI analyses it in seconds and delivers a full treatment plan.',
  onboarding_title3: 'Track & Thrive',
  onboarding_body3: 'Set watering reminders, track favorites, and monitor your entire garden from one dashboard.',
  onboarding_skip: 'Skip',
  onboarding_next: 'Next',
  onboarding_signUp: 'Sign Up',
  onboarding_login: 'Log In',
  auth_login: 'Login',
  auth_signup: 'Sign up',
  auth_email: 'Email address',
  auth_password: 'Password',
  auth_name: 'Full Name',
  auth_rememberMe: 'Remember Me',
  auth_forgotPassword: 'Forgot Password?',
  auth_googleLogin: 'Login with Google',
  auth_googleSignup: 'Continue with Google',
  auth_noAccount: "Don't have an account?",
  auth_hasAccount: 'Already have an account?',
  auth_welcomeBack: 'Yeay! Welcome Back',
  auth_welcomeBackBody: "Your plants have missed you. Let's check on your garden health.",
  auth_accountCreated: 'Account Created!',
  auth_accountCreatedBody: 'Welcome to Flora! Your botanical journey begins now.',
  auth_goHome: 'Go To Home',
  auth_passwordMin: 'Password must be at least 6 characters',
  auth_emailRequired: 'Email is required',
  auth_passwordRequired: 'Password is required',
  auth_nameRequired: 'Name is required',
  auth_checkInbox: 'Check your inbox',
  auth_checkInboxBody: 'We sent a verification link to {email}. Click the link in that email to activate your account and sign in.',
  auth_tryDifferentEmail: 'try a different email',
  auth_backToLogin: 'Back to Login',
  home_greeting: 'Hello, Gardener 🌿',
  home_subtitle: 'How are your plants today?',
  home_search: 'Search diseases, plants...',
  home_categories: 'Browse by Category',
  home_flowers: 'Flowers',
  home_leafPlants: 'Leaf Plants',
  home_succulents: 'Succulents',
  home_trees: 'Trees',
  home_scanBanner: 'Health of your plants',
  home_scanBannerSub: 'Scan a leaf for instant AI diagnosis',
  home_scanBtn: 'Scan Now',
  home_diseaseLib: 'Find plant disease',
  home_diseaseLibSub: 'Detect symptoms early and protect your botanicals with targeted treatments.',
  home_viewAll: 'View all',
  home_floraDir: 'Garden Flora Directory',
  home_floraDirSub: 'Browse our full plant encyclopedia',
  home_exploreCatalog: 'View Catalog',
  home_commonProblems: 'Common Problems',
  home_commonProblemsSub: 'Tap any condition to view full treatment protocol',
  home_seeAll: 'See All',
  home_highRisk: 'High Risk',
  home_treatable: 'Treatable',
  weather_title: 'Garden Weather',
  weather_loading: 'Fetching weather...',
  weather_error: 'Weather unavailable',
  weather_enableLocation: 'Enable location for weather alerts',
  weather_humidity: 'Humidity',
  weather_wind: 'Wind',
  weather_feelsLike: 'Feels like',
  weather_alertHeat: '🌡️ Heat stress warning — water plants early morning',
  weather_alertFrost: '🧊 Frost risk tonight — bring tender plants indoors',
  weather_alertRain: '🌧️ Heavy rain expected — skip watering today',
  weather_alertDrought: '🌵 Dry spell ahead — increase watering frequency',
  weather_alertWind: '💨 Strong winds — secure tall or climbing plants',
  weather_alertHumidity: '🍄 High humidity — watch for fungal diseases',
  weather_good: 'Good conditions',
  weather_goodSub: 'Great day for gardening!',
  weather_lastUpdated: 'Updated',
  weather_tapForDetails: 'Tap for full forecast',
  weather_enableBtn: 'Enable weather alerts',
  scan_title: 'Plant Scanner',
  scan_hint: 'Centre the leaf · tap scan',
  scan_gallery: 'Gallery',
  scan_flip: 'Flip',
  scan_analyse: 'Scan',
  scan_analysing: 'Analysing…',
  scan_step1: 'Detecting leaf structure…',
  scan_step2: 'Analysing chlorophyll patterns…',
  scan_step3: 'Cross-referencing disease database…',
  scan_step4: 'Generating diagnosis report…',
  scan_result_risk: 'Risk',
  scan_result_match: 'match',
  scan_result_topCause: 'Top cause',
  scan_scanAgain: 'Scan Again',
  scan_viewReport: 'View Full Report',
  scan_cameraUnavailable: 'Camera Unavailable',
  scan_cameraBody: 'Allow camera access in browser settings, or upload a photo.',
  scan_photoUploaded: 'Photo uploaded — tap Scan to analyse',
  scan_error: 'Diagnosis failed. Please try again.',
  diag_title: 'Diagnosis',
  diag_severity: 'Severity',
  diag_spreadRate: 'Spread Rate',
  diag_affectedArea: 'Affected Area',
  diag_confidence: 'Confidence',
  diag_causes: 'Common Causes',
  diag_treatment: 'Treatment Steps',
  diag_addSchedule: 'Add to Care Schedule',
  diag_added: 'Added to schedule!',
  diag_urgency: 'Urgency',
  catalog_favorited: 'Added to favorites',
  catalog_unfavorited: 'Removed from favorites',
  catalog_addSchedule: 'Add to Schedule',
  catalog_noResults: 'No plants match your search',
  catalog_resetFilters: 'Reset Filters',
  care_title: 'Care Schedule',
  care_pending: 'pending',
  care_completed: 'completed',
  care_addTask: 'Add Task',
  care_plantName: 'Plant name',
  care_taskType: 'Task type',
  care_water: 'Water',
  care_fertilize: 'Fertilize',
  care_prune: 'Prune',
  care_mist: 'Mist',
  care_dueDate: 'Due date',
  care_empty: 'No tasks yet. Add one above!',
  notif_title: 'Notifications',
  notif_empty: 'All clear! No notifications.',
  notif_markAll: 'Mark all as read',
  notif_clearAll: 'Clear all',
  profile_title: 'My Profile',
  profile_plants: 'Plants in Care',
  profile_favorites: 'Favorites',
  profile_careHealth: 'Care Health Rate',
  profile_editProfile: 'Edit Profile Info',
  profile_editSub: 'Update your name, bio, and avatar',
  profile_settings: 'Settings & Care Reminders',
  profile_settingsSub: 'Language, weather, and preferences',
  profile_alerts: 'Plant Health Alerts',
  profile_alertsSub: 'Review disease alerts and care tasks',
  profile_helpCenter: 'Doctor Plant Help Center',
  profile_helpSub: 'Plant disease guides and botanical advice',
  profile_helpBody: 'Flora automatically synchronizes with botanical treatment libraries. For urgent pest issues, use the AI Plant Scanner.',
  profile_logout: 'Log Out',
  profile_name: 'Name',
  profile_role: 'Gardening Title',
  settings_title: 'Settings',
  settings_language: 'Language',
  settings_languageSub: 'Choose your preferred language',
  settings_weather: 'Weather Alerts',
  settings_weatherSub: 'Location-based plant care alerts',
  settings_weatherEnable: 'Enable weather alerts',
  settings_notifications: 'Push Notifications',
  settings_notifSub: 'Disease alerts and care reminders',
  settings_careReminders: 'Care Reminders',
  settings_careRemindersSub: 'Daily watering and fertilizing reminders',
  settings_theme: 'Appearance',
  settings_themeSub: 'Light mode (more themes coming soon)',
  settings_about: 'About Flora',
  settings_aboutSub: 'Version, licenses, and credits',
  settings_version: 'Version 1.0.0',
  settings_chooseLanguage: 'Choose Language',
  settings_saved: 'Settings saved!',
};

// ─── Tamil ───────────────────────────────────────────────────────────────────
const ta: Translations = {
  appName: 'Flora',
  appTagline: 'தாவர சுகாதார அமைப்பு',
  loading: 'Flora ஏற்றுகிறது...',
  save: 'சேமிக்கவும்',
  cancel: 'ரத்து செய்யவும்',
  close: 'மூடவும்',
  back: 'பிறகு திரும்பவும்',
  retry: 'மீண்டும் முயற்சிக்கவும்',
  search: 'தேடவும்',
  clearAll: 'அனைத்தும் அழிக்கவும்',
  markAllRead: 'அனைத்தும் படித்ததாக குறிக்கவும்',
  noResults: 'முடிவுகள் இல்லை',
  error: 'ஏதோ தவறு நடந்தது',
  success: 'வெற்றி',
  confirm: 'உறுதிசெய்யவும்',
  delete: 'நீக்கவும்',
  edit: 'திருத்தவும்',
  add: 'சேர்க்கவும்',
  done: 'முடிந்தது',
  today: 'இன்று',
  tomorrow: 'நாளை',
  nav_home: 'முகப்பு',
  nav_scan: 'ஸ்கேன்',
  nav_profile: 'சுயவிவரம்',
  nav_settings: 'அமைப்புகள்',
  nav_catalog: 'தாவர அட்டவணை',
  nav_watering: 'நீர்ப்பாசன அட்டவணை',
  nav_notifications: 'அறிவிப்புகள்',
  nav_dashboard: 'டாஷ்போர்டு',
  splash_getStarted: 'தொடங்குங்கள்',
  splash_haveAccount: 'என்னிடம் ஏற்கனவே கணக்கு உள்ளது',
  onboarding_title1: 'Flora க்கு வரவேற்கிறோம்',
  onboarding_body1: 'தாவர ஆரோக்கியம், நோய் கண்டறிதல் மற்றும் பராமரிப்பு திட்டமிடலுக்கான உங்கள் தோழன்.',
  onboarding_title2: 'ஸ்கேன் & கண்டறியவும்',
  onboarding_body2: 'எந்த இலையையும் நோக்கி கேமராவை பிடியுங்கள் — நம் AI சில நொடிகளில் பகுப்பாய்வு செய்யும்.',
  onboarding_title3: 'கண்காணிக்கவும் & வளரவும்',
  onboarding_body3: 'நீர்ப்பாசன நினைவூட்டல்கள் அமைக்கவும், பிடித்தவற்றை கண்காணிக்கவும்.',
  onboarding_skip: 'தவிர்க்கவும்',
  onboarding_next: 'அடுத்து',
  onboarding_signUp: 'பதிவு செய்யவும்',
  onboarding_login: 'உள்நுழைக',
  auth_login: 'உள்நுழைக',
  auth_signup: 'பதிவு செய்யவும்',
  auth_email: 'மின்னஞ்சல் முகவரி',
  auth_password: 'கடவுச்சொல்',
  auth_name: 'முழு பெயர்',
  auth_rememberMe: 'என்னை நினைவில் வையுங்கள்',
  auth_forgotPassword: 'கடவுச்சொல் மறந்துவிட்டீர்களா?',
  auth_googleLogin: 'Google மூலம் உள்நுழைக',
  auth_googleSignup: 'Google மூலம் தொடரவும்',
  auth_noAccount: 'கணக்கு இல்லையா?',
  auth_hasAccount: 'ஏற்கனவே கணக்கு உள்ளதா?',
  auth_welcomeBack: 'மீண்டும் வரவேற்கிறோம்!',
  auth_welcomeBackBody: 'உங்கள் தாவரங்கள் உங்களை நினைவுகூர்ந்தன.',
  auth_accountCreated: 'கணக்கு உருவாக்கப்பட்டது!',
  auth_accountCreatedBody: 'Flora க்கு வரவேற்கிறோம்!',
  auth_goHome: 'முகப்புக்கு செல்லவும்',
  auth_passwordMin: 'கடவுச்சொல் குறைந்தது 6 எழுத்துகளாக இருக்க வேண்டும்',
  auth_emailRequired: 'மின்னஞ்சல் தேவை',
  auth_passwordRequired: 'கடவுச்சொல் தேவை',
  auth_nameRequired: 'பெயர் தேவை',
  auth_checkInbox: 'உங்கள் இன்பாக்ஸைச் சரிபாருங்கள்',
  auth_checkInboxBody: 'உங்கள் மின்னஞ்சலுக்கு சரிபார்ப்பு இணைப்பு அனுப்பினோம்.',
  auth_tryDifferentEmail: 'வேறு மின்னஞ்சல் முயற்சிக்கவும்',
  auth_backToLogin: 'உள்நுழைவுக்கு திரும்பவும்',
  home_greeting: 'வணக்கம், தோட்டக்காரர் 🌿',
  home_subtitle: 'உங்கள் தாவரங்கள் எப்படி இருக்கின்றன?',
  home_search: 'நோய்கள், தாவரங்கள் தேடவும்...',
  home_categories: 'வகையின் மூலம் உலாவுங்கள்',
  home_flowers: 'பூக்கள்',
  home_leafPlants: 'இலைத் தாவரங்கள்',
  home_succulents: 'சாறுள்ள தாவரங்கள்',
  home_trees: 'மரங்கள்',
  home_scanBanner: 'உங்கள் தாவரங்களின் ஆரோக்கியம்',
  home_scanBannerSub: 'உடனடி AI நோயறிதலுக்கு ஒரு இலையை ஸ்கேன் செய்யவும்',
  home_scanBtn: 'இப்போதே ஸ்கேன் செய்யவும்',
  home_diseaseLib: 'தாவர நோயைக் கண்டறியவும்',
  home_diseaseLibSub: 'அறிகுறிகளை முன்கூட்டியே கண்டறிந்து உங்கள் தாவரங்களைப் பாதுகாக்கவும்.',
  home_viewAll: 'அனைத்தும் காண்க',
  home_floraDir: 'தோட்ட தாவர கோப்பகம்',
  home_floraDirSub: 'எங்கள் முழு தாவர கலைக்களஞ்சியத்தை உலாவுங்கள்',
  home_exploreCatalog: 'அட்டவணையை பார்க்கவும்',
  home_commonProblems: 'பொதுவான பிரச்சனைகள்',
  home_commonProblemsSub: 'முழு சிகிச்சை நெறிமுறையை காண தட்டவும்',
  home_seeAll: 'அனைத்தும் காண்க',
  home_highRisk: 'அதிக ஆபத்து',
  home_treatable: 'சிகிச்சை அளிக்கலாம்',
  weather_title: 'தோட்ட வானிலை',
  weather_loading: 'வானிலை பெறுகிறது...',
  weather_error: 'வானிலை கிடைக்கவில்லை',
  weather_enableLocation: 'வானிலை எச்சரிக்கைக்கு இருப்பிடத்தை இயக்கவும்',
  weather_humidity: 'ஈரப்பதம்',
  weather_wind: 'காற்று',
  weather_feelsLike: 'உணர்வுத் தட்பவெப்பம்',
  weather_alertHeat: '🌡️ வெப்ப அழுத்த எச்சரிக்கை — காலையில் தாவரங்களுக்கு நீர் பாய்ச்சுங்கள்',
  weather_alertFrost: '🧊 இன்று இரவு பனி ஆபத்து — மென்மையான தாவரங்களை உள்ளே கொண்டு வாருங்கள்',
  weather_alertRain: '🌧️ கனமழை எதிர்பார்க்கப்படுகிறது — இன்று நீர் பாய்ச்சாதீர்கள்',
  weather_alertDrought: '🌵 வறட்சி வரவிருக்கிறது — நீர்ப்பாசன அதிர்வெண்ணை அதிகரிக்கவும்',
  weather_alertWind: '💨 வலுவான காற்று — உயரமான தாவரங்களை பாதுகாக்கவும்',
  weather_alertHumidity: '🍄 அதிக ஈரப்பதம் — பூஞ்சை நோய்களுக்கு கவனமாக இருங்கள்',
  weather_good: 'நல்ல நிலைமைகள்',
  weather_goodSub: 'தோட்டக்குலத்திற்கு சிறந்த நாள்!',
  weather_lastUpdated: 'புதுப்பிக்கப்பட்டது',
  weather_tapForDetails: 'முழு முன்னறிவிப்பிற்கு தட்டவும்',
  weather_enableBtn: 'வானிலை எச்சரிக்கைகளை இயக்கவும்',
  scan_title: 'தாவர ஸ்கேனர்',
  scan_hint: 'இலையை மையப்படுத்தி · ஸ்கேன் தட்டவும்',
  scan_gallery: 'கேலரி',
  scan_flip: 'திருப்பவும்',
  scan_analyse: 'ஸ்கேன்',
  scan_analysing: 'பகுப்பாய்வு செய்கிறது…',
  scan_step1: 'இலை அமைப்பை கண்டறிகிறது…',
  scan_step2: 'குளோரோபில் முறைகளை பகுப்பாய்வு செய்கிறது…',
  scan_step3: 'நோய் தரவுத்தளத்துடன் ஒப்பிடுகிறது…',
  scan_step4: 'நோயறிதல் அறிக்கை உருவாக்குகிறது…',
  scan_result_risk: 'ஆபத்து',
  scan_result_match: 'பொருத்தம்',
  scan_result_topCause: 'முக்கிய காரணம்',
  scan_scanAgain: 'மீண்டும் ஸ்கேன் செய்யவும்',
  scan_viewReport: 'முழு அறிக்கையை காண்க',
  scan_cameraUnavailable: 'கேமரா கிடைக்கவில்லை',
  scan_cameraBody: 'உலாவி அமைப்புகளில் கேமரா அணுகலை அனுமதிக்கவும்.',
  scan_photoUploaded: 'புகைப்படம் பதிவேற்றப்பட்டது — ஸ்கேன் தட்டவும்',
  scan_error: 'நோயறிதல் தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.',
  diag_title: 'நோயறிதல்',
  diag_severity: 'தீவிரம்',
  diag_spreadRate: 'பரவல் வேகம்',
  diag_affectedArea: 'பாதிக்கப்பட்ட பகுதி',
  diag_confidence: 'நம்பகத்தன்மை',
  diag_causes: 'பொதுவான காரணங்கள்',
  diag_treatment: 'சிகிச்சை படிகள்',
  diag_addSchedule: 'பராமரிப்பு அட்டவணையில் சேர்க்கவும்',
  diag_added: 'அட்டவணையில் சேர்க்கப்பட்டது!',
  diag_urgency: 'அவசரம்',
  catalog_favorited: 'பிடித்தவற்றில் சேர்க்கப்பட்டது',
  catalog_unfavorited: 'பிடித்தவற்றிலிருந்து நீக்கப்பட்டது',
  catalog_addSchedule: 'அட்டவணையில் சேர்க்கவும்',
  catalog_noResults: 'தாவரங்கள் இல்லை',
  catalog_resetFilters: 'வடிகட்டிகளை மீட்டமைக்கவும்',
  care_title: 'பராமரிப்பு அட்டவணை',
  care_pending: 'நிலுவையில்',
  care_completed: 'முடிந்தது',
  care_addTask: 'பணி சேர்க்கவும்',
  care_plantName: 'தாவரப் பெயர்',
  care_taskType: 'பணி வகை',
  care_water: 'நீர்ப்பாசனம்',
  care_fertilize: 'உரமிடவும்',
  care_prune: 'கத்தரிக்கவும்',
  care_mist: 'தெளிக்கவும்',
  care_dueDate: 'நியமித்த தேதி',
  care_empty: 'பணிகள் இல்லை. மேலே ஒன்றை சேர்க்கவும்!',
  notif_title: 'அறிவிப்புகள்',
  notif_empty: 'அனைத்தும் சரியாக உள்ளது! அறிவிப்புகள் இல்லை.',
  notif_markAll: 'அனைத்தும் படித்ததாக குறிக்கவும்',
  notif_clearAll: 'அனைத்தும் அழிக்கவும்',
  profile_title: 'என் சுயவிவரம்',
  profile_plants: 'பராமரிக்கும் தாவரங்கள்',
  profile_favorites: 'பிடித்தவை',
  profile_careHealth: 'பராமரிப்பு ஆரோக்கிய விகிதம்',
  profile_editProfile: 'சுயவிவரத்தை திருத்தவும்',
  profile_editSub: 'உங்கள் பெயர் மற்றும் படத்தை புதுப்பிக்கவும்',
  profile_settings: 'அமைப்புகள் & பராமரிப்பு நினைவூட்டல்கள்',
  profile_settingsSub: 'மொழி, வானிலை மற்றும் விருப்பங்கள்',
  profile_alerts: 'தாவர ஆரோக்கிய எச்சரிக்கைகள்',
  profile_alertsSub: 'நோய் எச்சரிக்கைகள் மற்றும் பராமரிப்பு பணிகளை மதிப்பாய்வு செய்யவும்',
  profile_helpCenter: 'தாவர மருத்துவர் உதவி மையம்',
  profile_helpSub: 'தாவர நோய் வழிகாட்டிகள் மற்றும் தாவர ஆலோசனை',
  profile_helpBody: 'Flora தானாகவே தாவர சிகிச்சை நூலகங்களுடன் ஒத்திசைகிறது.',
  profile_logout: 'வெளியேறவும்',
  profile_name: 'பெயர்',
  profile_role: 'தோட்டக்காரர் தலைப்பு',
  settings_title: 'அமைப்புகள்',
  settings_language: 'மொழி',
  settings_languageSub: 'உங்கள் விருப்பமான மொழியை தேர்ந்தெடுக்கவும்',
  settings_weather: 'வானிலை எச்சரிக்கைகள்',
  settings_weatherSub: 'இருப்பிட அடிப்படையிலான தாவர பராமரிப்பு எச்சரிக்கைகள்',
  settings_weatherEnable: 'வானிலை எச்சரிக்கைகளை இயக்கவும்',
  settings_notifications: 'அறிவிப்புகள்',
  settings_notifSub: 'நோய் எச்சரிக்கைகள் மற்றும் பராமரிப்பு நினைவூட்டல்கள்',
  settings_careReminders: 'பராமரிப்பு நினைவூட்டல்கள்',
  settings_careRemindersSub: 'தினசரி நீர்ப்பாசன நினைவூட்டல்கள்',
  settings_theme: 'தோற்றம்',
  settings_themeSub: 'ஒளி முறை',
  settings_about: 'Flora பற்றி',
  settings_aboutSub: 'பதிப்பு மற்றும் உரிமங்கள்',
  settings_version: 'பதிப்பு 1.0.0',
  settings_chooseLanguage: 'மொழியை தேர்ந்தெடுக்கவும்',
  settings_saved: 'அமைப்புகள் சேமிக்கப்பட்டன!',
};

// ─── Hindi ────────────────────────────────────────────────────────────────────
const hi: Translations = {
  appName: 'Flora',
  appTagline: 'वानस्पतिक स्वास्थ्य प्रणाली',
  loading: 'Flora लोड हो रहा है...',
  save: 'सहेजें',
  cancel: 'रद्द करें',
  close: 'बंद करें',
  back: 'वापस',
  retry: 'पुनः प्रयास करें',
  search: 'खोजें',
  clearAll: 'सब साफ करें',
  markAllRead: 'सभी पढ़ा हुआ चिह्नित करें',
  noResults: 'कोई परिणाम नहीं मिला',
  error: 'कुछ गलत हो गया',
  success: 'सफलता',
  confirm: 'पुष्टि करें',
  delete: 'हटाएं',
  edit: 'संपादित करें',
  add: 'जोड़ें',
  done: 'हो गया',
  today: 'आज',
  tomorrow: 'कल',
  nav_home: 'होम',
  nav_scan: 'स्कैन',
  nav_profile: 'प्रोफ़ाइल',
  nav_settings: 'सेटिंग्स',
  nav_catalog: 'पौधे की सूची',
  nav_watering: 'सिंचाई कार्यक्रम',
  nav_notifications: 'सूचनाएं',
  nav_dashboard: 'डैशबोर्ड',
  splash_getStarted: 'शुरू करें',
  splash_haveAccount: 'मेरे पास पहले से खाता है',
  onboarding_title1: 'Flora में आपका स्वागत है',
  onboarding_body1: 'पौधों के स्वास्थ्य, रोग पहचान और देखभाल के लिए आपका साथी।',
  onboarding_title2: 'स्कैन और निदान करें',
  onboarding_body2: 'किसी भी पत्ते पर कैमरा लगाएं — हमारा AI सेकंडों में विश्लेषण करता है।',
  onboarding_title3: 'ट्रैक और विकसित हों',
  onboarding_body3: 'पानी देने की याद दिहानी सेट करें, पसंदीदा ट्रैक करें।',
  onboarding_skip: 'छोड़ें',
  onboarding_next: 'अगला',
  onboarding_signUp: 'साइन अप करें',
  onboarding_login: 'लॉग इन करें',
  auth_login: 'लॉग इन',
  auth_signup: 'साइन अप',
  auth_email: 'ईमेल पता',
  auth_password: 'पासवर्ड',
  auth_name: 'पूरा नाम',
  auth_rememberMe: 'मुझे याद रखें',
  auth_forgotPassword: 'पासवर्ड भूल गए?',
  auth_googleLogin: 'Google से लॉग इन करें',
  auth_googleSignup: 'Google से जारी रखें',
  auth_noAccount: 'खाता नहीं है?',
  auth_hasAccount: 'पहले से खाता है?',
  auth_welcomeBack: 'वापसी पर स्वागत है!',
  auth_welcomeBackBody: 'आपके पौधों ने आपको याद किया।',
  auth_accountCreated: 'खाता बना दिया!',
  auth_accountCreatedBody: 'Flora में आपका स्वागत है!',
  auth_goHome: 'होम पर जाएं',
  auth_passwordMin: 'पासवर्ड कम से कम 6 अक्षर होना चाहिए',
  auth_emailRequired: 'ईमेल आवश्यक है',
  auth_passwordRequired: 'पासवर्ड आवश्यक है',
  auth_nameRequired: 'नाम आवश्यक है',
  auth_checkInbox: 'अपना इनबॉक्स जांचें',
  auth_checkInboxBody: 'हमने आपके ईमेल पर सत्यापन लिंक भेजा है।',
  auth_tryDifferentEmail: 'अलग ईमेल आज़माएं',
  auth_backToLogin: 'लॉग इन पर वापस जाएं',
  home_greeting: 'नमस्ते, बागवान 🌿',
  home_subtitle: 'आपके पौधे आज कैसे हैं?',
  home_search: 'बीमारियां, पौधे खोजें...',
  home_categories: 'श्रेणी के अनुसार ब्राउज़ करें',
  home_flowers: 'फूल',
  home_leafPlants: 'पत्ती के पौधे',
  home_succulents: 'रसीले पौधे',
  home_trees: 'पेड़',
  home_scanBanner: 'आपके पौधों का स्वास्थ्य',
  home_scanBannerSub: 'तत्काल AI निदान के लिए पत्ता स्कैन करें',
  home_scanBtn: 'अभी स्कैन करें',
  home_diseaseLib: 'पौधे की बीमारी खोजें',
  home_diseaseLibSub: 'लक्षणों को जल्दी पहचानें और अपने पौधों की रक्षा करें।',
  home_viewAll: 'सभी देखें',
  home_floraDir: 'गार्डन फ्लोरा डायरेक्टरी',
  home_floraDirSub: 'हमारे पूर्ण पौधे विश्वकोश को ब्राउज़ करें',
  home_exploreCatalog: 'सूची देखें',
  home_commonProblems: 'सामान्य समस्याएं',
  home_commonProblemsSub: 'पूरा उपचार प्रोटोकॉल देखने के लिए टैप करें',
  home_seeAll: 'सभी देखें',
  home_highRisk: 'उच्च जोखिम',
  home_treatable: 'इलाज योग्य',
  weather_title: 'बगीचे का मौसम',
  weather_loading: 'मौसम प्राप्त हो रहा है...',
  weather_error: 'मौसम उपलब्ध नहीं',
  weather_enableLocation: 'मौसम अलर्ट के लिए स्थान सक्षम करें',
  weather_humidity: 'आर्द्रता',
  weather_wind: 'हवा',
  weather_feelsLike: 'महसूस होता है',
  weather_alertHeat: '🌡️ गर्मी का तनाव — सुबह पौधों को पानी दें',
  weather_alertFrost: '🧊 रात में पाला का खतरा — नाजुक पौधों को अंदर लाएं',
  weather_alertRain: '🌧️ भारी बारिश — आज पानी न दें',
  weather_alertDrought: '🌵 सूखे का अनुमान — पानी देने की आवृत्ति बढ़ाएं',
  weather_alertWind: '💨 तेज हवाएं — लंबे पौधों को सुरक्षित करें',
  weather_alertHumidity: '🍄 उच्च आर्द्रता — फंगल रोगों के लिए सतर्क रहें',
  weather_good: 'अच्छी परिस्थितियां',
  weather_goodSub: 'बागवानी के लिए बढ़िया दिन!',
  weather_lastUpdated: 'अपडेट किया गया',
  weather_tapForDetails: 'पूर्ण पूर्वानुमान के लिए टैप करें',
  weather_enableBtn: 'मौसम अलर्ट सक्षम करें',
  scan_title: 'पौधा स्कैनर',
  scan_hint: 'पत्ते को बीच में रखें · स्कैन टैप करें',
  scan_gallery: 'गैलरी',
  scan_flip: 'पलटें',
  scan_analyse: 'स्कैन',
  scan_analysing: 'विश्लेषण हो रहा है…',
  scan_step1: 'पत्ती संरचना का पता लगाया जा रहा है…',
  scan_step2: 'क्लोरोफिल पैटर्न का विश्लेषण…',
  scan_step3: 'रोग डेटाबेस से मिलान…',
  scan_step4: 'निदान रिपोर्ट तैयार हो रही है…',
  scan_result_risk: 'जोखिम',
  scan_result_match: 'मिलान',
  scan_result_topCause: 'मुख्य कारण',
  scan_scanAgain: 'फिर स्कैन करें',
  scan_viewReport: 'पूरी रिपोर्ट देखें',
  scan_cameraUnavailable: 'कैमरा उपलब्ध नहीं',
  scan_cameraBody: 'ब्राउज़र सेटिंग्स में कैमरा एक्सेस दें, या फोटो अपलोड करें।',
  scan_photoUploaded: 'फोटो अपलोड हुई — स्कैन टैप करें',
  scan_error: 'निदान विफल। कृपया पुनः प्रयास करें।',
  diag_title: 'निदान',
  diag_severity: 'गंभीरता',
  diag_spreadRate: 'फैलने की दर',
  diag_affectedArea: 'प्रभावित क्षेत्र',
  diag_confidence: 'विश्वास',
  diag_causes: 'सामान्य कारण',
  diag_treatment: 'उपचार चरण',
  diag_addSchedule: 'देखभाल कार्यक्रम में जोड़ें',
  diag_added: 'कार्यक्रम में जोड़ा गया!',
  diag_urgency: 'तात्कालिकता',
  catalog_favorited: 'पसंदीदा में जोड़ा',
  catalog_unfavorited: 'पसंदीदा से हटाया',
  catalog_addSchedule: 'कार्यक्रम में जोड़ें',
  catalog_noResults: 'कोई पौधा नहीं मिला',
  catalog_resetFilters: 'फ़िल्टर रीसेट करें',
  care_title: 'देखभाल कार्यक्रम',
  care_pending: 'लंबित',
  care_completed: 'पूर्ण',
  care_addTask: 'कार्य जोड़ें',
  care_plantName: 'पौधे का नाम',
  care_taskType: 'कार्य प्रकार',
  care_water: 'पानी देना',
  care_fertilize: 'उर्वरक',
  care_prune: 'छंटाई',
  care_mist: 'धुंध',
  care_dueDate: 'नियत तारीख',
  care_empty: 'कोई कार्य नहीं। ऊपर एक जोड़ें!',
  notif_title: 'सूचनाएं',
  notif_empty: 'सब ठीक है! कोई सूचना नहीं।',
  notif_markAll: 'सभी पढ़ा हुआ चिह्नित करें',
  notif_clearAll: 'सब साफ करें',
  profile_title: 'मेरी प्रोफ़ाइल',
  profile_plants: 'देखभाल में पौधे',
  profile_favorites: 'पसंदीदा',
  profile_careHealth: 'देखभाल स्वास्थ्य दर',
  profile_editProfile: 'प्रोफ़ाइल संपादित करें',
  profile_editSub: 'अपना नाम और अवतार अपडेट करें',
  profile_settings: 'सेटिंग्स और देखभाल अनुस्मारक',
  profile_settingsSub: 'भाषा, मौसम और प्राथमिकताएं',
  profile_alerts: 'पौधे स्वास्थ्य अलर्ट',
  profile_alertsSub: 'रोग अलर्ट और देखभाल कार्यों की समीक्षा करें',
  profile_helpCenter: 'डॉक्टर प्लांट हेल्प सेंटर',
  profile_helpSub: 'पौधे की बीमारी गाइड और वनस्पति सलाह',
  profile_helpBody: 'Flora स्वचालित रूप से वनस्पति उपचार पुस्तकालयों के साथ सिंक होता है।',
  profile_logout: 'लॉग आउट',
  profile_name: 'नाम',
  profile_role: 'बागवानी शीर्षक',
  settings_title: 'सेटिंग्स',
  settings_language: 'भाषा',
  settings_languageSub: 'अपनी पसंदीदा भाषा चुनें',
  settings_weather: 'मौसम अलर्ट',
  settings_weatherSub: 'स्थान-आधारित पौधे देखभाल अलर्ट',
  settings_weatherEnable: 'मौसम अलर्ट सक्षम करें',
  settings_notifications: 'पुश सूचनाएं',
  settings_notifSub: 'रोग अलर्ट और देखभाल अनुस्मारक',
  settings_careReminders: 'देखभाल अनुस्मारक',
  settings_careRemindersSub: 'दैनिक सिंचाई अनुस्मारक',
  settings_theme: 'उपस्थिति',
  settings_themeSub: 'लाइट मोड',
  settings_about: 'Flora के बारे में',
  settings_aboutSub: 'संस्करण और लाइसेंस',
  settings_version: 'संस्करण 1.0.0',
  settings_chooseLanguage: 'भाषा चुनें',
  settings_saved: 'सेटिंग्स सहेजी गई!',
};

// ─── French ───────────────────────────────────────────────────────────────────
const fr: Translations = {
  appName: 'Flora',
  appTagline: 'Système de santé botanique',
  loading: 'Chargement de Flora...',
  save: 'Enregistrer',
  cancel: 'Annuler',
  close: 'Fermer',
  back: 'Retour',
  retry: 'Réessayer',
  search: 'Rechercher',
  clearAll: 'Tout effacer',
  markAllRead: 'Tout marquer comme lu',
  noResults: 'Aucun résultat',
  error: 'Une erreur est survenue',
  success: 'Succès',
  confirm: 'Confirmer',
  delete: 'Supprimer',
  edit: 'Modifier',
  add: 'Ajouter',
  done: 'Terminé',
  today: "Aujourd'hui",
  tomorrow: 'Demain',
  nav_home: 'Accueil',
  nav_scan: 'Scanner',
  nav_profile: 'Profil',
  nav_settings: 'Paramètres',
  nav_catalog: 'Catalogue',
  nav_watering: "Programme d'arrosage",
  nav_notifications: 'Notifications',
  nav_dashboard: 'Tableau de bord',
  splash_getStarted: 'Commencer',
  splash_haveAccount: "J'ai déjà un compte",
  onboarding_title1: 'Bienvenue sur Flora',
  onboarding_body1: 'Votre compagnon botanique intelligent pour la santé des plantes.',
  onboarding_title2: 'Scanner & Diagnostiquer',
  onboarding_body2: "Pointez votre caméra sur n'importe quelle feuille — notre IA analyse en secondes.",
  onboarding_title3: 'Suivre & Prospérer',
  onboarding_body3: 'Définissez des rappels, suivez vos favoris.',
  onboarding_skip: 'Ignorer',
  onboarding_next: 'Suivant',
  onboarding_signUp: "S'inscrire",
  onboarding_login: 'Se connecter',
  auth_login: 'Connexion',
  auth_signup: "S'inscrire",
  auth_email: 'Adresse e-mail',
  auth_password: 'Mot de passe',
  auth_name: 'Nom complet',
  auth_rememberMe: 'Se souvenir de moi',
  auth_forgotPassword: 'Mot de passe oublié?',
  auth_googleLogin: 'Connexion avec Google',
  auth_googleSignup: 'Continuer avec Google',
  auth_noAccount: 'Pas de compte?',
  auth_hasAccount: 'Déjà un compte?',
  auth_welcomeBack: 'Bon retour!',
  auth_welcomeBackBody: 'Vos plantes vous ont manqué.',
  auth_accountCreated: 'Compte créé!',
  auth_accountCreatedBody: 'Bienvenue sur Flora!',
  auth_goHome: "Aller à l'accueil",
  auth_passwordMin: 'Le mot de passe doit comporter au moins 6 caractères',
  auth_emailRequired: "L'e-mail est requis",
  auth_passwordRequired: 'Le mot de passe est requis',
  auth_nameRequired: 'Le nom est requis',
  auth_checkInbox: 'Vérifiez votre boîte de réception',
  auth_checkInboxBody: 'Nous avons envoyé un lien de vérification à votre e-mail.',
  auth_tryDifferentEmail: 'essayer un autre e-mail',
  auth_backToLogin: 'Retour à la connexion',
  home_greeting: 'Bonjour, Jardinier 🌿',
  home_subtitle: 'Comment vont vos plantes aujourd\'hui?',
  home_search: 'Rechercher maladies, plantes...',
  home_categories: 'Parcourir par catégorie',
  home_flowers: 'Fleurs',
  home_leafPlants: 'Plantes à feuilles',
  home_succulents: 'Succulentes',
  home_trees: 'Arbres',
  home_scanBanner: 'Santé de vos plantes',
  home_scanBannerSub: 'Scannez une feuille pour un diagnostic IA instantané',
  home_scanBtn: 'Scanner maintenant',
  home_diseaseLib: 'Trouver une maladie',
  home_diseaseLibSub: 'Détectez les symptômes tôt et protégez vos plantes.',
  home_viewAll: 'Voir tout',
  home_floraDir: 'Répertoire floral',
  home_floraDirSub: 'Parcourez notre encyclopédie complète',
  home_exploreCatalog: 'Voir le catalogue',
  home_commonProblems: 'Problèmes courants',
  home_commonProblemsSub: 'Appuyez pour voir le protocole de traitement',
  home_seeAll: 'Voir tout',
  home_highRisk: 'Risque élevé',
  home_treatable: 'Traitable',
  weather_title: 'Météo du jardin',
  weather_loading: 'Chargement de la météo...',
  weather_error: 'Météo indisponible',
  weather_enableLocation: 'Activer la localisation pour les alertes météo',
  weather_humidity: 'Humidité',
  weather_wind: 'Vent',
  weather_feelsLike: 'Ressenti',
  weather_alertHeat: '🌡️ Alerte chaleur — arrosez tôt le matin',
  weather_alertFrost: '🧊 Risque de gel — rentrez les plantes fragiles',
  weather_alertRain: '🌧️ Pluie attendue — pas d\'arrosage aujourd\'hui',
  weather_alertDrought: '🌵 Sécheresse — augmentez la fréquence d\'arrosage',
  weather_alertWind: '💨 Vents forts — sécurisez les plantes hautes',
  weather_alertHumidity: '🍄 Humidité élevée — attention aux maladies fongiques',
  weather_good: 'Bonnes conditions',
  weather_goodSub: 'Super journée pour jardiner!',
  weather_lastUpdated: 'Mis à jour',
  weather_tapForDetails: 'Appuyer pour les prévisions',
  weather_enableBtn: 'Activer les alertes météo',
  scan_title: 'Scanner de plantes',
  scan_hint: 'Centrez la feuille · appuyez sur scanner',
  scan_gallery: 'Galerie',
  scan_flip: 'Retourner',
  scan_analyse: 'Scanner',
  scan_analysing: 'Analyse en cours…',
  scan_step1: 'Détection de la structure foliaire…',
  scan_step2: 'Analyse des motifs chlorophylliens…',
  scan_step3: 'Référencement croisé de la base de données…',
  scan_step4: 'Génération du rapport de diagnostic…',
  scan_result_risk: 'Risque',
  scan_result_match: 'correspondance',
  scan_result_topCause: 'Cause principale',
  scan_scanAgain: 'Scanner à nouveau',
  scan_viewReport: 'Voir le rapport complet',
  scan_cameraUnavailable: 'Caméra indisponible',
  scan_cameraBody: "Autorisez l'accès à la caméra ou téléchargez une photo.",
  scan_photoUploaded: 'Photo téléchargée — appuyez sur Scanner',
  scan_error: 'Diagnostic échoué. Veuillez réessayer.',
  diag_title: 'Diagnostic',
  diag_severity: 'Sévérité',
  diag_spreadRate: 'Taux de propagation',
  diag_affectedArea: 'Zone affectée',
  diag_confidence: 'Confiance',
  diag_causes: 'Causes communes',
  diag_treatment: 'Étapes de traitement',
  diag_addSchedule: 'Ajouter au programme',
  diag_added: 'Ajouté au programme!',
  diag_urgency: 'Urgence',
  catalog_favorited: 'Ajouté aux favoris',
  catalog_unfavorited: 'Retiré des favoris',
  catalog_addSchedule: 'Ajouter au programme',
  catalog_noResults: 'Aucune plante trouvée',
  catalog_resetFilters: 'Réinitialiser les filtres',
  care_title: 'Programme de soin',
  care_pending: 'en attente',
  care_completed: 'terminé',
  care_addTask: 'Ajouter une tâche',
  care_plantName: 'Nom de la plante',
  care_taskType: 'Type de tâche',
  care_water: 'Arroser',
  care_fertilize: 'Fertiliser',
  care_prune: 'Tailler',
  care_mist: 'Vaporiser',
  care_dueDate: "Date d'échéance",
  care_empty: 'Aucune tâche. Ajoutez-en une!',
  notif_title: 'Notifications',
  notif_empty: 'Tout est bon! Aucune notification.',
  notif_markAll: 'Tout marquer comme lu',
  notif_clearAll: 'Tout effacer',
  profile_title: 'Mon profil',
  profile_plants: 'Plantes en soin',
  profile_favorites: 'Favoris',
  profile_careHealth: 'Taux de santé des soins',
  profile_editProfile: 'Modifier le profil',
  profile_editSub: 'Mettre à jour votre nom et avatar',
  profile_settings: 'Paramètres et rappels',
  profile_settingsSub: 'Langue, météo et préférences',
  profile_alerts: 'Alertes santé des plantes',
  profile_alertsSub: 'Revoir les alertes de maladie',
  profile_helpCenter: 'Centre d\'aide Dr Plant',
  profile_helpSub: 'Guides sur les maladies des plantes',
  profile_helpBody: 'Flora se synchronise automatiquement avec les bibliothèques de traitement botanique.',
  profile_logout: 'Se déconnecter',
  profile_name: 'Nom',
  profile_role: 'Titre de jardinier',
  settings_title: 'Paramètres',
  settings_language: 'Langue',
  settings_languageSub: 'Choisissez votre langue préférée',
  settings_weather: 'Alertes météo',
  settings_weatherSub: 'Alertes de soin basées sur la localisation',
  settings_weatherEnable: 'Activer les alertes météo',
  settings_notifications: 'Notifications push',
  settings_notifSub: 'Alertes de maladie et rappels de soin',
  settings_careReminders: 'Rappels de soin',
  settings_careRemindersSub: "Rappels quotidiens d'arrosage",
  settings_theme: 'Apparence',
  settings_themeSub: 'Mode clair',
  settings_about: 'À propos de Flora',
  settings_aboutSub: 'Version et licences',
  settings_version: 'Version 1.0.0',
  settings_chooseLanguage: 'Choisir la langue',
  settings_saved: 'Paramètres sauvegardés!',
};

// ─── Spanish ──────────────────────────────────────────────────────────────────
const es: Translations = {
  appName: 'Flora',
  appTagline: 'Sistema de salud botánica',
  loading: 'Cargando Flora...',
  save: 'Guardar',
  cancel: 'Cancelar',
  close: 'Cerrar',
  back: 'Atrás',
  retry: 'Reintentar',
  search: 'Buscar',
  clearAll: 'Limpiar todo',
  markAllRead: 'Marcar todo como leído',
  noResults: 'No se encontraron resultados',
  error: 'Algo salió mal',
  success: 'Éxito',
  confirm: 'Confirmar',
  delete: 'Eliminar',
  edit: 'Editar',
  add: 'Agregar',
  done: 'Listo',
  today: 'Hoy',
  tomorrow: 'Mañana',
  nav_home: 'Inicio',
  nav_scan: 'Escanear',
  nav_profile: 'Perfil',
  nav_settings: 'Ajustes',
  nav_catalog: 'Catálogo de plantas',
  nav_watering: 'Horario de riego',
  nav_notifications: 'Notificaciones',
  nav_dashboard: 'Panel',
  splash_getStarted: 'Comenzar',
  splash_haveAccount: 'Ya tengo una cuenta',
  onboarding_title1: 'Bienvenido a Flora',
  onboarding_body1: 'Tu compañero botánico inteligente para la salud de las plantas.',
  onboarding_title2: 'Escanear y Diagnosticar',
  onboarding_body2: 'Apunta tu cámara a cualquier hoja — nuestra IA analiza en segundos.',
  onboarding_title3: 'Rastrear y Prosperar',
  onboarding_body3: 'Establece recordatorios de riego y rastrea tus favoritos.',
  onboarding_skip: 'Omitir',
  onboarding_next: 'Siguiente',
  onboarding_signUp: 'Registrarse',
  onboarding_login: 'Iniciar sesión',
  auth_login: 'Iniciar sesión',
  auth_signup: 'Registrarse',
  auth_email: 'Dirección de correo',
  auth_password: 'Contraseña',
  auth_name: 'Nombre completo',
  auth_rememberMe: 'Recordarme',
  auth_forgotPassword: '¿Olvidaste tu contraseña?',
  auth_googleLogin: 'Iniciar sesión con Google',
  auth_googleSignup: 'Continuar con Google',
  auth_noAccount: '¿No tienes cuenta?',
  auth_hasAccount: '¿Ya tienes cuenta?',
  auth_welcomeBack: '¡Bienvenido de vuelta!',
  auth_welcomeBackBody: 'Tus plantas te extrañaron.',
  auth_accountCreated: '¡Cuenta creada!',
  auth_accountCreatedBody: '¡Bienvenido a Flora!',
  auth_goHome: 'Ir al inicio',
  auth_passwordMin: 'La contraseña debe tener al menos 6 caracteres',
  auth_emailRequired: 'El correo es obligatorio',
  auth_passwordRequired: 'La contraseña es obligatoria',
  auth_nameRequired: 'El nombre es obligatorio',
  auth_checkInbox: 'Revisa tu bandeja de entrada',
  auth_checkInboxBody: 'Enviamos un enlace de verificación a tu correo.',
  auth_tryDifferentEmail: 'probar otro correo',
  auth_backToLogin: 'Volver al inicio de sesión',
  home_greeting: 'Hola, Jardinero 🌿',
  home_subtitle: '¿Cómo están tus plantas hoy?',
  home_search: 'Buscar enfermedades, plantas...',
  home_categories: 'Explorar por categoría',
  home_flowers: 'Flores',
  home_leafPlants: 'Plantas de hoja',
  home_succulents: 'Suculentas',
  home_trees: 'Árboles',
  home_scanBanner: 'Salud de tus plantas',
  home_scanBannerSub: 'Escanea una hoja para diagnóstico IA instantáneo',
  home_scanBtn: 'Escanear ahora',
  home_diseaseLib: 'Encontrar enfermedad de planta',
  home_diseaseLibSub: 'Detecta síntomas temprano y protege tus plantas.',
  home_viewAll: 'Ver todo',
  home_floraDir: 'Directorio de flora',
  home_floraDirSub: 'Explora nuestra enciclopedia completa de plantas',
  home_exploreCatalog: 'Ver catálogo',
  home_commonProblems: 'Problemas comunes',
  home_commonProblemsSub: 'Toca cualquier condición para ver el protocolo de tratamiento',
  home_seeAll: 'Ver todo',
  home_highRisk: 'Alto riesgo',
  home_treatable: 'Tratable',
  weather_title: 'Clima del jardín',
  weather_loading: 'Obteniendo clima...',
  weather_error: 'Clima no disponible',
  weather_enableLocation: 'Activar ubicación para alertas climáticas',
  weather_humidity: 'Humedad',
  weather_wind: 'Viento',
  weather_feelsLike: 'Sensación térmica',
  weather_alertHeat: '🌡️ Alerta de calor — riega temprano en la mañana',
  weather_alertFrost: '🧊 Riesgo de helada — mete las plantas delicadas',
  weather_alertRain: '🌧️ Lluvia esperada — no riegues hoy',
  weather_alertDrought: '🌵 Sequía — aumenta la frecuencia de riego',
  weather_alertWind: '💨 Vientos fuertes — asegura las plantas altas',
  weather_alertHumidity: '🍄 Alta humedad — vigilar enfermedades fúngicas',
  weather_good: 'Buenas condiciones',
  weather_goodSub: '¡Gran día para jardinear!',
  weather_lastUpdated: 'Actualizado',
  weather_tapForDetails: 'Toca para pronóstico completo',
  weather_enableBtn: 'Activar alertas climáticas',
  scan_title: 'Escáner de plantas',
  scan_hint: 'Centra la hoja · toca escanear',
  scan_gallery: 'Galería',
  scan_flip: 'Voltear',
  scan_analyse: 'Escanear',
  scan_analysing: 'Analizando…',
  scan_step1: 'Detectando estructura foliar…',
  scan_step2: 'Analizando patrones de clorofila…',
  scan_step3: 'Referenciando base de datos de enfermedades…',
  scan_step4: 'Generando informe de diagnóstico…',
  scan_result_risk: 'Riesgo',
  scan_result_match: 'coincidencia',
  scan_result_topCause: 'Causa principal',
  scan_scanAgain: 'Escanear de nuevo',
  scan_viewReport: 'Ver informe completo',
  scan_cameraUnavailable: 'Cámara no disponible',
  scan_cameraBody: 'Permite el acceso a la cámara o sube una foto.',
  scan_photoUploaded: 'Foto subida — toca Escanear',
  scan_error: 'Diagnóstico fallido. Inténtalo de nuevo.',
  diag_title: 'Diagnóstico',
  diag_severity: 'Gravedad',
  diag_spreadRate: 'Tasa de propagación',
  diag_affectedArea: 'Área afectada',
  diag_confidence: 'Confianza',
  diag_causes: 'Causas comunes',
  diag_treatment: 'Pasos de tratamiento',
  diag_addSchedule: 'Agregar al programa de cuidado',
  diag_added: '¡Agregado al programa!',
  diag_urgency: 'Urgencia',
  catalog_favorited: 'Agregado a favoritos',
  catalog_unfavorited: 'Eliminado de favoritos',
  catalog_addSchedule: 'Agregar al programa',
  catalog_noResults: 'No se encontraron plantas',
  catalog_resetFilters: 'Restablecer filtros',
  care_title: 'Programa de cuidado',
  care_pending: 'pendiente',
  care_completed: 'completado',
  care_addTask: 'Agregar tarea',
  care_plantName: 'Nombre de la planta',
  care_taskType: 'Tipo de tarea',
  care_water: 'Regar',
  care_fertilize: 'Fertilizar',
  care_prune: 'Podar',
  care_mist: 'Nebulizar',
  care_dueDate: 'Fecha límite',
  care_empty: 'Sin tareas. ¡Agrega una!',
  notif_title: 'Notificaciones',
  notif_empty: '¡Todo bien! Sin notificaciones.',
  notif_markAll: 'Marcar todo como leído',
  notif_clearAll: 'Limpiar todo',
  profile_title: 'Mi perfil',
  profile_plants: 'Plantas en cuidado',
  profile_favorites: 'Favoritos',
  profile_careHealth: 'Tasa de salud del cuidado',
  profile_editProfile: 'Editar perfil',
  profile_editSub: 'Actualiza tu nombre y avatar',
  profile_settings: 'Ajustes y recordatorios',
  profile_settingsSub: 'Idioma, clima y preferencias',
  profile_alerts: 'Alertas de salud de plantas',
  profile_alertsSub: 'Revisar alertas de enfermedad',
  profile_helpCenter: 'Centro de ayuda Dr. Plant',
  profile_helpSub: 'Guías de enfermedades de plantas',
  profile_helpBody: 'Flora se sincroniza automáticamente con las bibliotecas de tratamiento.',
  profile_logout: 'Cerrar sesión',
  profile_name: 'Nombre',
  profile_role: 'Título de jardinero',
  settings_title: 'Ajustes',
  settings_language: 'Idioma',
  settings_languageSub: 'Elige tu idioma preferido',
  settings_weather: 'Alertas climáticas',
  settings_weatherSub: 'Alertas de cuidado de plantas basadas en ubicación',
  settings_weatherEnable: 'Activar alertas climáticas',
  settings_notifications: 'Notificaciones push',
  settings_notifSub: 'Alertas de enfermedad y recordatorios de cuidado',
  settings_careReminders: 'Recordatorios de cuidado',
  settings_careRemindersSub: 'Recordatorios diarios de riego',
  settings_theme: 'Apariencia',
  settings_themeSub: 'Modo claro',
  settings_about: 'Acerca de Flora',
  settings_aboutSub: 'Versión y licencias',
  settings_version: 'Versión 1.0.0',
  settings_chooseLanguage: 'Elegir idioma',
  settings_saved: '¡Ajustes guardados!',
};

// ─── Language registry ────────────────────────────────────────────────────────
export const LANGUAGES: { code: LangCode; label: string; nativeLabel: string; flag: string }[] = [
  { code: 'en', label: 'English',  nativeLabel: 'English',    flag: '🇺🇸' },
  { code: 'ta', label: 'Tamil',    nativeLabel: 'தமிழ்',       flag: '🇮🇳' },
  { code: 'hi', label: 'Hindi',    nativeLabel: 'हिन्दी',       flag: '🇮🇳' },
  { code: 'fr', label: 'French',   nativeLabel: 'Français',   flag: '🇫🇷' },
  { code: 'es', label: 'Spanish',  nativeLabel: 'Español',    flag: '🇪🇸' },
];

const ALL: Record<LangCode, Translations> = { en, ta, hi, fr, es };

export function getTranslations(lang: LangCode): Translations {
  return ALL[lang] ?? en;
}
