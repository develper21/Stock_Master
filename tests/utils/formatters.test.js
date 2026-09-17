import { describe, it, expect } from 'vitest';
import { formatDate, formatCurrency, formatQuantity } from '@/lib/formatters';

describe('Formatters', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatDate(date);
      expect(result).toBe('Jan 15, 2024');
    });

    it('should handle string dates', () => {
      const result = formatDate('2024-01-15');
      expect(result).toBe('Jan 15, 2024');
    });

    it('should return empty string for invalid date', () => {
      const result = formatDate(null);
      expect(result).toBe('');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with default settings', () => {
      const result = formatCurrency(1234.56);
      expect(result).toBe('$1,234.56');
    });

    it('should handle zero values', () => {
      const result = formatCurrency(0);
      expect(result).toBe('$0.00');
    });

    it('should handle negative values', () => {
      const result = formatCurrency(-123.45);
      expect(result).toBe('-$123.45');
    });

    it('should accept custom currency', () => {
      const result = formatCurrency(1234.56, 'EUR');
      expect(result).toBe('€1,234.56');
    });
  });

  describe('formatQuantity', () => {
    it('should format whole numbers', () => {
      const result = formatQuantity(100);
      expect(result).toBe('100');
    });

    it('should format decimal numbers', () => {
      const result = formatQuantity(100.5);
      expect(result).toBe('100.50');
    });

    it('should handle zero', () => {
      const result = formatQuantity(0);
      expect(result).toBe('0');
    });

    it('should format large numbers', () => {
      const result = formatQuantity(1000000);
      expect(result).toBe('1,000,000');
    });
  });
});
