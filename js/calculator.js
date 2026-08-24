import { state, CONSTANTS } from './state.js';
import { formatNumber, animateNumber, animateMoneyIcon, updateButtonStates, updateFinalTip } from './ui.js';

export function calculate() {
    state.hasCalculated = true;
    
    // --- 1. LECTURA DE VALORES ---
    const expansionCostUSD = parseFloat(document.getElementById('usdCost').value) || 0;
    const rawTokenPriceInput = document.getElementById('tokenPrice').value;
    const tokenPriceGold = parseInt(rawTokenPriceInput.replace(/\./g, '')) || 0;
    
    const rawCurrentGoldInput = document.getElementById('currentGold').value;
    const currentGold = parseInt(rawCurrentGoldInput.replace(/\./g, '')) || 0;
    
    let dailyFarm = 0;
    const rawDailyFarmInput = document.getElementById('dailyFarm').value;
    if (state.manualDaily) {
        dailyFarm = parseInt(rawDailyFarmInput.replace(/\./g, '')) || 0;
    }
    
    const deadlineDateStr = document.getElementById('deadlineDate').value;
    const deadlineDate = new Date(deadlineDateStr);
    
    // --- 2. CÁLCULO DE COSTO TOTAL ---
    const tokenValueUSD = 15;
    const tokensNeeded = Math.ceil(expansionCostUSD / tokenValueUSD);
    const totalGoldNeeded = tokensNeeded * tokenPriceGold;
    
    // --- 3. CÁLCULO DE ORO FALTANTE ---
    let missingGold = totalGoldNeeded - currentGold;
    if (missingGold < 0) missingGold = 0;
    
    // --- 4. CÁLCULO DE DÍAS HASTA LÍMITE ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffTime = deadlineDate - today;
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    // --- 5. LÓGICA DE AUTO-AJUSTE (Farm Diario) ---
    if (!state.manualDaily) {
        if (missingGold > 0) {
            dailyFarm = Math.ceil(missingGold / diffDays);
        } else {
            dailyFarm = 0;
        }
        document.getElementById('dailyFarm').value = formatNumber(dailyFarm);
    }
    
    // --- 6. CÁLCULOS SECUNDARIOS ---
    const realDaysNeeded = dailyFarm > 0 ? Math.ceil(missingGold / dailyFarm) : 0;
    
    // Progreso
    let progressPercent = 0;
    if (totalGoldNeeded > 0) {
        progressPercent = (currentGold / totalGoldNeeded) * 100;
        if (progressPercent > 100) progressPercent = 100;
    }
    
    // --- 7. ACTUALIZACIÓN VISUAL (DOM) ---
    const totalGoldEl = document.getElementById('totalGoldNeeded');
    const missingGoldEl = document.getElementById('missingGold');
    const tokensNeededEl = document.getElementById('tokensNeeded');
    
    const currentTotal = parseInt(totalGoldEl.innerText.replace(/\./g, '')) || 0;
    const currentMissing = parseInt(missingGoldEl.innerText.replace(/\./g, '')) || 0;
    const currentTokens = parseInt(tokensNeededEl.innerText) || 0;
    
    animateNumber(totalGoldEl, currentTotal, totalGoldNeeded, 800);
    animateNumber(missingGoldEl, currentMissing, missingGold, 800);
    animateNumber(tokensNeededEl, currentTokens, tokensNeeded, 800);
    
    document.getElementById('progressText').innerText = `${Math.floor(progressPercent)}%`;
    document.getElementById('progressBar').style.width = `${progressPercent}%`;
    
    // Mostrar resultados
    const resultsSec = document.getElementById('resultsSection');
    const resetContainer = document.getElementById('resetContainer');
    
    resultsSec.classList.remove('hidden');
    // Pequeño delay para permitir que el display:block se aplique antes de animar opacidad
    setTimeout(() => {
        resultsSec.classList.remove('opacity-0');
        resultsSec.classList.add('opacity-100');
    }, 50);

    resetContainer.classList.remove('hidden');
    setTimeout(() => {
        resetContainer.classList.remove('opacity-0');
        resetContainer.classList.add('opacity-100');
    }, 50);

    animateMoneyIcon(totalGoldEl.parentElement.querySelector('img'));
    animateMoneyIcon(missingGoldEl.parentElement.querySelector('img'));
    
    updateButtonStates(deadlineDateStr);
    
    // Determinación de Estado
    let status = 'neutral'; 
    if (missingGold > 0) {
        if (realDaysNeeded > diffDays) {
            status = 'danger';
        } else if (realDaysNeeded <= diffDays) {
            status = 'success';
        }
    } else {
        status = 'success';
    }
    
    const projectedDate = new Date(today);
    projectedDate.setDate(today.getDate() + realDaysNeeded);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const dateText = projectedDate.toLocaleDateString('es-ES', options);

    updateFinalTip(status, dateText, diffDays, dailyFarm, missingGold, realDaysNeeded);
}
