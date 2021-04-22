let data = [];
let policeDistricts = null;
let selectedDistricts = [];
let tooltip = null;

const width = 700;
const height = 580;
const albersProjection = d3
  .geoAlbers()
  .scale(190000)
  .rotate([71.057, 0])
  .center([0, 42.313])
  .translate([width / 2, height / 2]);

const albersProjection2 = d3.geoAlbers();

function initializeSvg() {
  const svg = d3
    .select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg.append("g");

  const path = d3.geoPath().projection(albersProjection);

  const allDistricts = topojson.feature(
    policeDistricts,
    policeDistricts.objects["Police_Districts"]
  ).features;

  let drawDistricts = g.selectAll("path").data(allDistricts);

  console.log(drawDistricts);

  tooltip = d3.select(".tooltip");

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
      

      console.log(d.target.__data__.properties.ID);
      selectedDistricts.push(d.target.__data__.properties.ID);
    }
    )
    .on("mouseover", function(d, event) {
      d3.select(d.target)
      .style("stroke", "red")
      .style("stroke-width", "3px")
      .style("fill", "blue");

      console.log("Hovering " + d.target.__data__.properties.ID);
      
      //tooltip.transition().duration(50).style("opacity", 0.95);

      tooltip.html('<div><p> ${d.target.__data__.properties.ID} </p><div>')
      .style("left", event.pageX + 10 + "px")
      .style("top", event.pageY - 15 + "px");
      console.log(tooltip);
    })
    .on("mouseout", d=> {
      d3.select(d.target)
      .style("stroke", "white")
      .style("stroke-width", "1px")
      .style("fill", "black");

      tooltip.transition().duration("0").style("opacity", 0);
      tooltip.html("");


    })
    ;

  const points = g.selectAll("path.crimePoints").data(data);

  points
    .join(
      function (enter) {
        return enter.append("path");
      },
      function (update) {
        return update;
      },
      function (exit) {
        exit.call((exit) => {
          exit.remove();
        });
      }
    )
    .attr(
      "transform",
      (d) => `translate(${getXCoordinate(d)}, ${getYCoordinate(d)})`
    )
    .style("fill", "white")
    .attr("d", (d) => d3.symbol().size(6)());
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
