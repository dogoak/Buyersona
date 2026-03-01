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