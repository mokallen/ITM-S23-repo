function checkIt(item, index) {
    console.log(`part ${index} is ${(isNonNegInt(item)?'a':'not a')} quantity`);
}

var pieces = ["Monika", "20", "20.5", "-19.5"];
pieces.forEach(checkIt);

function checkIt(item, index) {
  console.log(`Index ${index}: ${item}`);
}

var attributes =  "Monika;20;20.5;-19.5" ;
var pieces = attributes.split(";");

pieces.forEach(function(item, index) {
    if(Number(item) >= 0) {
        console.log(`piece ${index} is a non-negative number: ${item}.`);
    } else {
        console.log(`piece ${index} is not a non-negative number: ${item}.`);
    }
});
