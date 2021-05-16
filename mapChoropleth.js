let neighborhoodToAgeGroupChoropleth = null;
const AGE_GROUP_CHOROLOPLETH = "18-34 years %";
let dataChoropleth = null;

const widthChoropleth = 700;
const heightChoropleth = 580;

let svgChoropleth = null;
let gChoropleth = null;
console.log(d3.schemePurples);

let colorChoropleth = null;
const choroplethColors = [
  "#f7fbff",
  "#e1edf8",
  "#cadef0",
  "#abcfe6",
  "#82badb",
  "#59a1cf",
  "#3787c0",
  "#1c6aaf",
  "#0b4d94",
  "#08306b",
];

function initializeChoroplethColor() {
  const maxVal = Math.ceil(d3.max(dataChoropleth.map(d => {
    return d[AGE_GROUP_CHOROLOPLETH]
  }))*10)/10;
  

  colorChoropleth =  d3.scaleQuantize(
    [0, maxVal],
    d3.schemeBlues[maxVal*10]
  );

  // colorChoropleth =  d3.scaleSequential()
  //   .domain([0, maxVal])
  //   .interpolator(d3.interpolateBlues);
}

function initializeMapSvgChoropleth() {
  svgChoropleth = d3
    .select("#map-choropleth")
    .append("svg")
    .attr("width", widthChoropleth)
    .attr("height", heightChoropleth);
  
  console.log(svgChoropleth);

  svgChoropleth
    .append("g")
    .attr("transform", "translate(610,20)")
    .append(() => {
      let colorLegendObject = colorLegend({
        color: colorChoropleth,
        title: AGE_GROUP_CHOROLOPLETH,
        width: 260,
        tickFormat: ".2f",
      })
      console.log("FUCK")
      console.log(colorLegendObject.name);
      console.log(colorLegendObject)
      return colorLegendObject
    });

  gChoropleth = svgChoropleth.append("g");

  const path = d3.geoPath().projection(albersProjection);

  const allDistricts = topojson.feature(
    policeDistricts,
    policeDistricts.objects["Police_Districts"]
  ).features;

  let drawDistricts = gChoropleth.selectAll("path").data(allDistricts);

  drawDistricts
    .join(
      function (enter) {
        return enter.append("path").call((enter) =>
          enter
            .transition()
            .duration(1000)
            .attr("fill", (d) => {
              const color = colorChoropleth(
                neighborhoodToAgeGroupChoropleth.get(d.properties.DISTRICT)[
                  AGE_GROUP_CHOROLOPLETH
                ]
              );
              return color;
            })
            .attr("stroke", "white")
            .style("stroke-width", "3px")
            .attr("class", "district")
        );
      },
      function (update) {
        return update;
      },
      function (exit) {
        return exit.remove();
      }
    )
    .attr("d", path);
}

function getDataChoropleth() {
  d3.csv(
    "https://raw.githubusercontent.com/6859-sp21/final-project-discover_boston_crime/main/neighborhood_data_age.csv"
  ).then((allData) => {
    dataChoropleth = allData;
    console.log(dataChoropleth);
    neighborhoodToAgeGroupChoropleth = d3.rollup(
      dataChoropleth,
      (v) => v[0],
      (d) => d["Neighborhood"]
    );
    console.log(neighborhoodToAgeGroupChoropleth);
    initializeChoroplethColor()
    initializeMapSvgChoropleth();
  });
}

getDataChoropleth();

//d3 color legend: https://observablehq.com/@d3/color-legend
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
        .attr("font-weight", "bold")
        .attr("class", "title")
        .text(title)
    );

  function ramp(color, n = 256) {
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d");
    for (let i = 0; i < n; ++i) {
      context.fillStyle = color(i / (n - 1));
      context.fillRect(i, 0, 1, 1);
    }
    return canvas;
  }

  return svg.node();
}


