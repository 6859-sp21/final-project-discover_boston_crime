let data = [];
let currData = [];
let policeDistricts = null;
const offenseTypes = new Set();
const filtersSelected = new Map();
let selectedDistricts = new Set();
const hourBins = 4;
const hourIdToBins = new Map();
const MIN_THRESHOLD = 100;

const width = 1000;
const height = 700;
const albersProjection = d3
  .geoAlbers()
  .scale(210000)
  .rotate([71.057, 0])
  .center([0, 42.313])
  .translate([width / 2, height / 2]);

let svg = null;
let g = null;
let color = null;

const selectedDistrictFillColor = "#1167b1"; //"#052755";
const selectedPointColor = "#FFA500";

const pointTooltipD3Element = d3.select("#point-tooltip");
const offenseFiltersDivElement = document.querySelector(
  "#offense-type-filters"
);
// const timeFiltersDivElement = document.querySelector("#time-filters");
const districtTooltip = d3.select("#district-tooltip");

let crimeCountMap = {
  A1: 0,
  A7: 0,
  A15: 0,
  B2: 0,
  B3: 0,
  C6: 0,
  C11: 0,
  D4: 0,
  D14: 0,
  E5: 0,
  E13: 0,
  E18: 0,
};

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
              .attr("stroke", "grey")
              .style("stroke-width", "2px")
              .attr("class", "district")
          );
      },
      function (update) {
        return update.call((update) =>
          update
            .transition()
            .duration(1000)
            .attr("fill", "black")
            .attr("stroke", "white")
            .style("stroke-width", "2px")
        );
      },
      function (exit) {
        return exit.remove();
      }
    )
    .attr("d", path)
    .on("mouseover", function (event, d) {
      d3.select(this)
        .style("stroke", "white")
        .style("stroke-width", "3px")
        .style("fill", (d) => barColor(d.properties.ID));

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

      let clickInstruction = selectedDistricts.has(d.properties.ID)
        ? `<p class="italics"> Click to remove demographics information </p>`
        : `<p class="italics"> Click to add demographics information </p>`;
      const tooltipString = `<div> 
              <p> Police District: ${d.properties.ID} </p>
              <p> Neighborhoods: ${districtToNeighborhoodMap[d.properties.ID]
                .sort()
                .join(", ")} </p>
              <p> Crimes in District: ${crimeCountMap[d.properties.ID]}</p>
              ${clickInstruction}
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
          .style("stroke", "grey")
          .style("stroke-width", "2px")
          .style("fill", "black");
      }
      districtTooltip.transition().duration("0").style("opacity", 0);
      districtTooltip.html("");
    })
    .on("click", function (event, d) {
      if (selectedDistricts.has(d.properties.ID)) {
        d3.select(this)
          .style("stroke", "grey")
          .style("stroke-width", "2px")
          .style("fill", "black");

        selectedDistricts.delete(d.properties.ID);
        updateSecondaryCharts();
        //selectedDistricts.splice(selectedDistricts.indexOf(d.properties.ID), deleteCount = 1);
        //console.log(`selected districts are ${selectedDistricts}`);
      } else {
        d3.select(this)
          .style("stroke", "white")
          .style("stroke-width", "3px")
          .style("fill", (d) => barColor(d.properties.ID));

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

  //console.dir(points._enter);

  points
    .join(
      function (enter) {
        console.log("FUCK");
        console.log(enter);
        return enter.append("path").attr("class", (d) => {
          const pointDistrict = d["DISTRICT"];
          crimeCountMap[pointDistrict]++;
          return "";
        });
      },
      function (update) {
        return update;
      },
      function (exit) {
        return exit.remove().attr("class", (d) => {
          const pointDistrict = d["DISTRICT"];
          crimeCountMap[pointDistrict]--;
          return "";
        });
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
  const offenseCodeCountMap = new Map();
  data.forEach((d) => {
    if (offenseCodeCountMap[d["Aggregated Offence Code Group"]] !== undefined) {
      offenseCodeCountMap[d["Aggregated Offence Code Group"]] += 1;
    } else {
      offenseCodeCountMap[d["Aggregated Offence Code Group"]] = 1;
    }
  });

  Object.keys(offenseCodeCountMap).forEach((d) => {
    if (offenseCodeCountMap[d] > MIN_THRESHOLD) {
      offenseTypes.add(d);
    }
  });

  filtersSelected["Aggregated Offence Code Group"] = new Set();

  // for (i = 0; i < hourBins; i++) {
  //   hourIdToBins[i] = [(i * 24) / hourBins, ((i + 1) * 24) / hourBins - 1];
  // }

  // filtersSelected["HOUR"] = new Set();

  // const hourIds = Object.keys(hourIdToBins);

  // data.forEach((d) => {
  //   const hourOfOffense = +d["HOUR"];
  //   const offenseHourId = hourIds.find((hourId) => {
  //     [hourStart, hourEnd] = hourIdToBins[hourId];
  //     return hourStart <= hourOfOffense && hourOfOffense <= hourEnd;
  //   });
  //   d["HOUR_ID"] = offenseHourId;
  // });
}

function initializeMapHTMLElements() {
  offenseTypes.forEach((type) => {
    // <button
    //   type="button"
    //   class="btn btn-primary"
    //   data-bs-toggle="button"
    //   autocomplete="off"
    // >
    //   Toggle button
    // </button>;
    const buttonElement = document.createElement("button");
    buttonElement.classList.add("btn");
    buttonElement.classList.add("btn-outline-dark");
    buttonElement.classList.add("offense-type-filter");
    buttonElement.setAttribute("data-bs-toggle", "button");
    buttonElement.setAttribute("name", type);
    const textElement = document.createTextNode(type);
    buttonElement.appendChild(textElement);
    offenseFiltersDivElement.appendChild(buttonElement);

    buttonElement.addEventListener("mouseover", () => {
      d3.selectAll(`.${type.replace(/\s/g, "_")}`)
        .attr("fill", selectedPointColor)
        .attr("d", () => d3.symbol().size(25)());
    });

    buttonElement.addEventListener("mouseout", () => {
      // console.log(`hovering over ${type}`);
      d3.selectAll(`.${type.replace(/\s/g, "_")}`)
        .attr("fill", "white")
        .attr("d", () => d3.symbol().size(5)());
    });
  });

  // Object.keys(hourIdToBins).forEach((id) => {
  //   const buttonElement = document.createElement("button");
  //   buttonElement.classList.add("btn");
  //   buttonElement.classList.add("btn-outline-dark");
  //   buttonElement.classList.add("time-filter");
  //   buttonElement.setAttribute("data-bs-toggle", "button");
  //   buttonElement.setAttribute("name", id);
  //   const textElement = document.createTextNode(
  //     `${hourIdToBins[id][0]} - ${hourIdToBins[id][1]}`
  //   );
  //   buttonElement.appendChild(textElement);
  //   timeFiltersDivElement.appendChild(buttonElement);

  //   buttonElement.addEventListener("mouseover", () => {
  //     // console.log(`hovering over hour ${id}`);
  //     d3.selectAll(`.hour_${id}`)
  //       .attr("fill", selectedPointColor)
  //       .attr("d", () => d3.symbol().size(25)());
  //   });

  //   buttonElement.addEventListener("mouseout", () => {
  //     // console.log(`hovering over hour ${id}`);
  //     d3.selectAll(`.hour_${id}`)
  //       .attr("fill", "white")
  //       .attr("d", () => d3.symbol().size(5)());
  //   });
  // });
}

function initializeMapEventListeners() {
  d3.selectAll(".offense-type-filter").on("click", function (d) {
    // console.log(d);
    const isActive = d.target.classList.contains("active");
    // console.log(isActive);
    if (isActive) {
      filtersSelected["Aggregated Offence Code Group"].add(d.target.name);
    } else {
      filtersSelected["Aggregated Offence Code Group"].delete(d.target.name);
    }
    filterMapData();
    renderMapPoints();
    d.target.dispatchEvent(new Event("mouseover"));
  });

  d3.selectAll(".time-filter").on("click", function (d) {
    const isActive = d.target.classList.contains("active");
    if (isActive) {
      filtersSelected["HOUR"].add(d.target.name);
    } else {
      filtersSelected["HOUR"].delete(d.target.name);
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

  // currData = currData.filter((d) => {
  //   let skip = true;
  //   if (filtersSelected["HOUR"].size === 0) {
  //     return true;
  //   }
  //   for (let hourId of filtersSelected["HOUR"]) {
  //     [hourStart, hourEnd] = hourIdToBins[hourId];
  //     if (hourStart <= +d["HOUR"] && +d["HOUR"] <= hourEnd) {
  //       skip = false;
  //       break;
  //     }
  //   }
  //   return skip !== true;
  // });
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
    data = allData.slice(0, 3619); // 6/15/2015 - 7/15/2015
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
