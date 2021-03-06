//Sources: https://observablehq.com/@d3/grouped-bar-chart

const width = 600;
const height = 500;
const margin = { top: 10, right: 10, bottom: 20, left: 40 };

const neighborhoodFiltersDivElement = document.querySelector(
  "#neighborhood-type-filters"
);

let data = null;
let currData = null;
let svg = null;
let g = null;

let x0 = null;
let x1 = null;
let y = null;

let yAxis = null;
let xAxis = null;

const colorScheme = [
  "#a6cee3",
  "#1f78b4",
  "#b2df8a",
  "#33a02c",
  "#fb9a99",
  "#e31a1c",
  "#fdbf6f",
  "#ff7f00",
  "#cab2d6",
  "#6a3d9a",
  "#ffff99",
  "#b15928",
  "#000000",
];

const animationDelay = 500;
let transition = null;

const barTooltip = d3.select("#bar-tooltip");

const ageGroups = [
  "0-17 years %",
  "18-34 years %",
  "35-59 years %",
  "60 and over %",
];

const defaultNeighborhoods = new Set(["Boston"]);
const allNeighborhoods = [];
let currNeighborhoods = [];
const groupKey = "ageGroup";
let transformedCurrData = [];
const transformedData = [];
const neighborhoodsSelected = new Set();

function transformData() {
  transformedCurrData = [];
  ageGroups.flatMap((ageGroup) => {
    const newObj = new Object();
    newObj["ageGroup"] = ageGroup;
    currData.forEach((d) => {
      newObj[d["Neighborhood"]] = d[ageGroup];
    });
    transformedCurrData.push(newObj);
  });
  currNeighborhoods = [];
  currData.forEach((d) => {
    currNeighborhoods.push(d["Neighborhood"]);
  });
  //console.log(`new curr neighbors ${currNeighborhoods}`);
}

function initializeHTMLElements() {
  allNeighborhoods.forEach((type) => {
    // <label>
    //   <input type="checkbox" class="filter" name="isPop" />
    //   Pop
    // </label>
    if (!defaultNeighborhoods.has(type)) {
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
    }
  });
}

function initializeConstants() {
  data.forEach((d) => {
    allNeighborhoods.push(d["Neighborhood"]);
  });

  ageGroups.flatMap((ageGroup) => {
    const newObj = new Object();
    newObj["ageGroup"] = ageGroup;
    data.forEach((d) => {
      newObj[d["Neighborhood"]] = d[ageGroup];
    });
    transformedData.push(newObj);
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
  //console.log(`updating bars`);
  const selection = g.selectAll("g.group");

  //console.log("selection");
  //console.dir(selection);

  const update = selection.data(transformedCurrData, (d, i) => {
    currNeighborsString = Object.keys(d).join(" ");
    currNeighborsString += i;
    //console.log(`curr neighborhood string ${currNeighborsString}`);
    return currNeighborsString;
  });

  //console.log("update");
  //console.dir(update);

  const update2 = update
    .join(
      (enter) => enter.append("g"),
      (update) => update,
      (exit) => exit.remove()
    )
    .attr("transform", (d) => `translate(${x0(d[groupKey])},0)`)
    .attr("class", "group")
    .selectAll("rect")
    .data(
      (d) =>
        currNeighborhoods.map((neighborhood) => ({
          key: neighborhood,
          value: +d[neighborhood],
          ageGroup: d[groupKey],
        })),
      (d) => {
        //console.log(`returning unique key ${`${d["key"]}_${d["ageGroup"]}`}`);
        return `${d["key"]}_${d["ageGroup"]}`;
      }
    );

  //console.log("update2");
  //console.dir(update2);

  update2
    .join(
      (enter) => {
        return enter
          .append("rect")
          .attr("x", (d) => x1(d.key))
          .attr("y", (d) => y(d.value))
          .attr("width", x1.bandwidth())
          .attr("fill", (d) => {
            return color(d.key);
          })
          .call((enter) =>
            enter
              .transition()
              .duration(1000)
              .attr("height", (d) => y(0) - y(d.value))
          );
      },
      (update) => update,
      (exit) => {
        exit.remove();
      }
    )
    .on("mouseover", function (event, d) {
      d3.select(this).style("stroke", "white").style("stroke-width", "1px");

      const hoveredNeighborhood = d.key;
      const hoveredAgeGroup = d.ageGroup.split("%")[0].trim();
      const totalPopulation = data.find(
        (x) => (x.Neighborhood = hoveredNeighborhood)
      )["Total Population"];
      const agePopulation = data.find(
        (x) => (x.Neighborhood = hoveredNeighborhood)
      )[hoveredAgeGroup];

      let neighborhoodToNeighborhoodNameMap = {
        A1: ["North End", "West End", "Downtown", "Beacon Hill"],
        A7: ["East Boston"],
        A15: ["Charlestown"],
        B2: ["Mission Hill", "Roxbury", "Longwood"],
        B3: ["Mattapan"],
        C6: ["South Boston", "South Boston Waterfront"],
        C11: ["Dorchester"],
        D4: ["Fenway", "Back Bay", "South End"],
        D14: ["Allston", "Brighton"],
        E5: ["West Roxbury", "Roslindale"],
        E13: ["Jamaica Plain"],
        E18: ["Hyde Park"],
        Boston: ["Boston"],
      };

      const tooltipString = `<div>
        <p> Police District: ${hoveredNeighborhood}</p>
        <p> Neighborhoods: ${neighborhoodToNeighborhoodNameMap[
          hoveredNeighborhood
        ]
          .sort()
          .join(", ")} </p>
        <p> Age Group: ${hoveredAgeGroup} </p>
        <p> Percent of Population: ${d.value.toFixed(4)} </p>
        <p> Age Population: ${agePopulation} </p>
        <p> Total Population: ${totalPopulation} </p>
        </div>`;

      barTooltip
        .html(tooltipString)
        .transition()
        .duration(300)
        .style("opacity", 0.9)
        .style("left", event.pageX + "px")
        .style("top", event.pageY + "px")
        .style("background", "bisque");
    })
    .on("mouseout", function (event, d) {
      d3.select(this).style("stroke-width", "0px");

      barTooltip.transition().duration("0").style("opacity", 0);
      barTooltip.html("");
    });
}

function filterData() {
  if (neighborhoodsSelected.size === 0) {
    setDefaultData();
  } else {
    currData = data.filter((d) => {
      for (let neighborhood of neighborhoodsSelected) {
        if (d["Neighborhood"] === neighborhood) {
          return true;
        }
      }
      for (let neighborhood of defaultNeighborhoods) {
        if (d["Neighborhood"] === neighborhood) {
          return true;
        }
      }
      return false;
    });

    //console.log(`neighborhood selected updated`);
  }

  transformData();
  updateAxis();
  updateBars();
  updateLegend();
}

function setDefaultData() {
  currData = data.filter((d) => {
    for (let neighborhood of defaultNeighborhoods) {
      if (d["Neighborhood"] === neighborhood) {
        return true;
      }
    }
    return false;
  });
}

function initializeSvg() {
  svg = d3
    .select(".container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "bar-viz");

  transition = svg.transition().duration(animationDelay).ease(d3.easeLinear);

  g = svg.append("g");

  updateBars();

  //console.log("done initializing svg");
}

function updateAxis() {
  x1 = d3
    .scaleBand()
    .domain(currNeighborhoods)
    .rangeRound([0, x0.bandwidth()])
    .padding(0.05);

  // color = d3
  //   .scaleOrdinal(d3.schemeTableau10)
  //   .domain(currData.map((d) => d["Neighborhood"]));
}

function initializeScales() {
  x0 = d3
    .scaleBand()
    .domain(ageGroups)
    .rangeRound([margin.left, width - margin.right])
    .paddingInner(0.1);

  x1 = d3
    .scaleBand()
    .domain(currNeighborhoods)
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
    .scaleOrdinal(colorScheme)
    .domain(data.map((d) => d["Neighborhood"]));
}

function axis() {
  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  let lowerLabels = ["0-17", "18-34", "35-59", "60 and over"];

  let xAxis = d3
    .axisBottom(x0)
    .tickValues(ageGroups)
    .tickFormat((d, i) => {
      return lowerLabels[i];
    });

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis);
}

function updateLegend() {
  // color = d3
  //   .scaleOrdinal(d3.schemeTableau10)
  //   .domain(neighborhoodsSelected);

  const legend = svg.select("g.legend");

  const legendData = legend.selectAll("g").data(
    currData.map((d) => d["Neighborhood"]),
    (d, i) => {
      return d;
    }
  );
  // .join("g")

  console.log(color.domain().slice());
  console.dir(legendData);

  const legendUpdate = legendData
    .join(
      (enter) => {
        const e = enter.append("g");
        e.append("rect")
          .attr("x", -19)
          .attr("width", 19)
          .attr("height", 19)
          .attr("fill", (d) => {
            console.log(d);
            return color(d);
          });
        e.append("text")
          .attr("x", -24)
          .attr("y", 9.5)
          .attr("dy", "0.35em")
          .text((d) => d)
          .attr("text-anchor", "end");
        return e;
      },
      (update) => update,
      (exit) => {
        exit.remove();
        console.log("exit");
        console.log(exit);
      }
    )
    .attr("transform", (d, i) => `translate(0,${i * 20})`);

  //   legendData
  //   .selectAll("rect")
  //   .data(d => d)
  // .join(
  //   (enter) => {
  //     enter.append("rect")
  //   .attr("x", -19)
  //   .attr("width", 19)
  //   .attr("height", 19)
  //   .attr("fill", color)
  //   },
  //   (update) => update,
  //   (exit) => {
  //     exit.remove();
  //     console.log('exit');
  //     console.log(exit);
  //   }
  // )
}

function legend() {
  svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width + margin.right * 7},0)`)
    .attr("text-anchor", "end");

  updateLegend();
}

function labels() {
  svg
    .append("text")
    .call(d3.axisBottom(x0))
    .attr("fill", "black")
    .attr("font-size", "14px")
    .attr("font-weight", "bold")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom)
    .text("Age Group (in Years)");

  svg
    .append("text")
    .call(d3.axisLeft(y))
    .attr("transform", `translate(0, ${height / 2.25}) rotate(-90)`)
    .attr("text-anchor", "end")
    .attr("fill", "black")
    .attr("font-size", "14px")
    .attr("font-weight", "bold")
    .text("Percent");
}

function getData() {
  d3.csv(
    "https://raw.githubusercontent.com/6859-sp21/final-project-discover_boston_crime/main/neighborhood_data_age.csv"
  ).then((allData) => {
    data = allData;
    setDefaultData();
    console.log(currData);
    initializeConstants();
    transformData();
    initializeScales();
    initializeSvg();
    initializeHTMLElements();
    initializeEventListeners();
    axis();
    legend();
    labels();
  });
}

getData();
