// server.js runs the server for store page requests
var express = require('express'); // requiring express and not http, which will contain http and more
var app = express(); // creating object app to express
var qs = require('querystring');

app.use(express.urlencoded({ extended: true })); // wil automatically decode any data submitted, put keys/values in the data to put in the body

// routing 

// monitor all requests
app.all('*', function (request, response, next) { // any request for any path, executes function (* means any)
   console.log(request.method + ' to path ' + request.path);
   next();
});

// create variable products from json file and store it on the server
var products = require(__dirname + '/products.json');
   console.log(products); // to check that products are being loaded on the server

   app.get("/products.js", function (request, response, next) {
      response.type('.js');
      var products_str = `var products = ${JSON.stringify(products)};`;
      response.send(products_str);
   }); // sends string of data when requested

// track quantity sold
products.forEach( (prod,i) => {prod.total_sold = 0});

// process purchase request (validate quantities, check quantity available) monitor requests

// **IR1 Task: IR1 Track the total quantity of each item sold. This needs to be implemented on the server when you remove sold items from the quantity available. Display total quantity sold with the product information.
app.post('/process_form', function (request, response) { //route that is supposed to recieve the request when user submits #'s of products
   var POST = request.body;
   // assume no quantities
   var Valid_Purchase = false;
   // errorObject to store error messages
   var errorsObject = {};

   // for loop to check if there is a valid quantity input
   for (let i = 0; i < products.length; i++) {
      qtys = POST[`quantity`+i]; // retrieves quantity input from POST method

   // referenced from Assignment 1 workshop: checks if it is a valid request
   // if there are no quantities selected, this will push an error and create a flag to see if there are quantities in the input boxes
   Valid_Purchase = Valid_Purchase || (qtys > 0);

   // isNonNegInt function referenced from Lab9? **need to double check**
   if (isNonNegInt(qtys, false) == false) {
      errorsObject[`q_error${i}`] = isNonNegInt(qtys, true); // if there is an error, it will take the values of the error and put it into this custom error message
   }
}

   //*note to self: remove from inventory, loop again through quantities and deduct from the products array quantities available for that product. update from memory? serve products from the server.
   // if there are no empty boxes and purchase is valid, it will take the quantity inputted by user as the number of products sold
   if ((Valid_Purchase == true) && (Object.keys(errorsObject).length == 0)) {
      // calculates quantity sold by adding whatever the user has input
      for (let i in products) {
         qtys = POST[`quantity`+i];
         products[i].total_sold += Number(qtys); // add user input quantities
         products[i].quantity_available = products[i].quantity_available - Number(qtys); // quantity available minus input quantities to calculate how many products are left for sale
      }
      response.redirect("./invoice.html?" + qs.stringify(request.body)); // if valid, complete the purchase -> redirect to the inovice page, placed outside of the loop to ensure only one response is submitted
   }
   // if not valid, send errors and go back to order page
   // if all quantity boxes are empty and purchase is invalid, redirect to products_display page
   else if ((Valid_Purchase == false) && (Object.keys(errorsObject).length == 0)) {
      response.redirect("./products_display.html?" + qs.stringify(request.body) + `&noQuantities=Please enter a quantity`); // displays message with appended key: noQuantities and value: "Please enter a quantity"
   }
   // if there is an input error, redirect to products_display with appended key: inputError and value: "Please correct all errors"
   // append the errorsObject as a string
   else if ((Object.keys(errorsObject).length > 0)) {
      response.redirect("./products_display.html?" + qs.stringify(request.body) + `&inputError=Please correct all errors` + `&` + qs.stringify(errorsObject));
      console.log(errorsObject);
   }
});

// route all other GET requests to files in public 
app.use(express.static(__dirname + '/public'));
// start server
app.listen(8080, () => console.log(`listening on port 8080`)); // note the use of an anonymous function here to do a callback
// sets up to loop
