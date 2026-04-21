export type BundleConfig = {
  id: "starter" | "growth" | "pro";
  tagKey: string;
  nameKey: string;
  includesKey: string;
  prices: readonly [number, number, number];
  standalonePriceRange: string;
  savingsLabel: string;
  isHighlighted: boolean;
};

export const BUNDLES: readonly BundleConfig[] = [
  { id: "starter", tagKey: "bundles.starter.tag", nameKey: "bundles.starter.name", includesKey: "bundles.starter.includes", prices: [79, 99, 129], standalonePriceRange: "$100-200/mo", savingsLabel: "25-40%", isHighlighted: false },
  { id: "growth", tagKey: "bundles.growth.tag", nameKey: "bundles.growth.name", includesKey: "bundles.growth.includes", prices: [149, 199, 249], standalonePriceRange: "$250-450/mo", savingsLabel: "30-45%", isHighlighted: false },
  { id: "pro", tagKey: "bundles.pro.tag", nameKey: "bundles.pro.name", includesKey: "bundles.pro.includes", prices: [249, 329, 399], standalonePriceRange: "$400-700/mo", savingsLabel: "35-50%", isHighlighted: true },
];
