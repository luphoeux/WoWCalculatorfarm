import { state } from './state.js';
import { formatNumber } from './ui.js';
import { renderWidget } from './widget.js';

export async function fetchTokenPrice() {
    try {
        const sheetsUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS544M8yrVTP_xJm4oGHA8BGrT47da8f-gtb35CIAwTRZMyug8eeqnlZCi7lmrWR9mIbcAScdAhs72e/pub?output=csv';
        const response = await fetch(sheetsUrl + '&t=' + new Date().getTime());
        if (!response.ok) throw new Error('No se pudo cargar el precio desde Sheets');
        
        const text = await response.text();
        const lines = text.trim().split('\n');
        // Limpiamos \r y comillas que Sheets pueda agregar
        const rows = lines.slice(1).map(line => line.replace(/["\r]/g, '').split(','));
        
        if (rows.length === 0) throw new Error('El Excel está vacío');

        const history = [];
        let minNA24 = Infinity, maxNA24 = -Infinity;
        let minEU24 = Infinity, maxEU24 = -Infinity;

        const now = Date.now();
        const day24 = now - (24 * 60 * 60 * 1000);

        let lastNA = null, lastEU = null, lastTimestamp = null;

        rows.forEach(row => {
            if (row.length >= 3) {
                // row[0] fecha, row[1] NA, row[2] EU. Puede haber columnas vacías extra.
                const tsStr = row[0].trim();
                const na = parseInt(row[1], 10);
                const eu = parseInt(row[2], 10);
                const ts = new Date(tsStr).getTime();
                
                if (!isNaN(na) && !isNaN(eu) && !isNaN(ts)) {
                    history.push({ timestamp: ts, NA: na, EU: eu });
                    if (ts >= day24) {
                        if (na < minNA24) minNA24 = na;
                        if (na > maxNA24) maxNA24 = na;
                        if (eu < minEU24) minEU24 = eu;
                        if (eu > maxEU24) maxEU24 = eu;
                    }
                    lastNA = na; lastEU = eu; lastTimestamp = tsStr;
                }
            }
        });

        if (!lastNA) throw new Error('No se encontraron datos válidos en el Excel');

        const data = {
            NA: lastNA,
            EU: lastEU,
            lastUpdated: lastTimestamp,
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
             updatedInfo.innerHTML = `<i class="fas fa-exclamation-triangle text-yellow-400"></i><span class="text-yellow-400/80">Modo manual (o no publicado aún)</span>`;
        }
    }
}
