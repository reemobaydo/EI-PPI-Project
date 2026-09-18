import { Header } from './Header.js';
import { Footer } from './Footer.js';
import { SamplePreparationForm } from './forms/SamplePreparationForm.js';
import { InstrumentationForm } from './forms/InstrumentationForm.js';
import { ReagentForm } from './forms/ReagentForm.js';
import { WasteForm } from './forms/WasteForm.js';
import { PracticalityForm } from './forms/PracticalityForm.js';
// Using SimpleResults component instead
import { SimpleResults } from './SimpleResults.js';
// import { Results } from './Results.js';
// import { Visualization } from './Visualization.js';
import { SavedCalculations } from './SavedCalculations.js';
import { calculateTotalEIScore } from '../utils/calculations.js';
import { saveToDB, getCalculations, getCalculationById, deleteCalculation } from '../utils/database.js';
import { generatePDF } from '../utils/pdf.js';
import { generateExcel } from '../utils/excel.js';
import { translate, setLanguage, getCurrentLanguage } from '../utils/i18n.js';
import { createTabWatermark } from '../utils/tab-watermarks.js';
import { createCoxcombChart } from '../utils/charts.js';
import { 
  showLoader, 
  animateTabTransition,
  createPageTransition, 
  createReactionAnimation,
  showLoadingWithFacts
} from '../utils/animations.js';
import { showTabLoader } from '../utils/analytical-animations.js';
// Reuse same CDN version used in excel.js to keep rendering consistent.
const HTML2CANVAS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';

/** Ensure html2canvas is available (idempotent). */
async function ensureHtml2Canvas() {
  if (window.html2canvas) return;
  await new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${HTML2CANVAS_URL}"]`);
    if (existing) {
      existing.addEventListener('load', resolve, { once:true });
      existing.addEventListener('error', () => reject(new Error('html2canvas load error')), { once:true });
      return;
    }
    const s = document.createElement('script');
    s.src = HTML2CANVAS_URL;
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error('html2canvas load error'));
    document.head.appendChild(s);
  });
}

const instrumentationPng = new URL('../../assets/instrumentation.png', import.meta.url).href;
const samplePrepPng      = new URL('../../assets/samplePrep.png', import.meta.url).href;
const reagentsPng        = new URL('../../assets/reagents.png', import.meta.url).href;
const eiIndexPng         = new URL('../../assets/eiIndex.png', import.meta.url).href;
const ppIndexPng         = new URL('../../assets/ppIndex.png', import.meta.url).href;

// Export results as PDF
async function exportAsPDF() {
  calculateScores();
  const hideLoader = showLoader(translate('Generating PDF report...'));
  try {
    await generatePDF(state);
    showToast(translate('PDF created'), 'success');
  } catch (e) {
    console.error(e);
    showToast(translate('Error generating PDF file'), 'error');
  } finally {
    hideLoader();
  }
}

// Export results as Excel
async function exportAsExcel() {
  calculateScores();
  const hideLoader = showLoadingWithFacts(document.body);
  try {
    await generateExcel(state);
    showToast(translate('Excel created'), 'success');
  } catch (e) {
    console.error(e);
    showToast(translate('Error generating Excel file'), 'error');
  } finally {
    hideLoader();
  }
}


/*──────────────────────────────────────────────────────────────*/
/*  Toast + Modal helpers (plain JS, no external libs)          */
/*──────────────────────────────────────────────────────────────*/
function showToast(msg, type = 'info', ms = 4500) {
  const t = Object.assign(document.createElement('div'), {
    className: `eppi-toast eppi-toast-${type}`,
    textContent: msg
  });
  document.body.appendChild(t);
  requestAnimationFrame(() => (t.style.opacity = '1'));
  setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 300);
  }, ms);
}

function showModal({ title = '', message = '', showInput = false,
                     defaultValue = '', okText = translate('OK'),
                     cancelText = translate('Cancel') }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'eppi-modal-overlay';

    const box = document.createElement('div');
    box.className = 'eppi-modal';
    box.innerHTML = `<h3>${title}</h3><p>${message}</p>`;
    overlay.appendChild(box);

    let input;
    if (showInput) {
      input = document.createElement('input');
      input.className = 'eppi-modal-input';
      input.value = defaultValue;
      box.appendChild(input);
      input.focus();
    }

    const row = document.createElement('div');
    row.className = 'eppi-modal-btnrow';
    box.appendChild(row);

    const btnCancel = document.createElement('button');
    btnCancel.className = 'btn btn-secondary';
    btnCancel.textContent = cancelText;
    btnCancel.onclick = () => close(null);

    const btnOk = document.createElement('button');
    btnOk.className = 'btn btn-primary';
    btnOk.textContent = okText;
    btnOk.onclick = () => close(showInput ? input.value.trim() : true);

    row.append(btnCancel, btnOk);
    document.body.appendChild(overlay);

    function close(result) {
      overlay.classList.add('eppi-modal-hide');
      setTimeout(() => overlay.remove(), 200);
      resolve(result);
    }
  });
}

function showPrompt(msg, defVal = '') {
  return showModal({
    title: translate('Input'),
    message: msg,
    showInput: true,
    defaultValue: defVal,
    okText: translate('Save')
  });
}

function showConfirm(msg) {
  return showModal({
    title: translate('Please confirm'),
    message: msg,
    okText: translate('Yes'),
    cancelText: translate('No')
  });
}

/*── inject minimal styling once ──*/
if (!document.getElementById('eppi-toast-style')) {
  const style = document.createElement('style');
  style.id = 'eppi-toast-style';
  style.textContent = `
.eppi-toast{
  position:fixed;top:1rem;right:1rem;min-width:220px;padding:.75rem 1rem;
  background:#333;border-radius:6px;color:#fff;font-size:.9rem;opacity:0;
  transition:opacity .3s ease;z-index:9999;pointer-events:none}
.eppi-toast-success{background:#28a745}.eppi-toast-error{background:#dc3545}
.eppi-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);
  display:flex;align-items:center;justify-content:center;z-index:9998;
  animation:fadeIn .2s ease forwards}
.eppi-modal-hide{animation:fadeOut .2s ease forwards}
.eppi-modal{background:#fff;border-radius:8px;padding:1.25rem;max-width:340px;
  width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.15)}
.eppi-modal-input{width:100%;padding:.5rem .75rem;margin:.8rem 0;
  border:1px solid #ccc;border-radius:4px}
.eppi-modal-btnrow{display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes fadeOut{from{opacity:1}to{opacity:0}}
`;
  document.head.appendChild(style);
}

export function renderApp(container) {
  let currentTab = 'samplePrep';
  let calculationId = null;
  
  // Initial state for all forms
  const state = {
    samplePrep: {
      // 1.1 Pre-synthesis
      preSynthesis: 'no',
      yield: 'high',
      temperature: 'room',
      purification: false,
      energyConsumption: false,
      nonGreenSolvent: false,
      occupationalHazard: false,
      // 1.2 Sampling required
      instrumentRequirements: 'none',
      // 1.3 Type of sample and sample efficiency
      sampleType: 'simple',
      // 1.4 Sample throughput
      sampleThroughput: 'moderate', // neutral (0) by default, so the score never starts with a hidden +5 the user never chose
      // 1.5 Extraction procedure
      extractionNeeded: 'no',
      solventType: 'complete',
      solventVolume: 'less0.1',
      adsorbentNature: 'renewable',
      adsorbentAmount: 'less0.5',
      // 1.6 Other conditions
      derivatization: false,
      automatedPreparation: false,
      inSituPreparation: true,
      offline: false
    },
    instrumentation: {
      energy: 'non',
      vaporEmission: false,
      nonAutomated: 'automated',
      notMultianalyte: false,
      miniaturized: false
    },
    reagents: [
      {
        id: 'reagent_' + Date.now(),
        solventType: 'organic',
        signalWord: 'notAvailable',
        ghsClass: 'zero',
        volume: 'less1'
      }
    ], // Starts with one reagent card ready to fill in; "Add Another Solvent" appends more of {solventType, signalWord, ghsClass, volume}
    waste: {
      volume: 'less1',
      biodegradable: true,
      treatment: 'less10'  // Default changed from 'none' to 'less10' since we removed 'noModification'
    },
    practicality: {
    natureOfMethod:'quantitative',
    designOfExperiment: 'factorial',
    aiIntegration: 'advanced',
    validation: 'full',
    sensitivity: 'picogram',
    reagentAvailability: 'low',
    instrCost: 'all_low',
    maintenance: 'long',
    throughput: 'high',
    reusability: 'yes'
    },
    scores: {
      samplePrep: 0,
      instrumentation: 0,
      reagent: 0,
      waste: 0,
      eiIndex: 0,
      practicality: 0,
      total: 0
    },
    colorClass: 'result-good'
  };
  
  // Render the application
  function render() {
    container.innerHTML = '';
    
    // Create the app structure
    const appContainer = document.createElement('div');
    appContainer.className = 'container';
    
    // Render header
    appContainer.appendChild(Header());
    
    // Create the main content area
    const mainContent = document.createElement('main');
    mainContent.className = 'main-content';
    
    // Create the main tab navigation (with sections)
    const tabNav = document.createElement('div');
    tabNav.className = 'tabs main-tabs';
    
    // Define SVG icons for tabs
    const tabIcons = {
  instrumentation: `<img src="${instrumentationPng}" width="20" height="20" alt="Instrumentation" />`,
  samplePrep:      `<img src="${samplePrepPng}"   width="20" height="20" alt="Sample Prep" />`,
  reagent:         `<img src="${reagentsPng}"     width="20" height="20" alt="Reagents" />`,
  eiIndex:         `<img src="${eiIndexPng}"      width="20" height="20" alt="EI Index" />`,
  practicality:    `<img src="${ppIndexPng}"      width="20" height="20" alt="PP Index" />`,
      waste: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
      results: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
      saved: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>`
    };
  
    // Define the main sections
    const mainSections = [
      { 
        id: 'eiIndex', 
        label: translate('Environmental Index (EI)'),
        icon: tabIcons.eiIndex,
        subTabs: [
          { id: 'samplePrep', label: translate('Sample Preparation'), icon: tabIcons.samplePrep },
          { id: 'instrumentation', label: translate('Instrumentation'), icon: tabIcons.instrumentation },
          { id: 'reagent', label: translate('Reagents'), icon: tabIcons.reagent },
          { id: 'waste', label: translate('Waste'), icon: tabIcons.waste }
        ]
      },
      { 
        id: 'practicality', 
        label: translate('Performance Practicality Index (PPI)'),
        icon: tabIcons.practicality,
        subTabs: [
          { id: 'practicality', label: translate('Performance Practicality Index (PPI) Criteria'), icon: tabIcons.practicality }
        ]
      },
      { 
        id: 'results', 
        label: translate('Results'),
        icon: tabIcons.results,
        subTabs: [
          { id: 'results', label: translate('Results'), icon: tabIcons.results },
          { id: 'saved', label: translate('Saved Calculations'), icon: tabIcons.saved }
        ]
      }
    ];
    
    // Check if we're in a main section or one of its sub-tabs
    const getCurrentMainSection = (currentTab) => {
      for (const section of mainSections) {
        if (section.id === currentTab) return section.id;
        for (const subTab of section.subTabs) {
          if (subTab.id === currentTab) return section.id;
        }
      }
      return 'eiIndex'; // Default
    };
    
    // Get current active main section
    const currentMainSection = getCurrentMainSection(currentTab);
    
    // Create containers for the three tab positions (left, center, right)
    const leftTabContainer = document.createElement('div');
    const centerTabContainer = document.createElement('div');
    const rightTabContainer = document.createElement('div');
    
    // Add styling to each container
    leftTabContainer.style.textAlign = 'left';
    centerTabContainer.style.textAlign = 'center';
    rightTabContainer.style.textAlign = 'right';
    
    // Create the main section tabs and place them in the appropriate container
    mainSections.forEach((section, index) => {
      const tabElement = document.createElement('div');
      const isActive = currentMainSection === section.id;
      tabElement.className = `tab main-tab tab-${section.id} ${isActive ? 'active' : ''}`;
      
      // Create icon element
      const iconSpan = document.createElement('span');
      iconSpan.className = 'tab-icon';
      iconSpan.innerHTML = section.icon;
      
      // Create label element
      const labelSpan = document.createElement('span');
      labelSpan.className = 'tab-label';
      labelSpan.textContent = section.label;
      
      // Add icon and label to tab
      tabElement.appendChild(iconSpan);
      tabElement.appendChild(labelSpan);
      
      // Add click event listener with animation
      tabElement.addEventListener('click', () => {
        // Don't do anything if already on this main section
        if (currentMainSection === section.id) return;
        
        // Add animation class based on index position
        const animationClass = index === 0 ? 'slide-in-left' : 
                               index === 1 ? 'fade-in' : 'slide-in-right';
        
        // Get current active tab element to animate out
        const activeTabContent = document.querySelector('.tab-content');
        
        // Save the new tab we're switching to
        const newTab = section.subTabs[0].id;
        
        // Create an overlay for the transition effect
        const transitionOverlay = document.createElement('div');
        transitionOverlay.className = 'tab-transition-overlay';
        transitionOverlay.style.position = 'fixed';
        transitionOverlay.style.top = '0';
        transitionOverlay.style.left = '0';
        transitionOverlay.style.width = '100%';
        transitionOverlay.style.height = '100%';
        transitionOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        transitionOverlay.style.zIndex = '1000';
        transitionOverlay.style.opacity = '0';
        transitionOverlay.style.transition = 'opacity 0.3s ease';
        document.body.appendChild(transitionOverlay);
        
        // Fade in overlay
        setTimeout(() => {
          transitionOverlay.style.opacity = '1';
          
          // After overlay is visible, update tab and re-render
          setTimeout(() => {
            currentTab = newTab;
            render();
            
            // After rendering, find the new tab content
            const newTabContent = document.querySelector('.tab-content');
            if (newTabContent) {
              // Add the animation class
              newTabContent.classList.add(animationClass);
              
              // Ensure watermark is applied
              createTabWatermark(newTabContent, currentTab);
              
              // Remove the overlay
              setTimeout(() => {
                transitionOverlay.style.opacity = '0';
                setTimeout(() => {
                  if (document.body.contains(transitionOverlay)) {
                    document.body.removeChild(transitionOverlay);
                  }
                }, 300);
              }, 300);
            }
          }, 200);
        }, 10);
      });
      
      // Place tab in appropriate container based on index
      if (index === 0) {
        leftTabContainer.appendChild(tabElement);
      } else if (index === 1) {
        centerTabContainer.appendChild(tabElement);
      } else {
        rightTabContainer.appendChild(tabElement);
      }
    });
    
    // Add the containers to the tab navigation
    tabNav.appendChild(leftTabContainer);
    tabNav.appendChild(centerTabContainer);
    tabNav.appendChild(rightTabContainer);
    
    // Append the main tabs to the main content
    mainContent.appendChild(tabNav);
    
    // Only display sub-tabs for the active main section
    const activeSection = mainSections.find(section => section.id === currentMainSection);
    if (activeSection && activeSection.subTabs.length > 0) {
      const subTabNav = document.createElement('div');
      subTabNav.className = 'tabs sub-tabs';
      
      activeSection.subTabs.forEach(tab => {
        const tabElement = document.createElement('div');
        tabElement.className = `tab sub-tab tab-${tab.id} ${currentTab === tab.id ? 'active' : ''}`;
        
        // Create icon element
        const iconSpan = document.createElement('span');
        iconSpan.className = 'tab-icon';
        iconSpan.innerHTML = tab.icon;
        
        // Create label element
        const labelSpan = document.createElement('span');
        labelSpan.className = 'tab-label';
        labelSpan.textContent = tab.label;
        
        // Add icon and label to tab
        tabElement.appendChild(iconSpan);
        tabElement.appendChild(labelSpan);
        tabElement.addEventListener('click', () => {
          // Don't do anything if already on this tab
          if (currentTab === tab.id) return;
          
          // Get current active tab element
          const activeTabContent = document.querySelector('.tab-content');
          
          // Save the new tab we're switching to
          const newTab = tab.id;
          
          // Use tab transition animation for a smooth effect
          if (activeTabContent) {
            // Create a small pulse effect on the clicked tab
            tabElement.classList.add('tab-pulse');
            
            // Use the animateTabTransition function
            animateTabTransition(activeTabContent, null, () => {
              // After fade out, update tab and re-render
              currentTab = newTab;
              render();
              
              // After rendering, find the new tab content
              const newTabContent = document.querySelector('.tab-content');
              if (newTabContent) {
                // Add fade-in class for animation
                newTabContent.classList.add('fade-in');
                
                // Ensure watermark is applied
                createTabWatermark(newTabContent, currentTab);
                
                // Remove animation class after animation completes
                setTimeout(() => {
                  newTabContent.classList.remove('fade-in');
                  // Remove pulse from tab
                  tabElement.classList.remove('tab-pulse');
                }, 500);
              }
            });
          } else {
            // Fallback if no animation possible
            currentTab = newTab;
            render();
            
            // Ensure watermark is applied after tab switch
            const tabContent = document.querySelector('.tab-content');
            if (tabContent) {
              createTabWatermark(tabContent, currentTab);
            }
          }
        });
        subTabNav.appendChild(tabElement);
      });
      
      // Append sub-tabs after main tabs
      mainContent.appendChild(subTabNav);
    }
    
    // Tab content container
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content active';
    
    // Add the tab-specific watermark
    createTabWatermark(tabContent, currentTab);
    
    // Render the active tab - force update with timestamp
    const timestamp = Date.now(); // Force re-rendering
    // …inside renderApp(), *below* calculateScores() but before the switch block
const exportCoxcombPNG = async () => {
  calculateScores();                    // now resolves correctly

  const hideLoader = showLoader(translate('Generating Coxcomb PNG…'));
  try {
    await ensureHtml2Canvas();

    // off‑screen host
    const tmpHost = Object.assign(document.createElement('div'), {
      style: 'position:absolute;top:-9999px;left:-9999px;pointer-events:none'
    });
    document.body.appendChild(tmpHost);

    // build chart with fresh scores
    const cox = createCoxcombChart({
      samplePrep:      state.scores.samplePrep,
      instrumentation: state.scores.instrumentation,
      reagent:         state.scores.reagent,
      waste:           state.scores.waste,
      practicality:    state.scores.practicality
    });
    tmpHost.appendChild(cox);

    const canvas  = await window.html2canvas(cox, { backgroundColor:'#fff', scale:3 });
    const a       = document.createElement('a');
    a.href        = canvas.toDataURL('image/png');
    a.download    = `Coxcomb_${new Date().toISOString().slice(0,10)}.png`;
    a.click();

    showToast(translate('Coxcomb PNG created'), 'success');
  } catch (err) {
    console.error('[exportCoxcombPNG] failed:', err);
    showToast(translate('Error generating Coxcomb PNG'), 'error');
  } finally {
    hideLoader();
  }
};

 switch (currentTab) {
  case 'samplePrep':
    calculateScores(); // ← recompute all five component scores
    tabContent.appendChild(
      SamplePreparationForm(
        state.samplePrep,
        handleSamplePrepChange,
        state.scores // ← now contains { samplePrep, instrumentation, reagent, waste, practicality, … }
      )
    );
    break;

  case 'instrumentation':
    console.log(`Rendering Instrumentation Form (${timestamp})`);
    calculateScores();
    tabContent.appendChild(
      InstrumentationForm(
        state.instrumentation,
        handleInstrumentationChange,
        state.scores // ← pass scores here
      )
    );
    break;

  case 'reagent':
    console.log(`Rendering Reagent Form (${timestamp})`);
    calculateScores();
    tabContent.appendChild(
      ReagentForm(
        state.reagents,
        handleReagentChange,
        state.scores // ← pass the current scores object here
      )
    );
    break;

  case 'waste':
    console.log(`Rendering Waste Form (${timestamp})`);
    calculateScores();
    tabContent.appendChild(
      WasteForm(
        state.waste,
        handleWasteChange,
        state.scores // ← pass scores here
      )
    );
    break;

  case 'practicality':
    console.log(`Rendering Performance Practicality Index (PPI) Form (${timestamp})`);
    calculateScores();
    tabContent.appendChild(
      PracticalityForm(
        state.practicality,
        handlePracticalityChange,
        state.scores // ← pass scores here
      )
    );
    break;
      case 'results':
        try {
          console.log("Calculating scores for Results tab");
          calculateScores();
          console.log("Scores calculated:", JSON.stringify(state.scores));
          
          // Use the completely rewritten SimpleResults component
          console.log("Creating SimpleResults component with scores:", state.scores);
          tabContent.appendChild(SimpleResults(state.scores));
        } catch (error) {
          console.error("Error rendering Results tab:", error);
          
          // If there's an error, display a simple error message
          const errorDiv = document.createElement('div');
          errorDiv.style.padding = '20px';
          errorDiv.style.color = '#721c24';
          errorDiv.style.backgroundColor = '#f8d7da';
          errorDiv.style.border = '1px solid #f5c6cb';
          errorDiv.style.borderRadius = '5px';
          errorDiv.style.marginTop = '20px';
          
          const errorTitle = document.createElement('h3');
          errorTitle.textContent = translate('Results Display Issue');
          errorDiv.appendChild(errorTitle);
          
          const errorMsg = document.createElement('p');
          errorMsg.textContent = translate('There was a problem displaying the results. Please try again.');
          errorDiv.appendChild(errorMsg);
          
          tabContent.appendChild(errorDiv);
        }
        
        // Add export and save buttons
        const actionButtons = document.createElement('div');
        actionButtons.className = 'action-buttons';
        actionButtons.style.marginTop = '20px';
        
        const saveButton = document.createElement('button');
        saveButton.className = 'btn btn-primary';
        saveButton.textContent = translate('Save Calculation');
        saveButton.addEventListener('click', saveCalculation);
        actionButtons.appendChild(saveButton);
        
        // PDF Export button
        const pdfButton = document.createElement('button');
        pdfButton.className = 'btn btn-success';
        pdfButton.style.marginLeft = '10px';
        pdfButton.textContent = translate('Export as PDF');
        pdfButton.addEventListener('click', exportAsPDF);
        actionButtons.appendChild(pdfButton);
        
        // Excel Export button
        const excelButton = document.createElement('button');
        excelButton.className = 'btn btn-info';
        excelButton.style.marginLeft = '10px';
        excelButton.textContent = translate('Export as Excel');
        excelButton.addEventListener('click', exportAsExcel);
        actionButtons.appendChild(excelButton);
        // PNG Export button (Coxcomb only)
const pngButton = document.createElement('button');
pngButton.className = 'btn btn-warning'; // or custom class if you prefer
pngButton.style.marginLeft = '10px';
pngButton.textContent = translate('Export Coxcomb as PNG');
pngButton.addEventListener('click', exportCoxcombPNG);
actionButtons.appendChild(pngButton);

        tabContent.appendChild(actionButtons);
        break;

      case 'saved':
        tabContent.appendChild(SavedCalculations(loadSavedCalculations, handleLoadCalculation, handleDeleteCalculation));
        break;
    }
    
    mainContent.appendChild(tabContent);
    appContainer.appendChild(mainContent);
    
    // Render footer
    appContainer.appendChild(Footer());
    
    container.appendChild(appContainer);
    
    // Initialize icons
    if (window.feather) {
      window.feather.replace();
    }
  }
  
  // Event handlers for form changes
  function handleSamplePrepChange(field, value) {
    state.samplePrep[field] = value;
    render();
  }
  
  function handleInstrumentationChange(field, value) {
    state.instrumentation[field] = value;
    render();
  }
  
  function handleReagentChange(reagents) {
    state.reagents = reagents;
    render();
  }
  
  function handleWasteChange(field, value) {
    state.waste[field] = value;
    render();
  }
  
  function handlePracticalityChange(field, value) {
    state.practicality[field] = value;
    render();
  }
  
  // Calculate all scores
  function calculateScores() {
    // Import calculation function and compute scores
    state.scores = calculateTotalEIScore(state.samplePrep, state.instrumentation, state.reagents, state.waste, state.practicality);
    
    // Set color class based on the Environmental Index (EI) score (not total score)
    // Updated with new thresholds: 90-100 (Dark Green), <90-85 (Light Green), <85-65 (Yellow), <65 (Red)
    if (state.scores.eiIndex >= 90) {
      state.colorClass = 'result-ideal'; // Dark Green - Ideal Green Method
    } else if (state.scores.eiIndex >= 85) {
      state.colorClass = 'result-good'; // Light Green - Environmentally sustainable
    } else if (state.scores.eiIndex >= 65) {
      state.colorClass = 'result-medium'; // Yellow - Considerable Impact
    } else {
      state.colorClass = 'result-bad'; // Red - Serious Impact
    }
    
    // Set practicality color class based on practicality score
    if (state.scores.practicality >= 75) {
      state.practicalityColorClass = 'practicality-excellent';
    } else if (state.scores.practicality >= 50) {
      state.practicalityColorClass = 'practicality-acceptable';
    } else {
      state.practicalityColorClass = 'practicality-impractical';
    }
  }
    // ────────────────────────────────────────────────────────────────
  // Save current calculation to database  (modernised)
  // ────────────────────────────────────────────────────────────────
  async function saveCalculation() {
    calculateScores();

    const defaultName =
      translate('Calculation') + ' ' + new Date().toLocaleString();
    const name = await showPrompt(
      translate('Enter a name for this calculation:'),
      defaultName
    );
    if (!name) return; // user cancelled

    const calculation = {
      date: new Date().toISOString(),
      name,
      data: {
        samplePrep: { ...state.samplePrep },
        instrumentation: { ...state.instrumentation },
        reagents: [...state.reagents],
        waste: { ...state.waste },
        practicality: { ...state.practicality },
        scores: { ...state.scores }
      }
    };

    const hideLoader = showLoader(translate('Saving calculation...'));

    try {
      await saveToDB(calculation);
      hideLoader();

      // Success animation + toast
      const tabContent = document.querySelector('.tab-content');
      if (tabContent) {
        createReactionAnimation(tabContent, () =>
          showToast(translate('Calculation saved successfully!'), 'success')
        );
      } else {
        showToast(translate('Calculation saved successfully!'), 'success');
      }
    } catch (error) {
      hideLoader();
      console.error('Error saving calculation:', error);
      showToast(translate('Error saving calculation'), 'error');
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Load saved calculations (unchanged)
  // ────────────────────────────────────────────────────────────────
  async function loadSavedCalculations() {
    try {
      return await getCalculations();
    } catch (error) {
      console.error('Error loading calculations:', error);
      return [];
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Load a specific calculation  (toast on error)
  // ────────────────────────────────────────────────────────────────
  async function handleLoadCalculation(id) {
    try {
      const calculation = await getCalculationById(id);
      if (!calculation) return;

      state.samplePrep       = { ...calculation.data.samplePrep };
      state.instrumentation  = { ...calculation.data.instrumentation };
      state.reagents         = [...calculation.data.reagents];
      state.waste            = { ...calculation.data.waste };
      if (calculation.data.practicality) {
        state.practicality   = { ...calculation.data.practicality };
      }
      state.scores           = { ...calculation.data.scores };
      calculationId          = id;
      currentTab             = 'results';
      render();

      const tabContent = document.querySelector('.tab-content');
      tabContent && createTabWatermark(tabContent, 'results');
    } catch (error) {
      console.error('Error loading calculation:', error);
      showToast(translate('Error loading calculation'), 'error');
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Delete a calculation  (modern confirm + toast feedback)
  // ────────────────────────────────────────────────────────────────
  async function handleDeleteCalculation(id) {
    try {
      const ok = await showConfirm(
        translate('Are you sure you want to delete this calculation?')
      );
      if (!ok) return;

      await deleteCalculation(id);
      render();
      showToast(translate('Calculation deleted'), 'success');
    } catch (error) {
      console.error('Error deleting calculation:', error);
      showToast(translate('Error deleting calculation'), 'error');
    }
  }

  // Export results as PDF
  async function exportAsPDF() {
    calculateScores();
    const hideLoader = showLoader(translate('Generating PDF report...'));
    
    try {
      await generatePDF(state);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(translate('Error generating PDF file'));
    } finally {
      hideLoader();
    }
  }
  
  // Export results as Excel
  async function exportAsExcel() {
    calculateScores();
    const hideLoader = showLoadingWithFacts(document.body);
    
    try {
      await generateExcel(state);
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert(translate('Error generating Excel file'));
    } finally {
      hideLoader();
    }
  }
  
  // Register event listeners for menu items
  window.api.onMenuSaveCalculation(() => {
    if (currentTab !== 'results') {
      currentTab = 'results';
      render();
    }
    setTimeout(saveCalculation, 100);
  });
  
  window.api.onMenuLoadCalculation(() => {
    currentTab = 'saved';
    render();
  });
  
  window.api.onMenuExportPDF(() => {
    if (currentTab !== 'results') {
      currentTab = 'results';
      render();
    }
    setTimeout(exportAsPDF, 100);
  });
  
if (window.api?.onMenuExportCoxcombPNG) {
  window.api.onMenuExportCoxcombPNG(() => {
    if (currentTab !== 'results') {
      currentTab = 'results';
      render();
    }
    setTimeout(exportCoxcombPNG, 100);
  });
}

  
  window.api.onMenuAbout(() => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    
    const title = document.createElement('h3');
    title.textContent = 'About Environmental, Practicality, and Performance Index (EPPI)(EI & PPI)';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modalHeader.appendChild(title);
    modalHeader.appendChild(closeBtn);
    
    const modalBody = document.createElement('div');
    modalBody.innerHTML = `
      <p>The Environmental, Practicality, and Performance Index (EPPI)(EI & PPI) is a tool for assessing both the environmental sustainability and practical applicability of analytical chemistry methods.</p>
      <p>The Environmental, Practicality, and Performance Index (EPPI)(EI & PPI) consists of two main components:</p>
      <h4>Environmental Index (EI) (50% of total score)</h4>
      <ul>
        <li><strong>Sample Preparation</strong>: Evaluates the environmental friendliness and efficiency of sample preparation.</li>
        <li><strong>Instrumentation</strong>: Assesses the sustainability of analytical instruments.</li>
        <li><strong>Reagent</strong>: Evaluates the environmental impact of solvents and chemicals used.</li>
        <li><strong>Waste</strong>: Measures the impact of waste generation and management.</li>
      </ul>
      <p>A higher Environmental Index (EI) score (0-100) reflects a greener and more environmentally sustainable analytical method:</p>
      <ul>
        <li>90-100: Ideal Green Method</li>
        <li>&lt;90-85: Environmentally sustainable with Minimal Impact</li>
        <li>&lt;85-65: Acceptable green</li>
        <li>&lt;65: Unsustainable method with Serious Impact</li>
      </ul>
      
      <h4>Performance Practicality Index (PPI) (50% of total score)</h4>
      <p>Evaluates method practicality through criteria including method nature, validation, sensitivity, and costs.</p>
      <p>A higher Performance Practicality Index (PPI) score (0-100) indicates better real-world applicability:</p>
      <ul>
        <li>75-100: Excellent Performance Practicality Index (PPI) – Highly applicable and efficient</li>
        <li>50-74: Acceptable Performance Practicality Index (PPI) – Viable with moderate optimization</li>
        <li>&lt;50: Impractical – Limited real-world feasibility, needs improvement</li>
      </ul>
      
      <h4>EIPI Total Score</h4>
      <p>EIPI Total Score = (EI score × 0.5) + (PI × 0.5)</p>
      <p>Significance of total EIPI score:</p>
      <ul>
        <li>75-100: Green and practical efficient method</li>
        <li>Less than 75-50: Acceptable</li>
        <li>Less than 50: Non green and impractical</li>
      </ul>
      
      <p>Version 2.0.0</p>
    `;
    
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
  });
  
  // Initial render
  render();
  
  return {
    render
  };
}
