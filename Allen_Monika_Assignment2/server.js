// authored by monika allen
// this file will run the server for my online e-commerce store, sends instructions for store page requests

// encryption and decryption
// code referenced from https://stackoverflow.com/questions/51280576/trying-to-add-data-in-unsupported-state-at-cipher-update
let secrateKey = "secrateKey";
// requires crypto library
const crypto = require('crypto');

// function to encrypt the text
function encrypt(text) {
    encryptalgo = crypto.createCipher('aes192', secrateKey);
    let encrypted = encryptalgo.update(text, 'utf8', 'hex');
    encrypted += encryptalgo.final('hex');
    return encrypted;
}

// function to dercypt text
function decrypt(encrypted) {
    decryptalgo = crypto.createDecipher('aes192', secrateKey);
    let decrypted = decryptalgo.update(encrypted, 'hex', 'utf8');
    decrypted += decryptalgo.final('utf8');
    return decrypted;
}

// checks to see encrypted version of password in the terminal
console.log(encrypt('grader'));

// define variables used 
var express = require('express'); // requiring express and not http, which will contain http and more
var app = express(); // creating object app to express
var qs = require('querystring'); // requiring querystring

// requires user_data.json file for user information, taken from examples given by Port 
var fs = require('fs');
var filename = './user_data.json';

//used to store quantity data from products disiplay page
//assume empty at first
var temp_info = {};

//IR5:  Keep track of # of users logged in 
// create an object to keep count of how many users are logged in
var status = {};

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


// IR1: Track the total quantity of each item sold. This needs to be implemented on the server when you remove sold items from the quantity available. Display total quantity sold with the product information - copied from official assignment 1 page
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
        response.redirect("./index.html?" + qs.stringify(request.body) + `&noQuantities=Please enter a quantity`); // displays message with appended key: noQuantities and value: "Please enter a quantity"
    }
    /// if there is an input error, redirect to products_display with appended key: inputError and value: "Please correct all errors"
   // append the errorsObject as a string
    else if ((Object.keys(errorsObject).length > 0)) {
        response.redirect("./index.html?" + qs.stringify(request.body) + `&inputError=Please correct all errors` + `&` + qs.stringify(errorsObject));
        console.log(errorsObject);
    }


});

// referenced from assignment 2 code examples provided by professor port
app.use(express.urlencoded({ extended: true }));
// checks for the existence of the file
// referenced from Lab 13 Exercise 2B
if (fs.existsSync(filename)) {
    // if it exists, read the file user_data.json stored in filename
    var data = fs.readFileSync(filename, 'utf-8');
    // parse user data
    var user_data = JSON.parse(data);
}

// POST request from login.html
// adopted from assignment 2 code examples on ITM 352 website
app.post("/process_login", function (req, res) {
    // process a simple register form
    // get the username inputted from the request body
    // inspired by Lab 13 Ex 3
    var the_email = req.body.email.toLowerCase();
    //IR 1: Encrypt users passwords 
    var encryptedPassword = encrypt(req.body.password);

    // error message if username is taken
    if (typeof user_data[the_email] != 'undefined') {
        // check if password matches username
        if (user_data[the_email].password == encryptedPassword) {
            // if there are no errors, store user info in temp_info and send to invoice.  
            temp_info['email'] = the_email;
            status[the_email] = true;
            temp_info['name'] = user_data[the_email].name;

            // this will store the number of loggedin users to temp_data
            // the number of users in the system will be appended to the URL and can be found using params.get('users')
            // counts how many users are logged in
            temp_info['users'] = Object.keys(status).length

            let params = new URLSearchParams(temp_info);
            // send to invoice page if login successful
            res.redirect('/invoice.html?' + params.toString());
            // ends process
            return;
            // if the password does not match the password entered then error message for wrong password
        } else {
            req.query.email = the_email;
            req.query.LoginError = 'Invalid password!';
        }
    } else { // if the username is undefined there's an error
        // error message for user that doesn't exist
        req.query.LoginError = 'Invalid username!';
    }
    // if not back to login with errors.    
    params = new URLSearchParams(req.query);
    // redirect to login if there are errors
    res.redirect("./login.html?" + params.toString());
});

// POST request form register for account
// inspired by Lab 13
// registration validation adpoted & modified from https://www.w3resource.com/javascript/form/javascript-sample-registration-form-validation.php
app.post("/process_register", function (req, res) {
    // assume no errors at start
    var reg_errors = {};
    // import email from submitted page
    var reg_email = req.body.email.toLowerCase();


    // email validation: makes sure correct email format is being inputted into user textbox
    // check if the fullname is valid (charcters in parathenthesis taken from stack overflow)
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})*$/.test(req.body.email)) {
    } else {
        // error message for email that doesn't match the standard email format
        reg_errors['email'] = "Invalid email.";
    }
    // error message for email if it's already taken
    if (user_data[reg_email] != undefined) {
        reg_errors['email'] = 'Email taken.'
    }
    // name validation: makes sure only letters with a length of 1-30 are entered corrrectly
    // name must be ALL in letters (charcters in parathenthesis taken from stack overflow)
    if (/^[A-Za-z\s]+$/.test(req.body.fullname)) {
    }
    else {
        // error message pops up if it contains invalid characters
        reg_errors['fullname'] = 'Enter name with letter characters only';
    }
    // if nothing is entered 
    if (req.body.fullname == "") {
        // error message will pop up to enter name
        reg_errors['fullname'] = 'Enter name';
    }
    // length of name must be greater than 2 and no bigger than 30 characters long 
    if (req.body.fullname.length > 30 && req.body.fullname.length < 2) {
        reg_errors['fullname'] = 'Name exceeds 30 characters';
    }

    // password must have more tham 10 chracters
    // charcters in parathenthesis is taken from https://stackoverflow.com/questions/12090077/javascript-regular-expression-password-validation-having-special-characters
    // IR2: require that passwords have at least one number and one special character (charcters in parathenthesis taken from stack overflow)
    if (/^(?=.*[\d])(?=.*[!@#$%^&*])[\w!@#$%^&*]{6,16}$/.test(req.body.password)) {
    } else {
        // error message pops upp if password does not contain at least one number or special character
        reg_errors['password'] = "Password must have at least one number and one special character";
    }
    if (req.body.password.length < 10) {
        // error message pops up if password doesn't exceed 10 characters
        reg_errors['password'] = "Password must be more than 10 characters.";
    }

    // password confirmation to make sure two passwords entered match
    if (/^(?=.*[\d])(?=.*[!@#$%^&*])[\w!@#$%^&*]{6,16}$/.test(req.body.password)) {
    } else {
        // error message pops upp if password does not contain at least one number or special character
        reg_errors['password'] = "Password must have at least one number and one special character";
    }
    if (req.body.password !== req.body.confirmpassword) {
        // error message will pop up if two passwords entered are not the same
        reg_errors['confirmpassword'] = "Passwords are not the same."
    }

    // save registration data to json file and send to invoice page if registration successful. 
    // assignment 2 example code : reading and writing user info to a JSON file
    if (Object.keys(reg_errors).length == 0) {
        var email = req.body['email'].toLowerCase();
        user_data[email] = {};
        // information entered is added to user_data
        // inspired by Lab 13 Ex 4
        user_data[email]['name'] = req.body['fullname'];
        user_data[email]['password'] = encrypt(req.body['password']);
        // set the user's status to loggedin
        user_data[email]['status'] = "loggedin"

        // send the user's email to the array status
      status[email]=true;
        // finds how many users are active
        temp_info['users'] = Object.keys(status).length;
        // username and email from temp_info  variable added into file as username and email
        temp_info['email'] = email;
        temp_info['name'] = user_data[email]["name"];
        let params = new URLSearchParams(temp_info);
        // if registered send to invoice with product quantity data
        res.redirect('./invoice.html?' + params.toString());
    }
    // if errors exist, redirect to registration page with errors 
    else {
        req.body['reg_errors'] = JSON.stringify(reg_errors);
        let params = new URLSearchParams(req.body);
        // redirect to signup page after errors popup
        res.redirect('register.html?' + params.toString());
    }
});
// IF LOGIN IS CORRECT, USER CAN EDIT REGISTRATION DATA
// POST request from login.html
// referenced from assignment 2 code examples on ITM 352 website
app.post("/redirect_edit", function (req, res) {
    // process a simple register form
    // get the username inputted from the request body
    // inspired by Lab 13
    var encryptedPassword = encrypt(req.body.password);
    var the_email = req.body.email.toLowerCase();
    // if email is found in user_data...
    if (typeof user_data[the_email] != 'undefined') {
        // if password matches username
        if (user_data[the_email].password == encryptedPassword) {
            // if there are no errors, store user info in temp_info and send to invoice.  
            temp_info['email'] = the_email;
            let params = new URLSearchParams(temp_info);
            // send to invoice page if login successful
            res.redirect('/edit.html?' + params.toString());
            // ends process
            return;
            // if the password does not match the password entered then......
        } else {
            req.query.email = the_email;
            // error message for wrong password
            req.query.LoginError = 'Invalid password!';
        }
    } else { // if the username is undefined there's an error
        // error message for user that doesn't exist
        req.query.LoginError = 'Invalid username!';
    }
    // if not back to login with errors.    
    params = new URLSearchParams(req.query);
    // redirect to login if there are errors
    res.redirect("./login.html?" + params.toString());
});
// EDIT USER REGISTRATION 
// registration validation referenced & modified from https://www.w3resource.com/javascript/form/javascript-sample-registration-form-validation.php
app.post("/process_edit", function (req, res) {
    // assume no errors at start
    var reg_errors = {};

    // email validation: makes sure correct email format is being inputted into user textbox
    // check if the fullname is valid (charcters in parathenthesis taken from stack overflow)
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})*$/.test(req.body.email)) {
    } else {
        // error message for email that doesn't match the standard email format
        reg_errors['email'] = "Invalid email.";
    }
    // name validation: makes sure only letters with a length of 1-30 are entered corrrectly
    // name must be ALL in letters (charcters in parathenthesis taken from stack overflow)
    if (/^[A-Za-z\s]+$/.test(req.body.fullname)) {
    }
    else {
        // error message pops up if it contains invalid characters
        reg_errors['fullname'] = 'Enter name with letter characters only';
    }
    // if nothing is entered 
    if (req.body.fullname == "") {
        // error message will pop up to enter name
        reg_errors['fullname'] = 'Enter name';
    }
    // length of name must be greater than 2 and no bigger than 30 characters long 
    if (req.body.fullname.length > 30 && req.body.fullname.length < 2) {
        reg_errors['fullname'] = 'Name exceeds 30 characters';
    }

    // password must have more tham 10 chracters
    // charcters in parathenthesis is taken from https://stackoverflow.com/questions/12090077/javascript-regular-expression-password-validation-having-special-characters
    // IR2: require that passwords have at least one number and one special character (charcters in parathenthesis taken from stack overflow)
    if (/^(?=.*[\d])(?=.*[!@#$%^&*])[\w!@#$%^&*]{6,16}$/.test(req.body.password)) {
    } else {
        // error message pops up if password does not contain at least one number or special character
        reg_errors['password'] = "Password must have at least one number and one special character";
    }
    if (req.body.password.length < 10) {
        // error message pops up if password doesn't exceed 10 characters
        reg_errors['password'] = "Password must be more than 10 characters.";
    }

    // password confirmation to make sure two passwords entered match
    if (/^(?=.*[\d])(?=.*[!@#$%^&*])[\w!@#$%^&*]{6,16}$/.test(req.body.password)) {
    } else {
        // error message pops upp if password does not contain at least one number or special character
        reg_errors['password'] = "Password must have at least one number and one special character";
    }
    if (req.body.password !== req.body.confirmpassword) {
        // error message will pop up if two passwords entered are not the same
        reg_errors['confirmpassword'] = "Passwords are not the same."
    }

    // save registration data to json file and send to invoice page if registration successful. 
    // referenced from assignment 2 example code : reading and writing user info to a JSON file
    if (Object.keys(reg_errors).length == 0) {
        console.log(user_data);
        // delete email once logged out
        delete user_data[temp_info['email']];
        var email = req.body['email'].toLowerCase();
        user_data[email] = {};
        // information entered is added to user_data
        // inspired by Lab 13 Ex 4
        user_data[email]['name'] = req.body['fullname'];
        user_data[email]['password'] = encrypt(req.body['password']);

        user_data[email].status = 'loggedin';
        
        // send the user's email to the array status
      status[email]=true;
      // finds how many users are active
      temp_info['users'] = Object.keys(status).length;

        // username and email from temp_info  variable added into file as username and email
        temp_info['email'] = email;
        temp_info['name'] = user_data[email]["name"];
        let params = new URLSearchParams(temp_info);
        // if registered send to invoice with product quantity data
        res.redirect('./invoice.html?' + params.toString());
        console.log(user_data);
    }
    // if errors exist, redirect to registration page with errors 
    else {
        req.body['reg_errors'] = JSON.stringify(reg_errors);
        let params = new URLSearchParams(req.body);
        // redirect to signup page after errors popup
        res.redirect('edit.html?' + params.toString());
    }
});
// trashing login in email
app.post('/process_logout', function (request, response) {
    // get the user's email from the hidden textbox
    var email = request.body.email.toLowerCase();
// deletes users information stored in temp_info
    delete temp_info['email'];
    delete temp_info['name'];
    delete temp_info['users'];
    // delete email in the object
    delete status.email
    // log Out Status
    user_data[email].status = "loggedout";
    // redirect the user to index if they choose to log out
    response.redirect('./index.html?');
    console.log("Email:", email);
    console.log("User data:", user_data[email]);
    
    if (user_data[email]) {
      user_data[email].status = "loggedout";
    }
})

// route all other GET requests to files in public 
app.use(express.static(__dirname + '/public'));
// starts server
app.listen(8080, () => console.log(`listening on port 8080`));

// everytime this is ran it clears out my errors
function isNonNegInt(arrayElement, returnErrors = false) {

    // prioritizing the errorsObject to display errors rather than this array
    errors = [];

    // checks if arrayElement is a non-neg integer. If returnErrors is true, the array of errors is returned.
    // otherwise returns true if arrayElement is non-neg int.
    // if input is nothing than assigns it to zero
    // referenced from Store 1 WOD & modified 
    if (arrayElement == '') arrayElement = 0;
    if (Number(arrayElement) != arrayElement) errors.push('Not a number!'); // check if string is a number value
    else {
        if (arrayElement < 0) errors.push('Negative value!'); // check if it is non-negative
        if ((parseInt(arrayElement) != arrayElement) && (arrayElement != 0)) errors.push('Not an integer!'); // check that it is an integer
    }

    return returnErrors ? errors : (errors.length == 0);
}