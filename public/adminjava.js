document.addEventListener("DOMContentLoaded", function() {
    const cards = document.querySelectorAll('#table-row');
    const cardContainer = document.getElementById('table-container');
    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');
  
    let currentPage = 1;
    const cardsPerPage =6;
  
    function showPage(page) {
      const startIndex = (page - 1) * cardsPerPage;
      const endIndex = startIndex + cardsPerPage;
  
      cards.forEach((card, index) => {
        if (index >= startIndex && index < endIndex) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    }
  
    function updateButtons() {
      if (currentPage === 1) {
        prevButton.disabled = true;
      } else {
        prevButton.disabled = false;
      }
  
      if (currentPage === Math.ceil(cards.length / cardsPerPage)) {
        nextButton.disabled = true;
      } else {
        nextButton.disabled = false;
      }
    }
  
    function goToPrevPage() {
      if (currentPage > 1) {
        currentPage--;
        showPage(currentPage);
        updateButtons();
      }
    }
  
    function goToNextPage() {
      if (currentPage < Math.ceil(cards.length / cardsPerPage)) {
        currentPage++;
        showPage(currentPage);
        updateButtons();
      }
    }
  
    prevButton.addEventListener('click', goToPrevPage);
    nextButton.addEventListener('click', goToNextPage);
  
    // Initially show first page
    showPage(currentPage);
    updateButtons();
  });