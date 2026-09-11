import { translate } from '../../utils/i18n.js';
import { calculateSamplePrepScore } from '../../utils/calculations.js';
import {
  getEIColor,
  getPracticalityColor,   // ← add this
  createHorizontalProgressBar,
  createCoxcombChart
} from '../../utils/charts.js';
// ^— wherever your calculateSamplePrepScore(...) is actually defined
    // Helper to get color based on score - updated with new thresholds
    /**
 * Attach a click‐to‐toggle (collapse/expand) behavior to a header/content pair.
 * 
 * @param {HTMLElement} headerEl   – the element that will be clicked (e.g. a <div> or <h3>).
 * @param {HTMLElement} contentEl  – the element whose .style.display will be toggled.
 */
function makeCollapsible(headerEl, contentEl) {
  // 1) Ensure the header shows a pointer on hover
  headerEl.style.cursor = 'pointer';
  
  // 2) Hide the content by default
  contentEl.style.display = 'none';
  
  // 3) When header is clicked, toggle the content
  headerEl.addEventListener('click', () => {
    if (contentEl.style.display === 'none') {
      contentEl.style.display = '';          // use default (block)
    } else {
      contentEl.style.display = 'none';
    }
  });
}


export function SamplePreparationForm(state, onChange, scores) {
  const form = document.createElement('div');
  form.className = 'form-section card sample-prep-card';
  form.style.position = 'relative';
  const title = document.createElement('h3');
  title.textContent = translate('Sample Preparation');
  form.appendChild(title);
  
  // Info card with detailed explanation
  const infoCard = document.createElement('div');
  infoCard.className = 'info-card info-card-sample-prep';
  const infoCardTitle = document.createElement('div');
  infoCardTitle.className = 'info-card-title';
   // 1) Title remains visible and becomes clickable:
  infoCardTitle.classList.add('collapsible-title');
  infoCardTitle.textContent = translate('About Sample Preparation');
  infoCard.appendChild(infoCardTitle);

  // 2) Create the hidden “content” block:
  const infoCardContent = document.createElement('div');
  infoCardContent.className = 'info-card-content';
  infoCardContent.innerHTML = `
    <p>${translate('This section helps you calculate the Sample Preparation Score for your analytical method. Sample preparation is a critical step in environmental impact assessment, as it often involves chemicals, energy, and resources.')}</p>
    <ol>
      <li>${translate('Pre-synthesis - Any chemical preparation before the actual analysis')}</li>
      <li>${translate('Sampling procedure - Type and complexity of sampling preparation needed')}</li>
      <li>${translate('Extraction procedure - Methods used to extract analytes with solvent and adsorbent considerations')}</li>
      <li>${translate('Other conditions - Additional factors affecting environmental impact including:')}</li>
      <ul>
        <li>${translate('Derivatization/digestion requirements')}</li>
        <li>${translate('Automated sample preparation')}</li>
        <li>${translate('Type of sample preparation (in situ vs offline)')}</li>
        <li>${translate('Sample efficiency based on throughput')}</li>
      </ul>
    </ol>
    <p>${translate('Please fill in the information below to calculate your Sample Preparation Score.')}</p>
  `;
  infoCard.appendChild(infoCardContent);

  // 3) Immediately make the title/content pair collapsible:
  makeCollapsible(infoCardTitle, infoCardContent);
  
  // 4) Finally append the entire card to the form:
  form.appendChild(infoCard);

  
  // Pre-synthesis
  const preSynthesisSection = document.createElement('div');
  preSynthesisSection.className = 'form-section presynthesis-section';
  
  const preSynthesisGroup = createFormGroup(
    translate('Pre-synthesis'),
    'preSynthesis',
    [
      { value: 'no', label: translate('No pre-synthesis required'), score: '100' },
      { value: 'yes', label: translate('Pre-synthesis required'), score: '75' }
    ],
    state.preSynthesis || 'no',
    (value) => onChange('preSynthesis', value)
  );
  preSynthesisSection.appendChild(preSynthesisGroup);
  // 1. Create a container DIV for all Pre-synthesis sub-options
const presynthOptionsContainer = document.createElement('div');
presynthOptionsContainer.className = 'presynthesis-options';

// 2. Show additional options if pre-synthesis is required
if (state.preSynthesis === 'yes') {
  // (أ) Yield*
  const yieldGroup = createFormGroup(
    translate('Yield*'),
    'yield',
    [
      { value: 'high',     label: translate('High yield: cEF of 0.1 or less (>90%)'), score: '10' },
      { value: 'moderate', label: translate('Moderate yield: cEF > 0.1-1 (50-90%)'),  score: '5' },
      { value: 'low',      label: translate('Low yield: cEF > 1 (<50%)'),             score: '-5' }
    ],
    state.yield || 'high',
    (value) => onChange('yield', value)
  );
  // (أوضح: إزالة أي marginLeft هنا، لأنّ الحاوية نفسها ستحوي padding)
  presynthOptionsContainer.appendChild(yieldGroup);

  // (ب) Add cEF formula explanation
  const cEFExplanation = document.createElement('div');
  cEFExplanation.className = 'cef-explanation';
  cEFExplanation.innerHTML = `
    <p><strong>${translate('Complex E factor (cEF)')}</strong></p>
    <p>${translate('cEF = (Mass of all raw materials + Reagents + Solvents + Water - Mass of Product) / (Mass of Product)')}</p>
  `;
  cEFExplanation.style.fontSize = '0.9em';
  cEFExplanation.style.fontStyle = 'italic';
  cEFExplanation.style.backgroundColor = '#f8f9fa';
  cEFExplanation.style.padding = '10px';
  cEFExplanation.style.borderRadius = '5px';
  cEFExplanation.style.margin = '10px 0';
  presynthOptionsContainer.appendChild(cEFExplanation);

  // (ج) Temperature
  const temperatureGroup = createFormGroup(
    translate('Temperature'),
    'temperature',
    [
      { value: 'high',  label: translate('High temp. for more than 1 hr or cooling less than 0°C'), score: '-10' },
      { value: 'room',  label: translate('Room temperature more than 1 hr or heating less than 1 hr or cooling to 0°C'), score: '-5' },
      { value: 'low',   label: translate('Room temp. less than 1 hr'), score: '5' }
    ],
    state.temperature || 'room',
    (value) => onChange('temperature', value)
  );
  presynthOptionsContainer.appendChild(temperatureGroup);

  // (د) Purification needed
  const purificationGroup = createFormGroup(
    translate('Purification needed'),
    'purification',
    [
      { value: 'yes', label: translate('Yes'), score: '-5' },
      { value: 'no',  label: translate('No'),  score: '5' }
    ],
    state.purification === true ? 'yes' : 'no',
    (value) => onChange('purification', value === 'yes')
  );
  presynthOptionsContainer.appendChild(purificationGroup);

  // (ه) High energy consumption equipment
  const energyGroup = createFormGroup(
    translate('High energy consumption equipment >1.5 kW per sample'),
    'energyConsumption',
    [
      { value: 'yes', label: translate('Yes'), score: '-5' },
      { value: 'no',  label: translate('No'),  score: '5' }
    ],
    state.energyConsumption === true ? 'yes' : 'no',
    (value) => onChange('energyConsumption', value === 'yes')
  );
  presynthOptionsContainer.appendChild(energyGroup);

  // (و) Use of non-green solvent**
  const solventGroup = createFormGroup(
    translate('Use of non-green solvent**'),
    'nonGreenSolvent',
    [
      { value: 'yes', label: translate('Yes'), score: '-5' },
      { value: 'no',  label: translate('No'),  score: '5' }
    ],
    state.nonGreenSolvent === true ? 'yes' : 'no',
    (value) => onChange('nonGreenSolvent', value === 'yes')
  );
  presynthOptionsContainer.appendChild(solventGroup);

  // (ز) Add GHS explanation
  const ghsExplanation = document.createElement('div');
  ghsExplanation.className = 'ghs-explanation';
  ghsExplanation.innerHTML = `
    <p>${translate('** 2 or more pictograms in GHS with danger signal word')}</p>
  `;
  ghsExplanation.style.fontSize = '0.9em';
  ghsExplanation.style.fontStyle = 'italic';
  ghsExplanation.style.color = '#666';
  ghsExplanation.style.margin = '10px 0';
  presynthOptionsContainer.appendChild(ghsExplanation);

  // (ح) Presence of occupational hazard
  const hazardGroup = createFormGroup(
    translate('Presence of occupational hazard'),
    'occupationalHazard',
    [
      { value: 'yes', label: translate('Yes'), score: '-5' },
      { value: 'no',  label: translate('No'),  score: '5' }
    ],
    state.occupationalHazard === true ? 'yes' : 'no',
    (value) => onChange('occupationalHazard', value === 'yes')
  );
  presynthOptionsContainer.appendChild(hazardGroup);

  // 3. بعد الانتهاء من إضافة جميع الحقول الفرعية إلى 'presynthOptionsContainer'
  //    قم بإدخال الحاوية الكاملة إلى الـform
  preSynthesisSection.appendChild(presynthOptionsContainer);
  
}

form.appendChild(preSynthesisSection);
  
// ───────────── Sampling‐procedure wrapper (fixed) ─────────────

// Create the wrapper DIV and assign its class
const samplingProcedureSection = document.createElement('div');
samplingProcedureSection.className = 'form-section sampling-procedure-section';

// Build the “Sampling procedure” radio group
const instrumentRequirementsGroup = createFormGroup(
  translate('Sampling procedure'),
  'instrumentRequirements',
  [
    { value: 'none',  label: translate('NO Sampling is required – Ex. ATR technique or direct analysis'), score: '100' },
    { value: 'yes',   label: translate('YES (See options below)'), score: '0' }
  ],
  state.instrumentRequirements === 'none' ? 'none' : 'yes',
  (value) => {
    if (value === 'none') {
      onChange('instrumentRequirements', 'none');
      document.getElementById('samplingProcedureOptions')?.setAttribute('style', 'display: none');
    } else {
      onChange('instrumentRequirements', 'minimal');   // use a valid value immediately
      document.getElementById('samplingProcedureOptions')?.setAttribute('style', 'display: block');
    }
  }
);

// Create a container DIV for all Sampling sub‐options
const samplingOptionsDiv = document.createElement('div');
samplingOptionsDiv.id = 'samplingProcedureOptions';
samplingOptionsDiv.className = 'sampling-options';
if (state.instrumentRequirements === 'none') {
  samplingOptionsDiv.style.display = 'none';
}

// First subgroup: Sample preparation complexity
const samplingComplexityGroup = createFormGroup(
  translate('Sample Preparation Type'),
  'samplingProcedureType',
  [
    { value: 'minimal',  label: translate('Minimal sample preparation uv/vis fluorimetry and TLC'), score: '90' },
    { value: 'moderate', label: translate('Moderate sample preparation HPLC (Filtration or sonication) (80)'), score: '80' },
    { value: 'extensive',label: translate('Extensive sample preparations (bioanalytical methods)'), score: '70' }
  ],
  state.instrumentRequirements === 'none'
    ? 'minimal'
    : ['minimal','moderate','extensive'].includes(state.instrumentRequirements)
      ? state.instrumentRequirements
      : 'minimal',
  (value) => {
    onChange('instrumentRequirements', value);
    // Keep this in sync with the "Sample Processing Method" radio below, which
    // visually defaults to "In situ" — resetting both flags to false left the
    // UI showing "In situ" checked while neither +10 nor -10 was actually applied.
    onChange('inSituPreparation', true);
    onChange('offline', false);
  }
);
samplingOptionsDiv.appendChild(samplingComplexityGroup);

// Spacer between subgroups
const spacerDiv = document.createElement('div');
spacerDiv.style.height = '15px';
samplingOptionsDiv.appendChild(spacerDiv);

// Second subgroup: Sample processing method
const samplingMethodGroup = createFormGroup(
  translate('Sample Processing Method'),
  'samplingMethod',
  [
    { value: 'insitu',  label: translate('In situ sample preparation'), score: '10' },
    { value: 'offline', label: translate('Offline'), score: '-10' }
  ],
  state.offline ? 'offline' : 'insitu', // "insitu" is the only other real state, so this can never drift from the actual flags
  (value) => {
    onChange('inSituPreparation', value === 'insitu');
    onChange('offline', value === 'offline');
  }
);
samplingOptionsDiv.appendChild(samplingMethodGroup);

// ───────────────────────────────────────────────────────────────────
// Now append the radio group + its sub‐options into the wrapper,
// then append that wrapper to the form
// ───────────────────────────────────────────────────────────────────
samplingProcedureSection.appendChild(instrumentRequirementsGroup);
samplingProcedureSection.appendChild(samplingOptionsDiv);
form.appendChild(samplingProcedureSection);





/* ---------------------------------------------------------------------- */



// ───────────── Extraction‐procedure wrapper (fixed) ─────────────

const extractionSection = document.createElement('div');
extractionSection.className = 'form-section extraction-procedure-section';

const extractionGroup = createFormGroup(
  translate('Extraction procedure'),
  'extractionNeeded',
  [
    { value: 'no',  label: translate('No extraction needed'), score: '100' },
    { value: 'yes', label: translate('Extraction needed'), score: '70' }
  ],
  state.extractionNeeded || 'no',
  (value) => onChange('extractionNeeded', value)
);

// Create a container DIV for all Extraction sub‐options
const extractionOptionsContainer = document.createElement('div');
extractionOptionsContainer.className = 'extraction-options';

if (state.extractionNeeded === 'yes') {
  // (أ) Type of matrix
  const matrixTypeGroup = createFormGroup(
    translate('Type of matrix'),
    'matrixType',
    [
      { value: 'simple',  label: translate('Simple matrices such as bulk drug or pharmaceutical tablets'), score: '10' },
      { value: 'pharma',  label: translate('Matrices such as other pharmaceutical dosage form excluding tablet'), score: '-5' },
      { value: 'complex', label: translate('Complex matrices such as food, biological and environmental samples'), score: '-10' }
    ],
    state.matrixType || 'simple',
    (value) => onChange('matrixType', value)
  );
  matrixTypeGroup.style.marginBottom = '15px';
  extractionOptionsContainer.appendChild(matrixTypeGroup);

  // (ب) Solvent Type with detailed descriptions
  const solventTypeGroup = createFormGroup(
    translate('Solvent Type'),
    'solventType',
    [
      { value: 'complete', label: translate('Use of water or eco-friendly solvents'), score: '10' },
      { value: 'partial',  label: translate('Partial Green solvent'), score: '5' },
      { value: 'nongreen', label: translate('Non greener solvents'), score: '-10' }
    ],
    state.solventType || 'complete',
    (value) => onChange('solventType', value)
  );
  solventTypeGroup.style.marginBottom = '10px';
  extractionOptionsContainer.appendChild(solventTypeGroup);

  // (ج) Explanations for solvent types
  const solventExplanations = document.createElement('div');
  solventExplanations.className = 'solvent-explanations';
  solventExplanations.style.fontSize = '0.9em';
  solventExplanations.style.fontStyle = 'italic';
  solventExplanations.style.color = '#666';
  solventExplanations.style.margin = '5px 0 15px 0';
  solventExplanations.innerHTML = `
    <p>${translate('** 2 or more pictograms in GHS with danger signal word')}</p>
    <p>${translate('*** 2 pictogram with warning signal or 1 pictogram with warning or danger signal')}</p>
  `;
  extractionOptionsContainer.appendChild(solventExplanations);

  // (د) Amount of the solvent
  const solventVolumeGroup = createFormGroup(
    translate('Amount of the solvent'),
    'solventVolume',
    [
      { value: 'less0.1', label: translate('Less than 0.1 mL'), score: '10' },
      { value: '0.1to1',  label: translate('0.1 to 1 mL'), score: '5' },
      { value: '1to10',   label: translate('>1 to 10 mL'), score: '-5' },
      { value: 'more10',  label: translate('More than 10 mL'), score: '-10' }
    ],
    state.solventVolume || 'less0.1',
    (value) => onChange('solventVolume', value)
  );
  solventVolumeGroup.style.marginBottom = '15px';
  extractionOptionsContainer.appendChild(solventVolumeGroup);

  // (ه) Nature of the adsorbent
  const adsorbentNatureGroup = createFormGroup(
    translate('Nature of the adsorbent'),
    'adsorbentNature',
    [
      { value: 'renewable',    label: translate('If the adsorbent is renewable or reusable'), score: '5' },
      { value: 'nonrenewable', label: translate('No adsorbent or Not Used'), score: '0' }
    ],
    state.adsorbentNature || 'renewable',
    (value) => {
      onChange('adsorbentNature', value);
      // Show/hide adsorbent amount field based on selection
      const amountField = document.getElementById('adsorbentAmountGroup');
      if (amountField) {
        amountField.style.display = value === 'nonrenewable' ? 'none' : 'block';
      }
    }
  );
  adsorbentNatureGroup.style.marginBottom = '15px';
  extractionOptionsContainer.appendChild(adsorbentNatureGroup);

  // (و) Amount of the adsorbent – shown only when renewable
  const adsorbentAmountGroup = createFormGroup(
    translate('Amount of the adsorbent'),
    'adsorbentAmount',
    [
      { value: 'less0.5', label: translate('Less than 0.5 g'), score: '10' },
      { value: '0.5to1',  label: translate('0.5 g – 1 g'), score: '5' },
      { value: 'more1',   label: translate('Greater than 1 g (–10)'), score: '-10' }
    ],
    state.adsorbentAmount || 'less0.5',
    (value) => onChange('adsorbentAmount', value)
  );
  adsorbentAmountGroup.id = 'adsorbentAmountGroup';
  if (state.adsorbentNature === 'nonrenewable') {
    adsorbentAmountGroup.style.display = 'none';
  }
  extractionOptionsContainer.appendChild(adsorbentAmountGroup);
}

// ───────────────────────────────────────────────────────────────────
// Append the radio group + its sub‐options into the wrapper,
// then append that wrapper to the form
// ───────────────────────────────────────────────────────────────────
extractionSection.appendChild(extractionGroup);
extractionSection.appendChild(extractionOptionsContainer);
form.appendChild(extractionSection);


  
  // Other conditions section 
  const otherConditionsSection = document.createElement('div');
  otherConditionsSection.className = 'form-section other-conditions-section';
  
  const otherConditionsHeader = document.createElement('h4');
  otherConditionsHeader.textContent = translate('Other conditions');
  otherConditionsHeader.style.marginTop = '0';
  otherConditionsSection.appendChild(otherConditionsHeader);
  // Sampling Requires Derivatization/Digestion
  const derivatizationGroup = createFormGroup(
    translate('Sampling Requires Derivatization/Digestion or extra steps'),
    'derivatization',
    [
      { value: 'yes', label: translate('Yes'), score: '-10' },
      { value: 'no', label: translate('No or Not Available'), score: '0' }
    ],
    state.derivatization ? 'yes' : 'no',
    (value) => onChange('derivatization', value === 'yes')
  );
  otherConditionsSection.appendChild(derivatizationGroup);
  
  // Automated sample preparation
  const automatedPrepGroup = createFormGroup(
    translate('Automated sample preparation'),
    'automatedPreparation',
    [
      { value: 'yes', label: translate('Yes'), score: '10' },
      { value: 'no', label: translate('No or Not Available'), score: '0' }
    ],
    state.automatedPreparation ? 'yes' : 'no',
    (value) => onChange('automatedPreparation', value === 'yes')
  );
  otherConditionsSection.appendChild(automatedPrepGroup);
  
  // Type of Sample Preparation is now integrated in the sampling procedure options above
  
  // Sample throughput
  const sampleThroughputGroup = createFormGroup(
    translate('Sample throughput'),
    'sampleThroughput',
    [
      { value: 'high', label: translate('High sample throughput (≥60 samples/day)'), score: '5' },
      { value: 'moderate', label: translate('Moderate sample throughput (30–59 samples/day)'), score: '0' },
      { value: 'low', label: translate('Low sample throughput (<30 samples/day)'), score: '-5' }
    ],
    state.sampleThroughput || 'high',
    (value) => onChange('sampleThroughput', value)
  );
  otherConditionsSection.appendChild(sampleThroughputGroup);
  form.appendChild(otherConditionsSection);
  
  // Add formula note
  const formulaNote = document.createElement('div');
  formulaNote.className = 'formula-note';
  formulaNote.style.marginTop = '20px';
  formulaNote.style.padding = '15px';
  formulaNote.style.backgroundColor = '#f0f8ff';
  formulaNote.style.borderLeft = '4px solid var(--sample-prep-color)';
  formulaNote.style.borderRadius = '8px';
  formulaNote.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
  formulaNote.innerHTML = `
    <p><strong>${translate('Total sample preparation score = (Pre-synthesis + Sampling procedure + Extraction procedure) / 3 + Others')}</strong></p>
    <p>${translate('Other condition modifiers:')}</p>
    <ul>
      <li>${translate('Sampling requires derivatization/digestion: -10 points')}</li>
      <li>${translate('Automated sample preparation: +10 points')}</li>
      <li>${translate('In situ sample preparation: +10 points')}</li>
      <li>${translate('Offline sample preparation: -10 points')}</li>
      <li>${translate('High sample throughput (≥60 samples/day): +5 points')}</li>
      <li>${translate('Moderate sample throughput (30–59 samples/day): 0 points')}</li>
      <li>${translate('Low sample throughput (<30 samples/day): -5 points')}</li>
    </ul>
  `;
  // …after you appended formulaNote…
  form.appendChild(formulaNote);

  // ───────────────────────────────────────────────────────────────────
  // 1) Call the existing calculateSamplePrepScore(...) on the current state
  // ───────────────────────────────────────────────────────────────────
  const currentSPScore = calculateSamplePrepScore(state);
  // `currentSPScore` is now a number between 0 and 100 (inclusive)

  // ───────────────────────────────────────────────────────────────────
  // 2) Create the horizontal bar via your existing helper
  // ───────────────────────────────────────────────────────────────────
  const progressBarElement = createHorizontalProgressBar(
    currentSPScore,    // score
    100,               // maxScore
    '#4CAF50',         // fill color (green)
    translate('Sample Prep Score')
  );

  // ───────────────────────────────────────────────────────────────────
  // 3) Pin it to the form’s top-right
  // ───────────────────────────────────────────────────────────────────
  form.style.position = 'relative';        // (ensure this already exists right after form creation)
  progressBarElement.style.position = 'absolute';
  progressBarElement.style.top = '20px';
  progressBarElement.style.right = '20px';
  progressBarElement.style.width = '180px';  // adjust width to taste

  // ───────────────────────────────────────────────────────────────────
  // 4) Append the pinned bar and return
  // ───────────────────────────────────────────────────────────────────
  form.appendChild(progressBarElement);
  // 1. Assemble radarData exactly the same way SimpleResults does:
// Collect the component scores
const radarData = [];
if (scores.samplePrep !== undefined) {
  radarData.push({
    name: translate('Sample Prep'),
    value: scores.samplePrep,
    color: getEIColor(scores.samplePrep),
  });
}
if (scores.instrumentation !== undefined) {
  radarData.push({
    name: translate('Instrumentation'),
    value: scores.instrumentation,
    color: getEIColor(scores.instrumentation),
  });
}
if (scores.reagent !== undefined) {
  radarData.push({
    name: translate('Reagent'),
    value: scores.reagent,
    color: getEIColor(scores.reagent),
  });
}
if (scores.waste !== undefined) {
  radarData.push({
    name: translate('Waste'),
    value: scores.waste,
    color: getEIColor(scores.waste),
  });
}
// Always add Practicality axis last:
  if (scores.practicality   !== undefined) radarData.push({
    name: 'PPI',
    value: scores.practicality,
    color: getPracticalityColor(scores.practicality),
  });
/* =========================================================================
 *  Responsive EI / PPI sidebar – chart never disappears on small screens
 * ========================================================================= */

// 1) Remove any previous chart instance
const prev = document.getElementById('coxcombChart');
if (prev) prev.remove();

// 2) Build a new Coxcomb chart
const coxcombChart = createCoxcombChart(radarData);
coxcombChart.id = 'coxcombChart';
coxcombChart.style.cssText = `
  width: 150%;          /* let CSS decide the final size */
  max-width: 420px;     /* hard cap so it never overflows */
  height: auto;
  pointer-events: none;
`;

// 3) Split the “Performance Practicality Index” title over lines
const svg   = coxcombChart.querySelector('svg');
const SHIFT = 20;
if (svg) {
  svg.querySelectorAll('text').forEach(t => {
    if (t.textContent.includes('Performance Practicality Index')) {
      const y = parseFloat(t.getAttribute('y')) || 0;
      t.setAttribute('y', y - 50);
      const x = parseFloat(t.getAttribute('x')) || 0;
      t.setAttribute('x', x + SHIFT);

      const raw   = t.textContent.replace(/\s*\(PPI\)/, ' (PPI)');
      const words = raw.split(/\s+/);

      t.textContent = '';
      words.forEach((w, i) => {
        const span = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        span.setAttribute('x', t.getAttribute('x'));
        span.setAttribute('dy', i === 0 ? '0' : '1.2em');
        span.textContent = w;
        t.appendChild(span);
      });
    }
  });
}

// 4) Calculate the two headline scores
const ppiScore = scores.practicality ?? 0;
const eiScore  = (
  (scores.samplePrep      ?? 0) +
  (scores.instrumentation ?? 0) +
  (scores.reagent         ?? 0) +
  (scores.waste           ?? 0)
) / 4;

// 5) Helper to create one card
function makeCard(title, value, color) {
  const c = document.createElement('div');
  c.className = 'score-card';
  c.style.cssText = `
    width: 150px;
    max-width: 47%;
    height: 80px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0,0,0,.1);
    font-family: system-ui, sans-serif;
    pointer-events: none;
    box-sizing: border-box;
  `;

  const h4 = document.createElement('h4');
  h4.textContent = title;
  h4.style.cssText = `
    margin: 0;
    font-size: .75rem;
    font-weight: 600;
    color: #444;
    text-align: center;
  `;

  const span = document.createElement('span');
  span.textContent = `${value.toFixed(1)} %`;
  span.style.cssText = `
    font-size: 1.4rem;
    font-weight: 700;
    color: ${color};
  `;

  c.appendChild(h4);
  c.appendChild(span);
  return c;
}

const ppiCard = makeCard('Performance Practicality Index (PPI)', ppiScore, getPracticalityColor(ppiScore));
const eiCard  = makeCard('Environmental Index (EI)',            eiScore,  getEIColor(eiScore));



let sidebar = document.getElementById('ei-ppi-sidebar');
if (!sidebar) {
  sidebar = document.createElement('div');
  sidebar.id = 'ei-ppi-sidebar';
  document.body.appendChild(sidebar);
} else {
  // Remove the previous wrapper so we don’t end up with two .cards
  const oldCards = sidebar.querySelector('.cards');
  if (oldCards) oldCards.remove();
}

// 7) Global responsive CSS (inject only once)
if (!document.getElementById('ei-ppi-styles')) {
  const style = document.createElement('style');
  style.id = 'ei-ppi-styles';
  style.textContent = `
    :root {
      --sidebar-w: clamp(280px, 40vw, 420px);
    }
    body {
      margin-right: var(--sidebar-w);
    }
    #ei-ppi-sidebar {
      position: fixed;
      top: 27vh;
      right: 0vw;
      width: var(--sidebar-w);
      padding: 0 2vw;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      transform-origin: top right;
      z-index: 10000;
      pointer-events: none;
    }
    #ei-ppi-sidebar .cards {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin-top: 10px;
      margin-right: 10px;
      width: 95%;
    }
    /* Small screens: stack under content and shrink chart */
    @media (max-width: 900px) {
      body { margin-right: 0; }
      #ei-ppi-sidebar {
        position: static;
        margin: 20px auto;
        align-items: center;
      }op
      #coxcombChart { max-width: 320px; }
    }
    /* Very small screens: scale chart further so it never vanishes */
    @media (max-width: 600px) {
      #coxcombChart { max-width: 260px; }
    }
    /* Ensure SVG fills the div */
    #coxcombChart svg {
      width: 107%;
      height: auto;
    }
  `;
  document.head.appendChild(style);
}

// 8) Assemble sidebar content
const wrap = document.createElement('div');
wrap.className = 'cards';
wrap.appendChild(ppiCard);
wrap.appendChild(eiCard);

sidebar.appendChild(coxcombChart);
sidebar.appendChild(wrap);

// 9) Keep zoom scaling consistent
function refreshScale() {
  sidebar.style.transform = `scale(${1 / window.devicePixelRatio})`;
}
refreshScale();
window.addEventListener('resize', refreshScale);
window.matchMedia('(resolution)').addEventListener('change', refreshScale);



  return form;

}

function createFormGroup(label, name, options, selectedValue, onChange) {
  const group = document.createElement('div');
  group.className = 'form-group';
  
  const groupLabel = document.createElement('label');
  groupLabel.textContent = label;
  groupLabel.htmlFor = name;
  groupLabel.style.fontSize = '1.2rem';
  groupLabel.style.fontWeight = '600';
  groupLabel.style.marginBottom = '15px';
  groupLabel.style.display = 'block';
  group.appendChild(groupLabel);
  
  options.forEach((option, index) => {
    // Create a container div for the entire option
    const optionContainer = document.createElement('div');
    optionContainer.className = 'radio-option sample-prep-option';
    if (selectedValue === option.value) {
      optionContainer.classList.add('selected');
    }
    
    // Create custom radio container
    const radioContainer = document.createElement('label');
    radioContainer.className = 'custom-radio-container';
    radioContainer.htmlFor = `${name}_${option.value}`;
    
    // Create actual radio input (hidden)
    const radio = document.createElement('input');
    radio.className = 'custom-radio-input';
    radio.type = 'radio';
    radio.id = `${name}_${option.value}`;
    radio.name = name;
    radio.value = option.value;
    radio.checked = selectedValue === option.value;
    radio.addEventListener('change', () => {
      onChange(option.value);
      
      // Update selected class on change
      const options = group.querySelectorAll('.radio-option');
      options.forEach(opt => opt.classList.remove('selected'));
      optionContainer.classList.add('selected');
    });
    
    // Create custom radio visual element
    const radioCheckmark = document.createElement('span');
    radioCheckmark.className = 'radio-checkmark';
    
    // Create label content
    const labelContent = document.createElement('span');
    labelContent.className = 'radio-label-content';
    labelContent.textContent = option.label;
    
    // Create score display
    const scoreSpan = document.createElement('span');
    scoreSpan.className = 'option-score';
    scoreSpan.textContent = option.score;
    
    // Append all elements
    radioContainer.appendChild(radio);
    radioContainer.appendChild(radioCheckmark);
    radioContainer.appendChild(labelContent);
    radioContainer.appendChild(scoreSpan);
    
    // Add the radio container to the option container
    optionContainer.appendChild(radioContainer);
    
    // Add to form group
    group.appendChild(optionContainer);
  });
  
  return group;
}
