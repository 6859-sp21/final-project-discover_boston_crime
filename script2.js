const width = 700;
const height = 600;
const margin = { top: 10, right: 10, bottom: 20, left: 40 };

const neighborhoodFiltersDivElement = document.querySelector(
  "#neighborhood-type-filters"
);

let data = null;
let currData = null;
let svg = null;

let x0 = null;
let x1 = null;
let y = null;

const ageGroups = [
  "0-17 years %",
  "18-34 years %",
  "35-59 years %",
  "60 and over  %",
];
const allNeighborhoods = [];
let currNeighborhoods = [];
const groupKey = "ageGroup";
let transformedData = [];
const neighborhoodsSelected = new Set();

function transformData() {
  transformedData = [];
  ageGroups.flatMap((ageGroup) => {
    const newObj = new Object();
    newObj["ageGroup"] = ageGroup;
    currData.forEach((d) => {
      newObj[d["Neighborhood"]] = d[ageGroup];
    });
    transformedData.push(newObj);
  });
  currNeighborhoods = [];
  currData.forEach((d) => {
    currNeighborhoods.push(d["Neighborhood"]);
  });
}

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
  });
}

function initializeConstants() {
  currData.forEach((d) => {
    allNeighborhoods.push(d["Neighborhood"]);
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

function updateBars() {
  const update = svg
    .append("g")
    .selectAll("g")
    .data(transformedData, (d) => {
      currNeighborsString = "";
      currNeighborhoods.forEach((neighborhood) => {
        currNeighborsString += neighborhood;
      });
      console.log(currNeighborsString);
      return currNeighborsString;
    });
  console.dir(update);

  const update2 = update
    .join(
      (enter) => {
        const groupUpdate = enter.append("g");
        groupUpdate.selectAll("rect").data(
          (d) =>
            currNeighborhoods.map((neighborhood) => ({
              key: neighborhood,
              value: +d[neighborhood],
              ageGroup: d[groupKey],
            })),
          (d) => {
            let returnKey = "";
            if (d["key"] && d["ageGroup"]) {
              returnKey = `${d["key"]}_${d["ageGroup"]}`;
              console.log(`returning unique key ${returnKey}`);
            }
            return returnKey;
          }
        );
        return enter;
      },
      (update) => update,
      (exit) => exit.remove()
    )
    .attr("transform", (d) => `translate(${x0(d[groupKey])},0)`);

  console.dir(update2);

  update2
    .join(
      (enter) => enter.append("rect"),
      (update) => update,
      (exit) => exit.remove()
    )
    .attr("x", (d) => x1(d.key))
    .attr("y", (d) => y(d.value))
    .attr("width", x1.bandwidth())
    .attr("height", (d) => y(0) - y(d.value))
    .attr("fill", (d) => color(d.key));
}

function filterData() {
  if (neighborhoodsSelected.size === 0) {
    return;
  }

  currData = data.filter((d) => {
    for (let neighborhood of neighborhoodsSelected) {
      if (d["Neighborhood"] === neighborhood) {
        return true;
      }
    }
    return false;
  });

  console.log(`neighborhood selected updated`);

  transformData();
  updateBars();
}

function initializeSvg() {
  svg = d3
    .select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  updateBars();

  // svg.append("g")
  //     .call(xAxis);

  // svg.append("g")
  //     .call(yAxis);

  // svg.append("g")
  //     .call(legend);
}

function updateAxis() {
  x1 = d3
    .scaleBand()
    .domain(currNeighborhoods)
    .rangeRound([0, x0.bandwidth()])
    .padding(0.05);
}

function initializeScales() {
  x0 = d3
    .scaleBand()
    .domain(ageGroups)
    .rangeRound([margin.left, width - margin.right])
    .paddingInner(0.1);

  x1 = d3
    .scaleBand()
    .domain(allNeighborhoods)
    .rangeRound([0, x0.bandwidth()])
    .padding(0.05);

  y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(transformedData, (d) =>
        d3.max(allNeighborhoods, (neighborhood) => d[neighborhood])
      ),
    ])
    .nice()
    .rangeRound([height - margin.bottom, margin.top]);

  color = d3
    .scaleOrdinal(d3.schemeTableau10)
    .domain(currData.map((d) => d["Neighborhood"]));
}

function legend() {
  const g = svg
    .attr("transform", `translate(${width},0)`)
    .attr("text-anchor", "end")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .selectAll("g")
    .data(color.domain().slice().reverse())
    .join("g")
    .attr("transform", (d, i) => `translate(0,${i * 20})`);

  g.append("rect")
    .attr("x", -19)
    .attr("width", 19)
    .attr("height", 19)
    .attr("fill", color);

  g.append("text")
    .attr("x", -24)
    .attr("y", 9.5)
    .attr("dy", "0.35em")
    .text((d) => d);
}

function getData() {
  d3.csv(
    "https://raw.githubusercontent.com/6859-sp21/final-project-discover_boston_crime/main/neighborhood_data_age.csv"
  ).then((allData) => {
    data = allData;
    currData = data;
    console.log(currData);
    initializeConstants();
    transformData();
    initializeScales();
    initializeSvg();
    initializeHTMLElements();
    initializeEventListeners();
  });
}

getData();
