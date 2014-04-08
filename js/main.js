$(document).ready(function () {
    // Default vars
    var width = 490, // 490 is a good size for all larger breakpoints
        height = 490,
        top = 30,
        right = 40,
        bottom = 40,
        left = 65,
        tabletBreak = 900, // Needs to match media query for tablet re-layout
        target = '.chartholder', // selector for parent div of chart
        $table = $('.ediTable'); // jQuery object for the editable table (ediTable...get it?)

    // Function to resize table based on window width
    // TODO do this with CSS only
    var resizeTable = function (table) {
        if (innerWidth > tabletBreak) {
            table.css('width', window.innerWidth - parseInt($('.livechart').attr('width')) - parseInt(table.css('margin-right')) - 15);
        } else {
            table.css('width', '85%');
        }
    }

    // d3 Utility Functions
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
        };

    // setup y
    var yValue = function (d) {
        return d.importance;
    }, // data -> value
        yScale = d3.scale.linear().range([height, 0]), // value -> display
        yMap = function (d) {
            return yScale(yValue(d));
        };

    // setup r
    var dotSize = function (d) {
        return d.size;
    };

    // Function to gather data from the ediTable
    // TODO use a csv parser instead of hard-coding
    var getData = function (table) {
        var data = [],
            tableRowSelector = table + ' tbody tr';

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

    // Function to set up initial SVG
    var initChart = function (width, height, top, right, bottom, left, target) {
        // Insert the graph canvas before the element that matches the target selector
        var svg = d3.select("body").insert("svg", target)
            .attr("width", width + left + right)
            .attr("height", height + top + bottom)
            .attr("class", "livechart")
            .append("g")
            .attr("transform", "translate(" + left + "," + top + ")");
        xScale = d3.scale.linear().range([0, width]); // value -> display
        yScale = d3.scale.linear().range([height, 0]); // value -> display
        xAxis = d3.svg.axis().scale(xScale).orient("bottom");
        yAxis = d3.svg.axis().scale(yScale).orient("left");

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
        return svg;
    };

    // Function to erase the existing SVG chart and build a new one with parameterized size and margins
    // TODO make the resizing chart redraw fluidly
    var resizeChart = function (width, height, top, right, bottom, left, remove, target) {
        d3.select(remove).remove();
        init();
    };

    // Function to initialize dots on the chart
    // Data object passed in should be an array of objects with .size, .importance and .urgency attributes
    // Expects one svg element on the page with one child g element that needs dots
    // TODO this is too strict, need to parameterize more
    var initDots = function (data) {
        var svg = d3.select('svg g');
        svg.selectAll(".dot")
            .data(data)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("r", function (d) {
                if (d.size === 0) {
                    return 0;
                } else {
                    if (window.innerWidth > tabletBreak) {
                        return 4 + d.size * d.size;
                    } else {
                        return 4 + d.size * (1.431 * window.innerWidth / 860) * d.size;
                    }
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
            .style("stroke", "none");
        // Return an array of dots
        return svg.selectAll(".dot");
    };

    // Function to Get all current dots and transition them to new location/size.
    // Data object passed in should be an array of objects with .size, .importance and .urgency attributes
    // Expects one svg element on the page with one child g element that needs dots updated
    // TODO this is too strict, need to parameterize more
    var updateDots = function (data) {
        var dots = d3.selectAll('svg g circle');
        dots.data(data)
            .transition()
            .duration(350)
            .attr("r", function (d) {
                if (d.size === 0) {
                    return 0;
                } else {
                    if (window.innerWidth > tabletBreak) {
                        return 4 + d.size * d.size;
                    } else {
                        return 4 + d.size * (1.431 * window.innerWidth / 860) * d.size;
                    }
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
        return dots;
    };

    // Function to add a new row to the table
    var newRow = function ($table) {
        $table.append('<tr>\
                <td class="epic" contenteditable="true">Add new task here...</td>\
                <td class="value" contenteditable="true">0</td>\
                <td class="value" contenteditable="true">0</td>\
                <td class="value" contenteditable="true">0</td>\
                </tr>');
    };


    var deleteRow = function ($table) {
        // TODO let users delete rows somehow
    };


    // Add event handlers and widget support elements

    // add the tooltip area to the webpage
    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Function to bind mouseover/up events to a selection of dots
    var tooltipEvents = function (dots) {
        // Fade tooltips in and out on mousein, mouseout
        dots.on("mouseover", function (d) {
            tooltip.transition()
                .duration(400)
                .style("opacity", 1);
            if (d3.event.toElement.__data__.urgency < 8) {
                tooltip.html(d.epic + "<br/> (" + xValue(d) + ", " + yValue(d) + ", " + dotSize(d) + ")")
                    .style("left", (d3.event.pageX + 5) + "px")
                    .style("top", (d3.event.pageY + 5) + "px");
            } else {
                tooltip.html(d.epic + "<br/> (" + xValue(d) + ", " + yValue(d) + ", " + dotSize(d) + ")")
                    .style("left", (d3.event.pageX - 105) + "px")
                    .style("top", (d3.event.pageY + 5) + "px");
            }

        })
            .on("mouseout", function (d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    };

    // Add a new row to the table when the user clicks on the last row
    // TODO add a button to do this as well
    $(document).on("focus", '.ediTable tbody tr:last-child', function () {
        newRow($table);
    });

    // Set up buttons to save and clear table state
    $('#save').click(function () {
        localStorage.setItem('ediTable', $table.html());
    });

    $('#clear').click(function () {
        localStorage.clear('ediTable');
        location.reload();
    });

    // Update dots when table is edited or loses focus
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
        updateDots(getData('.ediTable'));
        return $this;
    });

    // Actually do stuff!
    
    // Add a placeholder row to the end of the dummy data table on page load
    newRow($table);

    // If we have a table saved in localStorage, use that instead
    if (localStorage.getItem('ediTable')) {
        $table.html(localStorage.getItem('ediTable'));
    }

    // Init chart, return SVG object for main chart building (and updating later)
    var init = function () {
        if (window.innerWidth <= tabletBreak) {
            var svg = initChart(window.innerWidth * .78, window.innerWidth * .78, 30, window.innerWidth * .1, 40, window.innerWidth * .12, target);
        } else {
            var svg = initChart(width, height, top, right, bottom, left, target);
        }
        var dots = initDots(getData('.ediTable'));
        tooltipEvents(dots);
    }

    init();

    // Once the chart is on the page, we can size the table appropriately to sit next to it
    // TODO there's gotta be a way to do this with CSS, right?
    resizeTable($table);

    // On window resize, resize the table and chart
    $(window).resize(function (e) {
        resizeTable($table);
        if (window.innerWidth < tabletBreak) {
            resizeChart(window.innerWidth * .80, window.innerWidth * .80, 30, window.innerWidth * .1, 40, window.innerWidth * .1, '.livechart', '.chartholder');
        } else {
            resizeChart(width, height, top, right, bottom, left, '.livechart', '.chartholder');
        }
    });

});