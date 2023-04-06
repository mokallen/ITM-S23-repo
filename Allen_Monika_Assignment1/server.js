var express = require('express'); // requiring express and not http, which will contain http and more
var app = express(); // creating object app to express

var products = require(__dirname + '/products.json');
console.log(products);

app.use(express.urlencoded({ extended: true })); // wil automatically decode any data submitted, put keys/values in the data to put in the body

// routing 

// monitor all requests
app.all('*', function (request, response, next) { // any request for any path, executes function (* means any)
   console.log(request.method + ' to path ' + request.path + ' with qs ' + JSON.stringify(request.query));
   next();
});

// process purchase request (validate quantities, check quantity available)
// trying to fix cannot get error
app.get('/', function(req, res) {
   res.send('Hello, world!');
 });
 
app.get("/product_data.js", function (request, response, next) {
   response.type('.js');
   var products_str = `var products = ${JSON.stringify(products)};`;
   response.send(products_str);
}); // microservice, when someone asks for this, it is not being take from a file. it is giving back javascript. asking for data, sever gives data. there are better ways to do this, asking server for json data

app.post('/process_purchase', function (request, response, next) { //route that is supposed to recieve the request when user submits #'s of products
   console.log(request.body);
   // validate quantities, all validations must be done on the server
   // gonna need a loop for all the quanities in the body
   // at least 1 selection, use a flag variable (false or true boolean, start above the loop has selections false > is q > 0? has quantities becomes false to true)
   var q = request.body['quantity_textbox'];
   if (typeof q != 'undefined') {
       response.send(`Thank you for purchasing ${q} things!`);
   } 

// if valid, complete the purchase

// if not valid, send errors and go back to porder page
//remove from inventory, loop again through quantities and deduct from the products array quantities available for that product. update from memory? serve products from the server.
});

// route all other GET requests to files in public 
app.use(express.static(__dirname + '/public'));
// start server
app.listen(8080, () => console.log(`listening on port 8080`)); // note the use of an anonymous function here to do a callback
// sets up to loop
