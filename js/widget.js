import { state } from './state.js';
import { formatNumber } from './ui.js';

export function renderWidget() {
    const region = state.currentRegion;
    const history = state.cachedPrices.history;
    const stats = state.cachedPrices.stats[region] || {};
    const current = state.cachedPrices[region];
    
    document.getElementById('widgetRegionBadge').innerText = region;
    
    if (current > 0) {
        document.getElementById('widgetCurrentPrice').innerHTML = `${formatNumber(current)} <img src="./public/images/money-gold.gif" alt="Gold" class="w-4 h-4 rounded-full">`;
    }
    
    if (stats['24h_low']) {
        document.getElementById('widgetLowPrice').innerHTML = `${formatNumber(stats['24h_low'])} <img src="./public/images/money-gold.gif" class="w-3 h-3">`;
    }
    if (stats['24h_high']) {
        document.getElementById('widgetHighPrice').innerHTML = `${formatNumber(stats['24h_high'])} <img src="./public/images/money-gold.gif" class="w-3 h-3">`;
    }
    
    if (history && history.length > 0) {
        const now = Date.now();
        const twoDaysAgo = now - (48 * 60 * 60 * 1000);
        const sparkData = history.filter(pt => pt.timestamp >= twoDaysAgo).map(pt => pt[region]);
        const filteredHistory = history.filter(pt => pt.timestamp >= twoDaysAgo);
        
        if (sparkData.length > 1) {
            const min = Math.min(...sparkData);
            const max = Math.max(...sparkData);
            const range = max - min;
            
            const svg = document.getElementById('sparklineSvg');
            const width = 100;
            
            let pathD = "";
            sparkData.forEach((val, i) => {
                const x = (i / (sparkData.length - 1)) * width;
                let y = 50; 
                if (range > 0) {
                    y = 90 - (((val - min) / range) * 80); 
                }
                if (i === 0) pathD += `M ${x.toFixed(2)} ${y.toFixed(2)} `;
                else pathD += `L ${x.toFixed(2)} ${y.toFixed(2)} `;
            });
            
            svg.innerHTML = `
                <path d="${pathD}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"></path>
            `;
            
            const container = document.getElementById('sparklineContainer');
            const tooltip = document.getElementById('chartTooltip');
            const dot = document.getElementById('chartHoverDot');
            const ttPrice = document.getElementById('ttPrice');
            const ttDate = document.getElementById('ttDate');

            container.onmousemove = (e) => {
                const rect = container.getBoundingClientRect();
                let x = e.clientX - rect.left;
                if (x < 0) x = 0;
                if (x > rect.width) x = rect.width;
                
                const percent = x / rect.width;
                const index = Math.round(percent * (sparkData.length - 1));
                const point = filteredHistory[index];
                
                if(!point) return;
                const price = point[region];
                
                let yPercent = 0.5;
                if (range > 0) yPercent = 0.9 - (((price - min) / range) * 0.8);
                const dotY = yPercent * rect.height;
                const dotX = (index / (sparkData.length - 1)) * rect.width;
                
                dot.style.left = `${dotX}px`;
                dot.style.top = `${dotY}px`;
                dot.classList.remove('hidden');
                
                // Default a la derecha del cursor (15px de separación)
                tooltip.style.left = `${dotX}px`;
                if (dotY < 30) tooltip.style.top = `${dotY + 10}px`;
                else tooltip.style.top = `${dotY - 40}px`;
                
                // Si está muy cerca del borde derecho, lo mostramos a la izquierda
                if (dotX > rect.width - 100) {
                    tooltip.style.transform = `translate(calc(-100% - 15px), 0)`;
                } else {
                    tooltip.style.transform = `translate(15px, 0)`;
                }

                tooltip.classList.remove('hidden');
                
                ttPrice.innerText = formatNumber(price);
                const dt = new Date(point.timestamp);
                ttDate.innerText = dt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + ' ' + dt.toLocaleDateString('es-ES', { weekday: 'short' });
            };
            
            container.onmouseleave = () => {
                tooltip.classList.add('hidden');
                dot.classList.add('hidden');
            };
            
            const oldPrice = sparkData[0];
            const diff = current - oldPrice;
            const diffEl = document.getElementById('widgetPriceDiff');
            if (diff > 0) {
                diffEl.innerHTML = `<span class="text-green-400">↑ +${formatNumber(diff)}</span>`;
            } else if (diff < 0) {
                diffEl.innerHTML = `<span class="text-red-400">↓ ${formatNumber(diff)}</span>`;
            } else {
                diffEl.innerHTML = `<span class="text-gray-500">-</span>`;
            }
        }
    }
}
