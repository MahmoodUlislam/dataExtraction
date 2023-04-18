const axios = require("axios");
const XLSX = require("XLSX");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

// Load the Excel file into a workbook object
const workbook = XLSX.readFile("./singlesite-List.xlsx");

// Get the first sheet name
const sheetName = workbook.SheetNames[0];
// Get the worksheet
const worksheet = workbook.Sheets[sheetName];
// Convert the worksheet data to an array of objects
const data = XLSX.utils.sheet_to_json(worksheet);
const websiteURL = "https://esikidz.com/";

// need to know how to get website address by name
// const name = "esikidz";

// create a CSV file
const csvWriter = createCsvWriter({
  path: "output.csv",
  header: [
    { id: "websiteAddress", title: "WEBSITE ADDRESS" },
    { id: "emailID", title: "EMAIL ID" },
  ],
});

// make a async function to get the data from the website
const getWebsiteData = async function (websiteURL) {
  const response = await axios.get(websiteURL);
  const landingPageHtml = response.data;

  // get all anchor tags on the page
  const anchorTagPattern = /href="(.*?)"/g;
  const links = landingPageHtml.match(anchorTagPattern);

  // getting the page data by hitting links from the landing page of the website
  let allPageHtml = [];
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    let filteredLinks = link.substring(6, link.length - 1);

    if (!filteredLinks.includes("http") && filteredLinks[0] === "/") {
      filteredLinks =
        websiteURL.substring(0, websiteURL.length - 1) + filteredLinks;
    }

    if (filteredLinks.includes(websiteURL)) {
      console.log("filteredLinks:", filteredLinks);
      try {
        const response = await axios.get(filteredLinks);
        const data =
          typeof response.data !== "string"
            ? JSON.stringify(response.data)
            : response.data;
        allPageHtml.push(data);
      } catch (error) {
        // ignoring the error for now
        // console.error(error);
      }
    }
  }

  // email pattern regex
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

  // find email address by the website data
  const emails = allPageHtml.map((item) => {
    const pickedRawEmail = item.match(emailPattern);
    return pickedRawEmail;
  });

  // to find all the email address in the nested array too
  const foundEmail = [...JSON.stringify(emails).match(emailPattern)];

  // to remove duplicate email address
  const filteredEmail = {};
  foundEmail.forEach((e) => {
    filteredEmail[e] = 0;
  });
  const email = [...Object.keys(filteredEmail)];

  // write the email address to the csv file with a , separator
  const records = [{ websiteAddress: websiteURL, emailID: email.join(", ") }];

  //  write the data to the csv file
  csvWriter.writeRecords(records).then(() => {
    console.log("Email address is written to the csv file", email);
  });
};

// loop through the excel file data
data.forEach((item) => {
  const url = item["website"];
  const name = item["Name"];
  if (url && url.trim().length !== 0) {
    getWebsiteData(url);
  }
});
