function createChart(id, max, chassis, current){
    $(id).empty();
    var width = $(id).width();
    var height = 40;
    var margin = {top: 5, right: 10, bottom: 15, left: 80};

/*    var x = d3.scale.linear()
        .domain([0, max])
        .range([0, width]);

    // linear color scale
    var colorscale = d3.scale.linear()
        .domain([0,3])
        .range(["steelblue", "brown"])
        .interpolate(d3.interpolateLab);

    var chart = d3.select(id).append("svg")
         .attr("class", "chart")
         .attr("width", width)
         .attr("height", 20);

    chart.selectAll("rect")
         .data([current, chassis, max])
         .enter().append("rect")
         .attr("y", 0)
         .attr("fill", function(d, i) { return colorscale(i); })
         .attr("opacity", .5)
         .attr("width", x)
         .attr("height", 20);
*/

    var chart = bulletChart()
        .width(width - margin.right - margin.left)
        .height(height - margin.top - margin.bottom);

    var vis = d3.select(id).selectAll("svg")
        .data([{"title":"Weight","subtitle":current + "/" + max,"ranges":[chassis,max],"measures":[current],"markers":[current]}])
        .enter().append("svg")
        .attr("class", "bullet")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(chart);

    var title = vis.append("g")
        .attr("text-anchor", "end")
        .attr("transform", "translate(-6," + (height - margin.top - margin.bottom) / 2 + ")");

    title.append("text")
        .attr("class", "title")
        .text(function(d) { return d.title; });

    var subtitle = title.append("text")
        .attr("class", "subtitle")
        .attr("dy", "1.2em")
        .text(function(d) { return d.subtitle; });

    // ninja updateChart into global namespace
    window.updateChart= function(max, chassis, current){
        function randomize(d) {
            d.ranges = [chassis, max] ;
            d.measures = [current];
            d.markers = [current];
            subtitle[0][0].textContent = current + "/" + max;
            return d;
        }
        vis.datum(randomize).call(chart);
    }
}



// Chart design based on the recommendations of Stephen Few. Implementation
// based on the work of Clint Ivy, Jamie Love, and Jason Davies.
// http://projects.instantcognition.com/protovis/bulletchart/
function bulletChart() {
    var orient = "left", // TODO top & bottom
        reverse = false,
        duration = 1000,
        ranges = bulletRanges,
        markers = bulletMarkers,
        measures = bulletMeasures,
        width = 380,
        height = 30,
        tickFormat = null;
// For each small multiple…
    function bullet(g) {
        g.each(function(d, i) {
            var rangez = ranges.call(this, d, i).slice().sort(d3.descending),
                markerz = markers.call(this, d, i).slice().sort(d3.descending),
                measurez = measures.call(this, d, i).slice().sort(d3.descending),
                g = d3.select(this);
// Compute the new x-scale.
            var x1 = d3.scale.linear()
                .domain([0, Math.max(rangez[0], markerz[0], measurez[0])])
                .range(reverse ? [width, 0] : [0, width]);
// Retrieve the old x-scale, if this is an update.
            var x0 = this.__chart__ || d3.scale.linear()
                .domain([0, Infinity])
                .range(x1.range());
// Stash the new scale.
            this.__chart__ = x1;
// Derive width-scales from the x-scales.
            var w0 = bulletWidth(x0),
                w1 = bulletWidth(x1);
// Update the range rects.
            var range = g.selectAll("rect.range")
                .data(rangez);
            range.enter().append("svg:rect")
                .attr("class", function(d, i) { return "range s" + i; })
                .attr("width", w0)
                .attr("height", height)
                .attr("x", reverse ? x0 : 0)
                .transition()
                .duration(duration)
                .attr("width", w1)
                .attr("x", reverse ? x1 : 0);
            range.transition()
                .duration(duration)
                .attr("x", reverse ? x1 : 0)
                .attr("width", w1)
                .attr("height", height);
// Update the measure rects.
            var measure = g.selectAll("rect.measure")
                .data(measurez);
            measure.enter().append("svg:rect")
                .attr("class", function(d, i) { return "measure s" + i; })
                .attr("width", w0)
                .attr("height", height / 2)
                .attr("x", reverse ? x0 : 0)
                .attr("y", height / 4)
                .transition()
                .duration(duration)
                .attr("width", w1)
                .attr("x", reverse ? x1 : 0);
            measure.transition()
                .duration(duration)
                .attr("width", w1)
                .attr("height", height / 2)
                .attr("x", reverse ? x1 : 0)
                .attr("y", height / 4);
// Update the marker lines.
            var marker = g.selectAll("line.marker")
                .data(markerz);
            marker.enter().append("svg:line")
                .attr("class", "marker")
                .attr("x1", x0)
                .attr("x2", x0)
                .attr("y1", height / 6)
                .attr("y2", height * 5 / 6)
                .transition()
                .duration(duration)
                .attr("x1", x1)
                .attr("x2", x1);
            marker.transition()
                .duration(duration)
                .attr("x1", x1)
                .attr("x2", x1)
                .attr("y1", height / 6)
                .attr("y2", height * 5 / 6);
// Compute the tick format.
            var format = tickFormat || x1.tickFormat(8);
// Update the tick groups.
            var tick = g.selectAll("g.tick")
                .data(x1.ticks(8), function(d) {
                    return this.textContent || format(d);
                });
// Initialize the ticks with the old scale, x0.
            var tickEnter = tick.enter().append("svg:g")
                .attr("class", "tick")
                .attr("transform", bulletTranslate(x0))
                .style("opacity", 1e-6);
            tickEnter.append("svg:line")
                .attr("y1", height)
                .attr("y2", height * 7 / 6);
            tickEnter.append("svg:text")
                .attr("text-anchor", "middle")
                .attr("dy", "1em")
                .attr("y", height * 7 / 6)
                .text(format);
// Transition the entering ticks to the new scale, x1.
            tickEnter.transition()
                .duration(duration)
                .attr("transform", bulletTranslate(x1))
                .style("opacity", 1);
// Transition the updating ticks to the new scale, x1.
            var tickUpdate = tick.transition()
                .duration(duration)
                .attr("transform", bulletTranslate(x1))
                .style("opacity", 1);
            tickUpdate.select("line")
                .attr("y1", height)
                .attr("y2", height * 7 / 6);
            tickUpdate.select("text")
                .attr("y", height * 7 / 6);
// Transition the exiting ticks to the new scale, x1.
            tick.exit().transition()
                .duration(duration)
                .attr("transform", bulletTranslate(x1))
                .style("opacity", 1e-6)
                .remove();
        });
        d3.timer.flush();
    }
// left, right, top, bottom
    bullet.orient = function(x) {
        if (!arguments.length) return orient;
        orient = x;
        reverse = orient == "right" || orient == "bottom";
        return bullet;
    };
// ranges (bad, satisfactory, good)
    bullet.ranges = function(x) {
        if (!arguments.length) return ranges;
        ranges = x;
        return bullet;
    };
// markers (previous, goal)
    bullet.markers = function(x) {
        if (!arguments.length) return markers;
        markers = x;
        return bullet;
    };
// measures (actual, forecast)
    bullet.measures = function(x) {
        if (!arguments.length) return measures;
        measures = x;
        return bullet;
    };
    bullet.width = function(x) {
        if (!arguments.length) return width;
        width = x;
        return bullet;
    };
    bullet.height = function(x) {
        if (!arguments.length) return height;
        height = x;
        return bullet;
    };
    bullet.tickFormat = function(x) {
        if (!arguments.length) return tickFormat;
        tickFormat = x;
        return bullet;
    };
    bullet.duration = function(x) {
        if (!arguments.length) return duration;
        duration = x;
        return bullet;
    };
    return bullet;
};
function bulletRanges(d) {
    return d.ranges;
}
function bulletMarkers(d) {
    return d.markers;
}
function bulletMeasures(d) {
    return d.measures;
}
function bulletTranslate(x) {
    return function(d) {
        return "translate(" + x(d) + ",0)";
    };
}
function bulletWidth(x) {
    var x0 = x(0);
    return function(d) {
        return Math.abs(x(d) - x0);
    };
}
