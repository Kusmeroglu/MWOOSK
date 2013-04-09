// MODIFIED FROM https://gist.github.com/3589712

function createRoseGraph(container, captiontext) {
    if ( $.browser.msie && $.browser.version < 9.0){
        $('roseChart').text("Graph not supported in IE version " + $.browser.version);
        return;
    }

    // Width of the whole visualization; used for centering
    var VISWIDTH = 90;
    var PADDING = 35;

    //console.log("creating rose chart");
    var ANGLULARWIDTHOFSECTION = 360/8;
    var ANGULARPADDING = 2;
    var INNERRADIUS = 10;
    var MAXLOOKUP = {
        "Damage":  36,
        "Heat":    13,
        "HPS":     5,
        "Weight":  15,
        "Cooldown":5,
        "Slots":   10,
        "DPS":     8.5,
//        "Ammo/Ton":2000,
        "Range": 2160
    };
    var COLORLOOKUP = {
        "Damage": "#aa0000",
        "Heat":"#ff0000",
        "HPS":"#aaaa00",
        "Weight":"#0000ff",
        "Cooldown":"#0000aa",
        "Slots":"#00ff00",
        "DPS":"#00aa00",
//        "Ammo/Ton":"#00ff00",
        "Range":"#00aaaa"
    };

    var SCALES = {};
    // build linear scales before graph generation (for efficiency)
    for ( var key in MAXLOOKUP ){
        SCALES[key] = d3.scale.linear().domain([0, MAXLOOKUP[key]]).range([INNERRADIUS, VISWIDTH - PADDING]).clamp(true);
    }

    weapons = [
        { name:"Damage",
            value:0, minvalue:0},
        { name:"Heat",
            value:0, minvalue:0},
        { name:"HPS",
            value:0, minvalue:0},
        { name:"Weight",
            value:0, minvalue:0},
        { name:"Slots",
            value:0, minvalue:0},
        { name:"Cooldown",
            value:0, minvalue:0},
        { name:"DPS",
            value:0, minvalue:0},
//        { name:"Ammo/Ton",
//            value:0},
        { name:"Range",
            value:0, minvalue:0}
    ];

    // Various visualization size parameters
    var w = 305,
        h = 190,
        r = Math.min(w, h) / 2, // center; probably broken if not square
        p = PADDING, // padding on outside of major elements
        ip = INNERRADIUS; // padding on inner circle


    /** Common wind rose code **/

    // Function to draw a single arc for the wind rose
    // Input: Drawing options object containing
    // width: degrees of width to draw (ie 5 or 15)
    // from: integer, inner radius
    // to: function returning the outer radius
    // Output: a function that when called, generates SVG paths.
    // It expects to be called via D3 with data objects from totalsToFrequences()
    var arc = function (o) {
        return d3.svg.arc()
            .startAngle(function (d, i) {
                var angle = (i*ANGLULARWIDTHOFSECTION - (o.width/2) + (ANGULARPADDING/2)) * Math.PI / 180;
                return angle;
            })
            .endAngle(function (d, i) {
                var angle = (i*ANGLULARWIDTHOFSECTION + (o.width/2) - (ANGULARPADDING/2)) * Math.PI / 180;
                return angle;
            })
            .innerRadius(o.from)
            .outerRadius(function (d) {
                var radius = o.to(d);
                return radius;
            });
    };

    // Map a weapon value amount to an outer radius for the chart
    function dataToOuterRadius(d) {
        return SCALES[d['name']](d.value);
    }
    // Map a weapon value amount to an inner radius for the chart
    function dataToInnerRadius(d) {
        return SCALES[d['name']](d.minvalue);
    }

    // Draw a complete wind rose visualization, including axes and center text
    // parent: element selector
    // plotData: data to draw
    function drawComplexArcs(parent, plotData) {
        var complexArcOptions = {
            width:ANGLULARWIDTHOFSECTION,
            from:dataToInnerRadius,
            to:dataToOuterRadius // function to determine outer radius from data
        }

        // Draw the main wind rose arcs
        parent.append("svg:g")
            .attr("class", "arcs")
            .attr("transform", "translate(15)")
            .selectAll("path")
            .data(plotData)
            .enter().append("svg:path")
            .attr("d", arc(complexArcOptions))
            .style("fill", function(d){return COLORLOOKUP[d['name']]})
            //        .style("stroke", "#000000")
            .attr("transform", "translate(" + VISWIDTH + "," + VISWIDTH + ")")
            .append("svg:title")
            .text(function (d) {
                return d.name + ": " + d.value
            });
    }


    function updateComplexArcs(parent, plotData, captiontext) {
        if ( $.browser.msie && $.browser.version < 9.0){
            return;
        }

        if ( !plotData ){
            return;
        }
        var complexArcOptions = {
            width:ANGLULARWIDTHOFSECTION,
            from:dataToInnerRadius,
            to:dataToOuterRadius // function to determine outer radius from data
        }

        // Update the arcs' shape and color
        parent.select("g.arcs").selectAll("path")
            .data(plotData)
            .transition().duration(200)
            .attr("d", arc(complexArcOptions));

        // Update the arcs' title tooltip
        parent.select("g.arcs").selectAll("path").select("title")
            .text(function (d) {
                return (d.value ? d.value:"");
            });

        parent.selectAll(".caption")
             .text(captiontext);

        // Labels: degree markers
        parent.select(".values")
            .selectAll("text")
            .data(plotData)
            .text(function (d) {
                return (d.value ? d.value:"");
            });
    }

    // The main SVG visualization element
    vis = d3.select(container)
        .append("svg:svg")
        .attr("width", w + "px").attr("height", h + "px");

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

    // Labels: values
    vis.append("svg:g")
        .attr("class", "values")
        .attr("transform", "translate(15)")
        .selectAll("text")
        .data(weapons)
        .enter().append("svg:text")
        .attr("dy", "-4px")
        .attr("text-anchor","middle")
        .attr("transform", function (d, i) {
            var txstring = "translate(" + (r) + "," + (p) + ") rotate(" + (ANGLULARWIDTHOFSECTION) * i + ",0," + (r - (p)) + ")";
            if ( (ANGLULARWIDTHOFSECTION) * i > 100 && (ANGLULARWIDTHOFSECTION) * i < 260 ){
                txstring += " rotate(180, 0, -9)";
            }
            return txstring;
        })
        .text(function (d) {
            return d.value;
        });

    // Labels: labels
    vis.append("svg:g")
        .attr("class", "labels")
        .attr("transform", "translate(15)")
        .selectAll("text")
        .data(weapons)
        .enter().append("svg:text")
        .attr("dy", "-4px")
        .attr("text-anchor","middle")
        .attr("transform", function (d, i) {
            var txstring = "translate(" + (r) + "," + (p - 13) + ") rotate(" + (ANGLULARWIDTHOFSECTION) * i + ",0," + (r - (p - 13)) + ")";
            if ( (ANGLULARWIDTHOFSECTION) * i > 100 && (ANGLULARWIDTHOFSECTION) * i < 260 ){
                txstring += " rotate(180, 0, -9)";
            }
            return txstring;
        })
        .text(function (d) {
            return d.name;
        });


    drawComplexArcs(vis, weapons);

    vis.append("svg:text")
        .text(captiontext)
        .attr("class", "caption")
        .attr("text-anchor","middle")
        .attr("transform", "translate(1, " + (h / 2) + ") rotate(90)");

    var extradata = vis.append("svg:g")
        .attr("transform", "translate(200)");

    // ninja updateRoseChartData into global namespace
    window.updateRoseChartData = function(data, title){
        extradata.selectAll("text").remove();
        updateComplexArcs(vis, data["rosechartdata"], title);
        var offset = 22;
        function addStatToInfoArea(attrname, label){
            if ( data[attrname] ){
                extradata.append("text")
                    .attr('class', 'labels')
                    .text(label)
                    .attr("text-anchor","middle")
                    .attr('transform', "translate(50,"+offset+")");
                extradata.append("text")
                    .text(data[attrname])
                    .attr('class', 'values')
                    .attr("text-anchor","middle")
                    .attr('transform', "translate(50,"+(offset+15)+")");
                offset += 45;
            }
        }
        addStatToInfoArea('ammoper', 'Ammo Per Ton');
        addStatToInfoArea('duration', 'Beam Duration');
        addStatToInfoArea('dpsmaxperton', 'DPS / Ton');
        addStatToInfoArea('dpsmaxperslot', 'DPS / Slot');
        addStatToInfoArea('dpsmaxperheat', 'DPS / Heat');
    }
    // ninja resetRoseChartData into global namespace
    window.resetRoseChartData = function(title){
        extradata.selectAll("text").remove();
        updateComplexArcs(vis, weapons, title);
    }

}


