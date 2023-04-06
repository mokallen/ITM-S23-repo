var express = require('express'); // requiring express and not http, which will contain http and more
var app = express(); // creating object app to express
app.all('*', function (request, response, next) { // any request for any path, executes function (* means any)
    console.log(request.method + ' to path ' + request.path + ' with qs ' + JSON.stringify(request.query));
    next();
});
app.listen(8080, () => console.log(`listening on port 8080`)); // note the use of an anonymous function here to do a callback
// sets up to loop
