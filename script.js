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

function startProcess() {
  const nameOfSystem = extractData(systemName);
  console.log(systemName);
  const { xmlData, cData } = splitFileIntoSections(logsContent);
  console.log("XML Data:", xmlData);
  console.log("C Data:", cData);
  addDownloadButton(fixOriginalLogFile(logsContent), nameOfSystem, "logs");
  addDownloadButton(fixOriginalLogFile(cData), `${nameOfSystem}-Data`, "txt");
}
