// //Create a command line application that extracts data from a ecommerce site.

const scrapeIt = require("scrape-it");
const fs = require("fs");
const fileName = "./data";
const csv = require("fast-csv");
const http =require('http');
//Check if folder data exists
if (!fs.existsSync(fileName)) {
  //If it doesn't exist create folder
  fs.mkdirSync(fileName);
}
fs.appendFile("scraper-error.log", 'Text\n',function(err){
  if(err) throw err;
  console.log('IS WRITTEN')
  });
// //============================================
function printError(error) {
  console.error(error.message);
}
//===================================================

try{
//First Promise acquires The URL Data
var promise1 = new Promise((resolve),(reject)=>{
scrapeIt(`http://shirts4mike.com/shirtasdfs.php`, {
  link: {
    listItem: ".products li a",
    //Extract content from list item
    data: {
      //Get href attribute and store it
      URL: {
        attr: "href"
      }
    }
  }
}).then(function({ data,response }) {

  if(response.statusCode===200){
  const urlArray = data.link;
  var array = [];
  for (var i = 0; i < urlArray.length; i++) {
    array.push(data.link[i]);
  }
  return array;} else{
    //http.STATUS_CODES[response.statusCode]; will return the status code error.
    const statusCodeError = new Error(`There was an error getting the message for URL.${response.statusCode}: (${http.STATUS_CODES[response.statusCode]}) `);
    printError(statusCodeError);
} 
}

);
//===============================================
var promise2 = promise1.then(function(array) {
  var shirtInfoArray = [];
  for (var i = 0; i < array.length; i++) {
    shirtInfoArray.push(
      scrapeIt(`http://shirts4mike.com/${array[i].URL}`, {
        //Title
        Title:  { selector: "img", attr: "alt" },
        //Image URL
        imageURL: { selector: "img", attr: "src" },
        //Price
        Price: ".shirt-details span.price"
      })
        .then(({ data,response }) => {
          if(response.statusCode===200){
          return [data.Title, data.Price, data.imageURL];}
          else{
            //http.STATUS_CODES[response.statusCode]; will return the status code error.
            const statusCodeError = new Error(`There was an error getting the message for URL.${response.statusCode}: (${http.STATUS_CODES[response.statusCode]}) `);
            printError(statusCodeError);
        } 
        })
    );
  }
  //Place shirt information in Promise.All, to ensure all links are checked.
  var promises = Promise.all(shirtInfoArray);
  //Return all of the data when info is
  return promises
    .then(function(values) {
      return values;
    });
  }
  
)

});

//===================================================

Promise.all([promise1, promise2]).then(function(values) {
  var csvStream = csv.createWriteStream({ headers: true }),
    writableStream = fs.createWriteStream("./data/my.csv");

  writableStream.on("finish", function() {
    console.log("DONE!");
  });
  csvStream.pipe(writableStream);
  for (var i = 0; i < values[0].length; i++) {
    //Object that holds
    var shirtDetailObject = {
    //ORDER OF CSV FILE:
    //Title
    Title:values[1][i][0],
    //Price
    Price:values[1][i][1],
    //Image URL
    ImageURL:values[1][i][2],
    //URL
    URL: values[0][i].URL,
    //Time
    Time: new Date()
        };
    csvStream.write(shirtDetailObject);
    //values[0][i]["ImageURL"]=values[1][i][1];
  }

  csvStream.end();asdf
  console.log(values)
});
}
catch(error){printError(error);
  var csvStream = csv.createWriteStream({ headers: true }),
  writableStream = fs.createWriteStream("./data/error.csv");

  writableStream.on("finish", function() {
    console.log("DONE!");
  });

  csvStream.pipe(writableStream);
  var today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = date+' '+time;
    csvStream.write({"Date":dateTime,"Error":error.message});
    csvStream.end();
}