// Wait for the DOM to load before running the script
document.addEventListener('DOMContentLoaded', function() {

  // Get the remember-me container, checkbox, and custom checkbox from the DOM
  var rememberMeContainer = document.querySelector('.remember-me');
  var checkbox = rememberMeContainer.querySelector('input[type="checkbox"]');
  var checkboxCustom = rememberMeContainer.querySelector('.checkbox-custom');

  // Add a click event listener to the remember-me container
  rememberMeContainer.addEventListener('click', function(event) {
      // If the clicked element isn't the checkbox itself, toggle the checkbox
      if (event.target !== checkbox) {
          checkbox.checked = !checkbox.checked;

          // Manually trigger the change event on the checkbox
          var changeEvent = new Event('change', {
              'bubbles': true,
              'cancelable': true
          });
          checkbox.dispatchEvent(changeEvent);
      }
  });

  // Add a change event listener to the checkbox
  checkbox.addEventListener('change', function() {
      // This function will be called any time the checkbox is checked or unchecked
      // You can add any additional functionality you need here
  });

  // Optional: If you have a form and want to perform a custom submit action
  var form = document.querySelector('.login-form');
  form.addEventListener('submit', function(event) {
      // Prevent the default form submit
      event.preventDefault();

      // You can add custom form submit functionality here
      // For example, you could use AJAX to submit the form data to your server
  });

  // Additional event listeners and functionality can be added below
});




///////////////dashboard/////////////////
function menuicon(){
    let menuicn = document.querySelector(".menuicn"); 
    let nav = document.querySelector(".navcontainer"); 
      
    menuicn.addEventListener("click", () => { 
        nav.classList.toggle("navclose"); 
    })
    
}

// pagination
