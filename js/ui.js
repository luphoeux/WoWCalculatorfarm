import { CONSTANTS } from './state.js';

export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function animateNumber(element, start, end, duration) {
    if (start === end) return;
    
    const range = end - start;
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    
    // Si la diferencia es muy grande, ajustamos el step para que la animación no se cuelgue
    const finalStepTime = stepTime < 10 ? 10 : stepTime;
    const steps = duration / finalStepTime;
    const valPerStep = range / steps;

    const timer = setInterval(function() {
        current += valPerStep;
        
        if ((increment === 1 && current >= end) || (increment === -1 && current <= end)) {
            element.innerText = formatNumber(end);
            clearInterval(timer);
        } else {
            element.innerText = formatNumber(Math.floor(current));
        }
    }, finalStepTime);
}

export function animateMoneyIcon(icon) {
    if (!icon) return;
    icon.classList.remove('money-bounce');
    void icon.offsetWidth; // Trigger reflow
    icon.classList.add('money-bounce');
}

export function checkDailyFarmValue() {
    const dailyInput = document.getElementById('dailyFarm');
    const syncBtn = document.getElementById('syncBtn');
    
    if (dailyInput.value.trim() === '' || dailyInput.value === '0') {
        syncBtn.classList.remove('hidden');
    } else {
        syncBtn.classList.add('hidden');
    }
}

export function updateButtonStates(currentDate) {
    const btnBruto = document.getElementById('btnBrutosaurio');
    const btnMid = document.getElementById('btnMidnight');

    const brutoActive = ['bg-yellow-900/40', 'border-yellow-500', 'text-yellow-200', 'shadow-[0_0_10px_rgba(234,179,8,0.2)]'];
    const brutoInactive = ['bg-[#2a220e]', 'border-yellow-900/30', 'text-wow-gold/60', 'hover:text-wow-gold', 'hover:border-yellow-900/60'];

    const midActive = ['bg-purple-900/40', 'border-purple-500', 'text-purple-200', 'shadow-[0_0_10px_rgba(168,85,247,0.2)]'];
    const midInactive = ['bg-[#181226]', 'border-purple-900/30', 'text-purple-400/60', 'hover:text-purple-400', 'hover:border-purple-900/60'];

    btnBruto.classList.remove(...brutoActive, ...brutoInactive);
    btnMid.classList.remove(...midActive, ...midInactive);

    if (currentDate === CONSTANTS.DATE_BRUTO) {
        btnBruto.classList.add(...brutoActive);
        btnMid.classList.add(...midInactive);
    } else if (currentDate === CONSTANTS.DATE_MIDNIGHT) {
        btnBruto.classList.add(...brutoInactive);
        btnMid.classList.add(...midActive);
    } else {
        btnBruto.classList.add(...brutoInactive);
        btnMid.classList.add(...midInactive);
    }
}

export function updateFinalTip(status, dateText, diffDays, dailyFarm, missingGold, realDaysNeeded) {
    const tipContainer = document.getElementById('tipContainer');
    const tipText = document.getElementById('tipText');

    if (status === 'danger') {
        tipContainer.className = "bg-gradient-to-r from-red-900/50 to-red-900/10 border-l-4 border-red-500 shadow-lg shadow-red-900/30 rounded-r-lg p-6 flex gap-4 items-start transition-all duration-300";
        const daysLate = realDaysNeeded - diffDays;
        tipText.innerHTML = `
            <div class="text-base text-gray-300">
                <strong class="text-red-300 text-lg block mb-1">Atención:</strong> 
                Llegarás a comprarlo el <strong class="text-white text-lg">${dateText}</strong> (${daysLate} días tarde) manteniendo el ritmo por <strong class="text-white text-lg">${realDaysNeeded}</strong> días de farmeo a <strong class="text-white text-lg">${formatNumber(dailyFarm)}</strong> oro diario.
            </div>
            <div class="mt-3 p-3 bg-red-950/40 rounded border border-red-900/30 text-sm text-gray-400">
                <i class="fas fa-hand-holding-dollar mr-1 text-red-400"></i> Sugerencia: Aumenta tu farm diario o compra lo restante con saldo de la tienda.
            </div>
        `;
    } else if (status === 'success') {
        tipContainer.className = "bg-gradient-to-r from-green-900/50 to-green-900/10 border-l-4 border-green-500 shadow-lg shadow-green-900/30 rounded-r-lg p-6 flex gap-4 items-start transition-all duration-300";
        if (missingGold <= 0) {
            tipText.innerHTML = `<strong class="text-green-300 text-lg">¡Felicidades!</strong> <div class="text-base mt-1">Ya tienes suficiente oro para comprar todo lo que necesitas.</div>`;
        } else {
            tipText.innerHTML = `<strong class="text-green-300 text-lg block mb-1">¡Vas por buen camino!</strong> <div class="text-base text-gray-300">Llegarás a comprarlo el <strong class="text-white text-lg">${dateText}</strong> manteniendo el ritmo por <strong class="text-white text-lg">${realDaysNeeded}</strong> días de farmeo a <strong class="text-white text-lg">${formatNumber(dailyFarm)}</strong> oro diario.</div>`;
        }
    } else {
        tipContainer.className = "bg-gradient-to-r from-yellow-900/40 to-yellow-900/10 border-l-4 border-yellow-500 shadow-lg shadow-yellow-900/30 rounded-r-lg p-6 flex gap-4 items-start transition-all duration-300";
        tipText.innerHTML = `<strong class="text-yellow-400 text-lg block mb-1">Plan Ideal:</strong> <div class="text-base text-gray-300">Para lograr la meta, deberías farmear <strong class="text-white text-lg">${formatNumber(dailyFarm)}</strong> oro diario durante <strong class="text-white text-lg">${realDaysNeeded}</strong> días de farmeo.</div>`;
    }
}
