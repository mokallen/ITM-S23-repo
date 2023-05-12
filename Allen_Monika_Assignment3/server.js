// monika allen
// this file will run the server for the leo store

// encryption and decryption
// code referenced from https://stackoverflow.com/questions/51280576/trying-to-add-data-in-unsupported-state-at-cipher-update

// allows anything to be put here, must choose a string to server as the "key" to encrypt and decrypt
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
// taken from Lab 13
var express = require('express');
var app = express();
var qs = require('querystring');

// requires user_data.json file for user information, taken from examples given by Port 
var fs = require('fs');
var filename = './user_data.json';
// adopted from assignment 2 code examples given by port
app.use(express.urlencoded({ extended: true }));
// checks for the existence of the file
// referenced from Lab 13 Exercise 2B
if (fs.existsSync(filename)) {
    // if it exists, read the file user_data.json stored in filename
    var data = fs.readFileSync(filename, 'utf-8');
    // parse user data
    var user_data = JSON.parse(data);
}

// used to store quantity data from products disiplay page
// assume empty at first
var temp_info = {};

// keeping track of # of users logged in 
// create an object to keep count of how many users are logged in
var status = {};

// load session middleware
var session = require('express-session');
app.use(session({ secret: "MySecretKey", resave: true, saveUnitialized: true }));

// middleware necessary to use cookies to keep track of log-in status
var cookieParser = require('cookie-parser');
const { request } = require('http');
app.use(cookieParser());

// module for email sending
var nodemailer = require('nodemailer');

// respond to any req for any path
app.all('*', function (request, response, next) {
    console.log(request.method + ' to path ' + request.path);
    // if the session does not have a cart already, make an empty cart
    if (typeof request.session.cart == 'undefined') {
        request.session.cart = {};
    }
    next();
});
// products data from json file and stores it
var products = require(__dirname + '/products.json');

// object.keys(products)[i] is going to get the keys from products: best sellers, tools, accessories
// search for array that corresponds to the category of products using products[Object.keys(products)[i]]
// search for the array in the products object
for (let i = 0; i < Object.keys(products).length; i++) {
    products[Object.keys(products)[i]].forEach((prod, i) => { prod.total_sold = 0 });
}

// monitor requests
app.get("/products.js", function (request, response, next) {
    response.type('.js');
    var products_str = `var products = ${JSON.stringify(products)};`;
    // send string of data as response to requests
    response.send(products_str);
});
// get products data
app.post("/get_products_data", function (request, response) {
    response.json(products);
});

app.post('/process_form', function (request, response) {
    var POST = request.body;

    // assume no quantities
    var Valid_Purchase = false;
    // create an errorsObject to store error messages
    var errorsObject = {};

    // for loop that checks if their is a valid quantity inputted
    for (let i = 0; i < products.length; i++) {
        // retrieve quantity input from the POST method
        qtys = POST[`quantity` + i];


        // code demonstrated by port in class for assignment 1 workshop
        // checks if it is a valid purchase
        // if there's no quantities selected push an error & create flag to see if there are quantities in the input boxes
        Valid_Purchase = Valid_Purchase || (qtys > 0);

        // code demonstrated in class
        if (isNonNegInt(qtys, false) == false) {
            // if there is an error, make the error message the values for key q_error${i}        
            errorsObject[`q_error${i}`] = isNonNegInt(qtys, true);
        }
    }
    // statements are outside of the loop, because you can only response once 
    // if there are no empty input boxes and the purchase is valid, then it will assign quantity inputted as total sold
    if ((Valid_Purchase == true) && (Object.keys(errorsObject).length == 0)) {
        // calculate the quantity sold by adding the user input
        for (let i in products) {
            // re-define the response here 
            qtys = POST[`quantity` + i];
            // calculate total sold by adding the user input after each form submission
            products[i].total_sold += Number(qtys);
            // take quantity available and calculate "remaining-number of quantities" to output how many more products are availble for sale
            products[i].quantity_available = products[i].quantity_available - Number(qtys);
            // store quantities in temp_data object so it can be passed to the invoice
            temp_info[`quantity${[i]}`] = POST[`quantity${[i]}`];

        }
        // line is outside of the loop because you don't want to have more than one response
        response.redirect("./login.html?" + qs.stringify(request.body));
    }
    // if all input boxes are empty and if purchase input is invalid
    // redirect to index.html with appended key: noQuantities and value: "please enter a quantity"
    else if ((Valid_Purchase == false) && (Object.keys(errorsObject).length == 0)) {
        response.redirect("./index.html?" + qs.stringify(request.body) + `&noQuantities=Please enter a quantity`);
    }
    // if there is an input error
    // redirect to index.html with appended key: inputError and value: "please correct all errors"
    // append the errorsObject as a string
    else if ((Object.keys(errorsObject).length > 0)) {
        response.redirect("./index.html?" + qs.stringify(request.body) + `&inputError=Please correct all errors` + `&` + qs.stringify(errorsObject));
        console.log(errorsObject);
    }


});

// POST request from login.html
// referenced from ssignment 2 code examples on ITM 352 website
app.post("/process_login", function (req, res) {
    // process a simple register form
    // get the username inputted from the request body
    // referenced from Lab 13 
    var the_email = req.body.email.toLowerCase();
    var encryptedPassword = encrypt(req.body.password);

    // error message if username is taken
    if (typeof user_data[the_email] != 'undefined') {
        // check if password matches username
        if (user_data[the_email].password == encryptedPassword) {
            // sets the cookie variable
            var user_cookie = { "email": the_email, "fullname": user_data[the_email]['name'] };
            // expires in 30 mins
            res.cookie('user_cookie', JSON.stringify(user_cookie), { "maxAge": 1800000 });

            let params = new URLSearchParams(temp_info);
            // send to products page if login successful
            res.redirect('./productsdisplay.html?');
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
    // name must be all in letters (charcters in parathenthesis taken from stack overflow)
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
    // require that passwords have at least one number and one special character (charcters in parathenthesis taken from stack overflow)
    if (/^(?=.*[\d])(?=.*[!@#$%^&*])[\w!@#$%^&*]{6,16}$/.test(req.body.password)) {
    } else {
        // error message pops upp if password does not contain at least one number or special character
        reg_errors['password'] = "Password must have at least one number and one special character";
    }
    if (req.body.password.length < 10) {
        // error message pops up if password doesn't exceed 10 characters
        reg_errors['password'] = "Password must be more than 10 characters.";
    }

    // password Confirmation to make sure two passwords entered match
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
    // referenced from assignment 2
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
        status[email] = true;
        // finds how many users are active
        temp_info['users'] = Object.keys(status).length;
        // username and email from temp_info  variable added into file as username and email
        temp_info['email'] = email;
        temp_info['name'] = user_data[email]["name"];
        let params = new URLSearchParams(temp_info);
        // if registered send to products display with product quantity data
        res.redirect('./productsdisplay.html?' + params.toString());
    }
    // if errors exist, redirect to registration page with errors 
    else {
        req.body['reg_errors'] = JSON.stringify(reg_errors);
        let params = new URLSearchParams(req.body);
        // redirect to signup page after errors popup
        res.redirect('register.html?' + params.toString());
    }
});
// if login is correct, user edits registration data
// POST request from login.html
// adopted from assignment 2 code examples
app.post("/redirect_edit", function (req, res) {
    // process a simple register form
    // get the username inputted from the request body
    // refrenced from Lab 13
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
// registration validation referenced from https://www.w3resource.com/javascript/form/javascript-sample-registration-form-validation.php
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
    // require that passwords have at least one number and one special character (charcters in parathenthesis taken from stack overflow)
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
    // assignment 2 example code
    if (Object.keys(reg_errors).length == 0) {
        console.log(user_data);
        // delete email once logged out
        delete user_data[temp_info['email']];
        var email = req.body['email'].toLowerCase();
        user_data[email] = {};
        // information entered is added to user_data
        // inspired by Lab 13
        user_data[email]['name'] = req.body['fullname'];
        user_data[email]['password'] = encrypt(req.body['password']);

        user_data[email].status = 'loggedin';

        // send the user's email to the array status
        status[email] = true;
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
// adding items to cart
// process purchase request (validate quantities, check quantity available)
app.post('/add_to_cart', function (request, response, next) {
    // get the products_key from the hidden input box
    var products_key = request.body['products_key'];

    // retrieve the request body
    var POST = request.body;

    // assume no quantities
    var Valid_Purchase = false;
    // create an errorsObject to store error messages
    var errorsObject = {};

    // if there are errors, redirect back to products display 
    let params = new URLSearchParams();
    // append the products_key so it can be searched in the URL
    params.append('products_key', products_key);

    // for loop that checks if their is a valid quantity inputted
    for (i in products[products_key]) { // For every item in each product category
        // retrieve the quantity input from the POST method
        qtys = POST[`quantity` + i];

        // code demonstrated by Professor in class for Assignment 1 Workshop
        // checks if it is a valid purchase
        // if there's no quantities selected push an error & create flag to see if there are quantities in the input boxes
        Valid_Purchase = Valid_Purchase || (qtys > 0);

        // referenced from in class demonstration for assignment 1 workshop
        if (isNonNegInt(qtys, false) == false) {
            // if there is an error, make the error message the values for key q_error${i}        
            errorsObject[`q_error${i}`] = isNonNegInt(qtys, true);
        }
    }
    // statements are outside of the loop 
    // of there are no empty input boxes and the purchase is valid, then it will assign quantity inputted as total sold
    if ((Valid_Purchase == true) && (Object.keys(errorsObject).length == 0)) {
        // calculate the quantity sold by adding the user input
        for (let i in products[products_key]) {
            // re-define the response here 
            qtys = POST[`quantity` + i];
            // calculate total sold by adding the user input after each form submission
            products[products_key][i].total_sold += Number(qtys);
            // next, take the quantity available and calculate "remaining-number of quantities" to output how many more products are availble for sale
            products[products_key][i].quantity_available = products[products_key][i].quantity_available - Number(qtys);

            // store the quantities in the temp_data object so that it can be passed to the invoice
            temp_info[`quantity${[i]}`] = POST[`quantity${[i]}`];
        }

        // redirect back to products display, append the products_key and the user's input 
        if (!request.session.cart) {
            // if there are no carts for the session, it will create one
            request.session.cart = {};
        }
        if (typeof request.session.cart[products_key] == 'undefined') { // make an array for each product category
            request.session.cart[products_key] = [];
        }

        // user quantity array
        var userProducts = [];

        for (let i in products[products_key]) {
            // pushing user inputs
            userProducts.push(Number(POST[`quantity${i}`]));
        }
        console.log(userProducts)

        // setting userProdcts into sessions
        request.session.cart[products_key] = userProducts;
        console.log(request.session.cart);

        response.redirect("./cart.html")
    }
    // if all input boxes are empty and if the purchase input is invalid
    // redirect to index.html with appended key: noQuantities and value: "please enter a quantity"
    else if ((Valid_Purchase == false) && (Object.keys(errorsObject).length == 0)) {
        response.redirect("./productsdisplay.html?" + qs.stringify(request.body) + `&noQuantities=Please enter a quantity`);
    }
    // if there is an input error, meaning the errorsObject has something in it
    // redirect to index.html with appended key: inputError and value: "please correct all errors"
    // append the errorsObject as a string
    else if ((Object.keys(errorsObject).length > 0)) {
        response.redirect("./productsdisplay.html?" + qs.stringify(request.body) + `&inputError=Please correct all errors` + `&` + qs.stringify(errorsObject));
        console.log(errorsObject);
    }
});

app.post('/get_cart', function (request, response) {
    response.json(request.session.cart)
});

// update quantities from cart page
app.post("/update_cart", function (request, response) {
    for (let pkey in request.session.cart) {
        // loop through cart products
        for (let i in request.session.cart[pkey]) {
            // loop through product's selected quantity
            if (typeof request.body[`qty_${pkey}_${i}`] != 'undefined') {
                // add or remove updated quantities from inventory
                request.session.cart[pkey][i].quantity_available -= request.session.cart[pkey][i];
                // update cart data with new quantity
                request.session.cart[pkey][i] = Number(request.body[`qty_${pkey}_${i}`]);

            }
        }
    }
    response.redirect("./cart.html"); // goes to shopping cart
});

// checkout from cart page
app.get("/checkout", function (request, response) {
    // checks for errors
    var errors = {};
    // looks for cookie to see if logged in
    if (typeof request.cookies['user_cookie'] == 'undefined') {
        // if not will send to login page
        response.redirect(`./login.html`);
        console.log(request.cookies);
        return;
    } else {
        console.log(request.cookies);
        // will send to invoice if logged in
        response.redirect(`./invoice.html?`);
    }

});
// referenced from assignment 3 code examples
// load nodemailer package
app.post("/finish_purchase", function (request, response) {
    // generate HTML invoice string
    var invoice_str = `Thank you for your order!<table border><th>Quantity</th><th>Item</th>`;
    var shopping_cart = request.session.cart;
    for (products_key in products) {
        for (i = 0; i < products[products_key].length; i++) {
            if (typeof shopping_cart[products_key] == 'undefined') continue;
            qty = shopping_cart[products_key][i];
            if (qty > 0) {
                invoice_str += `<tr><td>${qty}</td><td>${products[products_key][i].name}</td><tr>`;
            }
        }
    }
    invoice_str += '</table>';
    // set up mail server. only will work on UH Network due to security restrictions
    var transporter = nodemailer.createTransport({
        host: "mail.hawaii.edu",
        port: 25,
        secure: false, // use TLS
        tls: {
            // do not fail on invalid certs
            rejectUnauthorized: false
        }
    });

    var user_email = JSON.parse(request.cookies['user_cookie']).email
    var mailOptions = {
        from: 'monikak@hawaii.edu',
        to: user_email,
        subject: 'Your Leo Store Invoice',
        html: invoice_str
    };
    // send email
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            // if an error occurs in email settings
            console.log(error)
            invoice_str += '<br>There was an error and your invoice could not be emailed :(';
        } else {
            // add email document if an error does not occur in the email settings
            invoice_str += `<br>Your invoice was mailed to ${user_email}`;
        }
        // send email
        response.send(invoice_str);
    });
    request.session.destroy(); // ends session after user confirms purchase

});

// log out and redirect to home page from thank you page
app.get("/logout_done", function (request, response) {
    response.clearCookie('users_name');
    response.clearCookie("products"); // deletes cookie information products
    response.redirect('index.html'); // redirect to index
});
// route all other GET requests to files in public 
app.use(express.static(__dirname + '/public'));
// starts server
app.listen(8080, () => console.log(`listening on port 8080`));

// recieved help in ITMA, referenced by jaden morga and blake saari: everytime this is ran it clears out errors
function isNonNegInt(arrayElement, returnErrors = false) {

    // prioritizing the errorsObject to display errors rather than this array
    errors = [];

    // checks if arrayElement is a non-neg integer. If returnErrors is true, the array of errors is returned.
    // otherwise returns true if arrayElement is non-neg int.
    // if input is nothing than assigns it to zero
    // referenced from store 1 WOD 
    if (arrayElement == '') arrayElement = 0;
    if ((Number(arrayElement) != arrayElement) && (arrayElement != '')) errors.push('Not a number!'); // check if string is a number value
    else {
        if (arrayElement < 0) errors.push('Negative value!'); // check if it is non-negative
        if ((parseInt(arrayElement) != arrayElement) && (arrayElement != 0)) errors.push('Not an integer!'); // check that it is an integer
    }

    return returnErrors ? errors : (errors.length == 0);
}