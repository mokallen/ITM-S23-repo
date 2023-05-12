// taken from assignment 3 code examples
// this function asks the server for a "service" and converts the response to text. 
function loadJSON(service, callback) {
  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open('POST', service, false);
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == "200") {
      // required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
      callback(xobj.responseText);
    }
  };
  xobj.send(null);
}

// function makes navigation bar from a products_data object

function nav_bar(this_product_key, products_data) {
  // makes a navigation bar to other product pages
  for (let products_key in products_data) {
    if (products_key == this_product_key) continue;
    document.write(`<a href='./productsdisplay.html?products_key=${products_key}' onclick="w3_close()">${products_key}</a>&nbsp&nbsp&nbsp;`);
  }
}