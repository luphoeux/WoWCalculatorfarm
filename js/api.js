import { state } from './state.js';
import { formatNumber } from './ui.js';
import { renderWidget } from './widget.js';

const SUPABASE_TOKEN_URL = 'https://vqinisbwnilppemygomb.supabase.co/functions/v1/get-latest-wow-token';

function mergeHistory(naArr, euArr) {
    const toGold = records => records.map(r => ({
        ts: new Date(r.updated_at).getTime(),
        gold: Math.floor(r.price / 10000)
    })).sort((a, b) => a.ts - b.ts);

    const na = toGold(naArr);
    const eu = toGold(euArr);

    const threshold = 6 * 60 * 1000;
    const points = [];
    let j = 0;

    na.forEach(naPt => {
        while (j < eu.length && eu[j].ts < naPt.ts - threshold) {
            points.push({ timestamp: eu[j].ts, NA: null, EU: eu[j].gold });
            j++;
        }
        let best = null;
        for (let k = j; k < eu.length && eu[k].ts <= naPt.ts + threshold; k++) {
            if (Math.abs(eu[k].ts - naPt.ts) < threshold) best = eu[k];
        }
        if (best) {
            points.push({ timestamp: naPt.ts, NA: naPt.gold, EU: best.gold });
            j = eu.indexOf(best) + 1;
        } else {
            points.push({ timestamp: naPt.ts, NA: naPt.gold, EU: null });
        }
    });

    for (; j < eu.length; j++) {
        points.push({ timestamp: eu[j].ts, NA: null, EU: eu[j].gold });
    }

    return points.sort((a, b) => a.timestamp - b.timestamp);
}

export async function fetchTokenPrice() {
    try {
        const response = await fetch(SUPABASE_TOKEN_URL);
        if (!response.ok) throw new Error('No se pudo cargar el precio desde Supabase');

        const json = await response.json();
        if (!json.success || !json.data) throw new Error('La función no devolvió datos');

        const { NA, EU } = json.data;
        if (!Array.isArray(NA) || !Array.isArray(EU) || NA.length === 0 || EU.length === 0) {
            throw new Error('No hay historial en la base');
        }

        const history = mergeHistory(NA, EU);
        
        // Obtenemos los últimos valores reales
        const naSorted = [...NA].sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
        const euSorted = [...EU].sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
        
        const lastNA = Math.floor(naSorted[naSorted.length - 1].price / 10000);
        const lastEU = Math.floor(euSorted[euSorted.length - 1].price / 10000);

        const last = history[history.length - 1];
        const lastTs = last.timestamp;

        const day24 = lastTs - (24 * 60 * 60 * 1000);
        let minNA24 = Infinity, maxNA24 = -Infinity;
        let minEU24 = Infinity, maxEU24 = -Infinity;

        history.forEach(pt => {
            if (!pt.timestamp) return;
            if (Math.abs(pt.timestamp - lastTs) <= 24 * 60 * 60 * 1000 + 6 * 60 * 1000) {
                if (pt.NA !== null) {
                    if (pt.NA < minNA24) minNA24 = pt.NA;
                    if (pt.NA > maxNA24) maxNA24 = pt.NA;
                }
                if (pt.EU !== null) {
                    if (pt.EU < minEU24) minEU24 = pt.EU;
                    if (pt.EU > maxEU24) maxEU24 = pt.EU;
                }
            }
        });

        const data = {
            NA: lastNA,
            EU: lastEU,
            lastUpdated: new Date(lastTs).toISOString(),
            history: history,
            stats: {
                NA: { "24h_low": minNA24 === Infinity ? lastNA : minNA24, "24h_high": maxNA24 === -Infinity ? lastNA : maxNA24 },
                EU: { "24h_low": minEU24 === Infinity ? lastEU : minEU24, "24h_high": maxEU24 === -Infinity ? lastEU : maxEU24 }
            }
        };

        const updatedInfo = document.getElementById('lastUpdatedInfo');

        if (data.NA && data.EU) {
            state.cachedPrices.NA = data.NA;
            state.cachedPrices.EU = data.EU;
            state.cachedPrices.lastUpdated = data.lastUpdated;
            state.cachedPrices.history = data.history || [];
            state.cachedPrices.stats = data.stats || { NA: {}, EU: {} };

            if (updatedInfo && data.lastUpdated) {
                const updatedDate = new Date(data.lastUpdated);
                const timeStr = updatedDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                updatedInfo.innerHTML = `<span class="text-green-400/80">Actualizado a las ${timeStr}</span>`;
            }

            const priceInput = document.getElementById('tokenPrice');
            if (!priceInput.value) {
                priceInput.value = formatNumber(state.cachedPrices[state.currentRegion]);
            }

            renderWidget();
        }
    } catch (error) {
        console.warn('Usando modo manual. No se pudo obtener el precio automático:', error);
        const updatedInfo = document.getElementById('lastUpdatedInfo');
        if (updatedInfo) {
             updatedInfo.innerHTML = `<i class="fas fa-exclamation-triangle text-yellow-400"></i><span class="text-yellow-400/80">Modo manual</span>`;
        }
    }
}