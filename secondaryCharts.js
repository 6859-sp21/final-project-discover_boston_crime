console.log("fuck");
const defaultNeighborhoods = new Set(["Boston"]);
const allNeighborhoods = [];
let currNeighborhoods = [];
let neighborhoodsSelected = new Set();

const barWidth = 700;
const barHeight = 600;
const margin = { top: 10, right: 10, bottom: 20, left: 40 };
const svgs = [];
let sampleData = null;
let barColor = null;
const animationDelay = 500;

let neighborhoodToNeighborhoodNameMap = {
  A1: ["North End", "West End", "Downtown", "Beacon Hill"],
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
  Boston: ["Boston"],
};

const colorScheme = [
  "#a6cee3",
  "#1f78b4",
  "#b2df8a",
  "#33a02c",
  "#fb9a99",
  "#e31a1c",
  "#fdbf6f",
  "#ff7f00",
  "#cab2d6",
  "#6a3d9a",
  "#ffff99",
  "#b15928",
  "#000000",
];
const neighborhoodFiltersDivElement = document.querySelector(
  "#neighborhood-type-filters"
);
const barTooltip = d3.select("#bar-tooltip");

let transition = null;

class SVG {
  constructor(svg, data, labelGroups, bottomAxisLabel, axisLabels) {
    this.svg = svg;
    this.data = data;
    this.labelGroups = labelGroups; // ["0-17", ]
    this.bottomAxisLabel = bottomAxisLabel; //"ageGroup"
    this.axisLabels = axisLabels; // ["0-17", "18-34", "35-59", "60 and over"];

    this.transformedData = [];
    this.transformedCurrData = [];
    this.currData = null;

    this.x0 = null;
    this.x1 = null;
    this.y = null;
    this.g = null;

    this.createG();
    this.setDefaultData();
    this.initializeConstants();
    this.transformData();
    this.initializeScales();
    this.updateBars();
    this.axis();
    this.legend();
    this.labels();
  }

  createG() {
    this.g = this.svg.append("g");
  }

  setDefaultData() {
    // this.currData = this.data.filter((d) => {
    //   for (let neighborhood of defaultNeighborhoods) {
    //     if (d["Neighborhood"] === neighborhood) {
    //       return true;
    //     }
    //   }
    //   return false;
    // });

    this.currData = [];
    this.data.forEach((d) => {
      for (let neighborhood of defaultNeighborhoods) {
        if (d["Neighborhood"] === neighborhood) {
          this.currData.push(Object.assign({}, d));
        }
      }
    });
  }

  initializeConstants() {
    this.labelGroups.flatMap((labelGroup) => {
      const newObj = new Object();
      newObj[this.bottomAxisLabel] = labelGroup;
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
      newObj[this.bottomAxisLabel] = labelGroup;
      this.currData.forEach((d) => {
        newObj[d["Neighborhood"]] = d[labelGroup];
      });
      this.transformedCurrData.push(newObj);
    });
    // this.currNeighborhoods = [];
    // this.currData.forEach((d) => {
    //   this.currNeighborhoods.push(d["Neighborhood"]);
    // });
  }

  initializeScales() {
    this.x0 = d3
      .scaleBand()
      .domain(this.labelGroups)
      .rangeRound([margin.left, barWidth - margin.right])
      .paddingInner(0.1);

    this.x1 = d3
      .scaleBand()
      .domain(currNeighborhoods)
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
      .rangeRound([barHeight - margin.bottom, margin.top]);
  }

  filterData(neighborhoodsSelected) {
    if (neighborhoodsSelected.size === 0) {
      this.setDefaultData();
    } else {
      this.currData = [];
      this.data.forEach((d) => {
        for (let neighborhood of neighborhoodsSelected) {
          if (d["Neighborhood"] === neighborhood) {
            this.currData.push(Object.assign({}, d));
          }
        }
      });
      // this.data.filter((d) => {
      //   for (let neighborhood of neighborhoodsSelected) {
      //     if (d["Neighborhood"] === neighborhood) {
      //       return true;
      //     }
      //   }
      //   for (let neighborhood of defaultNeighborhoods) {
      //     if (d["Neighborhood"] === neighborhood) {
      //       return true;
      //     }
      //   }
      //   return false;
      // });

      //console.log(`neighborhood selected updated`);
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
      .attr("transform", `translate(0,${barHeight - margin.bottom})`)
      .call(xAxis);
  }

  legend() {
    this.svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${barWidth + margin.right * 7},0)`)
      .attr("text-anchor", "end");

    this.updateLegend();
  }

  labels() {
    this.svg
      .append("text")
      .call(d3.axisBottom(this.x0))
      .attr("fill", "black")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("x", barWidth / 2)
      .attr("y", barHeight + margin.bottom)
      .text(`${this.bottomAxisLabel}`);

    this.svg
      .append("text")
      .call(d3.axisLeft(this.y))
      .attr("transform", `translate(0, ${barHeight / 2.25}) rotate(-90)`)
      .attr("text-anchor", "end")
      .attr("fill", "black")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text("Percent");
  }

  update() {
    this.transformData();
    this.updateAxis();
    this.updateBars();
    this.updateLegend();
  }

  updateAxis() {
    this.x1 = d3
      .scaleBand()
      .domain(currNeighborhoods)
      .rangeRound([0, this.x0.bandwidth()])
      .padding(0.05);
  }

  updateBars() {
    const selection = this.g.selectAll("g.group");

    // console.log("selection");
    // console.dir(selection);

    const update = selection.data(this.transformedCurrData, (d, i) => {
      let currNeighborsString = Object.keys(d).join(" ");
      currNeighborsString += i;
      //console.log(`curr neighborhood string ${currNeighborsString}`);
      return currNeighborsString;
    });

    //console.log("update");
    //console.dir(update);

    const update2 = update
      .join(
        (enter) => enter.append("g"),
        (update) => update,
        (exit) => exit.remove()
      )
      .attr(
        "transform",
        (d) => `translate(${this.x0(d[this.bottomAxisLabel])},0)`
      )
      .attr("class", "group")
      .selectAll("rect")
      .data(
        (d) =>
          currNeighborhoods.map((neighborhood) => ({
            key: neighborhood,
            value: +d[neighborhood],
            [this.bottomAxisLabel]: d[this.bottomAxisLabel],
          })),
        (d) => {
          //console.log(`returning unique key ${`${d["key"]}_${d[this.bottomAxisLabel]}`}`);
          return `${d["key"]}_${d[this.bottomAxisLabel]}`;
        }
      );


    //console.log("update2");
    //console.dir(update2);

    update2
      .join(
        (enter) => {
          return enter
            .append("rect")
            .attr("x", (d) => this.x1(d.key))
            .attr("y", (d) => {
              // console.log(d);
              return this.y(d.value);
            })
            .attr("width", this.x1.bandwidth())
            .attr("fill", (d) => {
              return barColor(d.key);
            })
            .call((enter) =>
              enter
                .transition()
                .duration(1000)
                .attr("height", (d) => this.y(0) - this.y(d.value))
            );
        },
        (update) => update,
        (exit) => {
          exit.remove();
        }
      )
      .on(
        "mouseover",
        function (event, d) {
          d3.select(event.target)
            .style("stroke", "black")
            .style("stroke-width", "3px");
          
          
          const hoveredNeighborhood = d.key;
          const groupLabel = d[this.bottomAxisLabel].split("%")[0].trim();

          const dataObject = this.data.find((x) => (x.Neighborhood === hoveredNeighborhood));
          const tooltipString = this.getTooltipString(hoveredNeighborhood, groupLabel, dataObject, d.value);

          barTooltip
            .html(`<div> ${tooltipString} <div>`)
            .transition()
            .duration(300)
            .style("opacity", 0.9)
            .style("left", event.pageX + "px")
            .style("top", event.pageY + "px")
            .style("background", "bisque");

        }.bind(this)
      )
      .on("mouseout", function (event, d) {
        d3.select(this).style("stroke-width", "0px");

        barTooltip.transition().duration("0").style("opacity", 0);
        barTooltip.html("");
      });
  }

  getTooltipString(hoveredNeighborhood, groupLabel, dataObject, value) {
    let resultString = `
    <p class="tooltipp"> Police District: ${hoveredNeighborhood}</p>
    <p class="tooltipp"> Neighborhoods: ${neighborhoodToNeighborhoodNameMap[hoveredNeighborhood]
      .sort()
      .join(", ")} </p>`;

    switch(this.bottomAxisLabel){
      case "Age Group (in Years)": {
        const totalPopulation = dataObject["Total Population"];
        const agePopulation = dataObject[groupLabel];

        resultString += 
            `<p class="tooltipp"> Age Group: ${groupLabel} </p>
            <p class="tooltipp"> Percent of Population: ${(value*100).toFixed(2) + "%"} </p>
            <p class="tooltipp"> Age Population: ${agePopulation} </p>
            <p class="tooltipp"> Total Population: ${totalPopulation} </p>`;
        break;
      }
      case "Race": {
        const totalPopulation = dataObject["Total Population"];
        const racePopulation = dataObject[groupLabel];
        resultString += 
          `<p> Race: ${groupLabel} </p>
          <p> Percent of Population: ${(value*100).toFixed(2) + "%"} </p>
          <p> Race Population: ${racePopulation} </p>
          <p> Total Population: ${totalPopulation} </p>`;

        break;
      }
      case "Poverty Rate by Age": {
        let groupLabelPrefix = groupLabel.split(" ").slice(0,3).join(" ");
        if (groupLabelPrefix == "65 years and") groupLabelPrefix += " over";

        const totalPopulation = dataObject[groupLabelPrefix + " Total"];
        const povertyPopulation = dataObject[groupLabelPrefix + " Total Poverty"];

        resultString += 
          `<p> Age Group: ${groupLabel} </p>
          <p> Percent of Population: ${(value*100).toFixed(2) + "%"} </p>
          <p> Age Poverty Population: ${povertyPopulation} </p>
          <p> Total Age Population: ${totalPopulation} </p>`;
        break;
      }
      case "Family Income Bracket": {
        const totalPopulation = dataObject["Total Families"];
        const incomePopulation = dataObject[groupLabel];

        resultString += 
        `<p> Income Bracket: ${groupLabel} </p>
        <p> Percent of Population: ${(value*100).toFixed(2) + "%"} </p>
        <p> Families in Income Bracket: ${incomePopulation} </p>
        <p> Total Families: ${totalPopulation} </p>`
        break;
      }
      case "Education Attainment": {
        const educationGroupPopulation = dataObject[groupLabel];
        console.log(groupLabel);
        console.log(dataObject[groupLabel]);
        const totalPopulation = dataObject["Total population 25 years and over"];

        resultString += 
        `<p> Highest Education Attained: ${groupLabel} </p>
        <p> Percent of Population: ${(value*100).toFixed(2) + "%"} </p>
        <p> Number of Adults: ${educationGroupPopulation} </p>
        <p> Total Population over 25: ${totalPopulation} </p>`
        break;
      }
      default:
        console.log("ERROR: SHOULD NEVER REACH HERE");
        resultString =  "ERROR";
    }

    return resultString;
  }

  updateLegend() {
    const legend = this.svg.select("g.legend");

    const legendData = legend.selectAll("g").data(
      this.currData.map((d) => d["Neighborhood"]),
      (d, i) => {
        return d;
      }
    );
    // .join("g")

    // console.log(color.domain().slice());
    //console.dir(legendData);

    const legendUpdate = legendData
      .join(
        (enter) => {
          const e = enter.append("g");
          e.append("rect")
            .attr("x", -19)
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", (d) => {
              //console.log(d);
              return barColor(d);
            });
          e.append("text")
            .attr("x", -24)
            .attr("y", 9.5)
            .attr("dy", "0.35em")
            .text((d) => d)
            .attr("text-anchor", "end");
          return e;
        },
        (update) => update,
        (exit) => {
          exit.remove();
          //console.log("exit");
          //console.log(exit);
        }
      )
      .attr("transform", (d, i) => `translate(0,${i * 20})`);
  }
}

function initConstants() {
  sampleData.forEach((d) => {
    allNeighborhoods.push(d["Neighborhood"]);
  });

  currNeighborhoods = Array.from(defaultNeighborhoods);

  barColor = d3
    .scaleOrdinal(colorScheme)
    .domain(sampleData.map((d) => d["Neighborhood"]));
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
      //console.log("adding labels");
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
    currNeighborhoods = Array.from([
      ...neighborhoodsSelected,
      ...defaultNeighborhoods,
    ]);
    svgs.forEach((svg) => {
      svg.filterData(neighborhoodsSelected);
      svg.update();
    });
  });
}

function updateSecondaryCharts() {
  currNeighborhoods = Array.from([
    ...selectedDistricts,
    ...defaultNeighborhoods,
  ]);
  svgs.forEach((svg) => {
    svg.filterData(currNeighborhoods);
    svg.update();
  });
}



function createSvg() {
  const svg = d3
    .select("#side-charts")
    .append("svg")
    .attr("width", barWidth)
    .attr("height", barHeight)
    .attr("class", "bar-viz");

  transition = svg.transition().duration(animationDelay).ease(d3.easeLinear);

  return svg;
}

function getDemographicsData() {
  //age
  d3.csv(
    "https://raw.githubusercontent.com/6859-sp21/final-project-discover_boston_crime/main/neighborhood_data_age.csv"
  ).then((allData) => {
    const svg = createSvg();
    sampleData = allData;
    initConstants();
    // initializeHTMLElements();
    // initializeEventListeners();

    const labelGroups = [
      "0-17 years %",
      "18-34 years %",
      "35-59 years %",
      "60 and over %",
    ];

    let lowerLabels = ["0-17", "18-34", "35-59", "60 and Over"];

    const svgObj = new SVG(
      svg,
      allData,
      labelGroups,
      "Age Group (in Years)",
      lowerLabels
    );
    svgs.push(svgObj);
    //race
    d3.csv(
      "https://raw.githubusercontent.com/6859-sp21/final-project-discover_boston_crime/main/neighborhood_data_race.csv"
    ).then((allData) => {
      const svg = createSvg();
      const labelGroups = [
        "White Alone %",
        "Black/African-American %",
        "Hispanic %",
        "Asian alone %",
        "Other Races %",
      ];
      let lowerLabels = [
        "White Alone",
        "Black/African-American",
        "Hispanic",
        "Asian alone",
        "Other Races",
      ];
      const svgObj = new SVG(svg, allData, labelGroups, "Race", lowerLabels);
      svgs.push(svgObj);
      d3.csv(
        "https://raw.githubusercontent.com/6859-sp21/final-project-discover_boston_crime/main/neighborhood_data_poverty_rate.csv"
      ).then((allData) => {
        const svg = createSvg();
        const labelGroups = [
          "0 to 17 Poverty Rate",
          "18 to 34 Poverty Rate",
          "35 to 64 years Poverty Rate",
          "65 years and over Poverty Rate",
        ];
        let lowerLabels = [
          "0 to 17",
          "18 to 34",
          "35 to 64",
          "65 years and over ",
        ];
        const svgObj = new SVG(
          svg,
          allData,
          labelGroups,
          "Poverty Rate by Age",
          lowerLabels
        );
        svgs.push(svgObj);

        d3.csv(
          "https://raw.githubusercontent.com/6859-sp21/final-project-discover_boston_crime/main/neighborhood_data_family_income.csv"
        ).then((allData) => {
          const svg = createSvg();
          const labelGroups = [
            "$24,999 and under %",
            "$25,000 to $49,999 %",
            "$50,000 to $99,999 %",
            "$100,000+ %",
          ];
          let lowerLabels = [
            "$24,999 and Under",
            "$25,000 to $49,999",
            "$50,000 to $99,999",
            "$100,000+",
          ];
          const svgObj = new SVG(
            svg,
            allData,
            labelGroups,
            "Family Income Bracket",
            lowerLabels
          );
          svgs.push(svgObj);
          d3.csv(
            "https://raw.githubusercontent.com/6859-sp21/final-project-discover_boston_crime/main/neighborhood_data_educational_attainment.csv"
          ).then((allData) => {
            const svg = createSvg();
            const labelGroups = [
              "Less than High School %",
              "High School Graduate or GED %",
              "Associate's or Some College %",
              "Bachelor's Degree %",
              "Master's Degree or more %",
            ];
            let lowerLabels = [
              "Less Than High School",
              "High School Graduate/GED",
              "Associate's/Some College",
              "Bachelor's Degree",
              "Master's Degree/More",
            ];
            const svgObj = new SVG(
              svg,
              allData,
              labelGroups,
              "Education Attainment",
              lowerLabels
            );
            svgs.push(svgObj);
            
          });
        });
      });
    });
  });
}


getDemographicsData();
