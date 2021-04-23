//Sources: https://observablehq.com/@d3/grouped-bar-chart

const width = 700;
const height = 600;
const margin = ({top: 10, right: 10, bottom: 40, left: 40})

let data = null;
let currData = null;
let svg = null;

let x0 = null;
let x1 = null;
let y = null;

let yAxis = null;
let xAxis = null;

const ageGroups = ["0-17 years %", "18-34 years %", "35-59 years %", "60 and over  %"];
const neighborhoods = [];
const groupKey = "ageGroup";
let transformedData = [];

const barTooltip = d3.select("#bar-tooltip");


function transformData() {
    ageGroups.flatMap(ageGroup => {
        const newObj = new Object();
        newObj["ageGroup"] = ageGroup
        currData.forEach(d => {
            newObj[d["Neighborhood"]] = d[ageGroup];
        });
        transformedData.push(newObj);
    })

    currData.forEach(d => {
        neighborhoods.push(d["Neighborhood"]);
    })
}


function initializeSvg() {
    svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);;
    
    svg.append("g")
        .selectAll("g")
        .data(transformedData)
        .join("g")
        .attr("transform", d => `translate(${x0(d[groupKey])},0)`)
        .selectAll("rect")
        .data(d => neighborhoods.map(neighborhood => ({key: neighborhood, value: +d[neighborhood], ageGroup: d[groupKey]})))
        .join("rect")
        .attr("x", d => x1(d.key))
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => y(0) - y(d.value))
        .attr("fill", d => color(d.key))
        .on("mouseover", function (event, d) {
            d3.select(this)
                .style("stroke", "white")
                .style("stroke-width", "1px");

            const hoveredNeighborhood = d.key;
            const hoveredAgeGroup = d.ageGroup.split('%')[0].trim();
            const totalPopulation = data.find(x => x.Neighborhood = hoveredNeighborhood)["Total Population"];
            const agePopulation = data.find(x => x.Neighborhood = hoveredNeighborhood)[hoveredAgeGroup];

            const tooltipString = `<div> 
            <p> Neighborhood: ${hoveredNeighborhood} </p>
            <p> Age Group: ${hoveredAgeGroup} </p>
            <p> Percent of Population: ${d.value.toFixed(4)} </p>
            <p> Age Population: ${agePopulation} </p>
            <p> Total Population: ${totalPopulation} </p>
            </div>`
            
            barTooltip
                .html(tooltipString)
                .transition()
                .duration(300)
                .style("opacity", 0.9)
                .style("left", event.pageX + "px")
                .style("top", event.pageY + "px")
                .style("background", "bisque");
        })
        .on("mouseout", function (event, d){
            d3.select(this)
                .style("stroke-width", "0px");

            barTooltip.transition().duration("0").style("opacity", 0);
            barTooltip.style("left", "0px").style("top", "0px");
            barTooltip.html("");
        })
        ;
    
}

function updateAxis() {
    x1 = d3.scaleBand()
    .domain(neighborhoods)
    .rangeRound([0, x0.bandwidth()])
    .padding(0.05)
}

function initializeScales() {
    x0 = d3.scaleBand()
    .domain(ageGroups)
    .rangeRound([margin.left, width - margin.right])
    .paddingInner(0.1)

    x1 = d3.scaleBand()
    .domain(neighborhoods)
    .rangeRound([0, x0.bandwidth()])
    .padding(0.05)

    y = d3.scaleLinear()
    .domain([0, d3.max(transformedData, d => d3.max(neighborhoods, neighborhood => d[neighborhood]))]).nice()
    .rangeRound([height - margin.bottom, margin.top])

    color = d3.scaleOrdinal(d3.schemeTableau10)
    .domain(currData.map((d) => d["Neighborhood"]));
}

function axis() {
    svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(null, "s"))
    .call(g => g.select(".domain").remove())
    .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 3)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .attr("font-size", "16px")
        .text(data.y))
    
    let lowerLabels = ["0-17", "18-34", "35-59", "60 and over"];

    let yAxis = d3.axisBottom(x0).tickSizeOuter(0)
        .tickValues(ageGroups)
        .tickFormat((d, i) => {
                return lowerLabels[i]
        });
        

    svg
        .append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(yAxis)
        .attr("font-size", "16px")
        .call(g => g.select(".domain").remove());
}

function legend() {
    const g = svg
        .append("g")
        .attr("transform", `translate(${width},0)`)
        .attr("text-anchor", "end")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .selectAll("g")
        .data(color.domain().slice())
        .join("g")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);
  
    g.append("rect")
        .attr("x", -19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", color);
  
    g.append("text")
        .attr("x", -24)
        .attr("y", 9.5)
        .attr("dy", "0.35em")
        .text(d => d);
  }

function labels() {
    svg
        .append("text")
        .style("font-size", "16px")
        .call(d3.axisBottom(x0))
        .attr("fill", "black")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .attr("x", width / 2)
        .attr("y", height - margin.bottom/10)
        .text("Age Group (in Years)");

    svg
        .append("text")
        .call(d3.axisLeft(y))
        .attr("transform", `translate(${margin.left/4}, ${height/2.75}) rotate(-90)`)
        
        .attr("text-anchor", "end")
        .attr("fill", "black")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .text("Percent");
}

function getData() {
    d3.csv(
      "https://raw.githubusercontent.com/6859-sp21/final-project-discover_boston_crime/main/neighborhood_data_age.csv"
    ).then((allData) => {
      data = allData;
      currData = data;
      console.log(currData);
      transformData();
      initializeScales();
      initializeSvg();
      axis();
      legend();
      labels();
    });
  }
  
  getData();
  