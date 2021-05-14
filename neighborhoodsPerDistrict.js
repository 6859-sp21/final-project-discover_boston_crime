let neighborhoodsInDistricts = null;
let svgNeighborhoodsPerDistrict = null;
let gNeighborhoodsPerDistrict = null;
const widthNeighborhoodsPerDistrict = 700;
const heightNeighborhoodsPerDistrict = 580;
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

  const path = d3
    .geoPath()
    .projection(albersProjectionNeighborhoodsPerDistrict);

  const allDistricts = topojson.feature(
    policeDistricts,
    policeDistricts.objects["Police_Districts"]
  ).features;

  const allNeighborhoods = topojson.feature(
    neighborhoodsInDistricts,
    neighborhoodsInDistricts.objects["Boston_Neighborhoods"]
  ).features;

  let data = [...allNeighborhoods, ...allDistricts];

  let drawDistricts = gNeighborhoodsPerDistrict.selectAll("path").data(data);

  drawDistricts
    .join(
      function (enter, d) {
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
    .attr("d", path);

  //   g.selectAll("path")
  //     .data(allNeighborhoods)
  //     .enter()
  //     .append("path")
  //     .attr("fill", "#ccc")
  //     .attr("stroke", "#333")
  //     .attr("d", path);
  // .on("mouseover", function (event, d) {
  //   d3.select(this)
  //     .style("stroke", "white")
  //     .style("stroke-width", "3px")
  //     .style("fill", (d) => barColor(d.properties.ID));

  //   let districtToNeighborhoodMap = {
  //     A1: ["North End", "West End", "Downtown", "Beacon Hill"],
  //     A7: ["East Boston"],
  //     A15: ["Charlestown"],
  //     B2: ["Mission Hill", "Roxbury", "Longwood"],
  //     B3: ["Mattapan"],
  //     C6: ["South Boston", "South Boston Waterfront"],
  //     C11: ["Dorchester"],
  //     D4: ["Fenway", "Back Bay", "South End"],
  //     D14: ["Allston", "Brighton"],
  //     E5: ["West Roxbury", "Roslindale"],
  //     E13: ["Jamaica Plain"],
  //     E18: ["Hyde Park"],
  //   };

  //   const tooltipString = `<div>
  //           <p> Police District: ${d.properties.ID} </p>
  //           <p> Neighborhoods: ${districtToNeighborhoodMap[d.properties.ID]
  //             .sort()
  //             .join(", ")} </p>
  //           </div>`;

  //   districtTooltip
  //     .html(`<div><p> ${tooltipString} </p><div>`)
  //     .transition()
  //     .duration(300)
  //     .style("opacity", 0.9)
  //     .style("left", event.pageX + "px")
  //     .style("top", event.pageY + "px")
  //     .style("background", "bisque");
  // })
  // .on("mouseout", function (event, d) {
  //   d3.select(this)
  //     .style("stroke", "white")
  //     .style("stroke-width", "3px")
  //     .style("fill", "black");
  //   districtTooltip.transition().duration("0").style("opacity", 0);
  //   districtTooltip.html("");
  // });
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
      initializeMapSvg();
    });
  });
}

getNeighborhoodsPerDistrictData();
