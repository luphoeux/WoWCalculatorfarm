import { state } from './state.js';
import { calculate } from './calculator.js';
import { fetchTokenPrice } from './api.js';
import { renderWidget } from './widget.js';
import { checkDailyFarmValue } from './ui.js';

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
        // import formatNumber locally or just set it
        priceInput.value = state.cachedPrices[state.currentRegion].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    
    if (state.hasCalculated) {
        calculate();
    }
    renderWidget();
}

function setDeadline(dateStr) {
    const input = document.getElementById('deadlineDate');
    input.value = dateStr;
    calculate(); 
    
    input.classList.add('bg-blue-900/40', 'border-blue-500');
    setTimeout(() => {
        input.classList.remove('bg-blue-900/40', 'border-blue-500');
    }, 300);
}

function executeCalculation() {
    const priceInput = document.getElementById('tokenPrice');
    
    // Set the price from cache if available and input is empty
    if (!priceInput.value && state.cachedPrices[state.currentRegion] > 0) {
        priceInput.value = state.cachedPrices[state.currentRegion].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    
    state.hasCalculated = true;
    
    // Simulate formatting
    const numericValue = priceInput.value.replace(/\./g, '').replace(/[^0-9]/g, '');
    if (numericValue) {
        priceInput.value = parseInt(numericValue, 10).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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
    
    if (input.id === 'tokenPrice' || input.id === 'currentGold') {
        const MAX_GOLD_CAP = 10000000;
        if (parseInt(value, 10) > MAX_GOLD_CAP) value = MAX_GOLD_CAP.toString();
    }
    
    if (value) {
        input.value = parseInt(value, 10).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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

// 1. Setup default date
const today = new Date();
today.setMonth(today.getMonth() + 1);
const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
document.getElementById('deadlineDate').value = defaultDate;

// 2. Attach Event Listeners
document.getElementById('btnRegionNA').addEventListener('click', () => setRegion('NA'));
document.getElementById('btnRegionEU').addEventListener('click', () => setRegion('EU'));

document.getElementById('syncBtn').addEventListener('click', () => {
    state.manualDaily = false;
    document.getElementById('dailyFarm').value = '';
    checkDailyFarmValue();
    if (state.hasCalculated) calculate();
});

document.getElementById('btnBrutosaurio').addEventListener('click', () => setDeadline('2026-01-05'));
document.getElementById('btnMidnight').addEventListener('click', () => setDeadline('2026-03-02'));

document.getElementById('calculateBtnContainer').querySelector('button').addEventListener('click', executeCalculation);

document.getElementById('resetContainer').querySelector('button').addEventListener('click', () => {
    document.getElementById('usdCost').value = '90';
    document.getElementById('tokenPrice').value = '';
    document.getElementById('currentGold').value = '';
    document.getElementById('dailyFarm').value = '';
    state.manualDaily = false;
    checkDailyFarmValue();
    document.getElementById('deadlineDate').value = defaultDate;
    
    state.hasCalculated = false;
    const resultsSec = document.getElementById('resultsSection');
    const resetContainer = document.getElementById('resetContainer');
    
    resultsSec.classList.remove('opacity-100');
    resultsSec.classList.add('opacity-0');
    resetContainer.classList.remove('opacity-100');
    resetContainer.classList.add('opacity-0');
    
    setTimeout(() => {
        resultsSec.classList.add('hidden');
        resetContainer.classList.add('hidden');
    }, 500);
    
    if (state.cachedPrices[state.currentRegion] > 0) {
        document.getElementById('tokenPrice').value = state.cachedPrices[state.currentRegion].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
});

// Attach input formatting listeners
document.getElementById('usdCost').addEventListener('input', handleInputFormat);
document.getElementById('tokenPrice').addEventListener('input', handleInputFormat);
document.getElementById('currentGold').addEventListener('input', handleInputFormat);
document.getElementById('dailyFarm').addEventListener('input', handleInputFormat);

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
fetchTokenPrice();
