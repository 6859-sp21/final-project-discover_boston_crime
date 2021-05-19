//for solo testing
// const albersProjectionChoropleth = d3
//   .geoAlbers()
//   .scale(210000)
//   .rotate([71.057, 0])
//   .center([0, 42.313])
//   .translate([580 / 2, 700 / 2]);

// let policeDistricts = null;

// let margin = {left: 10, right: 10, top: 10, bottom: 10}
const buttonClassToSVG = new Map();

//data format
//Neighborhood : {Neighborhood: , Value: }
class ChoroplethSVG {
  constructor(svg, data, colorScheme, label, title, isCrimeCount, containerID) {
    this.svg = svg;
    this.data = data;
    this.colorScheme = colorScheme;
    this.title = title;
    this.label = label;
    this.formattedData = this.formatData();
    this.choropleth = null;
    this.isCrimeCount = isCrimeCount; //boolean for if doing crime count or not
    this.containerID = containerID;
    this.scale = this.isCrimeCount? 70 * window.innerWidth + 75600: 75 * window.innerWidth + 46000;
    this.albersProjection = d3
    .geoAlbers()
    .scale(this.scale)
    .rotate([71.057, 0])
    .center([0, 42.313])
    .translate([580 / 2, 700 / 2]);
    this.assignColor();
    this.createG();
    this.legend();
    this.drawGeoJson();
  }

  //change title, call other methods to change
  changeFilter(newLabel, newTitle) {
    this.title = newTitle;
    this.label = newLabel;
    this.formattedData = this.formatData();
    this.assignColor();
    this.updateGeoJson();
    this.legend();
  }

  updateGeoJson() {
    const allDistricts = topojson.feature(
      policeDistricts,
      policeDistricts.objects["Police_Districts"]
    ).features;

    console.log(this);
    const paths = d3.selectAll(`#${this.containerID} path`);
    console.log(this.g);
    console.log(paths);
    paths.attr(
      "fill",
      function (d) {
        //console.log(this.data.get(d.properties.DISTRICT).Value)
        //console.log(this.color(this.data.get(d.properties.DISTRICT).Value))
        console.log(d);
        const color = this.color(
          this.formattedData.get(d.properties.DISTRICT).Value
        );
        return color;
      }.bind(this)
    );
  }

  formatData() {
    let neighborhoodToValueMap = new Map();

    for (var i = 0; i < this.data.length; i++) {
      let neighborhood = this.data[i]["Neighborhood"];
      let value = this.data[i][this.label];
      neighborhoodToValueMap.set(neighborhood, { Value: value });
    }

    return neighborhoodToValueMap;
  }

  legend() {
    console.log("legend called");
    console.log(`selecting #${this.containerID} .legend`);
    const legend = document.querySelector(`#${this.containerID} .legend`);
    console.log(legend);
    if (legend != null) {
      legend.remove();
      console.log("removing legend");
    }

    this.svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${this.isCrimeCount ? window.innerWidth * 0.1 : 10}, 
        ${this.isCrimeCount ? 50 - window.innerHeight * 0.05 : 50 - window.innerHeight * .03})`)
      .append(
        function () {
          return colorLegend({
            color: this.color,
            title: this.title,
            width: 260,
            tickFormat: this.isCrimeCount ? undefined : ".2f",
          });
        }.bind(this)
      );
  }

  createG() {
    this.g = this.svg
      .append("g")
      .attr("transform", `translate(${this.isCrimeCount ? window.innerWidth * 0.1 : -300 + window.innerWidth * .22}, ${-200 + window.innerHeight * .2})`);
  }

  assignColor() {
    if (!this.isCrimeCount) {
      const maxVal =
        Math.ceil(
          d3.max(Array.from(this.formattedData.values()).map((d) => d["Value"])) * 100
        ) / 100;

      this.color = d3.scaleQuantize([0, maxVal], this.colorScheme[8]);
      //console.log(this.formattedData);
    } else {
      const maxVal = d3.max(
        Array.from(this.formattedData.values())
          .slice(1)
          .map((d) => +d["Value"])
      );
      const maxTick = Math.ceil(maxVal / 100) * 100;

      //console.log(this.data)
      //console.log(maxVal)

      this.color = d3.scaleQuantize(
        [0, maxTick],
        this.colorScheme[maxTick / 100]
      );
    }
  }

  // updateGeoJson() {

  // }

  drawGeoJson() {
    const path = d3.geoPath().projection(this.albersProjection);
    const allDistricts = topojson.feature(
      policeDistricts,
      policeDistricts.objects["Police_Districts"]
    ).features;

    let drawDistricts = this.g.selectAll("path").data(allDistricts);

    drawDistricts
      .join(
        function (enter) {
          return enter.append("path").call(
            function (enter) {
              enter
                .transition()
                .duration(1000)
                .attr("stroke", "black")
                .style("stroke-width", "2px")
                .attr("data-district", (d) => {
                  return d.properties.DISTRICT;
                })
                .attr(
                  "fill",
                  function (d) {
                    //console.log(this.data.get(d.properties.DISTRICT).Value)
                    //console.log(this.color(this.data.get(d.properties.DISTRICT).Value))
                    const color = this.color(
                      this.formattedData.get(d.properties.DISTRICT).Value
                    );
                    return color;
                  }.bind(this)
                );
            }.bind(this)
          );
        }.bind(this),
        function (update) {
          return update;
        },
        function (exit) {
          return exit.remove();
        }
      )
      .attr("d", path);
  }
}

function initializeChoroplethSVG(
  container,
  choroplethWidth = 580,
  choroplethHeight = 250 + window.innerHeight * .55
) {
  choroplethSVG = d3
    .select(container)
    .append("svg")
    .attr("width", choroplethWidth)
    .attr("height", choroplethHeight);

  return choroplethSVG;
}

function initializeHTMLElementsChoropleth(
  svg,
  buttonsContainer,
  columnNames,
  defaultSelected,
  isCrime
) {
  columnNames.forEach((column) => {
    const button = document.createElement("div");
    const buttonText = document.createTextNode(column.slice(0,-2));
    button.appendChild(buttonText);
    button.addEventListener("click", (d) => {
      const title = isCrime? column.slice(0,-2) + " Percent of Total Crime" : "Percent " + column.slice(0,-2) + " Population in District";
      svg.changeFilter(column, title);
      const clickedButton = buttonsContainer.querySelector(".clicked");
      console.log(clickedButton);
      if (clickedButton) {
        clickedButton.classList.remove("clicked");
      }
      button.classList.add("clicked");
    });
    button.addEventListener("mouseover", (d) => {
      button.classList.add("active");
    });
    button.addEventListener("mouseout", (d) => {
      button.classList.remove("active");
    });
    if (defaultSelected === column) {
      button.classList.add("clicked");
    }
    buttonsContainer.appendChild(button);
  });
}

function getChoroplethData() {
  d3.json(
    "https://raw.githubusercontent.com/6859-sp21/final-project-discover_boston_crime/main/data/police_districts.json"
  ).then((topojsonBoston) => {
    //console.log(topojsonBoston)
    policeDistricts = topojsonBoston;

    //race
    d3.csv(
      "https://raw.githubusercontent.com/6859-sp21/final-project-discover_boston_crime/main/neighborhood_data_race.csv"
    ).then((raceData) => {
      const raceColumnNames = [
        "White %",
        "Black %",
        "Hispanic %",
        "Asian %",
        "Other %",
      ];

      const containerIDrace1 = "race-map-1";
      const raceSVG1Container = document.querySelector(`#${containerIDrace1}`);
      let raceChoroplethSVG1 = initializeChoroplethSVG(
        raceSVG1Container,
        window.innerWidth / 3
      );
      raceSVG1 = new ChoroplethSVG(
        raceChoroplethSVG1,
        raceData,
        d3.schemeBlues,
        "White %",
        "Percent White Population in District",
        false,
        containerIDrace1
      );
      //add button event listeners to svg
      const race1Buttons = document.querySelector("#buttons-race-1");
      initializeHTMLElementsChoropleth(
        raceSVG1,
        race1Buttons,
        raceColumnNames,
        "White %",
        false
      );

      const containerIDrace2 = "race-map-2";
      const raceSVG2Container = document.querySelector(`#${containerIDrace2}`);
      let raceChoroplethSVG2 = initializeChoroplethSVG(
        raceSVG2Container,
        window.innerWidth / 3
      );
      const raceSVG2 = new ChoroplethSVG(
        raceChoroplethSVG2,
        raceData,
        d3.schemePurples,
        "Black %",
        "Percent Black Population in District",
        false,
        containerIDrace2
      );

      const race2Buttons = document.querySelector("#buttons-race-2");
      initializeHTMLElementsChoropleth(
        raceSVG2,
        race2Buttons,
        raceColumnNames,
        "Black %",
        false
      );

      d3.csv(
        "https://raw.githubusercontent.com/6859-sp21/final-project-discover_boston_crime/main/boston_crimes_per_neighborhood.csv"
      ).then((crimeData) => {
        const crimeColumnNames = [
          "Larceny %",
          "Disorderly Conduct %",
          "Drug Violation %",
          "Vandalism %",
          "Assault %",
          "Firearms and Explosives %",
          "Burglary %",
          "Robbery %",
        ];
        const totalCrimeMapContainer =
          document.querySelector("#crime-count-map");
        let totalCrimeChoroplethSVG = initializeChoroplethSVG(
          totalCrimeMapContainer,
          window.innerWidth / 2
        );
        new ChoroplethSVG(
          totalCrimeChoroplethSVG,
          crimeData,
          d3.schemeBlues,
          "Total Crimes",
          "Total Crime (binned)",
          true,
          "crime-count-map"
        );

        const containerIDcrime1 = "crime-type-map-1";
        const crimeMapContainer1 = document.querySelector(
          `#${containerIDcrime1}`
        );
        let crimeMapChoroplethSVG1 = initializeChoroplethSVG(
          crimeMapContainer1,
          window.innerWidth / 3
        );
        const crimeMapSVG1 = new ChoroplethSVG(
          crimeMapChoroplethSVG1,
          crimeData,
          d3.schemeBlues,
          "Larceny %",
          "Larceny Percent of Total Crime",
          false,
          containerIDcrime1
        );
        const crime1Buttons = document.querySelector("#buttons-crime-type-1");
        initializeHTMLElementsChoropleth(
          crimeMapSVG1,
          crime1Buttons,
          crimeColumnNames,
          "Larceny %",
          true
        );

        const containerIDcrime2 = "crime-type-map-2";
        const crimeMapContainer2 = document.querySelector(
          `#${containerIDcrime2}`
        );
        let crimeMapChoroplethSVG2 = initializeChoroplethSVG(
          crimeMapContainer2,
          window.innerWidth / 3
        );

        const crimeMapSVG2 = new ChoroplethSVG(
          crimeMapChoroplethSVG2,
          crimeData,
          d3.schemeOrRd,
          "Disorderly Conduct %",
          "Disorderly Conduct Percent of Total Crime",
          false,
          containerIDcrime2
        );

        const crime2Buttons = document.querySelector("#buttons-crime-type-2");
        initializeHTMLElementsChoropleth(
          crimeMapSVG2,
          crime2Buttons,
          crimeColumnNames,
          "Disorderly Conduct %",
          true
        );

        console.log("adding pieChart.js in choropleth.js");
        let head = document.getElementsByTagName("head")[0];
        let script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "pieChart.js";
        head.appendChild(script);
      });
    });
  });
}

getChoroplethData();

function colorLegend({
  color,
  title,
  tickSize = 6,
  width = 320,
  height = 44 + tickSize,
  marginTop = 18,
  marginRight = 0,
  marginBottom = 16 + tickSize,
  marginLeft = 0,
  ticks = width / 64,
  tickFormat,
  tickValues,
} = {}) {
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .style("overflow", "visible")
    .style("display", "block");

  let tickAdjust = (g) =>
    g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
  let x;

  // Continuous
  if (color.interpolate) {
    const n = Math.min(color.domain().length, color.range().length);

    x = color
      .copy()
      .rangeRound(
        d3.quantize(d3.interpolate(marginLeft, width - marginRight), n)
      );

    svg
      .append("image")
      .attr("x", marginLeft)
      .attr("y", marginTop)
      .attr("width", width - marginLeft - marginRight)
      .attr("height", height - marginTop - marginBottom)
      .attr("preserveAspectRatio", "none")
      .attr(
        "xlink:href",
        ramp(
          color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))
        ).toDataURL()
      );
  }

  // Sequential
  else if (color.interpolator) {
    x = Object.assign(
      color
        .copy()
        .interpolator(d3.interpolateRound(marginLeft, width - marginRight)),
      {
        range() {
          return [marginLeft, width - marginRight];
        },
      }
    );

    svg
      .append("image")
      .attr("x", marginLeft)
      .attr("y", marginTop)
      .attr("width", width - marginLeft - marginRight)
      .attr("height", height - marginTop - marginBottom)
      .attr("preserveAspectRatio", "none")
      .attr("xlink:href", ramp(color.interpolator()).toDataURL());

    // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
    if (!x.ticks) {
      if (tickValues === undefined) {
        const n = Math.round(ticks + 1);
        tickValues = d3
          .range(n)
          .map((i) => d3.quantile(color.domain(), i / (n - 1)));
      }
      if (typeof tickFormat !== "function") {
        tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
      }
    }
  }

  // Threshold
  else if (color.invertExtent) {
    const thresholds = color.thresholds
      ? color.thresholds() // scaleQuantize
      : color.quantiles
      ? color.quantiles() // scaleQuantile
      : color.domain(); // scaleThreshold

    const thresholdFormat =
      tickFormat === undefined
        ? (d) => d
        : typeof tickFormat === "string"
        ? d3.format(tickFormat)
        : tickFormat;

    x = d3
      .scaleLinear()
      .domain([-1, color.range().length - 1])
      .rangeRound([marginLeft, width - marginRight]);

    svg
      .append("g")
      .selectAll("rect")
      .data(color.range())
      .join("rect")
      .attr("x", (d, i) => x(i - 1))
      .attr("y", marginTop)
      .attr("width", (d, i) => x(i) - x(i - 1))
      .attr("height", height - marginTop - marginBottom)
      .attr("fill", (d) => d);

    tickValues = d3.range(thresholds.length);
    tickFormat = (i) => thresholdFormat(thresholds[i], i);
  }

  // Ordinal
  else {
    x = d3
      .scaleBand()
      .domain(color.domain())
      .rangeRound([marginLeft, width - marginRight]);

    svg
      .append("g")
      .selectAll("rect")
      .data(color.domain())
      .join("rect")
      .attr("x", x)
      .attr("y", marginTop)
      .attr("width", Math.max(0, x.bandwidth() - 1))
      .attr("height", height - marginTop - marginBottom)
      .attr("fill", color);

    tickAdjust = () => {};
  }

  svg
    .append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
        .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
        .tickSize(tickSize)
        .tickValues(tickValues)
    )
    .call(tickAdjust)
    .call((g) => g.select(".domain").remove())
    .call((g) =>
      g
        .append("text")
        .attr("x", marginLeft)
        .attr("y", marginTop + marginBottom - height - 6)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        //.attr("font-weight", "bold")
        .attr("font-size", "14px")
        .attr("class", "title")
        .text(title)
    );

  function ramp(color, n = 256) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    for (let i = 0; i < n; ++i) {
      context.fillStyle = color(i / (n - 1));
      context.fillRect(i, 0, 1, 1);
    }
    return canvas;
  }

  return svg.node();
}
