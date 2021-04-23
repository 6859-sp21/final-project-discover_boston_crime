const width = 700;
const height = 600;
const margin = ({top: 10, right: 10, bottom: 20, left: 40})

let data = null;
let currData = null;
let svg = null;

let x0 = null;
let x1 = null;
let y = null;

const ageGroups = ["0-17 years %", "18-34 years %", "35-59 years %", "60 and over  %"];
const neighborhoods = [];
const groupKey = "ageGroup";
let transformedData = [];


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
        .data(d => neighborhoods.map(neighborhood => ({key: neighborhood, value: +d[neighborhood]})))
        .join("rect")
        .attr("x", d => x1(d.key))
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => y(0) - y(d.value))
        .attr("fill", d => color(d.key));
    
    // svg.append("g")
    //     .call(xAxis);
    
    // svg.append("g")
    //     .call(yAxis);
    
    // svg.append("g")
    //     .call(legend);
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

function legend() {
    const g = svg
        .attr("transform", `translate(${width},0)`)
        .attr("text-anchor", "end")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
      .selectAll("g")
      .data(color.domain().slice().reverse())
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
    });
  }
  
  getData();
  