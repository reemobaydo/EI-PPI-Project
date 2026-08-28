import { translate } from '../../utils/i18n.js';
import {
  getEIColor,
  getPracticalityColor,
  createHorizontalProgressBar,
  createCoxcombChart
} from '../../utils/charts.js';

// Helper to collapse/expand the info block:
function makeCollapsible(headerEl, contentEl) {
  headerEl.style.cursor = 'pointer';
  contentEl.style.display = 'none';
  headerEl.addEventListener('click', () => {
    contentEl.style.display = contentEl.style.display === 'none' ? '' : 'none';
  });
}
export function ReagentForm(reagents, onChange, scores) {
  const form = document.createElement('div');
  form.className = 'form-section card reagent-card';
  form.style.position = 'relative';
  
  const title = document.createElement('h3');
  title.textContent = translate('Reagents');
  form.appendChild(title);
  
  // Info card with detailed explanation
  const infoCard = document.createElement('div');
  infoCard.className = 'info-card info-card-reagent';
  
  const infoCardTitle = document.createElement('div');
  infoCardTitle.className = 'info-card-title collapsible-title';
  infoCardTitle.textContent = translate('About Reagents');
  infoCard.appendChild(infoCardTitle);
  
  const infoCardContent = document.createElement('div');
  infoCardContent.className = 'info-card-content';
  infoCardContent.innerHTML = `
    <p>${translate(
      'This page helps you calculate the Reagent Score for your analytical method. ' +
      'The score evaluates the environmental sustainability and safety of solvents used, ' +
      'with emphasis on selecting greener and less hazardous reagents.'
    )}</p>
    <p>${translate('Please add information about each solvent used in your method.')}</p>
    <p><strong>${translate('Note:')}</strong> ${translate(
      'If "Not available" is selected for Signal Word, consider setting GHS Classification to "Zero pictograms". ' +
      'Similarly, if "Zero pictograms" is chosen for GHS Classification, "Not available" would be the appropriate Signal Word.'
    )}</p>
  `;
  infoCard.appendChild(infoCardContent);
  makeCollapsible(infoCardTitle, infoCardContent);
  form.appendChild(infoCard);
  
  // Current reagents list
  const reagentsList = document.createElement('div');
  reagentsList.className = 'reagents-container';
  reagentsList.style.display = 'grid';
  reagentsList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(450px, 1fr))';
  reagentsList.style.gap = '20px';
  
  // Display existing reagents
  reagents.forEach((reagent, index) => {
    const item = createReagentItem(reagent, index, (updatedReagent) => {
      const newArr = [...reagents];
      newArr[index] = updatedReagent;
      onChange(newArr);
    }, () => {
      const newArr = reagents.filter((_, i) => i !== index);
      onChange(newArr);
    });
    reagentsList.appendChild(item);
  });
  
  form.appendChild(reagentsList);
  
  // Add new reagent - modern UI style
  const addSolventContainer = document.createElement('div');
  addSolventContainer.className = 'add-solvent-container';
  addSolventContainer.style.cursor = 'pointer';
  addSolventContainer.style.padding = '15px';
  addSolventContainer.style.border = '1px dashed #ccc';
  addSolventContainer.style.marginTop = '15px';
  addSolventContainer.style.borderRadius = '5px';
  
  const addSolventTitle = document.createElement('div');
  addSolventTitle.className = 'add-solvent-title';
  addSolventTitle.textContent = translate('Add Another Solvent');
  addSolventContainer.appendChild(addSolventTitle);
  
  const addSolventDescription = document.createElement('div');
  addSolventDescription.textContent = translate(
    'Click to add another solvent or reagent to your calculation'
);
  addSolventContainer.appendChild(addSolventDescription);
  
  addSolventContainer.addEventListener('click', () => {
    const newReagent = {
      id: 'reagent_' + Date.now(), // Ensure unique ID
      solventType: 'water',
      signalWord: 'notAvailable',
      ghsClass: 'zero',
      volume: 'less1',
      configured: false // excluded from the Reagent Score average until the user sets real values
    };
    
    onChange([...reagents, newReagent]);
  });
  
  form.appendChild(addSolventContainer);
  
  // Help text
  const helpText = document.createElement('div');
  helpText.className = 'help-text';
  helpText.innerHTML = `
    <p><strong>${translate('GHS Classification Guide:')}</strong></p>
    <ul>
      <li>${translate('Zero pictograms: No hazard (generally for water)')}</li>
      <li>${translate('One pictogram: Low hazard')}</li>
      <li>${translate('Two pictograms: Moderate hazard')}</li>
      <li>${translate('Three or more pictograms: High hazard')}</li>
    </ul>
    <p><strong>${translate('Note:')}</strong> ${translate('If "Not available" is selected for Signal Word, consider setting GHS Classification to "Zero pictograms". Similarly, if "Zero pictograms" is chosen for GHS Classification, "Not available" would be the appropriate Signal Word.')}</p>
    <p>${translate('The total Reagent Score is the average of all individual reagent scores.')}</p>
  `;
  
  form.appendChild(helpText);

  // ─── Compute Average Reagent Score ───
  // Newly added solvents (configured === false) are excluded until the user
  // sets real values, so the score doesn't jump the moment "Add Another Solvent" is clicked.
  const configuredReagents = reagents.filter((r) => r.configured !== false);
  const individualScores = configuredReagents.map((r) => calculateReagentScore(r));
  const averageReagentScore =
    individualScores.length > 0
      ? individualScores.reduce((sum, x) => sum + x, 0) / individualScores.length
      : 100; // If no configured reagents, default to 100

  // ─── Pinned Horizontal Progress Bar ───
  const progressBarElement = createHorizontalProgressBar(
    averageReagentScore,
    100,
    getEIColor(averageReagentScore),
    translate('Reagent Score')
  );
  progressBarElement.style.position = 'absolute';
  progressBarElement.style.top = '20px';
  progressBarElement.style.right = '20px';
  progressBarElement.style.width = '180px';
  form.appendChild(progressBarElement);

  // ─── Build 5‐slice Radar (Coxcomb) Data ───
  // We expect `scores` to contain { samplePrep, instrumentation, waste, practicality }.
  const radarData = [];

  // (1) Sample Prep:
  if (scores.samplePrep !== undefined) {
    radarData.push({
      name: translate('Sample Prep'),
      value: scores.samplePrep,
      color: getEIColor(scores.samplePrep)
    });
  }

  // (2) Instrumentation:
  if (scores.instrumentation !== undefined) {
    radarData.push({
      name: translate('Instrumentation'),
      value: scores.instrumentation,
      color: getEIColor(scores.instrumentation)
    });
  }

  // (3) Reagent (this form’s own average score):
  radarData.push({
    name: translate('Reagent'),
    value: averageReagentScore,
    color: getEIColor(averageReagentScore)
  });

  // (4) Waste:
  if (scores.waste !== undefined) {
    radarData.push({
      name: translate('Waste'),
      value: scores.waste,
      color: getEIColor(scores.waste)
    });
  }

  // (5) Practicality (always last):
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

function createReagentItem(reagent, index, onUpdate, onRemove) {
  const reagentItem = document.createElement('div');
  reagentItem.className = 'reagent-item form-section reagent-cost-section';
  
  // Create a header for the reagent
  const reagentHeader = document.createElement('div');
  reagentHeader.style.display = 'flex';
  reagentHeader.style.justifyContent = 'space-between';
  reagentHeader.style.alignItems = 'center';
  
  // Create title for the reagent
  const reagentTitle = document.createElement('h4');
  reagentTitle.textContent = `${translate('Add Solvent')}`;
  reagentHeader.appendChild(reagentTitle);
  
  // Add remove button to the header
  const headerRemoveButton = document.createElement('button');
  headerRemoveButton.className = 'remove-btn';
  headerRemoveButton.innerHTML = '×';
  headerRemoveButton.addEventListener('click', onRemove);
  reagentHeader.appendChild(headerRemoveButton);
  
  // Add the header to the reagent item
  reagentItem.appendChild(reagentHeader);

  // Create a form layout with 3 sections, each with 2 fields
  const formLayout = document.createElement('div');
  formLayout.style.display = 'grid';
  formLayout.style.gridTemplateColumns = 'repeat(2, 1fr)';
  formLayout.style.gap = '15px';
  
  // FIRST ROW - Solvent Type and Solvent Name
  // 1. Solvent Type
  const solventTypeGroup = document.createElement('div');
  solventTypeGroup.className = 'reagent-form-group';
  
  const solventTypeLabel = document.createElement('label');
  solventTypeLabel.className = 'reagent-form-label';
  solventTypeLabel.textContent = translate('Solvent Type');
  solventTypeGroup.appendChild(solventTypeLabel);
  
  const solventTypeSelect = document.createElement('select');
  solventTypeSelect.className = 'form-control';
  
  const solventTypes = [
    { value: 'water', label: translate('Water') },
    { value: 'organic', label: translate('Organic Solvent') },
    { value: 'acid', label: translate('Acid') },
    { value: 'base', label: translate('Base') },
    { value: 'buffer', label: translate('Buffer') },
    { value: 'other', label: translate('Other') }
  ];
  
  solventTypes.forEach(type => {
    const option = document.createElement('option');
    option.value = type.value;
    option.textContent = type.label;
    if (type.value === reagent.solventType) {
      option.selected = true;
    }
    solventTypeSelect.appendChild(option);
  });
  
  solventTypeSelect.addEventListener('change', (e) => {
    const newSolventType = e.target.value;
    let updatedReagent = {
      ...reagent,
      solventType: newSolventType,
      configured: true
    };
    
    if (newSolventType === 'water') {
      updatedReagent.signalWord = 'notAvailable';
      updatedReagent.ghsClass = 'zero';
      delete updatedReagent.solventName;
      
      // When water is selected, hide the solvent name field
      const solventNameField = reagentItem.querySelector('.solvent-name-field');
      if (solventNameField) {
        solventNameField.style.display = 'none';
      }
    } else {
      // Show the solvent name field for non-water solvents
      const solventNameField = reagentItem.querySelector('.solvent-name-field');
      if (solventNameField) {
        solventNameField.style.display = 'block';
      }
    }
    
    onUpdate(updatedReagent);
  });
  
  solventTypeGroup.appendChild(solventTypeSelect);
  formLayout.appendChild(solventTypeGroup);
  
  // 2. Solvent Name
  const solventNameGroup = document.createElement('div');
  solventNameGroup.className = 'reagent-form-group solvent-name-field';
  // Initially hide or show based on solvent type
  solventNameGroup.style.display = reagent.solventType === 'water' ? 'none' : 'block';
  
  const solventNameLabel = document.createElement('label');
  solventNameLabel.className = 'reagent-form-label';
  solventNameLabel.textContent = translate('Solvent Name');
  solventNameGroup.appendChild(solventNameLabel);
  
  const solventNameInput = document.createElement('input');
  solventNameInput.type = 'text';
  solventNameInput.className = 'form-control';
  solventNameInput.placeholder = translate('Enter specific solvent name (e.g., Methanol, HCl, NaOH)');
  solventNameInput.value = reagent.solventName || '';
  
  solventNameInput.addEventListener('change', (e) => {
    onUpdate({
      ...reagent,
      solventName: e.target.value,
      configured: true
    });
  });
  
  solventNameGroup.appendChild(solventNameInput);
  formLayout.appendChild(solventNameGroup);
  
  // SECOND ROW - Signal Word and GHS Classification
  // 3. Signal Word
  const signalWordGroup = document.createElement('div');
  signalWordGroup.className = 'reagent-form-group';
  
  const signalWordLabelContainer = document.createElement('div');
  signalWordLabelContainer.className = 'reagent-field-with-help';
  
  const signalWordLabel = document.createElement('label');
  signalWordLabel.className = 'reagent-form-label';
  signalWordLabel.textContent = translate('Signal Word');
  signalWordLabelContainer.appendChild(signalWordLabel);
  
  const signalWordHelp = document.createElement('span');
  signalWordHelp.className = 'reagent-help-icon';
  signalWordHelp.textContent = '?';
  signalWordHelp.title = translate('Signal words are "Warning" or "Danger" on GHS hazard labels');
  signalWordLabelContainer.appendChild(signalWordHelp);
  
  signalWordGroup.appendChild(signalWordLabelContainer);
  
  const signalWordSelect = document.createElement('select');
  signalWordSelect.className = 'form-control';
  
  const signalWords = [
    { value: 'warning', label: translate('Warning') },
    { value: 'danger', label: translate('Danger') },
    { value: 'notAvailable', label: translate('Not available') }
  ];
  
  signalWords.forEach(word => {
    const option = document.createElement('option');
    option.value = word.value;
    option.textContent = word.label;
    if (word.value === reagent.signalWord) {
      option.selected = true;
    }
    signalWordSelect.appendChild(option);
  });
  
  signalWordSelect.addEventListener('change', (e) => {
    const newSignalWord = e.target.value;
    let updatedReagent = {
      ...reagent,
      signalWord: newSignalWord,
      configured: true
    };
    
    // If signal word is set to "Not available", suggest setting GHS to "Zero pictograms"
    if (newSignalWord === 'notAvailable' && reagent.ghsClass !== 'zero') {
      if (confirm(translate('Signal Word is set to "Not available". Would you like to set GHS Classification to "Zero pictograms"?'))) {
        updatedReagent.ghsClass = 'zero';
      }
    }
    
    onUpdate(updatedReagent);
  });
  
  signalWordGroup.appendChild(signalWordSelect);
  formLayout.appendChild(signalWordGroup);
  
  // 4. GHS Classification
  const ghsClassGroup = document.createElement('div');
  ghsClassGroup.className = 'reagent-form-group';
  
  const ghsClassLabelContainer = document.createElement('div');
  ghsClassLabelContainer.className = 'reagent-field-with-help';
  
  const ghsClassLabel = document.createElement('label');
  ghsClassLabel.className = 'reagent-form-label';
  ghsClassLabel.textContent = translate('GHS Classification');
  ghsClassLabelContainer.appendChild(ghsClassLabel);
  
  const ghsClassHelp = document.createElement('span');
  ghsClassHelp.className = 'reagent-help-icon';
  ghsClassHelp.textContent = '?';
  ghsClassHelp.title = translate('Number of GHS hazard pictograms on the chemical\'s label');
  ghsClassLabelContainer.appendChild(ghsClassHelp);
  
  ghsClassGroup.appendChild(ghsClassLabelContainer);
  
  const ghsClassSelect = document.createElement('select');
  ghsClassSelect.className = 'form-control';
  
  const ghsClasses = [
    { value: 'zero', label: translate('Zero pictograms') },
    { value: 'one', label: translate('One pictogram') },
    { value: 'two', label: translate('Two pictograms') },
    { value: 'three', label: translate('Three or more pictograms') }
  ];
  
  ghsClasses.forEach(cls => {
    const option = document.createElement('option');
    option.value = cls.value;
    option.textContent = cls.label;
    if (cls.value === reagent.ghsClass) {
      option.selected = true;
    }
    ghsClassSelect.appendChild(option);
  });
  
  ghsClassSelect.addEventListener('change', (e) => {
    const newGhsClass = e.target.value;
    let updatedReagent = {
      ...reagent,
      ghsClass: newGhsClass,
      configured: true
    };
    
    // If GHS is set to "Zero pictograms", suggest setting Signal Word to "Not available"
    if (newGhsClass === 'zero' && reagent.signalWord !== 'notAvailable') {
      if (confirm(translate('GHS Classification is set to "Zero pictograms". Would you like to set Signal Word to "Not available"?'))) {
        updatedReagent.signalWord = 'notAvailable';
      }
    }
    
    onUpdate(updatedReagent);
  });
  
  ghsClassGroup.appendChild(ghsClassSelect);
  formLayout.appendChild(ghsClassGroup);
  
  // THIRD ROW - Volume Used
  // 5. Volume Used
  const volumeGroup = document.createElement('div');
  volumeGroup.className = 'reagent-form-group';
  volumeGroup.style.gridColumn = '1 / 3'; // Make it span 2 columns
  
  const volumeLabel = document.createElement('label');
  volumeLabel.className = 'reagent-form-label';
  volumeLabel.textContent = translate('Volume Used');
  volumeGroup.appendChild(volumeLabel);
  
  const volumeSelect = document.createElement('select');
  volumeSelect.className = 'form-control';
  
  const volumes = [
    { value: 'less1', label: translate('< 1 mL (g)') },
    { value: 'less10', label: translate('1-10 mL (g)') },
    { value: 'between10And100', label: translate('10.1-100 mL (g)') },
    { value: 'more100', label: translate('> 100 mL (g)') }
  ];
  
  volumes.forEach(volume => {
    const option = document.createElement('option');
    option.value = volume.value;
    option.textContent = volume.label;
    if (volume.value === reagent.volume) {
      option.selected = true;
    }
    volumeSelect.appendChild(option);
  });
  
  volumeSelect.addEventListener('change', (e) => {
    onUpdate({
      ...reagent,
      volume: e.target.value,
      configured: true
    });
  });
  
  volumeGroup.appendChild(volumeSelect);
  formLayout.appendChild(volumeGroup);
  
  reagentItem.appendChild(formLayout);
  
  return reagentItem;
}

function calculateReagentScore(reagent) {
  // If it's water, score is 100
  if (reagent.solventType === 'water' && reagent.ghsClass === 'zero') {
    return 100;
  }
  
  // Base score on GHS classification and signal word combination
  let baseScore = 0;
  
  if (reagent.ghsClass === 'zero') {
    baseScore = 100; // Zero pictograms
  } else if (reagent.ghsClass === 'one' && reagent.signalWord === 'warning') {
    // One pictogram + Warning
    switch (reagent.volume) {
      case 'less1': return 98;
      case 'less10': return 96;
      case 'between10And100': return 94;
      case 'more100': return 92;
    }
  } else if ((reagent.ghsClass === 'one' && reagent.signalWord === 'danger') || 
            (reagent.ghsClass === 'two' && reagent.signalWord === 'warning')) {
    // One pictogram + Danger OR Two pictograms + Warning
    switch (reagent.volume) {
      case 'less1': return 90;
      case 'less10': return 85;
      case 'between10And100': return 80;
      case 'more100': return 75;
    }
  } else if (reagent.ghsClass === 'two' && reagent.signalWord === 'danger') {
    // Two pictograms + Danger
    switch (reagent.volume) {
      case 'less1': return 70;
      case 'less10': return 65;
      case 'between10And100': return 60;
      case 'more100': return 55;
    }
  } else if (reagent.ghsClass === 'three') {
    // Three or more pictograms + Danger
    switch (reagent.volume) {
      case 'less1': return 50;
      case 'less10': return 45;
      case 'between10And100': return 40;
      case 'more100': return 35;
    }
  }
  
  return baseScore;
}