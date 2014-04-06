$(document).ready(function () {
    // Wrap the table in a jQuery object, we'll use this multiple places later
    var $table = $('.ediTable');

    // Set up buttons to save and clear table state
    $('#save').click(function () {
        localStorage.setItem('ediTable', $table.html());
    });

    $('#clear').click(function () {
        localStorage.clear('ediTable');
        location.reload();
    });

    // Add a placeholder row to the end of the dummy data table on page load
    $table.append('<tr>\
                <td class="epic" contenteditable="true">Add new text here...</td>\
                <td class="value" contenteditable="true">0</td>\
                <td class="value" contenteditable="true">0</td>\
                <td class="value" contenteditable="true">0</td>\
                </tr>');

    // Add a new row to the table when the user clicks on the last row
    // TODO add a button to do this as well
    $(document).on("focus", '.ediTable tbody tr:last-child', function () {
        //append the new row here.
        var $table = $(".ediTable");
        $table.append('<tr>\
                <td class="epic" contenteditable="true">Add new text here...</td>\
                <td class="value" contenteditable="true">0</td>\
                <td class="value" contenteditable="true">0</td>\
                <td class="value" contenteditable="true">0</td>\
                </tr>');
    });

    // TODO let users delete rows somehow

    // If we have a table saved in localStorage, use that instead
    if (localStorage.getItem('ediTable')) {
        $table.html(localStorage.getItem('ediTable'));
    }

    // Set up function to gather data from the table
    var getData = function (table) {
        console.log(table);
        var data = [],
            tableRowSelector = table + ' tbody tr';
        console.log(tableRowSelector);

        $(tableRowSelector).each(function (index, tr) {
            var cells = $(tr).find('td');
            var data_object = {
                'epic': cells[0].innerHTML,
                'urgency': parseFloat(cells[1].innerHTML),
                'importance': parseFloat(cells[2].innerHTML),
                'size': parseFloat(cells[3].innerHTML)
            };
            data.push(data_object);
        });
        return data;
    };

    // All d3.js from here on out
    /* 
     * value accessor - returns the value to encode for a given data object.
     * scale - maps value to a visual display encoding, such as a pixel position.
     * map function - maps from data value to display value
     * axis - sets up axis
     */
    // setup x 
    var xValue = function (d) {
        return d.urgency;
    }, // data -> value
        xScale = d3.scale.linear().range([0, width]), // value -> display
        xMap = function (d) {
            return xScale(xValue(d));
        }, // data -> display
        xAxis = d3.svg.axis().scale(xScale).orient("bottom");

    // setup y
    var yValue = function (d) {
        return d.importance;
    }, // data -> value
        yScale = d3.scale.linear().range([height, 0]), // value -> display
        yMap = function (d) {
            return yScale(yValue(d));
        }, // data -> display
        yAxis = d3.svg.axis().scale(yScale).orient("left");

    // setup r
    var dotSize = function (d) {
        return d.size;
    };

    // add the tooltip area to the webpage
    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // scale the data
    xScale.domain([0, 10]);
    yScale.domain([0, 10]);

    // add x-axis and ticks
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .style("fill", "#666")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width / 2)
        .attr("y", 35)
        .style("text-anchor", "middle")
        .style("fill", "#bbb")
        .text("urgency");

    // add y-axis and ticks
    svg.append("g")
        .attr("class", "y axis")
        .style("fill", "#666")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", -25)
        .attr("x", -.5 * width)
        .style("text-anchor", "middle")
        .style("fill", "#bbb")
        .text("importance");

    // add quadrant dividing lines
    svg.append("line")
        .attr("class", "y divider")
        .attr("x1", width / 2 + .5)
        .attr("y1", 0)
        .attr("x2", width / 2 + .5)
        .attr("y2", height)
        .style("stroke", "#bbb");

    svg.append("line")
        .attr("class", "y divider")
        .attr("x1", width + .5)
        .attr("y1", 0)
        .attr("x2", width + .5)
        .attr("y2", height)
        .style("stroke", "#666");

    svg.append("line")
        .attr("class", "x divider")
        .attr("x1", 0)
        .attr("y1", .5)
        .attr("x2", width)
        .attr("y2", .5)
        .style("stroke", "#666");

    svg.append("line")
        .attr("class", "x divider")
        .attr("x1", 0)
        .attr("y1", height / 2 + .5)
        .attr("x2", width)
        .attr("y2", height / 2 + .5)
        .style("stroke", "#bbb");

    // add quadrant labels

    svg.append("text")
        .attr("class", "label")
        .attr("x", width / 4)
        .attr("y", 16)
        .style("text-anchor", "middle")
        .style("fill", "#bbb")
        .text("important goals");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width * 3 / 4)
        .attr("y", 16)
        .style("text-anchor", "middle")
        .style("fill", "#bbb")
        .text("critical activities");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width / 4)
        .attr("y", height / 2 + 16)
        .style("text-anchor", "middle")
        .style("fill", "#bbb")
        .text("distractions");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width * 3 / 4)
        .attr("y", height / 2 + 16)
        .style("text-anchor", "middle")
        .style("fill", "#bbb")
        .text("interruptions");

    // Data object passed in should be an array of objects with .size, .importance and .urgency attributes
    var drawDots = function (data) {
        var svg = d3.select('svg g');
        // Remove all previous dots to properly redraw
        // TODO change this to an animation instead of wipe/redraw
        svg.selectAll(".dot").remove();
        svg.selectAll(".dot")
            .data(data)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("r", function (d) {
                if (d.size === 0) {
                    return 0;
                } else {
                    return 4 + d.size * d.size;
                }
            })
            .attr("cx", xMap)
            .attr("cy", yMap)
            .style("fill", function (d) {
                var colorCat;
                // Color task dots by Eisenhower quadrant
                if (d.urgency < 5 && d.importance < 5) {
                    colorCat = "#fa2121";
                } else if (d.urgency >= 5 && d.importance <= 5) {
                    colorCat = "#ffff8e";
                } else if (d.urgency > 5 && d.importance > 5) {
                    colorCat = "#2c812c";
                } else {
                    colorCat = "#3f3fbf";
                }
                return colorCat;
            })
            .style("stroke", "none")
        // Fade tooltips in and out on mousein, mouseout
        .on("mouseover", function (d) {
            tooltip.transition()
                .duration(400)
                .style("opacity", 1);
            tooltip.html(d.epic + "<br/> (" + xValue(d) + ", " + yValue(d) + ", " + dotSize(d) + ")")
                .style("left", (d3.event.pageX + 5) + "px")
                .style("top", (d3.event.pageY + 5) + "px");
        })
            .on("mouseout", function (d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    };

    drawDots(getData('.ediTable'));

    // Redraw dots when table is edited or loses focus
    $('body').on('focus', '[contenteditable]', function () {
        var $this = $(this);
        $this.data('before', $this.html());
        return $this;
    }).on('blur keyup paste input', '[contenteditable]', function () {
        var $this = $(this);
        if ($this.data('before') !== $this.html()) {
            $this.data('before', $this.html());
            $this.trigger('change');
        }
        drawDots(getData('.ediTable'));
        return $this;
    });
});