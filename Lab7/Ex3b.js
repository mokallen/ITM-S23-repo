require("./products_data.js");

for(var i = 1; eval("typeof name"+i) != 'undefined'; i++) {
    if(i > 0.25 * (i-1) && i < 0.75 * (i-1)) {
    console.log(`${eval('name' + i)} is sold out!`)
    continue;
}
console.log(`${i}. ${eval('name' + i)}`);

if (i > (i-1)/2) {
    console.log(`Don't ask for anything else!`);
    process.exit();
    }
}

console.log(`That's all we have!`);