// This file contains all the calculation logic for the EI scale
export function calculateTotalEIScore(samplePrep, instrumentation, reagents, waste, practicality) {
  // Calculate all component scores
  const samplePrepScore = calculateSamplePrepScore(samplePrep);
  const instrumentationScore = calculateInstrumentationScore(instrumentation);
  const reagentScore = calculateReagentScore(reagents);
  const wasteScore = calculateWasteScore(waste);
  
  // Calculate Environmental Index (EI) score (SIRW)
  // Environmental Index (EI) = (Sample preparation score + Reagent score + Instrumentation score + Waste score) / 4
  const eiIndexScore = (samplePrepScore + instrumentationScore + reagentScore + wasteScore) / 4;
  
  // Calculate Performance Practicality Index (PPI) score if available
  let practicalityScore = 0;
  if (practicality) {
    practicalityScore = calculatePracticalityScore(practicality);
  }
  
  // Calculate base EPPI Score: 50% Environmental Index (EI) + 50% Performance Practicality Index (PPI) (new formula)
  let totalScore = (eiIndexScore * 0.5) + (practicalityScore * 0.5);
  
  // Ensure total score is between 0 and 100
  totalScore = Math.min(100, Math.max(0, totalScore));
  
  // Format scores with one decimal place
  return {
    samplePrep: parseFloat(samplePrepScore.toFixed(1)),
    instrumentation: parseFloat(instrumentationScore.toFixed(1)),
    reagent: parseFloat(reagentScore.toFixed(1)),
    waste: parseFloat(wasteScore.toFixed(1)),
    eiIndex: parseFloat(eiIndexScore.toFixed(1)),
    practicality: parseFloat(practicalityScore.toFixed(1)),
    total: parseFloat(totalScore.toFixed(1))
  };
}

// Function to calculate Sample Preparation Score
// Function to calculate Sample Preparation Score
export function calculateSamplePrepScore(samplePrep) {
  const norm = v => (v || '').toString().trim().toLowerCase();
samplePrep.solventType = norm(samplePrep.solventType);

  // Main components scores
  let preSynthesisScore = 0;
  let samplingRequiredScore = 0;
  let extractionProcedureScore = 0;
  let otherConditionsScore = 0;

  // (1) Pre-synthesis
  if (samplePrep.preSynthesis === 'no') {
    preSynthesisScore = 100;
  } else {
    preSynthesisScore = 75;

    // Yield modifiers
    if (samplePrep.yield === 'high') {
      preSynthesisScore += 10;
    } else if (samplePrep.yield === 'moderate') {
      preSynthesisScore += 5;
    } else if (samplePrep.yield === 'low') {
      preSynthesisScore -= 5;
    }

    // Temperature modifiers
    if (samplePrep.temperature === 'high') {
      preSynthesisScore -= 10;
    } else if (samplePrep.temperature === 'room') {
      preSynthesisScore -= 5;
    } else if (samplePrep.temperature === 'low') {
      preSynthesisScore += 5;
    }

    // Purification, energy, solvent, hazard modifiers
    if (samplePrep.purification) {
  preSynthesisScore -= 5;
} else {
  preSynthesisScore += 5;      // add +5 when no purification is needed
}

    if (samplePrep.energyConsumption) preSynthesisScore -= 5;
    else                               preSynthesisScore += 5;
    if (samplePrep.nonGreenSolvent)   preSynthesisScore -= 5;
    else                               preSynthesisScore += 5;
    if (samplePrep.occupationalHazard) preSynthesisScore -= 5;
    else                                preSynthesisScore += 5;
  }

  // (2) Sampling procedure
  if (samplePrep.instrumentRequirements === 'none') {
    samplingRequiredScore = 100;
  } else if (samplePrep.instrumentRequirements === 'minimal') {
    samplingRequiredScore = 90;
  } else if (samplePrep.instrumentRequirements === 'moderate') {
    samplingRequiredScore = 80;
  } else if (samplePrep.instrumentRequirements === 'extensive') {
    samplingRequiredScore = 70;
  }

  // (3) Extraction procedure
  if (samplePrep.extractionNeeded === 'no') {
    extractionProcedureScore = 100;
  } else {
    extractionProcedureScore = 70;

    // Solvent type
// normalise once near the top of calculateSamplePrepScore
samplePrep.solventType = norm(samplePrep.solventType);

// corrected test
if      (samplePrep.solventType === 'complete')  extractionProcedureScore += 10;
else if (samplePrep.solventType === 'partial')   extractionProcedureScore += 5;
else if (samplePrep.solventType === 'nongreen')  extractionProcedureScore -= 10;



    // Amount of solvent
    if (samplePrep.solventVolume === 'less0.1') {
      extractionProcedureScore += 10;
    } else if (samplePrep.solventVolume === '0.1to1') {
      extractionProcedureScore += 5;
    } else if (samplePrep.solventVolume === '1to10') {
      extractionProcedureScore -= 5;
    } else if (samplePrep.solventVolume === 'more10') {
      extractionProcedureScore -= 10;
    }

    // Adsorbent nature
    if (samplePrep.adsorbentNature === 'renewable') {
      extractionProcedureScore += 5;
    }

    // Adsorbent amount
    if (samplePrep.adsorbentAmount === 'less0.5') {
      extractionProcedureScore += 10;
    } else if (samplePrep.adsorbentAmount === '0.5to1') {
      extractionProcedureScore += 5;
    } else if (samplePrep.adsorbentAmount === 'more1') {
      extractionProcedureScore -= 10;
    }
  }

  // (4) Other conditions – start at zero
  //    (a) Derivatization
  if (samplePrep.derivatization === true) {
    otherConditionsScore -= 10;
  }

  //    (b) Automated sample preparation
  if (samplePrep.automatedPreparation === true) {
    otherConditionsScore += 10;
  }

  //    (c) In situ vs offline
  // if (samplePrep.inSituPreparation === true) {
  //   otherConditionsScore += 10;
  // }
  // if (samplePrep.offline === true) {
  //   otherConditionsScore -= 10;
  // }

  //    (d) **Sample throughput** (this is where the fix goes)
  if (samplePrep.sampleThroughput === 'high') {
    otherConditionsScore += 5;    // High throughput → +5
  } else if (samplePrep.sampleThroughput === 'moderate') {
    otherConditionsScore += 0;    // Moderate → +0
  } else if (samplePrep.sampleThroughput === 'low') {
    otherConditionsScore -= 5;    // Low → –5
  }

  // Ensure no negative intermediate scores
  preSynthesisScore        = Math.max(0, preSynthesisScore);
  samplingRequiredScore    = Math.max(0, samplingRequiredScore);
  extractionProcedureScore = Math.max(0, extractionProcedureScore);

  // Final formula:
  //   (Pre-synthesis + Sampling procedure + Extraction) / 3  +  otherConditionsScore
  const mainComponentsAvg = 
    (preSynthesisScore + samplingRequiredScore + extractionProcedureScore) / 3;
  let finalScore = mainComponentsAvg + otherConditionsScore; // retain decimals


  // Cap between 0 and 100
  return Math.min(100, Math.max(0, finalScore));
}

// Function to calculate Instrumentation Score
export function calculateInstrumentationScore(instrumentation) {
  // Base score from energy consumption
  let score = 0;
  
  // 1. Energy Consumption
  if (instrumentation.energy === 'non') {
    score = 100; // Non-instrumental methods (0 kWh)
  } else if (instrumentation.energy === 'low') {
    score = 95; // ≤0.1 kWh per sample
  } else if (instrumentation.energy === 'moderate') {
    score = 85; // ≤1.5 kWh per sample
  } else if (instrumentation.energy === 'high') {
    score = 75; // >1.5 kWh per sample
  }
  
  // 2. Apply other modifiers
  
  // Emission of Vapors
  if (instrumentation.vaporEmission) {
    score -= 20;
  }
  
// Manual / automation level (non | semi | automated)
const automation = instrumentation.nonAutomated ?? 'automated'; // default = automated

if (automation === 'non') {
  score -= 5;
} else if (automation === 'semi') {
  score -= 2;
} else if (automation === 'automated') {
  score += 2;
}
 
  // Multianalyte/multiparameter method adds 5 to the instrumentation score
  if (instrumentation.multianalyte) {
    score += 5;
  }

  // Miniaturized/portable instrument adds 10 to the instrumentation score
  if (instrumentation.miniaturized) {
    score += 10;
  }

  // Ensure score is not negative and not greater than 100
  score = Math.min(100, Math.max(0, score));
return score;
}

// Function to calculate Reagent Score
export function calculateReagentScore(reagents) {
  if (reagents.length === 0) {
    return 100; // If no reagents, assume perfect score (water only)
  }
  
  let totalScore = 0;
  
  // Calculate score for each reagent
  reagents.forEach(reagent => {
    let reagentScore = 0;
    
    // If it's water with zero pictograms
    if (reagent.solventType === 'water' && reagent.ghsClass === 'zero') {
      reagentScore = 100;
    }
    // Base score on GHS classification and signal word combination
    else if (reagent.ghsClass === 'zero') {
      reagentScore = 100; // Zero pictograms
    } 
    else if (reagent.ghsClass === 'one' && reagent.signalWord === 'warning') {
      // One pictogram + Warning
      switch (reagent.volume) {
        case 'less1': reagentScore = 98; break;
        case 'less10': reagentScore = 96; break;
        case 'between10And100': reagentScore = 94; break;
        case 'more100': reagentScore = 92; break;
      }
    } 
    else if ((reagent.ghsClass === 'one' && reagent.signalWord === 'danger') || 
            (reagent.ghsClass === 'two' && reagent.signalWord === 'warning')) {
      // One pictogram + Danger OR Two pictograms + Warning
      switch (reagent.volume) {
        case 'less1': reagentScore = 90; break;
        case 'less10': reagentScore = 85; break;
        case 'between10And100': reagentScore = 80; break;
        case 'more100': reagentScore = 75; break;
      }
    } 
    else if (reagent.ghsClass === 'two' && reagent.signalWord === 'danger') {
      // Two pictograms + Danger
      switch (reagent.volume) {
        case 'less1': reagentScore = 70; break;
        case 'less10': reagentScore = 65; break;
        case 'between10And100': reagentScore = 60; break;
        case 'more100': reagentScore = 55; break;
      }
    } 
    else if (reagent.ghsClass === 'three') {
      // Three or more pictograms + Danger
      switch (reagent.volume) {
        case 'less1': reagentScore = 50; break;
        case 'less10': reagentScore = 45; break;
        case 'between10And100': reagentScore = 40; break;
        case 'more100': reagentScore = 35; break;
      }
    }
    
    totalScore += reagentScore;
  });
  
  // Average the scores
  return totalScore / reagents.length;
}

// Function to calculate Waste Score
export function calculateWasteScore(waste) {
  let score = 0;
  
  // Base score based on volume
  if (waste.volume === 'less1') {
    score = 100; // < 1 mL
  } else if (waste.volume === 'between1And10') {
    score = 90; // 1–10 mL
  } else if (waste.volume === 'between10And100') {
    score = 60; // 11–100 mL
  } else if (waste.volume === 'more100') {
    score = 35; // >100 mL
  }
  
  // Apply biodegradability modifier
  if (waste.biodegradable) {
    score += 10; // +10 for biodegradable waste
  } else {
    score -= 10; // -10 for non-biodegradable waste
  }
  
  // Treatment modifiers
  if (waste.treatment === 'none') {
    score -= 5;
  } else if (waste.treatment === 'less10') {
    score += 10;
  } else if (waste.treatment === 'more10') {
    score += 20;
  }
  
  // Ensure score is between 0 and 100
  score = Math.min(100, Math.max(0, score));
  
  return score;
}

// Function to calculate Performance Practicality Index (PPI) Score
export function calculatePracticalityScore(practicality) {
  let score = 0;
  const defaultValues = {
    natureOfMethod:      'quantitative',
    designOfExperiment:  'factorial',
    aiIntegration:       'advanced',
    validation:          'full',
    sensitivity:         'picogram',
    reagentAvailability: 'low',
    instrCost:           'all_low',
    maintenance:         'long',
    throughput:          'high',
    reusability:         'yes'
  };

  // دمج القيم الافتراضية مع مدخلات المستخدم
  const p = { ...defaultValues, ...practicality };

  // 1. Nature of Method
  score += (p.natureOfMethod === 'quantitative'? 10
         : p.natureOfMethod === 'semiquantitative'? 6
         : 4);

  // 2. Design of Experiment
  score += (p.designOfExperiment === 'factorial'? 10
         : p.designOfExperiment === 'partial'?   5
         : 0);

  // 3. AI Integration
  score += (p.aiIntegration === 'advanced'? 10
         : p.aiIntegration === 'moderate'? 7
         : p.aiIntegration === 'basic'?    3
         : 0);

  // 4. Validation
  score += (p.validation === 'full'?    10
         : p.validation === 'partial'?  5
         : 0);

  // 5. Sensitivity
  score += (p.sensitivity === 'picogram'? 10
         : p.sensitivity === 'nanogram'?  8
         : p.sensitivity === 'microgram'?  5
         : 2);

  // 6. Availability of Reagent
  score += (p.reagentAvailability === 'low'? 10 : 5);

  // 7. Instrument availability & cost
  score += (p.instrCost === 'all_low'?   10
         : p.instrCost === 'one_med'?   5
         : 0);

  // 8. Maintenance
  score += (p.maintenance === 'long'?     10
         : p.maintenance === 'moderate'?  5
         : 0);

  // 9. Throughput
  score += (p.throughput === 'high'?     10
         : p.throughput === 'medium'?    5
         : 0);

  // 10. Reusability
  score += (p.reusability === 'yes'?     10 : 0);

  // اجعل النتيجة بين 0 و100
  return Math.min(100, Math.max(0, score));
}

