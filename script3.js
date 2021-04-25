const width = 700;
const height = 600;
const margin = { top: 10, right: 10, bottom: 20, left: 40 };

const neighborhoodFiltersDivElement = document.querySelector(
  "#neighborhood-type-filters"
);

let data = null;
let currData = null;

const allNeighborhoods = [];
let currNeighborhoods = [];
const neighborhoodsSelected = new Set();

function initializeSvg() {}

function initializeHTMLElements() {
  allNeighborhoods.forEach((type) => {
    // <label>
    //   <input type="checkbox" class="filter" name="isPop" />
    //   Pop
    // </label>
    const labelElement = document.createElement("label");
    const inputElement = document.createElement("input");
    const textElement = document.createTextNode(type);
    inputElement.type = "checkbox";
    inputElement.classList.add("neighborhood-filter");
    inputElement.name = type;
    labelElement.appendChild(inputElement);
    labelElement.appendChild(textElement);
    neighborhoodFiltersDivElement.appendChild(labelElement);
    console.log("adding labels");
  });
}

function initializeEventListeners() {
  d3.selectAll(".neighborhood-filter").on("change", function (d) {
    if (d.target.checked) {
      neighborhoodsSelected.add(d.target.name);
    } else {
      neighborhoodsSelected.delete(d.target.name);
    }
    filterData();
    // renderPoints();
  });
}
function initializeConstants() {
  currData.forEach((d) => {
    allNeighborhoods.push(d["Neighborhood"]);
  });
}

function filterData() {
  if (neighborhoodsSelected.size === 0) {
    currData = data;
  } else {
    currData = data.filter((d) => {
      for (let neighborhood of neighborhoodsSelected) {
        if (d["Neighborhood"] === neighborhood) {
          return true;
        }
      }
      return false;
    });

    console.log(`neighborhood selected updated`);
  }
}

function getData() {
  d3.csv(
    "https://raw.githubusercontent.com/6859-sp21/final-project-discover_boston_crime/main/neighborhood_data_race.csv"
  ).then((allData) => {
    data = allData;
    currData = data;
    console.log(currData);
    initializeConstants();
    initializeSvg();
    initializeHTMLElements();
    initializeEventListeners();
    // axis();
    // legend();
    // labels();
  });
}

getData();
