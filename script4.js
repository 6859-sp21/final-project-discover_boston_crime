const defaultNeighborhoods = new Set(["Boston"]);
const allNeighborhoods = [];
const currNeighborhoods = [];

const width = 700;
const height = 600;
const margin = { top: 10, right: 10, bottom: 20, left: 40 };
const svgs = [];

class SVG {
  constructor(svg, data, labelGroups, labelGroupName, axisLabels) {
    this.svg = svg;
    this.data = data;
    this.labelGroups = labelGroups; // ["0-17", ]
    this.labelGroupName = labelGroupName; //"ageGroup"
    this.axisLabels = axisLabels; // ["0-17", "18-34", "35-59", "60 and over"];

    this.transformedData = [];
    this.transformedCurrData = [];
    this.currData = null;

    this.x0 = null;
    this.x1 = null;
    this.y = null;

    setDefaultData();
    initializeConstants();
    transformData();
    initializeScales();
    updateBars();
    axis();
    legend();
  }

  setDefaultData() {
    this.currData = this.data.filter((d) => {
      for (let neighborhood of defaultNeighborhoods) {
        if (d["Neighborhood"] === neighborhood) {
          return true;
        }
      }
      return false;
    });
  }

  initializeConstants() {
    this.labelGroups.flatMap((labelGroup) => {
      const newObj = new Object();
      newObj[labelGroupName] = labelGroup;
      this.data.forEach((d) => {
        newObj[d["Neighborhood"]] = d[labelGroup];
      });
      this.transformedData.push(newObj);
    });
  }

  transformData() {
    this.transformedCurrData = [];
    this.labelGroups.flatMap((labelGroup) => {
      const newObj = new Object();
      newObj[labelGroupName] = labelGroup;
      this.currData.forEach((d) => {
        newObj[d["Neighborhood"]] = d[labelGroup];
      });
      this.transformedCurrData.push(newObj);
    });
    // this.currNeighborhoods = [];
    // this.currData.forEach((d) => {
    //   this.currNeighborhoods.push(d["Neighborhood"]);
    // });
    console.log(`new curr neighbors ${this.currNeighborhoods}`);
  }

  initializeScales() {
    this.x0 = d3
      .scaleBand()
      .domain(this.labelGroups)
      .rangeRound([margin.left, width - margin.right])
      .paddingInner(0.1);

    this.x1 = d3
      .scaleBand()
      .domain(this.currNeighborhoods)
      .rangeRound([0, this.x0.bandwidth()])
      .padding(0.05);

    this.y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(this.transformedData, (d) =>
          d3.max(allNeighborhoods, (neighborhood) => d[neighborhood])
        ),
      ])
      .nice()
      .rangeRound([height - margin.bottom, margin.top]);
  }

  filterData(neighborhoodsSelected) {
    if (neighborhoodsSelected.size === 0) {
      setDefaultData();
    } else {
      this.currData = this.data.filter((d) => {
        for (let neighborhood of neighborhoodsSelected) {
          if (d["Neighborhood"] === neighborhood) {
            return true;
          }
        }
        for (let neighborhood of defaultNeighborhoods) {
          if (d["Neighborhood"] === neighborhood) {
            return true;
          }
        }
        return false;
      });

      console.log(`neighborhood selected updated`);
    }
  }

  axis() {
    this.svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(this.y));

    let xAxis = d3
      .axisBottom(this.x0)
      .tickValues(this.labelGroups)
      .tickFormat((d, i) => {
        return this.axisLabels[i];
      });

    this.svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis);
  }

  legend() {
    const g = this.svg
      .append("g")
      .attr("transform", `translate(${width + margin.right * 7},0)`)
      .attr("text-anchor", "end")
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
      .text((d) => d);
  }
}

function initConstants() {
  data.forEach((d) => {
    allNeighborhoods.push(d["Neighborhood"]);
  });

  color = d3
    .scaleOrdinal(d3.schemeTableau10)
    .domain(data.map((d) => d["Neighborhood"]));
}

function initializeHTMLElements() {
  allNeighborhoods.forEach((type) => {
    // <label>
    //   <input type="checkbox" class="filter" name="isPop" />
    //   Pop
    // </label>
    if (!defaultNeighborhoods.has(type)) {
      const labelElement = document.createElement("label");
      const inputElement = document.createElement("input");
      const textElement = document.createTextNode(type);
      inputElement.type = "checkbox";
      inputElement.classList.add("neighborhood-filter");
      inputElement.name = type;
      labelElement.appendChild(inputElement);
      labelElement.appendChild(textElement);
      neighborhoodFiltersDivElement.appendChild(labelElement);
      console.log("adding labels");
    }
  });
}

function initializeEventListeners() {
  d3.selectAll(".neighborhood-filter").on("change", function (d) {
    if (d.target.checked) {
      neighborhoodsSelected.add(d.target.name);
    } else {
      neighborhoodsSelected.delete(d.target.name);
    }
    svgs.forEach((svg) => svg.filterData(neighborhoodsSelected));
  });
}

const svg = d3
  .select(".container")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("class", "bar-viz");

transition = svg.transition().duration(animationDelay).ease(d3.easeLinear);

g = svg.append("g");
