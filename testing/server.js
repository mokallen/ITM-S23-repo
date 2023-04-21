// authored by monika allen
// this file will run the server for my online e-commerce store, sends instructions for store page requests

// encryption and decryption
// code referenced from https://stackoverflow.com/questions/51280576/trying-to-add-data-in-unsupported-state-at-cipher-update

// allows you to put anything in here, you have to choose a string to server as the "key" to encrypt and decrypt
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
// taken from lab 13
var express = require('express');
var app = express();
var qs = require('querystring');

// requires user_data.json file for user information, taken from examples given by professor 
var fs = require('fs');
var filename = './user_data.json';

// used to store quantity data from products disiplay page
// assume empty at first
var temp_info = {};


//IR5: keep track of # of users logged in 
// create an object to keep count of how many users are logged in
var status = {};

// POST data can be decoded from the browser body
app.use(express.urlencoded({ extended: true }));

// respond to any req for any path
app.all('*', function (request, response, next) {
    console.log(request.method + ' to path ' + request.path);
    next();
});
// products data from json file and stores it
var products = require(__dirname + '/products.json');

// to track quantity sold
products.forEach((prod, i) => { prod.total_sold = 0 });

// monitor requests
app.get("/products.js", function (request, response, next) {
    response.type('.js');
    var products_str = `var products = ${JSON.stringify(products)};`;
    // send string of data as response to requests
    response.send(products_str);
});

//monitor requests & process purchase request (validate quantities, check quantity available)

app.post('/process_form', function (request, response) {
    var POST = request.body;
    // assume no quantities
    var Valid_Purchase = false;
    // create an errorsObject to store error messages
    var errorsObject = {};

    // for loop that checks if their is a valid quantity inputted
    for (let i = 0; i < products.length; i++) {
        // retrieve the quantity input from the POST method
        qtys = POST[`quantity` + i];


        /// referenced from assignment 1 workshop provided by professor: checks if it is a valid purchase
        // if there are no quantities selected, this will push an error and create a flag to see if there are quantities in the input boxes
        Valid_Purchase = Valid_Purchase || (qtys > 0);

        // isNonNegInt function referenced from assignment 1 workshop
        if (isNonNegInt(qtys, false) == false) {
            // // if there is an error, it will take the values of the error and put it into this custom error message        
            errorsObject[`q_error${i}`] = isNonNegInt(qtys, true);
        }
    }
    //*note to self: remove from inventory, loop again through quantities and deduct from the products array quantities available for that product. update from memory? serve products from the server.
    // if there are no empty boxes and purchase is valid, it will take the quantity inputted by user as the number of products sold

   // recieved help in ITMA by blake saari and referenced from blake saari
    if ((Valid_Purchase == true) && (Object.keys(errorsObject).length == 0)) {
        // calculate the quantity sold by adding the user input
        for (let i in products) {
            // re-define the response here 
            qtys = POST[`quantity` + i];
            // calculate total sold by adding the user input after each form submission
            products[i].total_sold += Number(qtys);
            // will take quantity available and calculate the remaining # of quantities to output how many more products are availble for sale
            products[i].quantity_available = products[i].quantity_available - Number(qtys); // quantity available - input quantities to calculate how many products are left for sale
            temp_info[`quantity${[i]}`] = POST[`quantity${[i]}`];
            // if valid, complete the purchase -> redirect to the inovice page, placed outside of the loop to ensure only one response is submitted
        }
        response.redirect("./login.html?" + qs.stringify(request.body)); // if valid, process login -> redirect to the login page, placed outside of the loop to ensure only one response is submitted
    }
    // if all input boxes are empty AND if the purchase input is invalid
    // redirect to index.html with appended key: noQuantities and value: "Please enter a quantity"
    else if ((Valid_Purchase == false) && (Object.keys(errorsObject).length == 0)) {
        response.redirect("./index.html?" + qs.stringify(request.body) + `&noQuantities=Please enter a quantity`);
    }
    // if there is an input error, meaning the errorsObject has something in it
    // redirect to index.html with appended key: inputError and value: "Please correct all errors"
    // + append the errorsObject as a string
    else if ((Object.keys(errorsObject).length > 0)) {
        response.redirect("./index.html?" + qs.stringify(request.body) + `&inputError=Please correct all errors` + `&` + qs.stringify(errorsObject));
        console.log(errorsObject);
    }


});

// referenceed from Assignment 2 code examples given by prof port
app.use(express.urlencoded({ extended: true }));
// checks for the existence of the file
// referenced from lab 13
if (fs.existsSync(filename)) {
    // if it exists, read the file user_data.json stored in filename
    var data = fs.readFileSync(filename, 'utf-8');
    // parse user data
    var user_data = JSON.parse(data);
}
// POST request from login.html
// referenced from assignment 2 code examples on ITM 352 website
app.post("/process_login", function (req, res) {
    // process simple register form
    // get username inputted from the request body
    // inspired by lab 13
    var the_email = req.body.email.toLowerCase();
    // IR1: Encrypt users passwords 
    var encryptedPassword = encrypt(req.body.password);

    // error message if username is taken
    if (typeof user_data[the_email] != 'undefined') {
        // check if password matches username
        if (user_data[the_email].password == encryptedPassword) {
            // if there are no errors, store user info in temp_info and send to invoice  
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
// registration validation referenced & modified from https://www.w3resource.com/javascript/form/javascript-sample-registration-form-validation.php
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
        //Error message will pop up to enter name
        reg_errors['fullname'] = 'Enter name';
    }
    // length of name must be greater than 2 and no bigger than 30 characters long 
    if (req.body.fullname.length > 30 && req.body.fullname.length < 2) {
        reg_errors['fullname'] = 'Name exceeds 30 characters';
    }

    // password must have more tham 10 chracters
    // charcters in parathenthesis is taken from https://stackoverflow.com/questions/12090077/javascript-regular-expression-password-validation-having-special-characters
    //IR2: Require that passwords have at least one number and one special character (charcters in parathenthesis taken from stack overflow)
    if (/^(?=.*[\d])(?=.*[!@#$%^&*])[\w!@#$%^&*]{6,16}$/.test(req.body.password)) {
    } else {
        // error message pop up if password does not contain at least one number or special character
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

    // save registration data to json file and send to invoice page if registration successful
    // assignment 2 example code : reading and writing user info to a JSON file
    if (Object.keys(reg_errors).length == 0) {
        var email = req.body['email'].toLowerCase();
        user_data[email] = {};
        // information entered is added to user_data
        // inspired by Lab 13
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
        // ff registered send to invoice with product quantity data
        res.redirect('./invoice.html?' + params.toString());
    }
    // ff errors exist, redirect to registration page with errors 
    else {
        req.body['reg_errors'] = JSON.stringify(reg_errors);
        let params = new URLSearchParams(req.body);
        // redirect to signup page after errors popup
        res.redirect('register.html?' + params.toString());
    }
});
// IF LOGIN IS CORRECT, USER CAN EDIT REGISTRATION DATA
// POST request from login.html
// referenced from assignment 2 code examples on ITM 352 website, with help from jaden morga
app.post("/redirect_edit", function (req, res) {
    // process a simple register form
    // get the username inputted from the request body
    // inspired by lab 13
    var encryptedPassword = encrypt(req.body.password);
    var the_email = req.body.email.toLowerCase();
    // if email is found in user_data...
    if (typeof user_data[the_email] != 'undefined') {
        // if password matches username
        if (user_data[the_email].password == encryptedPassword) {
            // if there are no errors, store user info in temp_info and send to invoice  
            temp_info['email'] = the_email;
            let params = new URLSearchParams(temp_info);
            // send to invoice page if login successful
            res.redirect('/edit.html?' + params.toString());
            // ends process
            return;
            // if password does not match the password entered then......
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
    //IR2: require that passwords have at least one number and one special character (charcters in parathenthesis taken from stack overflow)
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

    // save registration data to json file and send to invoice page if registration successful 
    // assignment 2 example code : reading and writing user info to a JSON file
    if (Object.keys(reg_errors).length == 0) {
        console.log(user_data);
        // delete email once logged out
        delete user_data[temp_info['email']];
        var email = req.body['email'].toLowerCase();
        user_data[email] = {};
        // information entered is added to user_data
        // inspired by lab 13
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
    response.redirect('/index.html?');

})

// route all other GET requests to files in public 
app.use(express.static(__dirname + '/public'));
// starts server
app.listen(8080, () => console.log(`listening on port 8080`));

// referenced with help from blake saari ITMA
// everytime this is ran it clears out my errors
function isNonNegInt(arrayElement, returnErrors = false) {

    // Prioritizing the errorsObject to display errors rather than this array
    errors = [];

    // Checks if arrayElement is a non-neg integer. If returnErrors is true, the array of errors is returned.
    // Otherwise returns true if arrayElement is non-neg int.
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