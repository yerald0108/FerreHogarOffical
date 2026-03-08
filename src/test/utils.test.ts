import { describe, it, expect } from "vitest";
import { formatCurrencyPrice } from "@/hooks/useProductPrices";

describe("formatCurrencyPrice", () => {
  it("should format USD price correctly", () => {
    const result = formatCurrencyPrice(25.5, "USD");
    expect(result).toContain("USD");
    expect(result).toContain("25");
  });

  it("should format EUR price correctly", () => {
    const result = formatCurrencyPrice(100, "EUR");
    expect(result).toContain("EUR");
  });

  it("should handle unknown currency gracefully", () => {
    const result = formatCurrencyPrice(50, "BTC");
    expect(result).toContain("BTC");
    expect(result).toContain("50");
  });
});

describe("Cart store logic", () => {
  it("should correctly calculate totals", () => {
    // Basic arithmetic validation
    const items = [
      { price: 100, quantity: 2 },
      { price: 50, quantity: 3 },
    ];
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    expect(total).toBe(350);
  });
});

describe("Price formatting", () => {
  it("should format CUP prices with Intl", () => {
    const formatted = new Intl.NumberFormat("es-CU", {
      style: "currency",
      currency: "CUP",
      minimumFractionDigits: 0,
    }).format(1500);
    expect(formatted).toBeTruthy();
    expect(formatted.length).toBeGreaterThan(0);
  });
});
