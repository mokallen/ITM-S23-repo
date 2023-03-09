//Returns errors for given string, outputs true if there are no errors in the string
function CheckforNonNegInt(input, returnErrors = false) {
    errors = []; // assume no errors at first
    if(Number(input) != input) errors.push('Not a number!'); // Check if string is a number value
    if(input < 0) errors.push('Negative value!'); // Check if it is non-negative
    if(parseInt(input) != input) errors.push('Not an integer!'); // Check that it is an integer    
    
    return returnErrors ? errors : (errors.length == 0);

}

var attributes =  "Monika;20;20.5;-19.5" ;
var pieces = attributes.split(";");
for(let part of pieces) {
    console.log(part, CheckforNonNegInt(part, true));
}

console.log(CheckforNonNegInt(pieces, true));