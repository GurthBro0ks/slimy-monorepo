import {
  calculateTokenCost,
  calculateImageCost,
  parseWindow,
  aggregateUsage,
} from '../../src/lib/usage-openai';

describe('calculateTokenCost', () => {
  it('should calculate cost for gpt-4o-mini', () => {
    const cost = calculateTokenCost('gpt-4o-mini', 1_000_000, 1_000_000);
    expect(cost).not.toBeNull();
    expect(cost!).toBeGreaterThan(0);
  });

  it('should calculate cost for gpt-4o-mini-2024-07-18', () => {
    const cost = calculateTokenCost('gpt-4o-mini-2024-07-18', 1_000_000, 0);
    expect(cost).not.toBeNull();
  });

  it('should return null for unknown model', () => {
    expect(calculateTokenCost('unknown-model', 100, 100)).toBeNull();
  });

  it('should return zero cost for zero tokens', () => {
    const cost = calculateTokenCost('gpt-4o-mini', 0, 0);
    expect(cost).toBe(0);
  });

  it('should split input and output costs', () => {
    const cost = calculateTokenCost('gpt-4o-mini', 1_000_000, 0);
    const costWithOutput = calculateTokenCost('gpt-4o-mini', 1_000_000, 1_000_000);
    expect(costWithOutput!).toBeGreaterThan(cost!);
  });
});

describe('calculateImageCost', () => {
  it('should calculate cost for standard quality', () => {
    expect(calculateImageCost('standard', 1)).toBe(0.04);
  });

  it('should calculate cost for hd quality', () => {
    expect(calculateImageCost('hd', 1)).toBe(0.08);
  });

  it('should calculate cost for multiple images', () => {
    expect(calculateImageCost('standard', 5)).toBe(0.2);
  });

  it('should default to standard for unknown quality', () => {
    expect(calculateImageCost('unknown', 1)).toBe(0.04);
  });
});

describe('parseWindow', () => {
  it('should parse "today" window', () => {
    const result = parseWindow('today');
    expect(result.startDate).toBeTruthy();
    expect(result.endDate).toBeTruthy();
  });

  it('should parse "7d" window', () => {
    const result = parseWindow('7d');
    expect(result.startDate).toBeTruthy();
    expect(result.endDate).toBeTruthy();
  });

  it('should parse "30d" window', () => {
    const result = parseWindow('30d');
    expect(result.startDate).toBeTruthy();
  });

  it('should parse "this_month" window', () => {
    const result = parseWindow('this_month');
    expect(result.startDate).toBeTruthy();
  });

  it('should parse "custom" window with dates', () => {
    const result = parseWindow('custom', '2026-01-01', '2026-01-31');
    expect(result.startDate).toBe('2026-01-01');
    expect(result.endDate).toBe('2026-01-31');
  });

  it('should throw for custom without dates', () => {
    expect(() => parseWindow('custom')).toThrow('Custom window requires');
  });

  it('should throw for unknown window', () => {
    expect(() => parseWindow('foobar')).toThrow('Unknown window');
  });
});

describe('aggregateUsage', () => {
  it('should handle empty data', () => {
    const result = aggregateUsage(null, null);
    expect(result.byModel).toEqual([]);
    expect(result.totalCost).toBe(0);
    expect(result.totalRequests).toBe(0);
  });

  it('should aggregate API usage data', () => {
    const apiData = {
      data: [
        {
          results: [
            {
              model: 'gpt-4o-mini',
              n_requests: 10,
              n_context_tokens_total: 50000,
              n_generated_tokens_total: 25000,
            },
          ],
        },
      ],
    };
    const result = aggregateUsage(apiData, null);
    expect(result.byModel.length).toBe(1);
    expect(result.byModel[0].model).toBe('gpt-4o-mini');
    expect(result.byModel[0].requests).toBe(10);
    expect(result.totalRequests).toBe(10);
    expect(result.totalCost).toBeGreaterThan(0);
  });

  it('should aggregate local image stats', () => {
    const imageStats = [
      { model: 'dall-e-3', successful_images: 5, quality: 'standard' },
    ];
    const result = aggregateUsage(null, imageStats);
    expect(result.byModel.length).toBe(1);
    expect(result.byModel[0].images).toBe(5);
    expect(result.totalCost).toBe(0.2);
  });

  it('should combine API and image stats', () => {
    const apiData = {
      data: [
        {
          results: [
            {
              model: 'gpt-4o-mini',
              n_requests: 10,
              n_context_tokens_total: 50000,
              n_generated_tokens_total: 25000,
            },
          ],
        },
      ],
    };
    const imageStats = [
      { model: 'dall-e-3', successful_images: 2, quality: 'hd' },
    ];
    const result = aggregateUsage(apiData, imageStats);
    expect(result.byModel.length).toBe(2);
    expect(result.totalRequests).toBe(12);
  });
});
