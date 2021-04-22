let data = [];
let policeDistricts = null;
let selectedDistricts = [];

const width = 700;
const height = 580;

function initializeSvg() {
  const svg = d3
    .select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const albersProjection = d3
    .geoAlbers()
    .scale(190000)
    .rotate([71.057, 0])
    .center([0, 42.313])
    .translate([width / 2, height / 2]);

  const g = svg.append("g");

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
              
          )
          
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
    .attr("d", path)
    .on("click", d => {
      selectedDistricts.push(d.target.__data__.properties.ID);
    }
    )
    ;
}

function getData() {
  d3.csv(
    "https://raw.githubusercontent.com/6859-sp21/final-project-discover_boston_crime/main/crime.csv"
  ).then((allData) => {
    data = allData.slice(0, 1500);
    d3.json(
      "https://raw.githubusercontent.com/6859-sp21/final-project-discover_boston_crime/main/data/police_districts.json"
    ).then((topojsonBoston) => {
      policeDistricts = topojsonBoston;
      console.log(policeDistricts);
      initializeSvg();
    });
  });
}

getData();
