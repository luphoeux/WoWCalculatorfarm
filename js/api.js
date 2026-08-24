import { state } from './state.js';
import { formatNumber } from './ui.js';
import { renderWidget } from './widget.js';

export async function fetchTokenPrice() {
    try {
        const response = await fetch('./token_price.json?t=' + new Date().getTime());
        if (!response.ok) throw new Error('No se pudo cargar el precio');
        
        const data = await response.json();
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
