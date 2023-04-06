var http = require('http');

// create a server object:
http.createServer(function (req, res) {
    console.log(req.headers); // output the request headers to the console
    res.writeHead(200, { 'Content-Type': 'text/html' }); // set MIME type to HTML, server does not know it is html
    res.write(`<h1>The server date is: ${Date()}</h1>`); // send a response to the client, executed on the server
    res.write('<h1>The client date is: <script>document.write( Date.now() );</script></h1>'); // send another response, script will be executed on the client
    
    res.end(); // end the response
}).listen(8080); // the server object listens on port 8080
// loop, will run forever until a request is sent

console.log('Hello world HTTP server listening on localhost port 8080');

// must ctrl+c when making updates