//authored by monika allen
// this file will run the server for my online e-commerce store, sends instructions for store page requests
// recieved help from ITMA club members throughout assignment 1, i recall port saying that we are allowed to get some help but if not i will take the point deduction sorry

var express = require('express'); // requiring express and not http, which will contain http and more
var app = express(); // creating object app to express
var qs = require('querystring'); // requiring querystring


//POST
app.use(express.urlencoded({ extended: true })); // wil automatically decode any data submitted, put keys/values in the data to put in the body

// routing

//monitor all requests 
app.all('*', function (request, response, next) {
    console.log(request.method + ' to path ' + request.path);
    next();
});

// create variable products from json file and store it on the server
var products = require(__dirname + '/products.json');

// will track quantity sold
products.forEach((prod, i) => { prod.total_sold = 0 });

// getting data from json file, read as a js file
app.get("/products.js", function (request, response, next) {
    response.type('.js');
    var products_str = `var products = ${JSON.stringify(products)};`;
    // sends string of data as response to requests
    response.send(products_str);
});

//monitor requests & process purchase request (validate quantities, check quantity available)


// **IR1 Task: IR1 Track the total quantity of each item sold. This needs to be implemented on the server when you remove sold items from the quantity available. Display total quantity sold with the product information - copied from official assignment 1 page
app.post('/process_form', function (request, response) {
    var POST = request.body;
    // assume there are no quantities
    var Valid_Purchase = false;
    // create an errorsObject to store error messages
    var errorsObject = {};

    //creating a for loop that is meant to check wether entered data is a valid quantity
    for (let i = 0; i < products.length; i++) {
        // Retrieve the quantity input from the POST method
        qtys = POST[`quantity` + i];
        // referenced from assignment 1 workshop provided by professor: checks if it is a valid purchase
        // if there are no quantities selected, this will push an error and create a flag to see if there are quantities in the input boxes
        Valid_Purchase = Valid_Purchase || (qtys > 0);

        // isNonNegInt function referenced from assignment 1 workshop
        if (isNonNegInt(qtys, false) == false) {     
            errorsObject[`q_error${i}`] = isNonNegInt(qtys, true);
        } // if there is an error, it will take the values of the error and put it into this custom error message
    }

    //*note to self: remove from inventory, loop again through quantities and deduct from the products array quantities available for that product. update from memory? serve products from the server.
   // if there are no empty boxes and purchase is valid, it will take the quantity inputted by user as the number of products sold

   // recieved help in ITMA by blake saari and referenced from blake saari
    if ((Valid_Purchase == true) && (Object.keys(errorsObject).length == 0)) {
        // calculate the quantity sold by adding the user input
        for (let i in products) {
            qtys = POST[`quantity` + i];
            // calculate the total sold by adding the user input after each form submission
            products[i].total_sold += Number(qtys);
            // will take quantity available and calculate the remaining # of quantities to output how many more products are availble for sale
            products[i].quantity_available = products[i].quantity_available - Number(qtys); // quantity available - input quantities to calculate how many products are left for sale
        }
        response.redirect("./invoice.html?" + qs.stringify(request.body)); // if valid, complete the purchase -> redirect to the inovice page, placed outside of the loop to ensure only one response is submitted
    }
    // if not valid, send errors and go back to order page
   // if all quantity boxes are empty and purchase is invalid, redirect to products_display page
    else if ((Valid_Purchase == false) && (Object.keys(errorsObject).length == 0)) {
        response.redirect("./index.html?" + qs.stringify(request.body) + `&noQuantities=Please enter a quantity`); // // displays message with appended key: noQuantities and value: "Please enter a quantity"
    }
    /// if there is an input error, redirect to products_display with appended key: inputError and value: "Please correct all errors"
   // append the errorsObject as a string
    else if ((Object.keys(errorsObject).length > 0)) {
        response.redirect("./index.html?" + qs.stringify(request.body) + `&inputError=Please correct all errors` + `&` + qs.stringify(errorsObject));
        console.log(errorsObject);
    }


});

// route all other GET requests to files in the public folder
app.use(express.static(__dirname + '/public'));
// starts server
app.listen(8080, () => console.log(`listening on port 8080`)); // sets up to loop

// code referenced from help recieved in ITMA, jaden morga - was struggling with errors, everytime this function is ran it is supposed to clear out errors
function isNonNegInt(arrayElement, returnErrors = false) {

    // prioritizing the errorsObject to display errors rather than this array
    errors = [];


    // checks if arrayElement is a non-neg integer. If returnErrors is true, the array of errors is returned. otherwise returns true if arrayElement is non-neg int.
    //If input is nothing than assigns it to zero
    //Referenced from Store 1 WOD & modified 
    if (arrayElement == '') arrayElement = 0;
    if (Number(arrayElement) != arrayElement) errors.push('Not a number!'); // Check if string is a number value
    else {
        if (arrayElement < 0) errors.push('Negative value!'); // Check if it is non-negative
        if ((parseInt(arrayElement) != arrayElement) && (arrayElement != 0)) errors.push('Not an integer!'); // Check that it is an integer
    }

    return returnErrors ? errors : (errors.length == 0);
}