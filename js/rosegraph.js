// MODIFIED FROM https://gist.github.com/3589712

weapons = [
    { name: "Damage",
     value: 50,
     angle: 0},
    { name: "Heat",
        value: 20,
     angle: 30},
    { name: "Weight",
        value: 10,
    angle: 60},
    { name: "Cooldown",
        value: 5,
    angle: 90},
    { name: "Slots",
        value: 3,
    angle: 120},
    { name: "DPS",
        value: 3.2,
    angle: 150}
];

function createRoseGraph(container, data, captiontext){
    // Various visualization size parameters
    var w = 400,
        h = 400,
        r = Math.min(w, h) / 2, // center; probably broken if not square
        p = 20, // padding on outside of major elements
        ip = 34; // padding on inner circle

    // The main SVG visualization element
    var vis = d3.select(container)
        .append("svg:svg")
        .attr("width", w + "px").attr("height", (h + 30) + "px");

    /*
    // Text representing chart tickmarks
    vis.append("svg:g").attr("class", "tickmarks")
        .selectAll("text")
        .data(['damage','heat','weight','cooldown','slots','dps'])
        .enter().append("svg:text")
        .text()
        .attr("dy", "-2px")
        .attr("transform", function(d) {
            var y = visWidth - radiusFunction(d);
            return "translate(" + r + "," + y + ") " })
    */

    // Labels: degree markers
    vis.append("svg:g")
        .attr("class", "labels")
        .selectAll("text")
        .data(data)
        .enter().append("svg:text")
        .attr("dy", "-4px")
        .attr("transform", function(d, i) {
            return "translate(" + r + "," + p + ") rotate(" + (360/6)*i + ",0," + (r-p) + ")"})
        .text(function(d) { return d.name; });

    drawComplexArcs(vis, data, speedToColor, speedText, probArcTextT);

    vis.append("svg:text")
        .text(captiontext)
        .attr("class", "caption")
        .attr("transform", "translate(" + w/2 + "," + (h + 20) + ")");
}



/** Common wind rose code **/

// Function to draw a single arc for the wind rose
// Input: Drawing options object containing
// width: degrees of width to draw (ie 5 or 15)
// from: integer, inner radius
// to: function returning the outer radius
// Output: a function that when called, generates SVG paths.
// It expects to be called via D3 with data objects from totalsToFrequences()
var arc = function(o) {
    return d3.svg.arc()
        .startAngle(function(d) { return (d.angle - o.width) * Math.PI/180; })
        .endAngle(function(d) { return (d.angle + o.width) * Math.PI/180; })
        .innerRadius(o.from)
        .outerRadius(function(d) { return o.to(d) });
};


/** Code for big visualization **/

// Transformation to place a mark on top of an arc
function probArcTextT(d) {
    var tr = probabilityToRadius(d);
    return "translate(" + visWidth + "," + (visWidth-tr) + ")" +
        "rotate(" + d.d + ",0," + tr + ")"; };
function speedArcTextT(d) {
    var tr = speedToRadius(d);
    return "translate(" + visWidth + "," + (visWidth-tr) + ")" +
        "rotate(" + d.d + ",0," + tr + ")"; };

// Return a string representing the wind speed for this datum
function speedText(d) { return d.s < 10 ? "" : d.s.toFixed(0); };
// Return a string representing the probability of wind coming from this direction
function probabilityText(d) { return d.p < 0.02 ? "" : (100*d.p).toFixed(0); };

// Map a wind speed to a color
var speedToColorScale = d3.scale.linear()
    .domain([5, 25])
    .range(["hsl(220, 70%, 90%)", "hsl(220, 70%, 30%)"])
    .interpolate(d3.interpolateHsl);
function speedToColor(d) { return speedToColorScale(d.s); }
// Map a wind probability to a color
var probabilityToColorScale = d3.scale.linear()
    .domain([0, 0.2])
    .range(["hsl(0, 70%, 99%)", "hsl(0, 70%, 40%)"])
    .interpolate(d3.interpolateHsl);
function probabilityToColor(d) { return probabilityToColorScale(d.p); }

// Width of the whole visualization; used for centering
var visWidth = 200;

// Map a wind speed to an outer radius for the chart
var speedToRadiusScale = d3.scale.linear().domain([0, 100]).range([34, visWidth-20]).clamp(true);
function speedToRadius(d) { return d.value + 35; speedToRadiusScale(d.value); }

// Draw a complete wind rose visualization, including axes and center text
// parent: element selector
// plotData:
// colorFunc:
// arcTextFunc:
// complexArcOptions:
// arcTextT:
function drawComplexArcs(parent, plotData, colorFunc, arcTextFunc, arcTextT) {
    var complexArcOptions = {
        width: 36,
        from: 34,
        to: speedToRadius // function to determine outer radius from data
    }

    // Draw the main wind rose arcs
    parent.append("svg:g")
        .attr("class", "arcs")
        .selectAll("path")
        .data(plotData)
        .enter().append("svg:path")
        .attr("d", arc(complexArcOptions))
        .style("fill", "#44ff44")
        .attr("transform", "translate(" + visWidth + "," + visWidth + ")")
        .append("svg:title")
        .text(function(d) { return d.name + ": " + d.value });

    /*
    // Annotate the arcs with speed in text
    if (false) { // disabled: just looks like chart junk
        parent.append("svg:g")
            .attr("class", "arctext")
            .selectAll("text")
            .data(plotData.dirs)
            .enter().append("svg:text")
            .text(arcTextFunc)
            .attr("dy", "-3px")
            .attr("transform", arcTextT);
    }

    // Add the calm wind probability in the center
    var cw = parent.append("svg:g").attr("class", "calmwind")
        .selectAll("text")
        .data([plotData.calm.p])
        .enter();
    cw.append("svg:text")
        .attr("transform", "translate(" + visWidth + "," + visWidth + ")")
        .text(function(d) { return Math.round(d * 100) + "%" });
    cw.append("svg:text")
        .attr("transform", "translate(" + visWidth + "," + (visWidth+14) + ")")
        .attr("class", "calmcaption")
        .text("calm");
    */
}



// Update drawn arcs, etc to the newly selected months
function updateComplexArcs(parent, plotData, colorFunc, arcTextFunc, complexArcOptions, arcTextT) {
    var complexArcOptions = {
        width: 36,
        from: 34,
        to: speedToRadius // function to determine outer radius from data
    }

    // Update the arcs' shape and color
    parent.select("g.arcs").selectAll("path")
        .data(plotData)
        .transition().duration(200)
        .style("fill", "#44ff44")
        .attr("d", arc(complexArcOptions));

    // Update the arcs' title tooltip
    parent.select("g.arcs").selectAll("path").select("title")
        .text(function(d) { return d.name + ": " + d.value });
}

// Draw a big wind rose, for the visualization
// windroseData:
// container:
// captionText:
function drawBigWindrose(windroseData, container, captionText) {
    // Various visualization size parameters
    var w = 400,
        h = 400,
        r = Math.min(w, h) / 2, // center; probably broken if not square
        p = 20, // padding on outside of major elements
        ip = 34; // padding on inner circle

    // The main SVG visualization element
    var vis = d3.select(container)
        .append("svg:svg")
        .attr("width", w + "px").attr("height", (h + 30) + "px");

    // Set up axes: circles whose radius represents probability or speed
    if (container == "#windrose") {
        var ticks = d3.range(0.025, 0.151, 0.025);
        var tickmarks = d3.range(0.05,0.101,0.05);
        var radiusFunction = probabilityToRadiusScale;
        var tickLabel = function(d) { return "" + (d*100).toFixed(0) + "%"; }
    } else {
        var ticks = d3.range(5, 20.1, 5);
        var tickmarks = d3.range(5, 15.1, 5);
        var radiusFunction = speedToRadiusScale;
        var tickLabel = function(d) { return "" + d + "kts"; }
    }
    // Circles representing chart ticks
    vis.append("svg:g")
        .attr("class", "axes")
        .selectAll("circle")
        .data(ticks)
        .enter().append("svg:circle")
        .attr("cx", r).attr("cy", r)
        .attr("r", radiusFunction);
    // Text representing chart tickmarks
    vis.append("svg:g").attr("class", "tickmarks")
        .selectAll("text")
        .data(tickmarks)
        .enter().append("svg:text")
        .text(tickLabel)
        .attr("dy", "-2px")
        .attr("transform", function(d) {
            var y = visWidth - radiusFunction(d);
            return "translate(" + r + "," + y + ") " })

    // Labels: degree markers
    vis.append("svg:g")
        .attr("class", "labels")
        .selectAll("text")
        .data(d3.range(30, 361, 30))
        .enter().append("svg:text")
        .attr("dy", "-4px")
        .attr("transform", function(d) {
            return "translate(" + r + "," + p + ") rotate(" + d + ",0," + (r-p) + ")"})
        .text(function(dir) { return dir; });

    var rollup = rollupForMonths(windroseData, selectedMonthControl.selected());
    if (container == "#windrose") {
    drawComplexArcs(vis, rollup, speedToColor, speedText, windroseArcOptions, probArcTextT);
    vis.append("svg:text")
        .text(captionText)
        .attr("class", "caption")
        .attr("transform", "translate(" + w/2 + "," + (h + 20) + ")");
}
}

