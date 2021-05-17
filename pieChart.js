const pieWidth = 700;
const pieHeight = 700;
//const margin = { top: 10, right: 10, bottom: 10, left: 10 };
const radius = pieWidth/2 - margin.top;
let pieSVG = null;
let raceData = null;
let pieG = null;
let pieColor = null;
let bostonData = [
    {race: "White", value: 304524},
    {race: "Black/African American", value: 155096},
    {race: "Hispanic", value: 135757},
    {race: "Asian", value: 65613},
    {race: "Other", value: 23389}
];

const pieTooltipD3Element = d3.select('#pie-tooltip');

function createPieChart(){
    pieSVG = d3.select("#pie").append("svg").attr("width", pieWidth).attr("height", pieHeight);    

    // bostonData = raceData[0];
    // console.log(bostonData);

    let pieFunc = d3.pie().value((d) =>  d.value);
    let arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius)
    let pieArcs = pieFunc(bostonData);

    console.log(pieArcs)

    pieColor = d3.scaleOrdinal(d3.schemeTableau10).domain(bostonData);

    pieSVG.append("g")
        .attr('stroke', 'black')
        .attr("stroke-width", "2px")
        .selectAll("path")
        .data(pieArcs)
        .join("path")
            .attr("fill", d => pieColor(d.data.race))
            .attr("d", arc)
            .on("mouseover", function (event,d) {
                d3.select(this)
                .style("stroke", "white")
                .style("stroke-width", "4px")
                console.log(d)
                const tooltipString = `<div>
                <p> Race: ${d.data.race} <p>
                <p> Population: ${d.data.value} <p>
                </div>`

                pieTooltipD3Element
                    .html(`<div><p> ${tooltipString}</p></div>`)
                    .style("left", event.pageX + "px")
                    .style("top", event.pageY + "px")
                    .style("opacity", 1)
                    .style("background", "bisque");

            })
            .on("mouseout", function (event, d){
                d3.select(this)
                .style("stroke", "black")
                .style("stroke-width", "2px")

                pieTooltipD3Element.style("opacity", 0).html("");
            })
        .attr("transform", "translate(" + pieWidth / 2 + "," + pieHeight / 2 + ")")

    
}

function getLegend(){
    pieSVG.append('g')
        .attr("class", "legend")
        .attr("transform", `translate(${pieWidth - margin.right },0)`)
        .attr("text-anchor", "end");
    
    const legend = pieSVG.selectAll("g.legend")
        
    const legendData = legend.selectAll('g').data(bostonData);

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
            return pieColor(d.race);
          });
        e.append("text")
          .attr("x", -24)
          .attr("y", 9.5)
          .attr("dy", "0.35em")
          .text((d) => d.race)
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

    // legend.append("rect")
    //     .attr("x", -19)
    //     .attr("width", 19)
    //     .attr("height", 19)
    //     .attr("fill", (d) => {
    //       console.log(d);
    //       return pieColor(d.race);
    // });
    
    //     legend.append("text")
    //         .attr("x", -24)
    //         .attr("y", 9.5)
    //         .attr("dy", "0.35em")
    //         .text((d) => d.race)
    //         .attr("text-anchor", "end");




function getData(){
    d3.csv(
        "https://raw.githubusercontent.com/6859-sp21/final-project-discover_boston_crime/main/neighborhood_data_race.csv"
      ).then((allData) => {
        raceData = allData;
        console.log("fuck");
        createPieChart();
        getLegend();
    });
}

getData();