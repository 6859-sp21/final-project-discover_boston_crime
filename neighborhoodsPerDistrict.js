let neighborhoodsInDistricts = null;
let svgNeighborhoodsPerDistrict = null;
let gNeighborhoodsPerDistrict = null;
const widthNeighborhoodsPerDistrict = window.innerWidth * 0.7;
const heightNeighborhoodsPerDistrict = window.innerHeight;
let pathNeighborhoodsPerDistrict = null;
let allDistrictsNeighborhoodsPerDistrict = [];
let allNeighborhoodsNeighborhoodsPerDistrict = [];
let dataNeighborhoodsPerDistrict = [];
const districtToNeighborhoodMapNPD = {
  A1: ["North End", "West End", "Downtown", "Beacon Hill", "Chinatown", "Bay Village", "Leather District"],
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
let colorNPD = null;

const neighborhoodToDistrictMapNPD = new Map();
const districtsElementNPD = document.querySelector("#police-districts-list");
const neighborhoodsContainerNPD = document.querySelector(
  "#police-districts-neighborhoods"
);

const albersProjectionNeighborhoodsPerDistrict = d3
  .geoAlbers()
  .scale(230000)
  .rotate([71.057, 0])
  .center([0, 42.313])
  .translate([
    widthNeighborhoodsPerDistrict / 2,
    heightNeighborhoodsPerDistrict / 2,
  ]);

function initializeConstantsNeighborhoodsPerDistrict() {
  Object.keys(districtToNeighborhoodMapNPD).forEach((district) => {
    const neighborhoods = districtToNeighborhoodMapNPD[district];
    neighborhoods.forEach((neighborhood) => {
      neighborhoodToDistrictMapNPD[neighborhood] = district;
    });
  });

  const allNeighborhoods = Object.keys(districtToNeighborhoodMapNPD).flatMap(
    (district) => districtToNeighborhoodMapNPD[district]
  );

  colorNPD = d3.scaleOrdinal(d3.schemeTableau10).domain(allNeighborhoods);
}

function initializeHTMLElementsNPD() {
  const numberOfLists = 3;
  const numDistricts = Object.keys(districtToNeighborhoodMapNPD).length;
  const divParentContainers = Array.from({
    length: numDistricts / numberOfLists - 1,
  }).map((_) => document.createElement("div"));
  divParentContainers.forEach((container) => {
    districtsElementNPD.appendChild(container);
  });

  Object.keys(districtToNeighborhoodMapNPD).forEach((district, i) => {
    const districtElement = document.createElement("p");
    districtElement.classList.add("district-button");
    const districtName = document.createTextNode(district);
    districtElement.appendChild(districtName);
    districtElement.addEventListener("mouseover", (d) => {
      console.log(district);
      console.log(`${district}-neighborhood`);
      d.target.classList.add("active");
      d3.selectAll(`.${district}-neighborhood`).attr("fill", (d) => {
        return colorNPD(d.properties["Name"]);
      });
      const neighborhoodsDiv = document.querySelector(
        `.${district}-neighborhood-list`
      );
      neighborhoodsDiv.classList.remove("hidden");
    });
    districtElement.addEventListener("mouseout", (d) => {
      console.log(district);
      console.log(`${district}-neighborhood`);
      d.target.classList.remove("active");
      d3.selectAll(`.${district}-neighborhood`).attr("fill", "black");
      const neighborhoodsDiv = document.querySelector(
        `.${district}-neighborhood-list`
      );
      neighborhoodsDiv.classList.add("hidden");
    });
    divParentContainers[
      Math.floor(i / (numDistricts / numberOfLists))
    ].appendChild(districtElement);
    // districtsElementNPD.appendChild(districtElement);

    // const neighborhoodsSvg = document.createElement("div");
    // neighborhoodsSvg.classList.add("hidden");
    // neighborhoodsSvg.classList.add(`${district}-neighborhood-list`);
    // const neighborhoods = districtToNeighborhoodMapNPD[district];
    // neighborhoods.forEach((neighborhood) => {
    //   const neighborhoodElement = document.createElement("p");
    //   const neighborhoodText = document.createTextNode(neighborhood);
    //   neighborhoodElement.appendChild(neighborhoodText);
    //   neighborhoodsDiv.appendChild(neighborhoodElement);
    // });

    const legend = svgNeighborhoodsPerDistrict
      .append("g")
      .attr("class", `hidden ${district}-neighborhood-list`)
      .attr(
        "transform",
        `translate(${(5 * widthNeighborhoodsPerDistrict) / 6},75)`
      )
      .attr("text-anchor", "end");

    // const svg = d3
    //   .select(neighborhoodsSvg)
    //   .append("svg")
    //   .attr("width", 200)
    //   .attr("height", 100);

    const neighborhoods = districtToNeighborhoodMapNPD[district];

    // const legend = svg
    //   .append("g")
    //   .attr("class", "legend")
    //   .attr("transform", `translate(100,0)`)
    //   .attr("text-anchor", "end");

    const legendData = legend.selectAll("g").data(neighborhoods);
    // .join("g")

    console.log(colorNPD.domain().slice());
    console.dir(legendData);

    const legendUpdate = legendData
      .join(
        (enter) => {
          const e = enter.append("g");
          e.append("rect")
            .attr("x", 15)
            .attr("width", 25)
            .attr("height", 25)
            .attr("fill", (d) => {
              console.log(d);
              return colorNPD(d);
            });
          e.append("text")
            .attr("x", 10)
            .attr("y", 9.5)
            .attr("dy", "0.55em")
            .text((d) => d)
            .attr("text-anchor", "end");
          return e;
        },
        (update) => update,
        (exit) => {
          exit.remove();
        }
      )
      .attr("transform", (d, i) => `translate(0,${i * 30})`);

    // neighborhoodsContainerNPD.appendChild(neighborhoodsSvg);
  });
}

function initializeMapSvg() {
  svgNeighborhoodsPerDistrict = d3
    .select("#neighborhoods-map")
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
    .data(dataNeighborhoodsPerDistrict);

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
            .attr("class", (d) => {
              if ("Neighborhood_ID" in d.properties) {
                console.log(d);
                console.log("neighborhood", d.properties["Name"]);
                return `${
                  neighborhoodToDistrictMapNPD[d.properties["Name"]]
                }-neighborhood`;
              } else {
                console.log(d);
                console.log("district", d.properties["DISTRICT"]);
                return d.properties["DISTRICT"];
              }
            })
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
    dataNeighborhoodsPerDistrict =
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
      offset: 0.5, //how far into the element the handler triggers
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
      initializeConstantsNeighborhoodsPerDistrict();
      initializeMapSvg();
      initializeHTMLElementsNPD();
      initializeScroller();

      console.log("adding mapChoropleth.js in neighborhoodsPerDistrict.js");
      let head = document.getElementsByTagName("head")[0];
      let script = document.createElement("script");
      script.type = "text/javascript";
      script.src = "choropleth.js";
      head.appendChild(script);
    });
  });
}

getNeighborhoodsPerDistrictData();
