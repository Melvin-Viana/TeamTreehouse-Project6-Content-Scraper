// //Create a command line application that extracts data from a ecommerce site.

const scrapeIt = require("scrape-it");//Scraper
const fs = require("fs");
const csv = require("fast-csv");// Writes CSV
const http = require("http");
const time = require("time-stamp");

const fileName = "./data";
const url = "http://shirts4mike.com/asdf";
//========================================
//Check if folder data exists
if (!fs.existsSync(fileName)) {
  //If it doesn't exist create folder
  fs.mkdirSync(fileName);
}
//=====================================================
//Functions for logging error data into scraper-error.log
function logErrorData(error) {
  //Append data to scraper-error.log
  //fs.appendFile() => creates first parameter as a file if it doesn't exist
  fs.appendFile(
    "scraper-error.log",
    `Date:${time('[YYYY/MM/DD HH:mm]')} \n  ${error}\n `,
    function(err) {
      if (err) throw err;
    }
  );
}

 //============================================
//Print error message
 function printError(error) {
  console.error(error.message);
}
//=================================================================================================================


//===================================================
/*
  First Promise: Acquires shirt URL Links
*/
var promise1 = scrapeIt(`${url}shirts.php`, {
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
}).then(function({ data, response }) {
  //If Promise request has response.statusCode of 200, scrape shirtUrls. 
  if (response.statusCode === 200) {
    const urlArray = data.link;
    var array = [];
    for (var i = 0; i < urlArray.length; i++) {
      array.push(data.link[i]);
    }
    return array;
  } else {
    //http.STATUS_CODES[response.statusCode]; will return the status code error.
    const statusCodeError = new Error(
      `${response.statusCode} ${
        http.STATUS_CODES[response.statusCode]
      }. Cannot connect to ${url} `
    );
    printError(statusCodeError);
    logErrorData(statusCodeError);
  }
});
// End of First Promise
//===============================================
/*
      Second Scrape: With the URL, scrape data from each page.
  */
var promise2 = promise1.then(function(array) {
  var shirtInfoArray = [];
  for (var i = 0; i < array.length; i++) {
    shirtInfoArray.push(
      scrapeIt(`${url}${array[i].URL}`, {
        //Title
        Title: { selector: "img", attr: "alt" },
        //Image URL
        imageURL: { selector: "img", attr: "src" },
        //Price
        Price: ".shirt-details span.price"
      }).then(({ data }) => {
        return [data.Title, data.Price, data.imageURL];
      })
    );
  }
  //Place shirt information in Promise.All, to ensure all links are checked.
  var promises = Promise.all(shirtInfoArray);
  //Return all of the data into the promise2 variable, which will hold an array of the Shirt Data
  return promises.then(function(values) {
    return values;
  });
});
//End of 2nd Promise
//===================================================
/*
    Using both promises place the values in a promise array.
    
    The data will be formatted  in this code so that it will display as a CSV.
    The data includes:
    -Title of the shirt
    -Price of the shirt
    -ImageURL of the shirt
    -URL of the shirt
    -Time the CSV was created.

    
*/
Promise.all([promise1, promise2])
  .then(function(values) {
    var csvStream = csv.createWriteStream({ headers: true }),
      writableStream = fs.createWriteStream(`./data/${time()}.csv`); //places file into data folder with todays date.

    writableStream.on("finish", function() {
      console.log("CSV file contents are written!");
    });
    csvStream.pipe(writableStream);
    for (var i = 0; i < values[0].length; i++) {
      //Object that holds
      var shirtDetailObject = {
        //ORDER OF CSV FILE:
        //Title
        Title: values[1][i][0],
        //Price
        Price: values[1][i][1],
        //Image URL
        ImageURL: url + values[1][i][2],
        //URL
        URL: url + values[0][i].URL,
        //Time
        Time: time("HH:mm:ss")
      };
      //Append data onto the file
      csvStream.write(shirtDetailObject);
    }

    csvStream.end();
  })
  //=============================
  /*Catches any errors that occur within the promises
Catches syntax and Promise request errors.
Logs in the error into scraper-error.log
*/
  .catch(error => {
    logErrorData(error);

    function resolved() {}

    function rejected() {
      console.log("Promise error: check error log for details");
    }
    //If there is a promise error, the code is
    Promise.reject(new Error(error.message)).then(resolved, rejected);
  });
//=====================================================================================
