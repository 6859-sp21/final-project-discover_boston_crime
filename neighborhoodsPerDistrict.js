let neighborhoodsInDistricts = null;
let svgNeighborhoodsPerDistrict = null;
let gNeighborhoodsPerDistrict = null;
const widthNeighborhoodsPerDistrict = 700;
const heightNeighborhoodsPerDistrict = 580;
let pathNeighborhoodsPerDistrict = null;
let allDistrictsNeighborhoodsPerDistrict = [];
let allNeighborhoodsNeighborhoodsPerDistrict = [];
let dataNeighborhodosPerDistrict = [];

const albersProjectionNeighborhoodsPerDistrict = d3
  .geoAlbers()
  .scale(170000)
  .rotate([71.057, 0])
  .center([0, 42.313])
  .translate([
    widthNeighborhoodsPerDistrict / 2,
    heightNeighborhoodsPerDistrict / 2,
  ]);

function initializeMapSvg() {
  svgNeighborhoodsPerDistrict = d3
    .select("#neighborhoods-per-district")
    .append("svg")
    .attr("width", widthNeighborhoodsPerDistrict)
    .attr("height", heightNeighborhoodsPerDistrict);

  gNeighborhoodsPerDistrict = svgNeighborhoodsPerDistrict.append("g");

  pathNeighborhoodsPerDistrict = d3
    .geoPath()
    .projection(albersProjectionNeighborhoodsPerDistrict);

  allDistrictsNeighborhoodsPerDistrict = topojson.feature(
    policeDistricts,
    policeDistricts.objects["Police_Districts"]
  ).features;

  allNeighborhoodsNeighborhoodsPerDistrict = topojson.feature(
    neighborhoodsInDistricts,
    neighborhoodsInDistricts.objects["Boston_Neighborhoods"]
  ).features;
}

function updateMapNeighborhoodsPerDistrict() {
  let drawDistricts = gNeighborhoodsPerDistrict
    .selectAll("path")
    .data(dataNeighborhodosPerDistrict);

  drawDistricts
    .join(
      function (enter) {
        return enter.append("path").call((enter) =>
          enter
            .transition()
            .duration(1000)
            .attr("fill", "black")
            .attr("fill-opacity", (d) => {
              if ("Neighborhood_ID" in d.properties) {
                console.log("neighborhood");
                return "1";
              } else {
                console.log("district");
                return "0";
              }
            })
            .attr("stroke", (d) => {
              if ("Neighborhood_ID" in d.properties) {
                console.log("neighborhood");
                return "white";
              } else {
                console.log("district");
                return "orange";
              }
            })
            .style("stroke-width", (d) => {
              if ("Neighborhood_ID" in d.properties) {
                console.log("neighborhood");
                return "1px";
              } else {
                console.log("district");
                return "3px";
              }
            })
            .attr("class", "district")
        );
      },
      function (update) {
        return update;
      },
      function (exit) {
        return exit.remove();
      }
    )
    .attr("d", pathNeighborhoodsPerDistrict);
}

function initializeScroller() {
  // initialize the scrollama
  let scroller = scrollama();

  // scrollama event handlers
  function handleStepEnter(response) {
    // response = { element, direction, index }
    console.log(`scroller entering`);
    console.log(response);
    // add to color to current step
    response.element.classList.add("is-active");
    dataNeighborhodosPerDistrict =
      response.index === 0
        ? [...allNeighborhoodsNeighborhoodsPerDistrict]
        : [
            ...allNeighborhoodsNeighborhoodsPerDistrict,
            ...allDistrictsNeighborhoodsPerDistrict,
          ];

    updateMapNeighborhoodsPerDistrict();
  }

  function handleStepExit(response) {
    // response = { element, direction, index }
    console.log(`scroller exiting`);
    console.log(response);
    // remove color from current step
    response.element.classList.remove("is-active");
  }

  console.log(`initializing scrollama for neighborhoods per district`);
  // 1. setup the scroller with the bare-bones options
  // 		this will also initialize trigger observations
  // 2. bind scrollama event handlers (this can be chained like below)
  scroller
    .setup({
      step: "#neighborhoods-per-district .description .step",
      debug: true, //set to true to see the offset
      offset: 0.33, //how far into the element the handler triggers
    })
    .onStepEnter(handleStepEnter)
    .onStepExit(handleStepExit);

  // 3. setup resize event
  window.addEventListener("resize", scroller.resize);
}

function getNeighborhoodsPerDistrictData() {
  d3.json(
    "https://raw.githubusercontent.com/6859-sp21/final-project-discover_boston_crime/main/data/police_districts.json"
  ).then((policeDistrictsTopojson) => {
    policeDistricts = policeDistrictsTopojson;
    console.log(policeDistricts);
    d3.json(
      "https://raw.githubusercontent.com/6859-sp21/final-project-discover_boston_crime/main/data/boston_neighborhoods.json"
    ).then((neighborhoodsTopojson) => {
      neighborhoodsInDistricts = neighborhoodsTopojson;
      console.log(neighborhoodsInDistricts);
      initializeScroller();
      initializeMapSvg();

      console.log("adding mapChoropleth.js in neighborhoodsPerDistrict.js");
      let head = document.getElementsByTagName("head")[0];
      let script = document.createElement("script");
      script.type = "text/javascript";
      script.src = "mapChoropleth.js";
      head.appendChild(script);
    });
  });
}

getNeighborhoodsPerDistrictData();
