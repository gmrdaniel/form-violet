export type ServiceConfig = {
  id: string;
  nameKey: string;
  descriptionKey: string;
  prices: readonly [number, number, number];
  priceSetup?: readonly [number, number, number];
  hasSetupFee: boolean;
};

export const SERVICES: readonly ServiceConfig[] = [
  { id: "short_clips", nameKey: "services.short_clips.name", descriptionKey: "services.short_clips.description", prices: [29, 59, 99], hasSetupFee: false },
  { id: "thumbnail_design", nameKey: "services.thumbnail_design.name", descriptionKey: "services.thumbnail_design.description", prices: [19, 49, 79], hasSetupFee: false },
  { id: "ai_dubbing", nameKey: "services.ai_dubbing.name", descriptionKey: "services.ai_dubbing.description", prices: [49, 89, 149], hasSetupFee: false },
  { id: "content_seo", nameKey: "services.content_seo.name", descriptionKey: "services.content_seo.description", prices: [29, 59, 99], hasSetupFee: false },
  { id: "performance_dashboard", nameKey: "services.performance_dashboard.name", descriptionKey: "services.performance_dashboard.description", prices: [19, 39, 69], hasSetupFee: false },
  { id: "media_kit", nameKey: "services.media_kit.name", descriptionKey: "services.media_kit.description", prices: [19, 39, 69], hasSetupFee: false },
  { id: "ai_coach", nameKey: "services.ai_coach.name", descriptionKey: "services.ai_coach.description", prices: [29, 59, 99], hasSetupFee: false },
  { id: "we_post_for_you", nameKey: "services.we_post_for_you.name", descriptionKey: "services.we_post_for_you.description", prices: [29, 59, 99], hasSetupFee: false },
  { id: "paid_community", nameKey: "services.paid_community.name", descriptionKey: "services.paid_community.description", prices: [99, 199, 299], hasSetupFee: false },
  { id: "newsletter", nameKey: "services.newsletter.name", descriptionKey: "services.newsletter.description", prices: [79, 129, 199], hasSetupFee: false },
  { id: "online_course", nameKey: "services.online_course.name", descriptionKey: "services.online_course.description", prices: [49, 99, 149], priceSetup: [299, 499, 999], hasSetupFee: true },
  { id: "podcast", nameKey: "services.podcast.name", descriptionKey: "services.podcast.description", prices: [49, 79, 149], hasSetupFee: false },
  { id: "merch_store", nameKey: "services.merch_store.name", descriptionKey: "services.merch_store.description", prices: [49, 79, 149], priceSetup: [199, 299, 499], hasSetupFee: true },
];
