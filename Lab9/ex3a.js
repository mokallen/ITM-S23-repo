//Creating loop
var attributes =  "Monika;20;20.5;-19.5" ;
var pieces = attributes.split(";");
for(let i=0; i < pieces.length; i++) {
    console.log(pieces[i], typeof pieces[i]);
}
