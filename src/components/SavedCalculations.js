import { translate } from '../utils/i18n.js';

export function SavedCalculations(loadCalculations, onLoad, onDelete) {
  const savedContainer = document.createElement('div');
  savedContainer.className = 'form-section card';
  
  const title = document.createElement('h3');
  title.textContent = translate('Saved Calculations');
  savedContainer.appendChild(title);
  
  const description = document.createElement('p');
  description.textContent = translate('View, load, or delete your previously saved EI scale calculations.');
  savedContainer.appendChild(description);
  
  // Loading message
  const loadingMessage = document.createElement('p');
  loadingMessage.textContent = translate('Loading saved calculations...');
  savedContainer.appendChild(loadingMessage);
  
  // Load saved calculations
  loadCalculations().then(calculations => {
    // Remove loading message
    savedContainer.removeChild(loadingMessage);
    
    if (calculations.length === 0) {
      const noCalculationsMessage = document.createElement('p');
      noCalculationsMessage.textContent = translate('No saved calculations found.');
      savedContainer.appendChild(noCalculationsMessage);
      return;
    }
    
    // Create a list of saved calculations
    const calculationsList = document.createElement('ul');
    calculationsList.className = 'calculation-list';
    
    calculations.forEach(calculation => {
      const item = document.createElement('li');
      item.className = 'calculation-item';
      
      // Create item container with display flex
      const itemContent = document.createElement('div');
      itemContent.style.display = 'flex';
      itemContent.style.justifyContent = 'space-between';
      itemContent.style.alignItems = 'center';
      
      // Left side info
      const itemInfo = document.createElement('div');
      
      const itemName = document.createElement('h4');
      itemName.textContent = calculation.name || translate('Unnamed Calculation');
      itemName.style.margin = '0 0 5px 0';
      
      const itemDate = document.createElement('small');
      const date = new Date(calculation.date);
      itemDate.textContent = date.toLocaleString();
      itemDate.style.color = '#666';
      
      itemInfo.appendChild(itemName);
      itemInfo.appendChild(itemDate);
      
      // Score display
      const scoreInfo = document.createElement('div');
      
      const totalScore = calculation.data.scores.total;
      let scoreClass = '';

      // Higher total score = better, matching the interpretation used in
      // Results/PDF/Excel (getTotalInterpretation: >=75 Highly Recommended,
      // >=50 Recommended, <50 Needs Improvement/Not Recommended).
      if (totalScore >= 75) {
        scoreClass = 'success';
      } else if (totalScore >= 50) {
        scoreClass = 'warning';
      } else {
        scoreClass = 'danger';
      }
      
      const scoreBadge = document.createElement('span');
      scoreBadge.style.padding = '5px 10px';
      scoreBadge.style.borderRadius = '15px';
      scoreBadge.style.color = 'white';
      scoreBadge.style.fontWeight = 'bold';
      
      if (scoreClass === 'success') {
        scoreBadge.style.backgroundColor = '#2ecc71';
      } else if (scoreClass === 'warning') {
        scoreBadge.style.backgroundColor = '#f39c12';
      } else {
        scoreBadge.style.backgroundColor = '#e74c3c';
      }
      
      scoreBadge.textContent = `${translate('EI Score')}: ${totalScore.toFixed(1)}`;
      
      scoreInfo.appendChild(scoreBadge);
      
      // Actions (buttons)
      const itemActions = document.createElement('div');
      
      const loadButton = document.createElement('button');
      loadButton.className = 'btn btn-primary btn-sm';
      loadButton.innerHTML = `<i data-feather="download"></i> ${translate('Load')}`;
      loadButton.addEventListener('click', () => {
        onLoad(calculation.id);
      });
      
      const deleteButton = document.createElement('button');
      deleteButton.className = 'btn btn-danger btn-sm';
      deleteButton.style.marginLeft = '10px';
      deleteButton.innerHTML = `<i data-feather="trash-2"></i> ${translate('Delete')}`;
      deleteButton.addEventListener('click', (e) => {
        e.stopPropagation();
        onDelete(calculation.id);
      });
      
      itemActions.appendChild(loadButton);
      itemActions.appendChild(deleteButton);
      
      // Assemble the item
      itemContent.appendChild(itemInfo);
      itemContent.appendChild(scoreInfo);
      itemContent.appendChild(itemActions);
      
      item.appendChild(itemContent);
      calculationsList.appendChild(item);
    });
    
    savedContainer.appendChild(calculationsList);
    
    // Initialize feather icons
    if (window.feather) {
      window.feather.replace();
    }
  }).catch(error => {
    console.error('Error loading calculations:', error);
    
    // Remove loading message
    savedContainer.removeChild(loadingMessage);
    
    const errorMessage = document.createElement('p');
    errorMessage.style.color = 'red';
    errorMessage.textContent = translate('Error loading calculations. Please try again.');
    savedContainer.appendChild(errorMessage);
  });
  
  return savedContainer;
}
