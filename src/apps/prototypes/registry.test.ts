import { describe, expect, it } from "vitest";
import { findPrototype, PROTOTYPE_STATUSES, PROTOTYPES } from "./registry";

const STATUS_IDS = PROTOTYPE_STATUSES.map((s) => s.id);

describe("prototype registry", () => {
  it("has at least one prototype", () => {
    expect(PROTOTYPES.length).toBeGreaterThan(0);
  });

  it("uses unique, kebab-case slugs", () => {
    const slugs = PROTOTYPES.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("gives every entry a component, title, description and known status", () => {
    for (const p of PROTOTYPES) {
      expect(typeof p.component, `${p.slug} component`).toBe("function");
      expect(p.title.trim(), `${p.slug} title`).not.toBe("");
      expect(p.description.trim(), `${p.slug} description`).not.toBe("");
      expect(STATUS_IDS, `${p.slug} status`).toContain(p.status);
    }
  });

  it("looks prototypes up by slug", () => {
    expect(findPrototype(PROTOTYPES[0].slug)).toBe(PROTOTYPES[0]);
    expect(findPrototype("does-not-exist")).toBeUndefined();
    expect(findPrototype(undefined)).toBeUndefined();
  });
});
