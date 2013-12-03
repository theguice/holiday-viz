/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
$(document).ready(function() {

    initDashboard();
//    var start, end, userIds = [21, 22], activeOnly;
//    var summary2 = getSummary(start, end, userIds, activeOnly);


});

var summary;
var userSummary;
var summaryChartData = {'time': [], 'distance': []};

function initDashboard()
{
    var start, end, userIds, activeOnly = 1;
    summary = getSummary(start, end, userIds, activeOnly);
    updateDashboardTable();

    drawDonutChart(summaryChartData['time'], '#donut-by-time', 'overall-trans-mode-by-time', 'donut');
    drawDonutChart(summaryChartData['distance'], '#donut-by-distance', 'overall-trans-mode-by-distance', 'donut');

}

function updateDashboardTable()
{


    var tab = $('#dashboard-table');
    var str = "<table>";
    var header = "";
    var totalTime = 0;
    var totalDistance = 0;
    var averageSpeed = 0;
    var totalPoints = 0;
    for (var i = 0, j = summary.length; i < j; i++)
    {
        var line = summary[i];
        var time = parseFloat(line['total_time_hr']);
        var distance = parseFloat(line['total_distance_mi']);
        var mode = line['trans_mode'];
        if (line['trans_mode'] !== '')
            totalTime += time;
        totalDistance += distance;
        totalPoints += parseInt(['track_count']);

        summaryChartData['time'].push({'name': mode, 'value': time});
        summaryChartData['distance'].push({'name': mode, 'value': distance});

//        summaryChartData['time'][line['trans_mode']] += time;
//        summaryChartData['distance'][line['trans_mode']] += distance;

        var header = "<tr>";
        var body = "<tr>"
        for (var key in line)
        {
            if (line['trans_mode'] !== "Stop")
            {
                if (i === 0)
                {
                    header += "<td>" + key + "</td>";
                }
                body += "<td>" + line[key] + "</td>";
            }
        }
        header += "</tr>";
        body += "</tr>";

        str += (i === 0) ? header : "";
        str += body;



    }

    averageSpeed = Math.round(totalDistance / totalTime * 100) / 100;
    $('#speed-value').text(averageSpeed + " mph");
    $('#distance-value').text(totalDistance + " miles");
    $('#time-value').text(totalTime + " hours");
    $('#count-value').text(totalPoints + " points");



    str += "</table>";
    tab.append(str);
}
function updateCashbaord()
{
    updateDashboardSummary();
    updateDashboardChart();
}

function updateDashboardSummary()
{

}

function updateDashboardChart()
{

}

/**
 * 
 * @param {type} data in [{name: string, value: float}]
 * @param {type} target
 * @param {type} id
 * @param {type} classes
 * @returns {undefined}
 */
function drawDonutChart(data, target, id, classes)
{
    console.log(data);
    var w = parseInt($(target).css('width')),
            h = parseInt($(target).css('height')),
            r = Math.min(w, h) / 2 - 50,
            labelr = r + 30, // radius for label anchor
            color = d3.scale.category20c(),
            donut = d3.layout.pie(),
            arc = d3.svg.arc().innerRadius(r * .6).outerRadius(r);

    var vis = d3.select(target)
            .append("svg:svg")
            .data([data])
            .attr("width", w)
            .attr("height", h)
            .attr("id", id)
            .attr('class', classes);

    var arcs = vis.selectAll("g.arc")
            .data(donut.value(function(d) {
                return d.value
            }))
            .enter().append("svg:g")
            .attr("class", "arc")
            .attr("transform", "translate(" + ((w - r) / 2) + "," + ((h - r)) + ")"
                    );
    arcs.append("svg:path")
            .attr("fill", function(d, i) {
                return color(i);
            })
            .attr("d", arc);

    arcs.append("svg:text")
            .attr("transform", function(d) {
                var c = arc.centroid(d),
                        x = c[0],
                        y = c[1],
                        // pythagorean theorem for hypotenuse
                        h = Math.sqrt(x * x + y * y);

                console.log(c);

                return "translate(" + (x / w * labelr) + ',' +
                        (y / h * labelr) + ")";
            })
            .attr("dy", ".35em")
            .attr("text-anchor", function(d) {
                // are we past the center?
                return (d.endAngle + d.startAngle) / 2 > Math.PI ?
                        "end" : "start";
            })
            .text(function(d, i) {
//                console.log(d);
//                console.log(i);
                return d.data.name;
            });

    arcs.append('svg:circle')
            .attr({'class': 'icon',
                cx: 0,
                cy: 0,
                r: 30
            });
            
            arcs.append('svg:line')
            .attr({'class': 'icon',
                x1: 0,
                y1: 0,
                x2:0,
                y2:20
            });
    /*
     < svg xmlns = "http://www.w3.org/2000/svg" xmlns:xlink = "http://www.w3.org/1999/xlink" version = "1.1" id = "Layer_1" x = "0px" y = "0px" width = "300px" height = "300px" viewBox = "0 0 300 300" enable - background = "new 0 0 300 300" xml:space = "preserve" xmlns:xml = "http://www.w3.org/XML/1998/namespace" >
     < circle fill = "none" stroke = "#000000" stroke - width = "20" stroke - miterlimit = "10" cx = "150" cy = "149.749" r = "118.707" / >
     < line fill = "none" stroke = "#000000" stroke - width = "11" stroke - linecap = "round" stroke - linejoin = "round" stroke - miterlimit = "10" x1 = "150" y1 = "150" x2 = "150" y2 = "72" / >
     < line fill = "none" stroke = "#000000" stroke - width = "11" stroke - linecap = "round" stroke - linejoin = "round" stroke - miterlimit = "10" x1 = "150.423" y1 = "150.423" x2 = "188" y2 = "188" / >
     < /svg>
     */
}