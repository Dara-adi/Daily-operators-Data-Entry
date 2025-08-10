// Global State
const state = {
  currentStep: 1,
  formHistory: [],
  dropdownData: null,
  timeoutId: null,
};

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeApp);
document.addEventListener('mousemove', resetTimeout);
document.addEventListener('keypress', resetTimeout);
document.addEventListener('click', resetTimeout);

document.getElementById('dataEntryForm').addEventListener('click', handleNavigation);
document.getElementById('dataEntryForm').addEventListener('change', handleDynamicFields);
document.getElementById('dataEntryForm').addEventListener('submit', handleFormSubmit);

// Initialization
function initializeApp() {
  google.script.run.withSuccessHandler(data => {
    state.dropdownData = data;
    populateAllDropdowns();
  }).getDropdownData();
  showStep(state.currentStep);
  resetTimeout();
}

// Timeout Functions
function resetTimeout() {
  clearTimeout(state.timeoutId);
  state.timeoutId = setTimeout(showTimeoutOverlay, 900000);
}

function showTimeoutOverlay() {
  document.getElementById('timeout-overlay').style.display = 'flex';
}

// Navigation and UI
function showStep(step) {
  document.querySelectorAll('.step').forEach(s => s.classList.add('hidden'));
  document.getElementById(`step-${step}`).classList.remove('hidden');
}

function handleNavigation(event) {
  if (event.target.classList.contains('next-btn')) {
    if (validateStep(state.currentStep)) {
      state.formHistory.push(state.currentStep);
      state.currentStep++;
      showStep(state.currentStep);
    }
  } else if (event.target.classList.contains('back-btn')) {
    const prevStep = state.formHistory.pop();
    if (prevStep) {
      state.currentStep = prevStep;
      showStep(state.currentStep);
    }
  } else if (event.target.classList.contains('back-to-start-btn')) {
    saveAndResetForm();
  }
}

// Dropdown and Datalist Population
function populateDropdowns(dropdownId, dataArray) {
  const dropdown = document.getElementById(dropdownId);
  dropdown.innerHTML = dataArray.map(item => `<option value="${item}">${item}</option>`).join('');
}

function populateDatalist(datalistId, dataArray) {
    const datalist = document.getElementById(datalistId);
    datalist.innerHTML = dataArray.map(item => `<option value="${item}"></option>`).join('');
}

function populateAllDropdowns() {
  const { sites, equipments } = state.dropdownData;
  populateDatalist('site-options', sites);
  populateDropdowns('equipment', equipments);
}

// Dynamic Field Logic
function handleDynamicFields(event) {
  const target = event.target;
  switch (target.id) {
    case 'renewal-yes':
    case 'renewal-no':
      toggleRenewalOptions(target.value === 'Yes');
      break;
    case 'lease-start-date':
    case 'lease-end-date':
      calculateLeaseRemainder();
      break;
    case 'other-payments-yes':
    case 'other-payments-no':
      handleOtherPayments(target.value);
      break;
    case 'used-yes':
    case 'used-no':
      toggleUsageOptions(target.value === 'Yes');
      break;
    case 'breakdown-yes':
    case 'breakdown-no':
      toggleBreakdownOptions(target.value === 'Yes');
      break;
    case 'done-yes':
    case 'done-no':
      handleFinalSubmission(target.value);
      break;
  }
}

function toggleRenewalOptions(isYes) {
  document.getElementById('renewal-options').classList.toggle('hidden', !isYes);
}

function toggleUsageOptions(isUsed) {
  document.getElementById('usage-yes-options').classList.toggle('hidden', !isUsed);
  document.getElementById('usage-no-options').classList.toggle('hidden', isUsed);
}

function toggleBreakdownOptions(isBreakdown) {
  document.getElementById('breakdown-remarks-div').classList.toggle('hidden', !isBreakdown);
}

function handleOtherPayments(choice) {
  if (choice === 'Yes') {
    alert("You selected 'Yes' for other payments. This is where you would handle additional entries or logic.");
  } else {
    state.formHistory.push(state.currentStep);
    state.currentStep++;
    showStep(state.currentStep);
  }
}

function handleFinalSubmission(choice) {
  document.getElementById('final-submit-div').classList.toggle('hidden', choice !== 'Yes');
  document.getElementById('back-to-start-div').classList.toggle('hidden', choice !== 'No');
}

// Form Submission & Validation
function handleFormSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());
  google.script.run.withSuccessHandler(resetFormAndShowSuccess).saveData(data);
}

function validateStep(step) {
  const stepElement = document.getElementById(`step-${step}`);
  const requiredInputs = stepElement.querySelectorAll('[required]');
  let isValid = true;
  requiredInputs.forEach(input => {
    if (!input.value || (input.type === 'radio' && !document.querySelector(`input[name="${input.name}"]:checked`))) {
      isValid = false;
      input.style.border = '2px solid red';
    } else {
      input.style.border = '1px solid #333';
    }
  });
  return isValid;
}

function calculateLeaseRemainder() {
  const startDate = new Date(document.getElementById('lease-start-date').value);
  const endDate = new Date(document.getElementById('lease-end-date').value);
  const today = new Date(document.getElementById('date').value);

  if (startDate && endDate && today) {
    const totalLeaseDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const adjustedRemainingDays = totalLeaseDays - elapsedDays; // This is a simplified calculation

    document.getElementById('lease-remainder-display').innerHTML = `
      <p><strong>Total Lease Days:</strong> ${totalLeaseDays}</p>
      <p><strong>Elapsed Days:</strong> ${elapsedDays}</p>
      <p><strong>Adjusted Remaining Days:</strong> ${adjustedRemainingDays}</p>
    `;
  }
}

function resetFormAndShowSuccess() {
  alert('Entry saved successfully!');
  document.getElementById('dataEntryForm').reset();
  state.currentStep = 1;
  state.formHistory = [];
  showStep(state.currentStep);
}

function saveAndResetForm() {
  const formData = new FormData(document.getElementById('dataEntryForm'));
  const data = Object.fromEntries(formData.entries());
  google.script.run.withSuccessHandler(resetFormAndShowSuccess).saveData(data);
}