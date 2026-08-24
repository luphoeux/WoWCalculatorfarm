export const state = {
    manualDaily: false,
    currentRegion: 'NA',
    cachedPrices: { NA: 0, EU: 0, lastUpdated: null, history: [], stats: { NA: {}, EU: {} } },
    hasCalculated: false
};

export const CONSTANTS = {
    DATE_BRUTO: '2026-01-05',
    DATE_MIDNIGHT: '2026-03-02',
    MAX_GOLD_CAP: 10000000
};
