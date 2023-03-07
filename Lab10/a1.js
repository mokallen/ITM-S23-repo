month = "January";
day = 17;
year = 2003;

step1 = 03; //Try to find a way to get the last 2 #'s  without hardcoding
step2 = parseInt(step1/4);
step3 = step1 + step2;
//Month is Janaury so move onto step 5
step5 = day + step3;
step8 = step5 //is the total
//Year is in the 2000's and it was not a leap year, so subtract 1 from total
step9 = step5 - 1;
step10 = (step9 % 7);
//2.7142857142857144 with remainder of 5, output should be 5 (Friday)

console.log(step10);