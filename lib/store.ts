import { create } from "zustand";
import type { Submission, ServiceAnswer } from "./schema";

export type FormState = Partial<Omit<Submission, "services" | "hp_website" | "is_test">> & {
  services: Record<string, Partial<ServiceAnswer>>;
  is_test: boolean;
};

type FormActions = {
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  setService: (serviceId: string, patch: Partial<ServiceAnswer>) => void;
  reset: () => void;
  hydrate: (partial: Partial<FormState>) => void;
};

const initial: FormState = {
  services: {},
  is_test: false,
};

export const useFormStore = create<FormState & FormActions>((set) => ({
  ...initial,
  set: (key, value) => set((s) => ({ ...s, [key]: value })),
  setService: (serviceId, patch) =>
    set((s) => ({
      services: {
        ...s.services,
        [serviceId]: { ...s.services[serviceId], serviceId, ...patch },
      },
    })),
  reset: () => set(initial),
  hydrate: (partial) => set((s) => ({ ...s, ...partial })),
}));
