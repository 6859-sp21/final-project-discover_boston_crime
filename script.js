let data = [];
let currData = [];
let policeDistricts = null;
const offenseTypes = new Set();
const offenseTypesSelected = new Set();

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

const pointTooltipD3Element = d3.select("#point-tooltip");
const filtersDivElement = document.querySelector("#offense-type-filters");

function initializeSvg() {
  svg = d3
    .select("body")
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
          );
      },
      function (update) {
        return update.call((update) =>
          update
            .transition()
            .duration(1000)
            .attr("fill", "black")
            .attr("stroke", "white")
        );
      },
      function (exit) {
        return exit.remove();
      }
    )
    .attr("d", path);
}

function renderPoints() {
  console.log("rendering points");
  const points = g
    .selectAll("path.crimePoints")
    .data(currData, (d) => d["INCIDENT_NUMBER"]);

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
    .attr("fill", "white")
    .on("mouseover", function (event, d) {
      d3.select(this).style("stroke", "yellow");

      pointTooltipD3Element.transition().duration(300).style("opacity", 0.9);
      pointTooltipD3Element
        .transition()
        .duration(300)
        .style("opacity", 0.9)
        .style("left", event.pageX + "px")
        .style("top", event.pageY + "px")
        .style("background", "bisque");
      pointTooltipD3Element.html(`Offense Type: ${d["OFFENSE_CODE_GROUP"]}`);
    })
    .on("mouseout", function (event, d) {
      d3.select(this).style("stroke", "white");
      pointTooltipD3Element.transition().duration("0").style("opacity", 0);
      pointTooltipD3Element.style("left", "0px").style("top", "0px");
      pointTooltipD3Element.html("");
    })
    .attr("d", (d) => d3.symbol().size(30)());
}

function initializeDataTransforms() {
  data.forEach((d) => {
    if (!offenseTypes.has(d["OFFENSE_CODE_GROUP"])) {
      offenseTypes.add(d["OFFENSE_CODE_GROUP"]);
    }
  });
}

function initializeHTMLElements() {
  offenseTypes.forEach((type) => {
    // <label>
    //   <input type="checkbox" class="filter" name="isPop" />
    //   Pop
    // </label>
    const labelElement = document.createElement("label");
    const inputElement = document.createElement("input");
    const textElement = document.createTextNode(type);
    inputElement.type = "checkbox";
    inputElement.classList.add("offense-type-filter");
    inputElement.name = type;
    labelElement.appendChild(inputElement);
    labelElement.appendChild(textElement);
    filtersDivElement.appendChild(labelElement);
  });
}

function initializeEventListeners() {
  d3.selectAll(".offense-type-filter").on("change", function (d) {
    if (d.target.checked) {
      offenseTypesSelected.add(d.target.name);
    } else {
      offenseTypesSelected.delete(d.target.name);
    }
    filterData();
    renderPoints();
  });
}

function filterData() {
  if (offenseTypesSelected.length === 0) {
    currData = data;
    return;
  }
  console.log("filtering data");
  currData = data.filter((d) => {
    let isNeeded = false;
    for (let type of offenseTypesSelected) {
      if (d["OFFENSE_CODE_GROUP"] === type) {
        isNeeded = true;
        break;
      }
    }
    return isNeeded;
  });
}

function getXCoordinate(d) {
  return albersProjection([+d["Long"], +d["Lat"]])[0];
}

function getYCoordinate(d) {
  return albersProjection([+d["Long"], +d["Lat"]])[1];
}

function getData() {
  d3.csv(
    "https://raw.githubusercontent.com/6859-sp21/final-project-discover_boston_crime/main/crime.csv"
  ).then((allData) => {
    data = allData.slice(0, 100);
    currData = data;
    d3.json(
      "https://raw.githubusercontent.com/6859-sp21/final-project-discover_boston_crime/main/data/police_districts.json"
    ).then((topojsonBoston) => {
      policeDistricts = topojsonBoston;
      console.log(policeDistricts);
      initializeDataTransforms();
      initializeSvg();
      initializeHTMLElements();
      initializeEventListeners();
      renderPoints();
    });
  });
}

getData();
