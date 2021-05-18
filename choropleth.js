//for solo testing
const albersProjectionChoropleth = d3
  .geoAlbers()
  .scale(210000)
  .rotate([71.057, 0])
  .center([0, 42.313])
  .translate([580 / 2, 700 / 2]);

// let policeDistricts = null;

//data format
//Neighborhood : {Neighborhood: , Value: }
class ChoroplethSVG {
  constructor(svg, data, colorScheme, title, isCrimeCount) {
    this.svg = svg;
    this.data = data;
    this.colorScheme = colorScheme;
    this.title = title;
    this.choropleth = null;
    this.isCrimeCount = isCrimeCount; //boolean for if doing crime count or not

    this.assignColor();
    this.createG();
    this.legend();
    this.drawGeoJson();
  }

  legend() {
    this.svg
      .append("g")
      .attr("transform", `translate(${this.isCrimeCount ? 200: 10}, 20)`)
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
    this.g = this.svg.append("g").attr("transform", `translate(${this.isCrimeCount ? 300 : 100}, 0)`);
    

  }

  assignColor() {
    if (!this.isCrimeCount) {
      const maxVal = 
        Math.ceil(
          d3.max(Array.from(this.data.values()).map((d) => d["Value"])) * 10
        ) / 10;

      this.color = d3.scaleQuantize([0, maxVal], this.colorScheme[Math.max(maxVal * 10, 6)]);
      console.log(maxVal);
    } else {
      const maxVal = d3.max(
        Array.from(this.data.values())
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

  drawGeoJson() {
    const path = d3.geoPath().projection(albersProjectionChoropleth);
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
                .attr("class", "district")
                .attr(
                  "fill",
                  function (d) {
                    //console.log(this.data.get(d.properties.DISTRICT).Value)
                    //console.log(this.color(this.data.get(d.properties.DISTRICT).Value))
                    const color = this.color(
                      this.data.get(d.properties.DISTRICT).Value
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
  choroplethHeight = 700
) {
  choroplethSVG = d3
    .select(container)
    .append("svg")
    .attr("width", choroplethWidth)
    .attr("height", choroplethHeight);

  return choroplethSVG;
}

function initializeChoroplethData(data, label) {
  let neighborhoodToValueMap = new Map();

  for (var i = 0; i < data.length; i++) {
    let neighborhood = data[i]["Neighborhood"];
    let value = data[i][label];
    neighborhoodToValueMap.set(neighborhood, { Value: value });
  }
  return neighborhoodToValueMap;
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
      const whiteMapContainer = document.querySelector("#white-map");
      let whiteChoroplethSVG = initializeChoroplethSVG(
        whiteMapContainer,
        window.innerWidth / 3
      );
      let whiteFormattedData = initializeChoroplethData(
        raceData,
        "White Alone %"
      );
      new ChoroplethSVG(
        whiteChoroplethSVG,
        whiteFormattedData,
        d3.schemeBlues,
        "Percent White Population in District",
        false
      );

      const blackMapContainer = document.querySelector("#black-map");
      let blackChoroplethSVG = initializeChoroplethSVG(
        blackMapContainer,
        window.innerWidth / 3
      );
      let blackFormattedData = initializeChoroplethData(
        raceData,
        "Black/African-American %"
      );
      new ChoroplethSVG(
        blackChoroplethSVG,
        blackFormattedData,
        d3.schemePurples,
        "Percent Black Population in District",
        false
      );

      d3.csv(
        "https://raw.githubusercontent.com/6859-sp21/final-project-discover_boston_crime/main/boston_crimes_per_neighborhood.csv"
      ).then((crimeData) => {
        const totalCrimeMapContainer =
          document.querySelector("#crime-count-map");
        let totalCrimeChoroplethSVG = initializeChoroplethSVG(
          totalCrimeMapContainer,
          window.innerWidth / 2
        );
        let totalCrimeData = initializeChoroplethData(
          crimeData,
          "Total Crimes"
        );
        new ChoroplethSVG(
          totalCrimeChoroplethSVG,
          totalCrimeData,
          d3.schemeGreys,
          "Total Crime",
          true
        );

        const larcenyMapContainer = document.querySelector("#larceny-map");
        let larcenyChoroplethSVG = initializeChoroplethSVG(
          larcenyMapContainer,
          window.innerWidth / 3
        );
        let larcenyCrimeData = initializeChoroplethData(crimeData, "Larceny %");
        new ChoroplethSVG(
          larcenyChoroplethSVG,
          larcenyCrimeData,
          d3.schemeBlues,
          "Larceny Percent of Total Crime",
          false
        );

        const disorderlyConductMapContainer = document.querySelector(
          "#disorderly-conduct-map"
        );
        let disorderlyConductChoroplethSVG = initializeChoroplethSVG(
          disorderlyConductMapContainer,
          window.innerWidth / 3
        );
        let disorderlyConductCrimeData = initializeChoroplethData(
          crimeData,
          "Disorderly Conduct %"
        );
        new ChoroplethSVG(
          disorderlyConductChoroplethSVG,
          disorderlyConductCrimeData,
          d3.schemeOrRd,
          "Disorderly Conduct Percent of Total Crime",
          false
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
