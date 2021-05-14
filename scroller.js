const scrolly = document.querySelector("#scrolly");
const article = scrolly.querySelector("article");
const step = article.querySelectorAll(".step");

// initialize the scrollama
var scroller = scrollama();

// scrollama event handlers
function handleStepEnter(response) {
  // response = { element, direction, index }
  console.log(`scroller entering`);
  console.log(response);
  // add to color to current step
  response.element.classList.add("is-active");
}

function handleStepExit(response) {
  // response = { element, direction, index }
  console.log(`scroller exiting`);
  console.log(response);
  // remove color from current step
  response.element.classList.remove("is-active");
}

function init() {
  console.log(`initializing scrollama`);
  // 1. setup the scroller with the bare-bones options
  // 		this will also initialize trigger observations
  // 2. bind scrollama event handlers (this can be chained like below)
  scroller
    .setup({
      step: "#scrolly article .step",
      debug: true, //set to true to see the offset
      offset: 0.33, //how far into the element the handler triggers
    })
    .onStepEnter(handleStepEnter)
    .onStepExit(handleStepExit);

  // 3. setup resize event
  window.addEventListener("resize", scroller.resize);
}

// kick things off
init();
