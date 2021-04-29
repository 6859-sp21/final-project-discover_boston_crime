let data = [];
let currData = [];
let policeDistricts = null;
const offenseTypes = new Set();
const filtersSelected = new Map();
let selectedDistricts = new Set();
const hourBins = 4;
const hourIdToBins = new Map();

const width = 700;
const height = 580;
const albersProjection = d3
  .geoAlbers()
  .scale(190000)
  .rotate([71.057, 0])
  .center([0, 42.313])
  .translate([width / 2, height / 2]);

let svg = null;
let g = null;
let color = null;

const pointTooltipD3Element = d3.select("#point-tooltip");
const offenseFiltersDivElement = document.querySelector(
  "#offense-type-filters"
);
const timeFiltersDivElement = document.querySelector("#time-filters");
const districtTooltip = d3.select("#district-tooltip");

//from script4.js
// const defaultNeighborhoods = new Set(["Boston"]);
// const allNeighborhoods = [];
// let currNeighborhoods = [];
// let neighborhoodsSelected = new Set();

// const barWidth = 700;
// const barHeight = 600;
// const margin = { top: 10, right: 10, bottom: 20, left: 40 };
// const svgs = [];
// let sampleData = null;
// let barColor = null;
// const animationDelay = 500;

// const colorScheme = [
//   "#a6cee3",
//   "#1f78b4",
//   "#b2df8a",
//   "#33a02c",
//   "#fb9a99",
//   "#e31a1c",
//   "#fdbf6f",
//   "#ff7f00",
//   "#cab2d6",
//   "#6a3d9a",
//   "#ffff99",
//   "#b15928",
//   "#000000",
// ];
// const neighborhoodFiltersDivElement = document.querySelector(
//   "#neighborhood-type-filters"
// );
// const barTooltip = d3.select("#bar-tooltip");

// let transition = null;

function initializeMapSvg() {
  svg = d3
    .select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  g = svg.append("g");

  const path = d3.geoPath().projection(albersProjection);

  const allDistricts = topojson.feature(
    policeDistricts,
    policeDistricts.objects["Police_Districts"]
  ).features;

  let drawDistricts = g.selectAll("path").data(allDistricts);

  console.log(drawDistricts);

  drawDistricts
    .join(
      function (enter) {
        return enter
          .append("path")
          .call((enter) =>
            enter
              .transition()
              .duration(1000)
              .attr("fill", "black")
              .attr("stroke", "white")
              .style("stroke-width", "3px")
          );
      },
      function (update) {
        return update.call((update) =>
          update
            .transition()
            .duration(1000)
            .attr("fill", "black")
            .attr("stroke", "white")
            .style("stroke-width", "3px")
        );
      },
      function (exit) {
        return exit.remove();
      }
    )
    .attr("d", path)
    .on("mouseover", function (event, d) {
      d3.select(this)
        .style("stroke", "red")
        .style("stroke-width", "5px")
        .style("fill", "blue");

      let districtToNeighborhoodMap = {
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
      };
      const tooltipString = `<div> 
              <p> Police District: ${d.properties.ID} </p>
              <p> Neighborhoods: ${districtToNeighborhoodMap[d.properties.ID]
                .sort()
                .join(", ")} </p>
              </div>`;
      //tooltip.transition().duration(50).style("opacity", 0.95);

      districtTooltip
        .html(`<div><p> ${tooltipString} </p><div>`)
        .transition()
        .duration(300)
        .style("opacity", 0.9)
        .style("left", event.pageX + "px")
        .style("top", event.pageY + "px")
        .style("background", "bisque");
    })
    .on("mouseout", function (event, d) {
      if (!selectedDistricts.has(d.properties.ID)) {
        d3.select(this)
          .style("stroke", "white")
          .style("stroke-width", "3px")
          .style("fill", "black");

        districtTooltip.transition().duration("0").style("opacity", 0);
        districtTooltip.html("");
      }
    })
    .on("click", function (event, d) {
      if (selectedDistricts.has(d.properties.ID)) {
        d3.select(this)
          .style("stroke", "white")
          .style("stroke-width", "3px")
          .style("fill", "black");

        selectedDistricts.delete(d.properties.ID);
        updateSecondaryCharts();
        //selectedDistricts.splice(selectedDistricts.indexOf(d.properties.ID), deleteCount = 1);
        //console.log(`selected districts are ${selectedDistricts}`);
      } else {
        d3.select(this)
          .style("stroke", "red")
          .style("stroke-width", "5px")
          .style("fill", "blue");

        selectedDistricts.add(d.properties.ID);
        //currNeighborhoods.push(d.properties.ID);
        updateSecondaryCharts();
        //console.log(`selected districts are ${selectedDistricts}`);
      }
    });
}

function renderMapPoints() {
  console.log("rendering points");
  const points = g
    .selectAll("path.crimePoints")
    .data(currData, (d) => d["INCIDENT_NUMBER"]);

  // console.dir(points);

  points
    .join(
      function (enter) {
        return enter.append("path");
      },
      function (update) {
        return update;
      },
      function (exit) {
        return exit.remove();
      }
    )
    .attr(
      "transform",
      (d) => `translate(${getXCoordinate(d)}, ${getYCoordinate(d)})`
    )
    // .attr("fill", (d) => color(d["Aggregated Offence Code Group"]))
    .attr("fill", "white")
    .attr(
      "class",
      (d) =>
        `crimePoints ${d["Aggregated Offence Code Group"].replace(
          /\s/g,
          "_"
        )} hour_${d["HOUR_ID"]}`
    )
    // .on("mouseover", function (event, d) {
    //   d3.select(this).style("stroke", "yellow");

    //   pointTooltipD3Element.transition().duration(300).style("opacity", 0.9);
    //   pointTooltipD3Element
    //     .transition()
    //     .duration(300)
    //     .style("opacity", 0.9)
    //     .style("left", event.pageX + "px")
    //     .style("top", event.pageY + "px")
    //     .style("background", "bisque");
    //   pointTooltipD3Element.html(
    //     `Offense Type: ${d["Aggregated Offence Code Group"]}`
    //   );
    // })
    // .on("mouseout", function (event, d) {
    //   d3.select(this).style("stroke", "white");
    //   pointTooltipD3Element.transition().duration("0").style("opacity", 0);
    //   pointTooltipD3Element.style("left", "0px").style("top", "0px");
    //   pointTooltipD3Element.html("");
    // })
    .attr("d", (d) => d3.symbol().size(5)());
}

function initializeMapScales() {
  color = d3
    .scaleOrdinal(d3.schemeTableau10)
    .domain(currData.map((d) => d["Aggregated Offence Code Group"]));
}

function initializeMapDataTransforms() {
  data.forEach((d) => {
    if (!offenseTypes.has(d["Aggregated Offence Code Group"])) {
      offenseTypes.add(d["Aggregated Offence Code Group"]);
    }
  });

  filtersSelected["Aggregated Offence Code Group"] = new Set();

  for (i = 0; i < hourBins; i++) {
    hourIdToBins[i] = [(i * 24) / hourBins, ((i + 1) * 24) / hourBins - 1];
  }

  filtersSelected["HOUR"] = new Set();

  const hourIds = Object.keys(hourIdToBins);

  data.forEach((d) => {
    const hourOfOffense = +d["HOUR"];
    const offenseHourId = hourIds.find((hourId) => {
      [hourStart, hourEnd] = hourIdToBins[hourId];
      return hourStart <= hourOfOffense && hourOfOffense <= hourEnd;
    });
    d["HOUR_ID"] = offenseHourId;
  });
}

function initializeMapHTMLElements() {
  offenseTypes.forEach((type) => {
    // <label>
    //   <input type="checkbox" class="filter" name="isPop" />
    //   Pop
    // </label>
    const labelElement = document.createElement("label");
    labelElement.classList.add("btn");
    labelElement.classList.add("btn-outline-dark");
    labelElement.classList.add("offense-type-filter");
    const inputElement = document.createElement("input");
    const textElement = document.createTextNode(type);
    inputElement.type = "checkbox";
    inputElement.name = type;
    labelElement.appendChild(inputElement);
    labelElement.appendChild(textElement);
    offenseFiltersDivElement.appendChild(labelElement);

    labelElement.addEventListener("mouseover", () => {
      // console.log(`hovering over ${type}`);
      d3.selectAll(`.${type.replace(/\s/g, "_")}`)
        .attr("fill", "red")
        .attr("d", () => d3.symbol().size(20)());
    });

    labelElement.addEventListener("mouseout", () => {
      // console.log(`hovering over ${type}`);
      d3.selectAll(`.${type.replace(/\s/g, "_")}`)
        .attr("fill", "white")
        .attr("d", () => d3.symbol().size(5)());
    });
  });

  Object.keys(hourIdToBins).forEach((id) => {
    const labelElement = document.createElement("label");
    labelElement.classList.add("btn");
    labelElement.classList.add("btn-outline-dark");
    labelElement.classList.add("time-filter");
    const inputElement = document.createElement("input");
    const textElement = document.createTextNode(
      `${hourIdToBins[id][0]} - ${hourIdToBins[id][1]}`
    );
    inputElement.type = "checkbox";
    inputElement.name = id;
    labelElement.appendChild(inputElement);
    labelElement.appendChild(textElement);
    timeFiltersDivElement.appendChild(labelElement);

    labelElement.addEventListener("mouseover", () => {
      // console.log(`hovering over hour ${id}`);
      d3.selectAll(`.hour_${id}`)
        .attr("fill", "red")
        .attr("d", () => d3.symbol().size(50)());
    });

    labelElement.addEventListener("mouseout", () => {
      // console.log(`hovering over hour ${id}`);
      d3.selectAll(`.hour_${id}`)
        .attr("fill", "white")
        .attr("d", () => d3.symbol().size(5)());
    });
  });
}

function initializeMapEventListeners() {
  d3.selectAll(".offense-type-filter").on("click", function (d) {
    const inputChild = d.target.querySelector("input");
    if (!inputChild.checked) {
      filtersSelected["Aggregated Offence Code Group"].add(inputChild.name);
    } else {
      filtersSelected["Aggregated Offence Code Group"].delete(inputChild.name);
    }
    filterMapData();
    renderMapPoints();
  });

  d3.selectAll(".time-filter").on("click", function (d) {
    const inputChild = d.target.querySelector("input");
    if (!inputChild.checked) {
      filtersSelected["HOUR"].add(inputChild.name);
    } else {
      filtersSelected["HOUR"].delete(inputChild.name);
    }
    filterMapData();
    renderMapPoints();
  });
}

function filterMapData() {
  const allFiltersSelected = new Set();
  Object.keys(filtersSelected).forEach((filterType) => {
    filtersSelected[filterType].forEach((filter) => {
      allFiltersSelected.add(filter);
    });
  });
  if (allFiltersSelected.size === 0) {
    currData = data;
    return;
  }
  console.log("filtering data");
  currData = data.filter((d) => {
    let skip = true;
    if (filtersSelected["Aggregated Offence Code Group"].size === 0) {
      return true;
    }
    for (let type of filtersSelected["Aggregated Offence Code Group"]) {
      if (d["Aggregated Offence Code Group"] === type) {
        skip = false;
        break;
      }
    }
    return skip !== true;
  });

  currData = currData.filter((d) => {
    let skip = true;
    if (filtersSelected["HOUR"].size === 0) {
      return true;
    }
    for (let hourId of filtersSelected["HOUR"]) {
      [hourStart, hourEnd] = hourIdToBins[hourId];
      if (hourStart <= +d["HOUR"] && +d["HOUR"] <= hourEnd) {
        skip = false;
        break;
      }
    }
    return skip !== true;
  });
}

function getXCoordinate(d) {
  return albersProjection([+d["Long"], +d["Lat"]])[0];
}

function getYCoordinate(d) {
  return albersProjection([+d["Long"], +d["Lat"]])[1];
}

function getMapData() {
  d3.csv(
    "https://raw.githubusercontent.com/6859-sp21/final-project-discover_boston_crime/main/crime_aggregated_code_groups.csv"
  ).then((allData) => {
    data = allData.slice(0, 1000);
    currData = data;
    d3.json(
      "https://raw.githubusercontent.com/6859-sp21/final-project-discover_boston_crime/main/data/police_districts.json"
    ).then((topojsonBoston) => {
      policeDistricts = topojsonBoston;
      console.log(policeDistricts);
      initializeMapDataTransforms();
      initializeMapSvg();
      initializeMapHTMLElements();
      initializeMapEventListeners();
      initializeMapScales();
      renderMapPoints();

      console.log("adding secondaryCharts.js in map.js");
      let head = document.getElementsByTagName("head")[0];
      let script = document.createElement("script");
      script.type = "text/javascript";
      script.src = "secondaryCharts.js";
      head.appendChild(script);
    });
  });
}

getMapData();