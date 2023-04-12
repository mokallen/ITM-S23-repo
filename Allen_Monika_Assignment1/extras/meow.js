    var products = require(__dirname + "/Allen_Monika_Assignment1/products.json"); // creating variable products using products.json

  let params = (new URL(document.location)).searchParams;
  // when the window loads, perform the following function:
  window.onload = function () {
      // if the url has 'inputError', it means that there is a negative, non-integer, or non-number value
      if (params.has('inputError')) {
          // make an alert with the value of key: inputError, which is "Please correct all errors"
          alert(params.get('inputError'));
          for (let i in products) {
              // display the error message in the label
              document.getElementById(`quantity${i}_label`).innerHTML = params.get(`q_error${i}`);
              // display what the user inputted in the value of the input box by getting the value from the URL that matches with key 'quantity${i}'
              inputForm[`qInput${i}`].value = params.get(`quantity${i}`);
          }
      }
      // if the url has the key 'noQuantities', it means that there are no quantities inputted
      // if so, send an alert with the value 'Please enter a quantity'
      if (params.has('noQuantities')) {
          alert(params.get('noQuantities'));
      }
  }

  // checking to see if inbox has valid quantities and to add pop ups to inform customers 
  function checkQuantityTextbox(theTextbox) {
      console.log("in checkbox", theTextbox.name);

      // setting all errors to isNonNegInt
      errors = isNonNegInt(theTextbox.value, true);
      // will display if input is 0
      if (errors.length == 0) errors = ['Enter your quantity desired: '];
      // will display if input is blank
      if (theTextbox.value.trim() == '') errors = ['Enter your quantity desired: '];
      // will display errors in red font
      if (errors.length > 0) {
          document.getElementById(theTextbox.name + '_label').innerHTML = errors.join('<font color="red">, </font>');
      }
  }
  // code referenced from Lab 11
  function isNonNegInt(arrayElement, returnErrors = false) {
      errors = []; // assume no errors at first
      if (Number(arrayElement) != arrayElement) errors.push('<font color="red">Not a number!</font>'); // check if string is a number value
      else {
          if (arrayElement < 0) errors.push('<font color="red">Quantity cannot be a negative!</font>');
          // checking if input is an integer; // check if it is non-negative
          if (parseInt(arrayElement) != arrayElement) errors.push('<font color="red">Not an integer!</font>'); // check that it is an integer
          if ((parseInt(arrayElement) == arrayElement) && (arrayElement >= 0)) { // check that it is a positive integer
              // loop through the products array
              for (let i = 0; i < products.length; i++) {
                  // set user input ID
                  var inputValue = document.getElementById(`qInput${i}`).value;
              }
          }
      }
      return (returnErrors ? errors : (errors.length == 0));
  };