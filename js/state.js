export const state = {
    manualDaily: false,
    currentRegion: 'NA',
    currentTab: 'bruto-7m',
    cachedPrices: { NA: 0, EU: 0, lastUpdated: null, history: [], stats: { NA: {}, EU: {} } },
    hasCalculated: false
};

export const CONSTANTS = {
    DATE_BRUTO_7M: '2026-10-06',
    DATE_BRUTO_90USD: '2026-11-17',
    MAX_GOLD_CAP: 10000000
};
