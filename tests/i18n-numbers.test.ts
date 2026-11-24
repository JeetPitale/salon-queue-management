import { describe, it, expect } from "vitest";
import { formatLocalizedNumber } from "../src/lib/i18n";

describe("Localized Numbers Formatting (en, hi, gu)", () => {
  it("formats English numbers as standard Arabic/Western digits", () => {
    expect(formatLocalizedNumber(139, "en")).toBe("139");
    expect(formatLocalizedNumber(13, "en")).toBe("13");
    expect(formatLocalizedNumber("09:00 - 21:00", "en")).toBe("09:00 - 21:00");
    expect(formatLocalizedNumber("₹150", "en")).toBe("₹150");
    expect(formatLocalizedNumber("#5", "en")).toBe("#5");
  });

  it("formats Gujarati numbers using Gujarati digits (૦-૯)", () => {
    expect(formatLocalizedNumber(139, "gu")).toBe("૧૩૯");
    expect(formatLocalizedNumber(13, "gu")).toBe("૧૩");
    expect(formatLocalizedNumber(3, "gu")).toBe("૩");
    expect(formatLocalizedNumber(0, "gu")).toBe("૦");
    expect(formatLocalizedNumber("09:00 - 21:00", "gu")).toBe("૦૯:૦૦ - ૨૧:૦૦");
    expect(formatLocalizedNumber("₹150", "gu")).toBe("₹૧૫૦");
    expect(formatLocalizedNumber("#5", "gu")).toBe("#૫");
    expect(formatLocalizedNumber("~15m", "gu")).toBe("~૧૫m");
    expect(formatLocalizedNumber("03:45", "gu")).toBe("૦૩:૪૫");
  });

  it("formats Hindi numbers using Devanagari digits (०-९)", () => {
    expect(formatLocalizedNumber(139, "hi")).toBe("१३९");
    expect(formatLocalizedNumber(13, "hi")).toBe("१३");
    expect(formatLocalizedNumber(3, "hi")).toBe("३");
    expect(formatLocalizedNumber(0, "hi")).toBe("०");
    expect(formatLocalizedNumber("09:00 - 21:00", "hi")).toBe("०९:०० - २१:००");
    expect(formatLocalizedNumber("₹150", "hi")).toBe("₹१५०");
    expect(formatLocalizedNumber("#5", "hi")).toBe("#५");
    expect(formatLocalizedNumber("~15m", "hi")).toBe("~१५m");
    expect(formatLocalizedNumber("03:45", "hi")).toBe("०३:४५");
  });

  it("handles null, undefined, and non-numeric characters gracefully", () => {
    expect(formatLocalizedNumber(null, "gu")).toBe("");
    expect(formatLocalizedNumber(undefined, "gu")).toBe("");
    expect(formatLocalizedNumber("--", "gu")).toBe("--");
  });
});
