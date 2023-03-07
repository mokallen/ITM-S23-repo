//Experimenting with creating loop using in and of
var attributes =  "Monika;20;20.5;-19.5" ;
var pieces = attributes.split(";");
for(let part of pieces) {
    console.log(part, typeof part);
}
console.log(pieces.join(","));