import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveDraft, loadDraft, clearDraft, DRAFT_KEY } from "./draft";

describe("draft storage", () => {
  beforeEach(() => { localStorage.clear(); });

  it("saves and loads a draft", () => {
    saveDraft({ answers: { name: "Ana" }, route: "/es/s1/2" });
    const loaded = loadDraft();
    expect(loaded?.answers.name).toBe("Ana");
    expect(loaded?.route).toBe("/es/s1/2");
  });

  it("returns null when no draft exists", () => {
    expect(loadDraft()).toBeNull();
  });

  it("returns null when draft is older than 7 days", () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      version: 1, timestamp: eightDaysAgo, answers: {}, route: "/es",
    }));
    expect(loadDraft()).toBeNull();
  });

  it("returns null when version mismatches", () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      version: 999, timestamp: Date.now(), answers: {}, route: "/es",
    }));
    expect(loadDraft()).toBeNull();
  });

  it("clears draft", () => {
    saveDraft({ answers: { name: "Ana" }, route: "/es/s1/2" });
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  it("silently no-ops when localStorage throws", () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = vi.fn(() => { throw new Error("QuotaExceeded"); });
    expect(() => saveDraft({ answers: {}, route: "/es" })).not.toThrow();
    Storage.prototype.setItem = original;
  });
});
