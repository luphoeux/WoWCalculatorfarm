import { state, CONSTANTS } from './state.js';
import { calculate } from './calculator.js';
import { fetchTokenPrice } from './api.js';
import { renderWidget } from './widget.js';
import { checkDailyFarmValue, formatNumber } from './ui.js';

// Helper to set region globally and visually
function setRegion(region) {
    state.currentRegion = region;
    const btnNA = document.getElementById('btnRegionNA');
    const btnEU = document.getElementById('btnRegionEU');
    
    // Reset styles
    btnNA.className = "px-3 py-1 text-xs font-bold rounded-md text-gray-500 hover:text-gray-300 transition-colors";
    btnEU.className = "px-3 py-1 text-xs font-bold rounded-md text-gray-500 hover:text-gray-300 transition-colors";
    
    // Set active styles
    if (region === 'NA') {
        btnNA.className = "px-3 py-1 text-xs font-bold rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30 transition-colors";
    } else {
        btnEU.className = "px-3 py-1 text-xs font-bold rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30 transition-colors";
    }
    
    // Auto-update price input when switching regions
    const priceInput = document.getElementById('tokenPrice');
    if (state.cachedPrices[state.currentRegion] > 0) {
        priceInput.value = formatNumber(state.cachedPrices[state.currentRegion]);
    }
    
    if (state.hasCalculated) {
        calculate();
    }
    renderWidget();
}

function setDeadline(dateStr) {
    const input = document.getElementById('deadlineDate');
    input.value = dateStr;
    // We must update flatpickr instance if it exists
    if (input._flatpickr) {
        input._flatpickr.setDate(dateStr);
    }
    calculate(); 
    
    input.classList.add('bg-blue-900/40', 'border-blue-500');
    setTimeout(() => {
        input.classList.remove('bg-blue-900/40', 'border-blue-500');
    }, 300);
}

function setTab(tabId) {
    state.currentTab = tabId;
    const btn7M = document.getElementById('btnTab7M');
    const btn90USD = document.getElementById('btnTab90USD');
    const usdInputs = document.getElementById('usdModeInputs');
    
    // reset styles
    btn7M.className = "group relative flex-1 px-2 py-2 rounded-lg transition-all duration-300 flex items-center justify-center border font-bold text-[10px] sm:text-xs bg-[#2a220e] border-yellow-900/30 text-yellow-500/60 hover:text-yellow-500 hover:border-yellow-900/60";
    btn90USD.className = "group relative flex-1 px-2 py-2 rounded-lg transition-all duration-300 flex items-center justify-center border font-bold text-[10px] sm:text-xs bg-[#181226] border-purple-900/30 text-purple-400/60 hover:text-purple-400 hover:border-purple-900/60";
    
    if (tabId === 'bruto-7m') {
        btn7M.className = "group relative flex-1 px-2 py-2 rounded-lg transition-all duration-300 flex items-center justify-center border font-bold text-[10px] sm:text-xs bg-yellow-900/40 border-yellow-500 text-yellow-200 shadow-[0_0_10px_rgba(234,179,8,0.2)]";
        if(usdInputs) usdInputs.classList.add('hidden');
        setDeadline(CONSTANTS.DATE_BRUTO_7M);
    } else if (tabId === 'bruto-90usd') {
        btn90USD.className = "group relative flex-1 px-2 py-2 rounded-lg transition-all duration-300 flex items-center justify-center border font-bold text-[10px] sm:text-xs bg-purple-900/40 border-purple-500 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.2)]";
        if(usdInputs) usdInputs.classList.remove('hidden');
        const usdCostInput = document.getElementById('usdCost');
        if(usdCostInput && (usdCostInput.value === '15' || usdCostInput.value === '')) {
            usdCostInput.value = '90';
            document.getElementById('inputTokensDisplay').innerText = '6';
        }
        setDeadline(CONSTANTS.DATE_BRUTO_90USD);
    } else {
        if(usdInputs) usdInputs.classList.remove('hidden');
        const usdCostInput = document.getElementById('usdCost');
        if(usdCostInput && (usdCostInput.value === '90' || usdCostInput.value === '')) {
            usdCostInput.value = '15';
            document.getElementById('inputTokensDisplay').innerText = '1';
        }
    }
}

function executeCalculation() {
    const priceInput = document.getElementById('tokenPrice');
    
    // Set the price from cache if available and input is empty
    if (!priceInput.value && state.cachedPrices[state.currentRegion] > 0) {
        priceInput.value = formatNumber(state.cachedPrices[state.currentRegion]);
    }
    
    state.hasCalculated = true;
    
    // Simulate formatting
    const numericValue = priceInput.value.replace(/\./g, '').replace(/[^0-9]/g, '');
    if (numericValue) {
        priceInput.value = formatNumber(parseInt(numericValue, 10));
    }
    
    calculate();
    
    if (window.innerWidth < 1024) {
        setTimeout(() => {
            const resultsSec = document.getElementById('resultsSection');
            if (resultsSec) {
                resultsSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 150);
    }
}

function handleInputFormat(e) {
    const input = e.target;
    let value = input.value.replace(/\./g, '').replace(/[^0-9]/g, '');
    
    if (input.id === 'tokenPrice' || input.id === 'currentGold' || input.id === 'initialGold') {
        if (parseInt(value, 10) > CONSTANTS.MAX_GOLD_CAP) value = CONSTANTS.MAX_GOLD_CAP.toString();
    }
    
    if (value) {
        input.value = formatNumber(parseInt(value, 10));
    } else {
        input.value = '';
    }
    
    if (input.id === 'dailyFarm') {
        if (value && value !== '0') {
            state.manualDaily = true;
        } else {
            state.manualDaily = false;
        }
        checkDailyFarmValue();
    }
    
    if (state.hasCalculated) {
        calculate();
    }
}

// 1. Setup default state
state.currentTab = 'default';
const today = new Date();
const actualDate = new Date();
today.setMonth(today.getMonth() + 1);
const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
document.getElementById('deadlineDate').value = defaultDate;

// Tab visibility logic based on dates
const hide7MDate = new Date('2026-10-07T00:00:00');
const hide90USDDate = new Date('2026-11-18T00:00:00');

if (actualDate >= hide7MDate) {
    const btn7M = document.getElementById('btnTab7M');
    btn7M.classList.add('hidden');
    btn7M.classList.remove('flex');
}
if (actualDate >= hide90USDDate) {
    const btn90USD = document.getElementById('btnTab90USD');
    btn90USD.classList.add('hidden');
    btn90USD.classList.remove('flex');
}
if (actualDate >= hide7MDate && actualDate >= hide90USDDate) {
    const modeTabs = document.getElementById('modeTabs');
    modeTabs.classList.add('hidden');
    modeTabs.classList.remove('flex');
}

// 2. Attach Event Listeners
document.getElementById('btnRegionNA').addEventListener('click', () => setRegion('NA'));
document.getElementById('btnRegionEU').addEventListener('click', () => setRegion('EU'));

document.getElementById('syncBtn').addEventListener('click', () => {
    state.manualDaily = false;
    document.getElementById('dailyFarm').value = '';
    checkDailyFarmValue();
    if (state.hasCalculated) calculate();
});

document.getElementById('btnTab7M').addEventListener('click', () => setTab('bruto-7m'));
document.getElementById('btnTab90USD').addEventListener('click', () => setTab('bruto-90usd'));

document.getElementById('calculateBtnContainer').querySelector('button').addEventListener('click', executeCalculation);

document.getElementById('resetContainer').querySelector('button').addEventListener('click', () => {
    if (state.currentTab === 'bruto-90usd') {
        document.getElementById('usdCost').value = '90';
        document.getElementById('inputTokensDisplay').innerText = '6';
        const dlInput = document.getElementById('deadlineDate');
        dlInput.value = CONSTANTS.DATE_BRUTO_90USD;
        if (dlInput._flatpickr) dlInput._flatpickr.setDate(CONSTANTS.DATE_BRUTO_90USD);
    } else {
        document.getElementById('usdCost').value = '15';
        document.getElementById('inputTokensDisplay').innerText = '1';
        if (state.currentTab === 'bruto-7m') {
            const dlInput = document.getElementById('deadlineDate');
            dlInput.value = CONSTANTS.DATE_BRUTO_7M;
            if (dlInput._flatpickr) dlInput._flatpickr.setDate(CONSTANTS.DATE_BRUTO_7M);
        } else {
            const dlInput = document.getElementById('deadlineDate');
            dlInput.value = defaultDate;
            if (dlInput._flatpickr) dlInput._flatpickr.setDate(defaultDate);
        }
    }
    
    document.getElementById('tokenPrice').value = '';
    document.getElementById('currentGold').value = '';
    document.getElementById('initialGold').value = '';
    document.getElementById('dailyFarm').value = '';
    state.manualDaily = false;
    state.hasCalculated = false;
    checkDailyFarmValue();
    
    document.getElementById('resultsSection').classList.add('hidden', 'opacity-0');
    document.getElementById('resultsSection').classList.remove('opacity-100');
    document.getElementById('resetContainer').classList.add('hidden', 'opacity-0');
    document.getElementById('resetContainer').classList.remove('opacity-100');
    
    if (state.cachedPrices[state.currentRegion] > 0) {
        document.getElementById('tokenPrice').value = formatNumber(state.cachedPrices[state.currentRegion]);
    }
    
    transitionToOnboarding();
});

// Attach input formatting listeners
document.getElementById('initialGold').addEventListener('input', handleInputFormat);
document.getElementById('usdCost').addEventListener('input', handleInputFormat);
document.getElementById('tokenPrice').addEventListener('input', handleInputFormat);
document.getElementById('currentGold').addEventListener('input', handleInputFormat);
document.getElementById('dailyFarm').addEventListener('input', handleInputFormat);

// Onboarding Logic
function transitionToMainApp() {
    const onboarding = document.getElementById('onboardingStep');
    const mainApp = document.getElementById('mainAppContent');
    
    onboarding.style.opacity = '0';
    setTimeout(() => {
        onboarding.classList.add('hidden');
        onboarding.classList.remove('flex');
        
        mainApp.classList.remove('hidden');
        mainApp.classList.add('flex');
        setTimeout(() => {
            mainApp.classList.remove('opacity-0');
            if (state.hasCalculated) calculate();
        }, 50);
    }, 700);
}

function transitionToOnboarding() {
    const onboarding = document.getElementById('onboardingStep');
    const mainApp = document.getElementById('mainAppContent');
    
    mainApp.classList.add('opacity-0');
    setTimeout(() => {
        mainApp.classList.add('hidden');
        mainApp.classList.remove('flex');
        
        onboarding.classList.remove('hidden');
        onboarding.classList.add('flex');
        setTimeout(() => {
            onboarding.style.opacity = '1';
        }, 50);
    }, 700);
}

document.getElementById('btnStartCalc').addEventListener('click', () => {
    const initialGoldInput = document.getElementById('initialGold');
    if (initialGoldInput.value) {
        document.getElementById('currentGold').value = initialGoldInput.value;
    }
    transitionToMainApp();
});

document.getElementById('btnSkipOnboarding').addEventListener('click', () => {
    transitionToMainApp();
});

// 3. Initialize Flatpickr if present
if (typeof flatpickr !== 'undefined') {
    flatpickr("#deadlineDate", {
        locale: "es",
        altInput: true,
        altFormat: "d/m/Y",
        dateFormat: "Y-m-d",
        minDate: "today",
        disableMobile: "true",
        onChange: function() {
            if (state.hasCalculated) calculate();
        },
        onReady: function(selectedDates, dateStr, instance) {
            instance.altInput.className = instance.input.className;
        }
    });
}

// 4. Initial calculations
fetchTokenPrice().then(() => {
    executeCalculation();
});
