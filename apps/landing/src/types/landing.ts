export type NavItem = {
  label: string;
  href: string;
};

export type Feature = {
  icon: string;
  title: string;
  description: string;
  color: string;
};

export type FeatureDeepDive = {
  title: string;
  headline: string;
  description: string;
  highlights: string[];
  imagePosition: 'left' | 'right';
};

export type HowItWorksStep = {
  step: number;
  title: string;
  description: string;
  code?: string;
};

export type ComparisonRow = {
  feature: string;
  radar: boolean;
  reactDevTools: boolean;
  flipper: boolean;
  reactotron: boolean;
};

export type TechLogo = {
  name: string;
  icon: string;
};
