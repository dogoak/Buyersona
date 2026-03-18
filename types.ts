export type Language = 'en' | 'es';

export enum BusinessType {
  B2B = 'B2B',
  B2C = 'B2C',
  Service = 'Service',
  Product = 'Product',
  SaaS = 'SaaS',
  Retail = 'Retail'
}

export interface BusinessInput {
  // Stage 1: Identity & Context
  businessName: string;
  businessStage: 'idea' | 'startup' | 'growth' | 'mature'; // New: Business Stage
  websiteUrl?: string;
  businessType: string[];
  customBusinessType?: string;
  distributionModel: string;
  offeringType: string;
  differentiation: string;
  description: string;
  locationScope: string;
  targetRegion: string;
  currency: string;

  // Stage 2: Product Intelligence
  productName: string;
  productImages?: string[];
  documents?: string[];
  productTargetScope: 'b2b' | 'b2c' | 'both';

  // --- B2B SPECIFIC VALUE PROP ---
  b2bUseCase?: string[];
  b2bBuyerRole?: string[];
  b2bProblemSolved?: string[];
  customB2bProblem?: string;
  b2bPurchaseDrivers?: string[];
  customB2bDriver?: string;

  // --- B2C SPECIFIC VALUE PROP ---
  b2cPurchaseContext?: string[];
  b2cNaturalChannel?: string[]; // Changed from string to string[]
  b2cProblemSolved?: string[];
  customB2cProblem?: string;
  b2cPurchaseDrivers?: string[];
  customB2cDriver?: string;

  // Shared / Global Product attributes
  secondaryBenefits: string[];
  painOfInaction: string;
  marketPositioning: string;
  priceRelativity: string;
  usageFrequency: string[];

  // Stage 3: Money (Revenue Model)
  targetCustomer: string[];
  paymentModel: string[];

  productPrice: string; // New: Price of 1 unit
  purchaseVolume: string; // New: Typical quantity purchased
  transactionType?: 'per_unit' | 'avg_ticket'; // Deprecated but kept for compatibility if needed

  customerValue: string[];
  salesCycle: string[];

  // Stage 4: Acquisition & Strategy
  socialMediaPresence: string[];
  customSocialMedia?: string;
  salesChannels: string[];
  customSalesChannel?: string;
  acquisitionChannels: string[];
  customAcquisitionChannel?: string;

  bestChannel: string;
  bestClientChannel: string;
  volumeChannel: string;

  adSpendRange: string;
  customAdSpend?: string;

  demandPredictability: string;
  responseMechanism: string;
  prospectingSources: string[];
  customProspectingSource?: string;

  // Strategic Ambition
  exploreSecondaryMarket?: boolean;
  secondaryMarketType?: 'b2b' | 'b2c';

  // Stage 5: Operations
  teamSize: number;
  capacityPerDay: number;
  capacityChannel: string[];
  responseSla: string;
  automationTools: string[];
  surgeHandling: string;
  supportReadiness?: string;

  // Stage 6: Pain
  primaryPain: string[];
  customPain?: string;
  businessRiskIfNoChange: string;

  // Stage 7: Ambition
  growthGoal: string[];
  growthPace: string;
  additionalNotes?: string;

  // Optional fields for cost tracking
  websiteAnalysisCostUsd?: number;
}

export enum PersonaType {
  PRIMARY = 'Primary',
  ALTERNATIVE = 'Alternative',
  CASH_COW = 'Cash Cow',
  SCALABLE = 'Scalable',
  LONG_TERM = 'Long Term'
}

// --- DEEP PERSONA PROFILES ---

export interface DemographicProfile {
  role: string;
  companyType: string;
  companySize: string;
  industry: string;
  marketType: string;
}

export interface PsychologicalProfile {
  motivations: string[];
  fears: string[];
  hates: string;
  decisionTriggers: string;
  uncertaintyDrivers: string;
}

export interface SocialProfile {
  reportsTo: string;
  desiredImage: string;
  reputationalRisk: string;
  adoptionStyle: string;
}

export interface EconomicProfile {
  costsControlled: string;
  revenueImpacted: string;
  keyMetrics: string[];
  goodPurchaseDefinition: string;
  badPurchaseDefinition: string;
}

export interface MaturityProfile {
  stage: string;
  buyingBehavior: string;
  decisionSpeed: string;
  riskTolerance: string;
}

export interface FrictionProfile {
  barriers: string[];
  approvalNeeds: string;
  salesTouch: string;
  keyObjections: string[];
}

export interface PersonaStrategy {
  bestChannel: string;
  secondaryChannel: string;
  marketingHook: string;
  contentIdeas: string[]; // Changed from contentIdea: string
  offerAngle: string;
  minBudget: string; // New: Minimum budget for results
  whyThisPersona: string; // New: Explanation for recommendation
}

export interface Persona {
  name: string;
  type: PersonaType;
  suitabilityScore: number;
  oneLiner: string;

  // The 6 Profiles
  demographic: DemographicProfile;
  psychological: PsychologicalProfile;
  social: SocialProfile;
  economic: EconomicProfile;
  maturity: MaturityProfile;
  friction: FrictionProfile;

  // Strategy
  strategy: PersonaStrategy;
}

export interface MarketInsights {
  industry: string;
  trends: string[];
  typicalSalesCycle: string;
  benchmarkCAC: string;
  benchmarkConversion: string;
  keySuccessFactors: string[];
}

export interface OperationalAnalysis {
  status: 'Safe' | 'Caution' | 'Danger';
  capacityWarning: string;
  advice: string;
  maxLeadsPerMonth: number;
}

export interface CompetitorAnalysis {
  name: string;
  website: string;
  overlap: string;
  differentiation: string;
}

export interface SocialListening {
  platform: string;
  topic: string;
  sentiment: string;
  insight: string;
  url?: string;
}

export interface GrowthOpportunity {
  title: string;
  description: string;
  type: 'Market Expansion' | 'New Segment' | 'Product Innovation';
  pros: string[];
  cons: string[];
}

export interface BlueOcean {
  status: 'Red Ocean' | 'Blue Ocean' | 'Hybrid';
  diagnosis: string;
  blueOceanPath: string;
  errcGrid: {
    eliminate: string[];
    raise: string[];
    reduce: string[];
    create: string[];
  };
}

export interface StrategicAnalysis {
  summary: string;
  businessClassification: string;
  marketInsights: MarketInsights;
  competitors: CompetitorAnalysis[]; // New
  socialListening: SocialListening[]; // New
  blueOcean: BlueOcean; // New
  demandMap: Persona[];
  operationalCheck: OperationalAnalysis;
  actionPlan: string[];
  growthOpportunities?: GrowthOpportunity[]; // New: Alternative Markets/Clients
}

// ----------------------------------------------------------------------
// PRODUCT DEEP DIVE TYPES (EXTREME GRANULARITY V2)
// ----------------------------------------------------------------------

export interface DeepDiveInput {
  analysisScope?: 'specific_product' | 'product_family'; // New: one SKU vs product line
  productFamilyDescription?: string; // Description of the product family when scope is 'product_family'
  productName: string;
  productDescription: string;
  productUrl?: string;
  productImages?: string[]; // Used for AI analysis only, stripped before DB save
  unitPrice: string;
  unitCost?: string;
  specificPainSolved: string;
  currentCustomerProfile: string;
  desiredCustomerProfile: string;
  mainObjection: string;
  directCompetitors: string[];

  // Strategic context (multi-choice)
  targetAudience?: string[];     // B2B, B2C, B2B2C, D2C — multi-select
  salesPlatforms?: string[];     // Selected platforms
  expectedVolume?: string;       // Volume range
  differentiator?: string;       // Precio, Calidad, Diseño, Servicio, Innovación, Exclusividad, No sé
  deliveryModel?: string;        // Digital, Físico, Servicio, Combo
  priceRange?: string;           // <$10, $10-50, $50-200, $200-1000, >$1000
  repurchaseFrequency?: string[];// Única, Mensual, etc. — multi-select
  productStage?: string;         // Idea, MVP, En Ventas, Escala
  currentMargin?: string;        // Computed or free text
  unitCostRaw?: string;          // Raw cost input for margin calculator
  uniqueAngle?: string;          // What makes it different from generic alternatives
  salesModel?: string;           // Mayorista, Minorista, Ambos, Nuevos Mercados
}

export interface DayInLifeProfile {
  morningRoutine: string;
  workdayHabits: string;
  eveningRoutine: string;
  weekendActivities: string;
  frequentPhysicalPlaces: string[];
  frequentDigitalPlaces: string[];
  musicAndEntertainment: string;
  vehicleAndCommute: string;
  vacationPreferences: string;
  socialCircle: string;
}

export interface AspirationalProfile {
  clothingBrands: string[];
  roleModels: string[];
  influencersFollowed: string[];
  contentCreatorsConsumed: string[];
  lifeGoals: string;
}

export interface DeepDiveGoToMarket {
  primaryChannel: string;
  secondaryChannel: string;
  thePerfectPitch: string;
  toneOfVoice: string;
  specificTactics: string[];
}

export interface DeepDivePersona {
  name: string;
  type: 'Ideal' | 'Secundario' | 'Emergente' | 'Nicho' | 'Aspiracional';
  oneLiner: string;
  demographic: DemographicProfile;
  psychological: PsychologicalProfile;
  social: SocialProfile;
  dayInTheLife: DayInLifeProfile;
  aspirations: AspirationalProfile;
  goToMarket: DeepDiveGoToMarket;
}

export interface ObjectionHandling {
  objection: string;
  severity: 'Alta' | 'Media' | 'Baja';
  twoLineResponse: string;
  underlyingFear: string;
  reframeTechnique: string;     // Psychological reframe approach
}

export interface SalesSurvivalKit {
  coldEmailTemplate: string;
  coldDmTemplate: string;       // DM version for Instagram/WhatsApp
  landingPageStructure: string[];
  adAngles: string[];
  elevatorPitch: string;        // 30-second pitch
}

export interface DeepDiveMarketStrategy {
  businessModel: 'B2B' | 'B2C' | 'B2B2C' | 'D2C';
  modelJustification: string;
  recommendedPlatforms: string[];
  expectedMonthlyVolume: string;
  retentionStrategies: string[];
  loyaltyHooks: string[];
}

export interface PricingStrategy {
  currentPriceAssessment: string;  // Is it too high, too low, right?
  recommendedPrice: string;
  justification: string;
  psychologicalAnchors: string[];  // Anchoring techniques
  bundleOpportunities: string[];
}

export interface ContentCalendarDay {
  day: string;         // "Lunes", "Martes", etc.
  platform: string;    // "Instagram", "LinkedIn", etc.
  format: string;      // "Reel", "Carousel", "Story"
  topic: string;
  copyExample: string;
  cta: string;
}

export interface UnitEconomics {
  estimatedCAC: string;
  estimatedLTV: string;
  breakEvenUnits: string;
  suggestedMargin: string;
  roiProjection: string;
}

export interface DeepDiveExecutionStep {
  phase: 'ShortTerm' | 'MediumTerm';
  timing: string;
  focus: string;
  actions: string[];
  metrics: string[];
}

export interface SeasonalityInsight {
  period: string;
  intensity: 'Alta' | 'Media' | 'Baja';
  keyDates: string[];
  strategy: string;
}

export interface QuickWin {
  action: string;
  timeToExecute: string;
  expectedImpact: string;
  tools: string[];
}

export interface DeepDiveResult {
  summary: string;
  marketStrategy: DeepDiveMarketStrategy;
  pricingStrategy: PricingStrategy;
  unitEconomics: UnitEconomics;
  contentCalendar: ContentCalendarDay[];
  targetPersonas: DeepDivePersona[];
  objectionMatrix: ObjectionHandling[];
  competitorTearDown: CompetitorAnalysis[];
  socialListeningNiche: SocialListening[];
  salesSurvivalKit: SalesSurvivalKit;
  executionPlan: DeepDiveExecutionStep[];
  seasonality?: SeasonalityInsight[];
  quickWins?: QuickWin[];
}

// ----------------------------------------------------------------------
// DIGITAL AUDIT TYPES
// ----------------------------------------------------------------------

export interface DigitalAuditInput {
  websiteUrl: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  xUrl?: string;
  pinterestUrl?: string;
  googleMapsUrl?: string;
  marketplaces?: { platform: string; storeName: string }[];
  businessType?: 'B2B' | 'B2C' | 'both';
  competitors?: { name: string; website: string; instagramUrl?: string }[];
  // Auto-detected data (populated by pre-scan)
  detectedPlatform?: string;
  detectedTools?: string[];
  detectedSocialLinks?: string[];
  // Pre-scan results for user confirmation
  preScanData?: DigitalPreScanResult;
  // Raw scraper data from web-scraper Edge Function
  scraperData?: any;
  // Raw Instagram data from Apify
  instagramData?: InstagramScrapeResult;
  // Raw Google Maps data from Apify
  googleMapsData?: GoogleMapsScrapeResult;
  // Raw Facebook data from Apify
  facebookData?: FacebookScrapeResult;
  // Raw TikTok data from Apify
  tiktokData?: TikTokScrapeResult;
  // Raw X (Twitter) data from Apify
  xData?: XScrapeResult;
  // Raw LinkedIn data from Apify
  linkedinData?: LinkedInScrapeResult;
  // Raw YouTube data from Apify
  youtubeData?: YouTubeScrapeResult;
  // Raw Pinterest data from Apify
  pinterestData?: PinterestScrapeResult;
  // Raw Meta Ads Library data from Apify
  metaAdsData?: MetaAdsScrapeResult;
  // Raw MercadoLibre data from Apify
  mercadolibreData?: MercadoLibreScrapeResult;
  // Raw Google SERP data from Apify
  serpData?: GoogleSerpResult[];
  // User-declared marketing context (from onboarding)
  paidAds?: { active: boolean; platforms?: string[] };
  adBudgetRange?: string;
  emailMarketing?: { active: boolean; platform?: string };
  cartRecovery?: boolean;
  crmTool?: { active: boolean; name?: string };
  marketingObjective?: string;
  marketingTeamSize?: string;
}

export interface GoogleSerpResult {
  query: string;
  organicResults: {
    position: number;
    title: string;
    url: string;
    description: string;
    isSitelinks: boolean;
    isFeaturedSnippet: boolean;
  }[];
  userPosition: number | null;
  userMatchedBy: string;
  competitorPositions: {
    name: string;
    position: number;
    matchedBy: string;
  }[];
  userInLocalPack: boolean;
  localPack: {
    position: number;
    title: string;
    rating: number | null;
    reviews: number;
  }[];
}

export interface MercadoLibreScrapeResult {
  found: boolean;
  totalProducts: number;
  seller: {
    name: string;
    reputation: string;
    transactions: number;
    positiveRatings: number;
    location: string;
  } | null;
  products: {
    title: string;
    price: number;
    currency: string;
    condition: string;
    soldQuantity: number;
    availableQuantity: number;
    freeShipping: boolean;
    rating: number | null;
    url: string;
    imageUrl: string;
  }[];
}

export interface MetaAdsScrapeResult {
  isRunningAds: boolean;
  totalAds: number;
  ads: {
    adId: string;
    pageName: string;
    body: string;
    title: string;
    ctaText: string;
    ctaLink: string;
    status: string;
    startedRunning: string;
    platforms: string[];
  }[];
}

export interface FacebookScrapeResult {
  pageName: string;
  likes: number;
  followers: number;
  category: string;
  about: string;
  website?: string;
  phone?: string;
  address?: string;
  latestPosts: { text: string; likes: number; comments: number; shares: number; date?: string; url?: string; imageUrl?: string }[];
}

export interface TikTokScrapeResult {
  username: string;
  nickname: string;
  followers: number;
  following?: number;
  likes: number;
  videos: number;
  bio: string;
  verified: boolean;
  latestVideos: { description: string; views: number; likes: number; comments: number; shares: number; url: string; coverUrl?: string }[];
}

export interface GoogleMapsScrapeResult {
  title: string;
  rating: number;
  reviewsCount: number;
  address: string;
  website?: string;
  phone?: string;
  reviews: { text: string; rating: number; reviewerName: string }[];
}

export interface XScrapeResult {
  username: string;
  name: string;
  followers: number;
  following: number;
  isVerified: boolean;
  latestTweets: { text: string; likes: number; retweets: number; replies: number; date: string; url: string }[];
}

export interface LinkedInScrapeResult {
  name: string;
  headline: string;
  followers: number;
  connections: number;
  about: string;
  industry: string;
  location: string;
  website: string;
  isCompany: boolean;
  employeeCount: number | null;
  specialties: string[];
}

export interface YouTubeScrapeResult {
  channelName: string;
  subscribers: number;
  totalViews: string;
  totalVideos: number;
  description: string;
  joinedDate: string;
  location: string;
  isMonetized: boolean;
  latestVideos: { title: string; views: number; duration: string; date: string; url: string }[];
}

export interface PinterestScrapeResult {
  username: string;
  fullName: string;
  followers: number;
  following: number;
  pins: number;
  boards: number;
  latestPins: { title: string; description: string; saves: number; comments: number; url: string }[];
}

export interface InstagramScrapeResult {
  username: string;
  fullName: string;
  biography: string;
  followersCount: number;
  followsCount: number;
  postsCount: number;
  isVerified: boolean;
  isBusinessAccount: boolean;
  businessCategoryName: string;
  externalUrl: string;
  latestPosts: { type: string, caption: string, likesCount: number, commentsCount: number, url: string }[];
}

export interface DigitalPreScanResult {
  platform: string;
  hasSSL: boolean;
  detectedTools: string[];
  socialLinks: { platform: string; url: string }[];
  estimatedFollowers?: { platform: string; count: string }[];
  googleRating?: string;
  googleReviewCount?: string;
}

export interface DigitalSnapshot {
  digitalMaturityScore: number; // 0-100
  scoreBreakdown: {
    web: number;
    seo: number;
    socialMedia: number;
    reputation: number;
    email: number;
    aiReadiness: number;
  };
  followers: { platform: string; count: string; trend: string }[];
  googleRating: string;
  googleReviewCount: string;
  ecommercePlatform: string;
  activeChannels: string[];
}

export interface WebTechnicalAudit {
  overallScore: 'good' | 'needs_work' | 'critical';
  detectedTools: { name: string; status: string }[];
  ssl: boolean;
  sitemap: boolean;
  robotsTxt: boolean;
  pageSpeedScore: string;
  mobileReadiness: string;
  conversionReadyAudit: {
    hasClearCTAs: boolean;
    hasLeadCapture: boolean;
    hasWhatsAppButton: boolean;
    hasAbandonedCartRecovery: boolean;
    details: string;
  };
  schemaMarkup: { detected: boolean; types: string[]; recommendation: string };
}

export interface SeoAnalysis {
  overallScore: 'good' | 'needs_work' | 'critical';
  brokenUrls: string[];
  blogStatus: string;
  metaTagsStatus: string;
  keywordGapAnalysis: string;
  contentAuthorityScore: string;
  productNamingIssues: { currentName: string; problem: string; suggestedName: string }[];
  localSeoCheck: {
    googleMyBusinessOptimized: boolean;
    napConsistency: string;
    localReviewSummary: string;
  };
}

export interface AiReadinessAudit {
  overallScore: 'ready' | 'partial' | 'invisible';
  structuredData: { detected: boolean; types: string[]; recommendation: string };
  qaContent: { hasQaFormat: boolean; recommendation: string };
  eeatScore: string;
  llmsTxt: { exists: boolean; recommendation: string };
  aiCrawlerAccess: { blocked: string[]; allowed: string[]; recommendation: string };
  atomicAnswers: { score: string; recommendation: string };
  entityConsistency: { score: string; issues: string[] };
  summary: string;
}

export interface SocialMediaChannelAudit {
  platform: string;
  status: 'strong' | 'moderate' | 'weak' | 'absent';
  followers: string;
  engagementRate: string;
  postingFrequency: string;
  topPosts: { description: string; whyItWorked: string }[];
  contentMix: { educational: string; entertainment: string; sales: string };
  hashtagStrategy: string;
  bestPostingTimes: string;
  recommendation: string;
  personaCrossRef?: string;
}

export interface ReputationAnalysis {
  overallSentiment: 'positive' | 'mixed' | 'negative';
  googleReviews: {
    rating: string;
    count: string;
    trend: string;
    recurringThemesPositive: string[];
    recurringThemesNegative: string[];
  };
  responseRate: string;
  brandMentions: { source: string; sentiment: string; detail: string }[];
}

export interface CompetitorDigitalBenchmark {
  competitorName: string;
  website: string;
  whatTheyDoBetter: string;
  whatClientDoesBetter: string;
  contentStrategyGap: string;
  keyTakeaway: string;
}

export interface EmailCrmAssessment {
  hasEmailCapture: boolean;
  emailPlatformDetected: string;
  leadNurturingScore: 'active' | 'basic' | 'absent';
  crmMaturity: string;
  recommendations: string[];
}

export interface PrioritizedOpportunity {
  title: string;
  category: 'Quick Win' | 'Strategic Investment' | 'Critical Fix';
  impact: 'high' | 'medium' | 'low';
  effort: string;
  estimatedRoi: string;
  description: string;
  howTo: string;
}

export interface DigitalRisk {
  risk: string;
  severity: 'high' | 'medium' | 'low';
  detail: string;
  mitigation: string;
}

export interface RoadmapMilestone {
  phase: '30_days' | '60_days' | '90_days';
  focus: string;
  actions: string[];
  kpis: string[];
}

export interface IndustryLeader {
  name: string;
  platform: string;
  profileUrl: string;
  followers: string;
  engagementRate: string;
  strategy: string;
  topPosts: { description: string; url: string; engagement: string }[];
  lessonsForUser: string;
}

export interface CriticalFinding {
  title: string;
  area: string; // web_ux, seo, social_media, reputation, conversion, naming, content, technical
  severity: 'critical' | 'warning' | 'opportunity';
  diagnosis: string;
  whyItMatters: string;
  moneyImpact: string;
  fix: string;
  effort: 'quick_fix' | 'medium' | 'major';
}

export interface DigitalAuditResult {
  snapshot: DigitalSnapshot;
  findings: CriticalFinding[];
  webTechnical: WebTechnicalAudit;
  seoAnalysis: SeoAnalysis;
  aiReadiness: AiReadinessAudit;
  socialMediaAudit: SocialMediaChannelAudit[];
  reputationAnalysis: ReputationAnalysis;
  competitorBenchmark: CompetitorDigitalBenchmark[];
  emailCrmAssessment: EmailCrmAssessment;
  opportunities: PrioritizedOpportunity[];
  risks: DigitalRisk[];
  industryLeaders: IndustryLeader[];
  digitalHealthGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  executiveSummary: string;
  moneyOnTheTable: string;
  roadmap: RoadmapMilestone[];
  // ── Growth Plan Fields (new) ──
  competitorComparison?: {
    platforms: {
      platform: string;
      userMetrics: { followers: number; engagement: string; postFreq: string };
      competitors: { name: string; followers: number; engagement: string; postFreq: string }[];
    }[];
  };
  channelStrategies?: {
    platform: string;
    currentState: string;
    strategy: string;
    contentTypes: string[];
    postingSchedule: string;
    budgetSuggestion: string;
    expectedResults: string;
    kpis: { metric: string; current: string; target30d: string; target90d: string }[];
  }[];
  adStrategy?: {
    currentAdSpend: string;
    competitorAdActivity: string;
    recommendedBudget: string;
    recommendedPlatforms: string[];
    adTypes: { type: string; why: string; budget: string }[];
  };
  influencerStrategy?: {
    recommendedTier: string;
    suggestedProfiles: { name: string; platform: string; followers: string; niche: string; whyRelevant: string }[];
    collaborationIdeas: string[];
    estimatedCost: string;
  };
  marketplaceAnalysis?: {
    platform: string;
    currentPresence: string;
    topProducts: { title: string; price: string; soldQty: number }[];
    competitorPricing: string;
    recommendations: string[];
  };
  // ── Social Proof (NEW) ──
  socialProof?: {
    overallSentiment: 'very_positive' | 'positive' | 'mixed' | 'negative' | 'critical';
    trustScore: number;
    googleReviewsAnalysis?: {
      averageRating: number;
      totalReviews: number;
      positiveThemes: string[];
      negativeThemes: string[];
      samplePositive: string;
      sampleNegative: string;
    };
    socialMentions: {
      platform: string;
      sentiment: string;
      topComment: string;
      context: string;
    }[];
    recommendations: string[];
  };
  // ── Funnel Analysis (NEW) ──
  funnelAnalysis?: {
    stages: {
      stage: string;
      channels: string[];
      currentState: string;
      bottleneck: string;
      fix: string;
    }[];
    conversionPaths: string[];
    biggestLeak: string;
  };
  // ── Content Identity Audit (NEW) ──
  contentIdentityAudit?: {
    visualScore: number;
    toneOfVoice: string;
    contentMix: { type: string; percentage: string }[];
    isTransactionalOnly: boolean;
    valueContentRatio: string;
    brandConsistency: string;
    recommendations: string[];
  };
}

export enum AppState {
  LANDING = 'LANDING',
  AUTH = 'AUTH',
  ONBOARDING = 'ONBOARDING',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS'
}

export interface User {
  email: string;
  name?: string;
  role?: 'user' | 'admin';
}

// ----------------------------------------------------------------------
// Admin Dashboard Types
// ----------------------------------------------------------------------

export interface SystemLog {
  id: string;
  user_id?: string;
  event_type: string;
  event_data: any;
  severity: 'info' | 'warning' | 'error' | 'critical';
  created_at: string;
}

export interface AdminUserStat {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: string | null;
  total_reports: number;
  total_revenue: number;
}

export interface AdminDashboardStats {
  kpis: {
    total_users: number;
    total_revenue: number;
    total_reports: number;
    paid_reports: number;
    total_deep_dives: number;
  };
  user_stats: AdminUserStat[];
  recent_logs: SystemLog[];
  daily_registrations: { date: string; count: number }[];
}