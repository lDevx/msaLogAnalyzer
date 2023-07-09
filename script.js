let logsContent;
let cData;

//Enter the RegEx values in this section||||||||||||||||||||||
const systemName =
  '<PROPERTY name="product-id" type="string">([^<]+)</PROPERTY>';
//Enter the RegEx values in this section||||||||||||||||||||||

function handleFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  const reader = new FileReader();

  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");

  reader.onloadstart = function () {
    progressBar.value = 0; // Reset progress bar when loading starts
    progressText.textContent = "0%"; // Reset progress text
  };

  reader.onprogress = function (event) {
    if (event.lengthComputable) {
      const percentLoaded = Math.round((event.loaded / event.total) * 100); // Calculate percentage
      progressBar.value = percentLoaded; // Update progress bar value
      progressText.textContent = percentLoaded + "%"; // Update progress text
    }
  };

  reader.onload = function (event) {
    progressBar.value = 100; // Set progress bar to 100% when loading is complete
    progressText.textContent = "100%"; // Set progress text to 100%
    const contents = event.target.result;
    logsContent = contents;
    startProcess();
  };

  reader.readAsText(file);
}
//This function will return the data based on the regex provided
// EG:  '<PROPERTY name="product-id" type="string">([^<]+)</PROPERTY>';
function extractData(string) {
  const regex = new RegExp(string);
  const match = logsContent.match(regex);

  if (match) {
    const textContent = match[1];
    return textContent;
  }

  console.log("No matching data found.");
  return null;
}
//The function below helps us the split the log data into 2 sections, XML and cData.
function splitFileIntoSections(fileContents) {
  const splitIndex = fileContents.indexOf("<LOG_CONTENT>");

  if (splitIndex !== -1) {
    const xmlData = fileContents.substring(0, splitIndex);
    const cData = fileContents.substring(splitIndex);
    // Continue with further processing or actions for each section

    return { xmlData, cData }; // Return the sections if needed for further use
  } else {
    console.log("Split point not found in the file.");
    return null; // Or handle the case when the split point is not found
  }
}
// To add the </LOG_DATA> to the .logs file based on the generation
function fixOriginalLogFile(data) {
  if (data.includes("</wbi>")) {
    console.log("System appears to be 206X");
    const modifiedText = data.replace("</wbi>", "</wbi>\n</LOG_DATA>");
    return modifiedText;
  } else {
    const modifiedText = data.replace(
      "</CONFIG_XML>",
      "</CONFIG_XML>\n</LOG_DATA>"
    );
    console.log("not MSA 2060 - </wbi> not found");
    return modifiedText;
  }
}
// Users can download the amended .logs file
function addDownloadButton(data, label, extention) {
  const filename = `${label}.${extention}`;
  const blob = new Blob([data], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const downloadButton = document.createElement("button");
  downloadButton.textContent = `${extention}`;
  downloadButton.addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  });

  const container = document.getElementById("downloadContainer");
  container.appendChild(downloadButton);
}
// This function is to clear the mess and eleminat the need to write all the execution inside fileHandle.

function handleXML(xmlData) {
  // Assume xmlString contains the XML content retrieved or loaded
  let xmlString = xmlData;
  // Assume xmlString contains the XML content retrieved or loaded

  // Regular expression pattern to match the desired block
  const pattern = /<RESPONSE[^>]*>[\s\S]*?<\/RESPONSE>/g;

  // Extract the blocks of data using the pattern
  const matches = xmlString.match(pattern);
  const data = {}; // Object to store the extracted data blocks
  // Process and use the extracted blocks of data
  if (matches) {
    for (let i = 0; i < matches.length; i++) {
      const blockData = matches[i];

      // Parse the block of data as XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(blockData, "text/xml");

      // Extract the REQUEST attribute value of the RESPONSE element
      const responseElement = xmlDoc.getElementsByTagName("RESPONSE")[0];
      const requestValue = responseElement.getAttribute("REQUEST");

      // Create an object representing the block data
      const blockObject = {
        [requestValue]: {},
      };

      // Extract the hierarchy of the block data
      const objectElements = xmlDoc.getElementsByTagName("OBJECT");

      // Process the <OBJECT> elements and their child elements
      for (let j = 0; j < objectElements.length; j++) {
        const objectElement = objectElements[j];
        const propertiesElements =
          objectElement.getElementsByTagName("PROPERTY");
        const objectData = {};

        // Process the <PROPERTY> elements
        for (let k = 0; k < propertiesElements.length; k++) {
          const propertyElement = propertiesElements[k];
          const propertyName = propertyElement.getAttribute("name");
          const propertyValue = propertyElement.textContent.trim();

          objectData[propertyName] = propertyValue;
        }

        const objectName = objectElement.getAttribute("name");
        blockObject[requestValue][objectName] = objectData;
      }

      // Add the block object to the data object
      Object.assign(data, blockObject);
    }

    // Output the extracted data preserving the hierarchy
    console.log(data);
    // Access the parent container element where the HTML will be generated
    // Call the generateHTML function with your JSON object and the parent container
  } else {
    console.log("No matching blocks of data found.");
  }
  const propertyList = $("#propertyList");
  const propertyContent = $("#propertyContent");

  // Display all properties in the left section
  for (const property in data) {
    const listItem = $("<li>").text(property);
    listItem.on("click", function () {
      showPropertyContent(property);
    });
    propertyList.append(listItem);
  }

  // Function to show the content of the selected property
  function showPropertyContent(property) {
    const content = data[property];
    if (typeof content === "object") {
      const contentHTML = createNestedHTML(content);
      propertyContent.html(contentHTML);
    } else {
      propertyContent.text(content);
    }
  }

  function createNestedHTML(obj) {
    let html = "";
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (typeof value === "object") {
          const nestedHTML = createNestedHTML(value);
          html += `<p><strong>${key}:</strong></p>`;
          html += `<div class="nested">${nestedHTML}</div>`;
        } else {
          html += `<p>${key}: ${value}</p>`;
        }
      }
    }
    return html;
  }
}

function startProcess() {
  const nameOfSystem = extractData(systemName);
  console.log(systemName);
  const { xmlData, cData } = splitFileIntoSections(logsContent);
  console.log("XML Data:", xmlData);
  console.log("C Data:", cData);
  addDownloadButton(fixOriginalLogFile(logsContent), nameOfSystem, "logs");
  addDownloadButton(fixOriginalLogFile(cData), `${nameOfSystem}-Data`, "txt");
   handleXML(xmlData);
}
