let data = [];
let policeDistricts = null;
let selectedDistricts = [];


const width = 700;
const height = 580;
const albersProjection = d3
  .geoAlbers()
  .scale(190000)
  .rotate([71.057, 0])
  .center([0, 42.313])
  .translate([width / 2, height / 2]);

const pointTooltipD3Element = d3.select("#point-tooltip");
const districtTooltip = d3.select("#district-tooltip");

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
    .on("click", function(event, d) {
      

      console.log("Clicked on " + d.properties.ID);
      selectedDistricts.push(d.properties.ID);
    }
    )
    .on("mouseover", function(event, d) {
      console.log(d);
      d3.select(this)
      .style("stroke", "red")
      .style("stroke-width", "3px")
      .style("fill", "blue");

      console.log("Hovering " + d.properties.ID);
      
      //tooltip.transition().duration(50).style("opacity", 0.95);

      districtTooltip.html(`<div><p> ${d.properties.ID} </p><div>`)
      .transition()
        .duration(300)
        .style("opacity", 0.9)
        .style("left", event.pageX + "px")
        .style("top", event.pageY + "px")
        .style("background", "bisque");
      console.log(districtTooltip);
    })
    .on("mouseout", function(event, d) {
      d3.select(this)
      .style("stroke", "white")
      .style("stroke-width", "1px")
      .style("fill", "black");

      districtTooltip.transition().duration("0").style("opacity", 0);
      districtTooltip.style("left", "0px").style("top", "0px");
      districtTooltip.html("");


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
