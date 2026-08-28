import { translate } from '../../utils/i18n.js';
import { calculatePracticalityScore } from '../../utils/calculations.js';   // ← add this
import {
  getEIColor,
  getPracticalityColor,   // ← add this
  createHorizontalProgressBar,
  createCoxcombChart
} from '../../utils/charts.js';
// ─── add this helper exactly as in SamplePreparationForm ───
function makeCollapsible(headerEl, contentEl) {
  headerEl.style.cursor = 'pointer';
  contentEl.style.display = 'none';
  headerEl.addEventListener('click', () => {
    contentEl.style.display = contentEl.style.display === 'none' ? '' : 'none';
  });
}

export function PracticalityForm(state, onChange, scores) {
  const form = document.createElement('div');
  form.className = 'form-section card practicality-card';
  
  const title = document.createElement('h3');
  title.textContent = translate('Performance Practicality Index (PPI)');
  form.appendChild(title);
  
   // Info card with detailed explanation (collapsed by default)
  const infoCard = document.createElement('div');
  infoCard.className = 'info-card info-card-practicality';

  const infoCardTitle = document.createElement('div');
  infoCardTitle.className = 'info-card-title collapsible-title';
  infoCardTitle.textContent = translate('About Performance Practicality Index (PPI)');
  infoCard.appendChild(infoCardTitle);

  const infoCardContent = document.createElement('div');
  infoCardContent.className = 'info-card-content';
  infoCardContent.innerHTML = `
    <p>${translate('The Performance Practicality Index (PPI) (PI) accounts for 50% of the total Dual Index score. It measures the real-world applicability and efficiency of an analytical method.')}</p>
    <p>${translate('Please fill in the information below to calculate your Performance Practicality Index (PPI) (PI).')}</p>
  `;
  infoCard.appendChild(infoCardContent);

  // Hide content until the title is clicked:
  makeCollapsible(infoCardTitle, infoCardContent);

  form.appendChild(infoCard);

  
  // Method Characteristics Section
  const methodSection = document.createElement('div');
  methodSection.className = 'form-section method-characteristics-section';
  
  // 1. Nature of Method
  const natureGroup = createFormGroup(
    translate('Nature of Method'),
    'natureOfMethod',
    [
      { value: 'quantitative', label: translate('Quantitative'), score: '10' },
      { value: 'semiquantitative', label: translate('Semiquantitative'), score: '6' },
      { value: 'qualitative', label: translate('Qualitative'), score: '4' }
    ],
    state.natureOfMethod || 'quantitative',
    (value) => onChange('natureOfMethod', value)
  );
  natureGroup.classList.add('practicality-option');
  methodSection.appendChild(natureGroup);
  
  // 2. QbD Applied (using designOfExperiment field)
  const designGroup = createFormGroup(
    translate('QbD Applied'),
    'designOfExperiment',
    [
      { value: 'factorial', label: translate('Optimization'), score: '10' },
      { value: 'partial', label: translate('Screening'), score: '5' },
      { value: 'none', label: translate('No Design'), score: '0' }
    ],
    state.designOfExperiment || 'factorial',
    (value) => onChange('designOfExperiment', value)
  );
  designGroup.classList.add('practicality-option');
  methodSection.appendChild(designGroup);
  form.appendChild(methodSection);
  
    // ─── 3. AI Integration ───
  const aiSection = document.createElement('div');
  aiSection.className = 'form-section ai-integration-section';

  const aiGroup = createFormGroup(
    translate('AI Integration'),
    'aiIntegration',
    [
      { value: 'advanced', label: translate('Advanced AI Integration'),  score: '10' },
      { value: 'moderate', label: translate('Moderate AI Integration'),  score: '7'  },
      { value: 'basic',    label: translate('Basic AI Integration'),     score: '3'  },
      { value: 'none',     label: translate('No AI Integration'),        score: '0'  }
    ],
    state.aiIntegration || 'none',
    (value) => onChange('aiIntegration', value)
  );
  aiGroup.classList.add('practicality-option');
  aiSection.appendChild(aiGroup);
  form.appendChild(aiSection);

  // Validation Section
  const validationSection = document.createElement('div');
  validationSection.className = 'form-section validation-section';
  
  // 3. Validation
  const validationGroup = createFormGroup(
    translate('Validation'),
    'validation',
    [
      { value: 'full', label: translate('Fully Validated'), score: '10' },
      { value: 'partial', label: translate('Partial'), score: '5' },
      { value: 'none', label: translate('Not validated'), score: '0' }
    ],
    state.validation || 'full',
    (value) => onChange('validation', value)
  );
  validationGroup.classList.add('practicality-option');
  validationSection.appendChild(validationGroup);
  
  // 4. Sensitivity
  const sensitivityGroup = createFormGroup(
    translate('Sensitivity'),
    'sensitivity',
    [
      { value: 'picogram', label: translate('Picogram'), score: '10' },
      { value: 'nanogram', label: translate('Nanogram'), score: '8' },
      { value: 'microgram', label: translate('Microgram'), score: '5' },
      { value: 'more', label: translate('>Microgram'), score: '2' }
    ],
    state.sensitivity || 'picogram',
    (value) => onChange('sensitivity', value)
  );
  sensitivityGroup.classList.add('practicality-option');
  validationSection.appendChild(sensitivityGroup);
  form.appendChild(validationSection);
  
  // ─── 6. Availability of Reagent ───
  const reagentAvailSection = document.createElement('div');
  reagentAvailSection.className = 'form-section reagent-availability-section';

  const reagentAvailGroup = createFormGroup(
    translate('Availability of Reagent'),
    'reagentAvailability',
    [
      { value: 'low',  label: translate('Commercially available at low cost'), score: '10' },
      { value: 'high', label: translate('High cost or require synthesis'), score: '5' }
    ],
    state.reagentAvailability || 'low',
    (value) => onChange('reagentAvailability', value)
  );
  reagentAvailGroup.classList.add('practicality-option');
  reagentAvailSection.appendChild(reagentAvailGroup);
  form.appendChild(reagentAvailSection);

  // ─── 7. Availability of Instrument & Cost of Analysis ───
  const instrCostSection = document.createElement('div');
  instrCostSection.className = 'form-section instrument-cost-section';

  const instrCostGroup = createFormGroup(
    translate('Instrument availability & cost per sample'),
    'instrCost',
    [
      { value: 'all_low',    label: translate('All instruments available + low cost (<$100)'),     score: '10' },
      { value: 'one_med',    label: translate('One special needed + medium/high cost ($100–300)'), score: '5'  },
      { value: 'many_high',  label: translate('More instruments needed + high cost (>$300)'),       score: '0'  }
    ],
    state.instrCost || 'all_low',
    (value) => onChange('instrCost', value)
  );
  instrCostGroup.classList.add('practicality-option');
  instrCostSection.appendChild(instrCostGroup);
  form.appendChild(instrCostSection);

  // ─── 8. Maintenance frequency and instrument lifetime ───
  const maintenanceSection = document.createElement('div');
  maintenanceSection.className = 'form-section maintenance-section';

  const maintenanceGroup = createFormGroup(
    translate('Maintenance frequency and instrument lifetime'),
    'maintenance',
    [
      { value: 'long',     label: translate('Long lifespans and minimal maintenance'), score: '10' },
      { value: 'moderate', label: translate('Moderate maintenance'), score: '5' },
      { value: 'frequent', label: translate('Frequent repairs or replacement'), score: '0' }
    ],
    state.maintenance || 'long',
    (value) => onChange('maintenance', value)
  );
  maintenanceGroup.classList.add('practicality-option');
  maintenanceSection.appendChild(maintenanceGroup);
  form.appendChild(maintenanceSection);


  // Efficiency Section
  const efficiencySection = document.createElement('div');
  efficiencySection.className = 'form-section efficiency-section';
  
  // 9. Time of Analysis (Throughput)
  const throughputGroup = createFormGroup(
    translate('Time of Analysis (Throughput)'),
    'throughput',
    [
      { value: 'high', label: translate('High throughput (≥25 samples/hr)'), score: '10' },
      { value: 'medium', label: translate('Medium throughput (13-24 samples/hr)'), score: '5' },
      { value: 'low', label: translate('Low throughput (≤12 samples/hr)'), score: '0' }
    ],
    state.throughput || 'high',
    (value) => onChange('throughput', value)
  );
  throughputGroup.classList.add('practicality-option');
  efficiencySection.appendChild(throughputGroup);
  
  // 10. Sample Reusability
  const reusabilityGroup = createFormGroup(
    translate('Sample Reusability'),
    'reusability',
    [
      { value: 'yes', label: translate('Yes, sample can be reused'), score: '10' },
      { value: 'no', label: translate('No, sample cannot be reused'), score: '0' }
    ],
    state.reusability || 'yes',
    (value) => onChange('reusability', value)
  );
  reusabilityGroup.classList.add('practicality-option');
  efficiencySection.appendChild(reusabilityGroup);
  form.appendChild(efficiencySection);
  
  // We've removed the "Criteria and Scoring Scheme" section as requested
  
  // Add formula note
  const formulaNote = document.createElement('div');
  formulaNote.className = 'formula-note';
  formulaNote.style.marginTop = '20px';
  formulaNote.style.padding = '15px';
  formulaNote.style.backgroundColor = '#f0f8ff';
  formulaNote.style.borderLeft = '4px solid var(--practicality-color)';
  formulaNote.style.borderRadius = '8px';
  formulaNote.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
  formulaNote.innerHTML = `
  <p>${translate('Performance Practicality Index (PPI) (PI) = ∑ (Weighted scores from 10 core criteria)')}</p>
  <p>${translate('EPPI Total Score = (EI score × 0.5) + (PI × 0.5)')}</p>
  <p>${translate('Interpretation of PI Scores:')}</p>
  <ul>
    <li>${translate('75–100: Excellent Performance Practicality Index (PPI) – Highly applicable and efficient')}</li>
    <li>${translate('50–74: Acceptable Performance Practicality Index (PPI) – Viable with moderate optimization')}</li>
    <li>${translate('<50: Impractical Performance Practicality Index (PPI) – Limited real-world feasibility, needs improvement')}</li>
  </ul>
`;
;
  form.appendChild(formulaNote);
    // ─── COMPUTE PRACTICALITY SCORE ───
  const currentPI = calculatePracticalityScore(state);

  // ─── PINNED HORIZONTAL PROGRESS BAR ───
  const piProgressBar = createHorizontalProgressBar(
    currentPI,
    100,
    getPracticalityColor(currentPI),
    translate('Performance Practicality Index (PPI) Score')
  );
  form.style.position = 'relative';
  piProgressBar.style.position = 'absolute';
  piProgressBar.style.top = '20px';
  piProgressBar.style.right = '20px';
  piProgressBar.style.width = '180px';
  form.appendChild(piProgressBar);

  // ─── BUILD FIVE‐SLICE RADAR DATA ───
  const radarData = [];
  if (scores.samplePrep !== undefined) {
    radarData.push({
      name: translate('Sample Prep'),
      value: scores.samplePrep,
      color: getEIColor(scores.samplePrep)
    });
  }
  if (scores.instrumentation !== undefined) {
    radarData.push({
      name: translate('Instrumentation'),
      value: scores.instrumentation,
      color: getEIColor(scores.instrumentation)
    });
  }
  if (scores.reagent !== undefined) {
    radarData.push({
      name: translate('Reagent'),
      value: scores.reagent,
      color: getEIColor(scores.reagent)
    });
  }
  if (scores.waste !== undefined) {
    radarData.push({
      name: translate('Waste'),
      value: scores.waste,
      color: getEIColor(scores.waste)
    });
  }
  // Use this page’s own Practicality score:
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
  width: 120%;          /* let CSS decide the final size */
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

// 6) Sidebar container (create only if it doesn’t exist)
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
      top: 25vh;
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
      width: 100%;
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
    radio.addEventListener('change', () => onChange(option.value));
    
    // Create custom radio visual element
    const radioCheckmark = document.createElement('span');
    radioCheckmark.className = 'radio-checkmark';
    
    // Create label text
    const labelText = document.createTextNode(option.label);
    
    // Create score display
    const scoreSpan = document.createElement('span');
    scoreSpan.className = 'option-score';
    scoreSpan.textContent = option.score;
    
    // Append all elements
    radioContainer.appendChild(radio);
    radioContainer.appendChild(radioCheckmark);
    radioContainer.appendChild(labelText);
    radioContainer.appendChild(scoreSpan);
    
    group.appendChild(radioContainer);
  });
  
  return group;
}