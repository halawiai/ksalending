export type EntityType = 'individual' | 'company' | 'institution';

export const VALID_ENTITY_TYPES: EntityType[] = ['individual', 'company', 'institution'];

export const ENTITY_CONFIG = {
  individual: {
    title: 'Individual',
    description: 'Personal credit assessment and lending services',
    icon: 'Users',
    color: 'emerald',
    dashboardPath: '/individual',
    onboardingPath: '/onboarding/individual',
    features: [
      'Nafath Identity Verification',
      'SIMAH Credit Reports',
      'Income Assessment',
      'Personal Loan Applications'
    ]
  },
  company: {
    title: 'Company',
    description: 'Business credit evaluation and corporate lending',
    icon: 'Building2',
    color: 'teal',
    dashboardPath: '/company',
    onboardingPath: '/onboarding/company',
    features: [
      'Commercial Registration',
      'Financial Statements Analysis',
      'Business Risk Scoring',
      'Corporate Loan Applications'
    ]
  },
  institution: {
    title: 'Institution',
    description: 'Financial institution management and regulatory compliance',
    icon: 'University',
    color: 'emerald',
    dashboardPath: '/institution',
    onboardingPath: '/onboarding/institution',
    features: [
      'SAMA Regulatory Compliance',
      'Portfolio Management',
      'Risk Analytics Platform',
      'Institutional Oversight'
    ]
  }
} as const;

export function isValidEntityType(entityType: string): entityType is EntityType {
  return VALID_ENTITY_TYPES.includes(entityType as EntityType);
}

export function getEntityConfig(entityType: EntityType) {
  return ENTITY_CONFIG[entityType];
}

export function getEntityTitle(entityType: EntityType): string {
  return ENTITY_CONFIG[entityType].title;
}

export function getEntityDescription(entityType: EntityType): string {
  return ENTITY_CONFIG[entityType].description;
}

export function getEntityDashboardPath(entityType: EntityType): string {
  return ENTITY_CONFIG[entityType].dashboardPath;
}

export function getEntityOnboardingPath(entityType: EntityType): string {
  return ENTITY_CONFIG[entityType].onboardingPath;
}

export function getEntityFeatures(entityType: EntityType): string[] {
  return [...ENTITY_CONFIG[entityType].features] as string[];
}

// Route validation utilities
export function validateEntityRoute(entityType: string | string[] | undefined): EntityType | null {
  if (typeof entityType !== 'string') return null;
  return isValidEntityType(entityType) ? entityType : null;
}

// Navigation helpers
export function getEntityNavigationItems() {
  return VALID_ENTITY_TYPES.map(entityType => ({
    entityType,
    ...ENTITY_CONFIG[entityType]
  }));
}