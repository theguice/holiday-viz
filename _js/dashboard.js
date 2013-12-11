var summary;
var userSummary;
/*
 var summaryChartData = {
 'time': [],
 'distance': []
 };*/
var LIMIT = 5;
var totalTime = 0;
var totalDistance = 0;
var averageSpeed = 0;
var totalPoints = 0;
var columnTitles = {
    'track_count': '# of Points',
    'total_distance_m': 'Total Distance',
    'total_distance_mi': 'Total Distance',
    'total_time_s': 'Total Time',
    'total_time_hr': 'Total Time',
    'average_speed_ms': 'Average',
    'average_speed_mph': 'Average Speed'
};
var columnUnits = {
    'track_count': 'points',
    'total_distance_m': 'Meters',
    'total_distance_mi': 'Miles',
    'total_time_s': 'Seconds',
    'total_time_hr': 'Hours',
    'average_speed_ms': 'Meters / Second',
    'average_speed_mph': 'MPH'
};
var transColor = {};
function initDashboard(start, end, userIds) {
    var activeOnly = 1;
    /*summaryChartData = {
     'time': [],
     'distance': []
     };*/
    var colors = [];
    var color = d3.scale.category20c();
    for (var i = 0; i <= 20; i++)
        colors.push(color(i));
    transColor['Walk'] = colors[1];
//    color.get
    transColor['Bike'] = colors[5];
    transColor['Drive'] = colors[8];
    transColor['Fly'] = colors[12];
    transColor['undefined'] = colors[4];
    transColor['Stop'] = colors[16];
    console.log(transColor);
    var summary = getSummary(start, end, userIds, activeOnly, false, true);
    var summaryChartData = prepareSummaryData(summary);
    drawDonutChart(summaryChartData['time'], '#donut-by-distance', 'overall-trans-mode-by-time', 'donut', 'Transportation by Time');
    drawDonutChart(summaryChartData['distance'], '#donut-by-time', 'overall-trans-mode-by-distance', 'donut', 'Transportation by Distance');
    summary = getSummary(start, end, false, true, false, false);
    drawSummaryData(summary, '#general-stats', 'General Stats', false);
    //    updateDashboardTable();

    //Graph code starts here!
    //overall stats

    // overall-user-city-by-distance
    summary = runCustomQuery("select substr(city,1,9) as name, ROUND(sum(distance)*0.000621371) as value from gpx_track where city is not null  and city <>'' group by city order by sum(distance) desc LIMIT " + LIMIT)
    //    console.log("overall-user-city-by-distance", summary)
    drawBarChart(summary, '#city-by-distance', 'overall-user-city-by-distance', 'bar', 'Most Trevled City (Miles)');
    // overall-user-city-by-time
    summary = runCustomQuery("select substr(city,1,9) as name, ROUND(sum(delta_time)*0.000277778) as value from gpx_track where city is not null and city <>'' group by city order by sum(delta_time) desc LIMIT " + LIMIT)
    //    console.log("overall-user-city-by-time", summary)
    drawBarChart(summary, '#city-by-time', 'overall-user-city-by-time', 'bar', 'Longest Traveled City (Hours)');
    //    console.log(summary)
    summary = runCustomQuery("SELECT b.user_id, b.first_name as name,  count(distinct a.city) as value from gpx_track a, gpx_users b  where a.user_id = b.user_id group by b.user_id, b.first_name order by count(distinct city) desc LIMIT " + LIMIT)
    drawBarChart(summary, '#users-by-city-count', 'overall-user-users-by-city-count', 'bar', 'Top City Hoppers');
    summary = runCustomQuery("SELECT b.user_id, b.first_name as name,  round(sum(a.distance) * 0.000621371)  as value from gpx_track a, gpx_users b  where a.user_id = b.user_id group by b.user_id, b.first_name order by sum(a.distance) desc LIMIT " + LIMIT)
    drawBarChart(summary, '#users-by-distance', 'overall-user-users-by-distance', 'bar', 'Furthest Travelers (Miles)');
    summary = runCustomQuery("SELECT b.user_id,  b.first_name as name, ROUND(sum(delta_time)*0.000277778)  as value from gpx_track a, gpx_users b where a.user_id = b.user_id group by b.user_id, b.first_name order by sum(delta_time) desc LIMIT " + LIMIT)
    drawBarChart(summary, '#users-by-time', 'overall-user-users-by-time', 'bar', 'Longest Travelers (Hours)');
    addIconEvents();
    addStatsEvents();
}

function initUserDashboard(userId)
{
    var id = [userId];
    addUserBadge("#user-stat-badge", userId)
    var summary = getSummary(false, false, id, true, false, true);
    console.log(summary);
    var summaryChartData = prepareSummaryData(summary);
    console.log(summaryChartData);
    drawDonutChart(summaryChartData['time'], '#user-donut-by-distance', 'user-trans-mode-by-time', 'donut', 'Transportation by Time');
    drawDonutChart(summaryChartData['distance'], '#user-donut-by-time', 'user-trans-mode-by-distance', 'donut', 'Transportation by Distance');
    summary = getSummary(false, false, id, true, false, false);
    drawSummaryData(summary, '#user-general-stats', 'General Stats', userId);
    //    updateDashboardTable();

    //Graph code starts here!
    //overall stats

    summary = runCustomQuery("select substr(city,1,9) as name, ROUND(sum(distance)*0.000621371) as value from gpx_track where user_id=" + userId + " and city is not null  and city <>'' group by city order by sum(distance) desc LIMIT " + LIMIT);
    drawBarChart(summary, '#user-city-by-distance', 'user-city-by-distance', 'bar', 'Most Trevled City (Miles)');
    summary = runCustomQuery("select substr(city,1,9) as name, ROUND(sum(delta_time)*0.000277778) as value from gpx_track where user_id=" + userId + " and  city is not null and city <>'' group by city order by sum(delta_time) desc LIMIT " + LIMIT);
    drawBarChart(summary, '#user-city-by-time', 'user-city-by-time', 'bar', 'Longest Traveled City (Hours)');
    addIconEvents();
}
function addUserBadge(target, userId)
{
    var user = getUserById(userId);
    $(target).empty();
    $(target).append("<div class='donut-title'>" + user.firstName + " " + user.lastName + "</div><br>")
            .append(formatUserColumnHTML(user));
    $(target).children('.user-column').addClass('user-column-stat').children('.user-button-img').remove();
    $(target).children('.user-column').children('.user-facts').addClass('user-facts-stat').removeClass('user-facts').children('.name').remove();
    $(target).children('.user-column').removeClass('user-column')
}
function addStatsEvents() {
    $('#show-stats-button').unbind().click(function() {
        $('#overall-stats').css('display', 'block').hide().slideDown(500);
    });
    $('.user-stat-button').unbind().click(function() {
//        alert('user stats');
        $('#user-stats').css('display', 'block').hide().slideDown(500);
        var id = parseInt($(this).attr('data-id'));
        console.log('showing user stats for ' + id);
        initUserDashboard(id);
    });
    $('.hide-button').unbind().click(function() {
        $(this).parent().slideUp(500);
    });
    $('#show-landing-button').unbind().click(function() {
        $('#user-selection').slideDown();
    });
}

function drawSummaryData(data, target, title, user_id) {
    $(target).empty().append("<div class='donut-title'>" + title + "</div><br>");
    if (user_id) {
//        drawUserBadge(target, user_id)
    }
    if (data[0]) {
        var line = data[0];
        for (var key in line) {
            var t = (columnTitles[key]) ? columnTitles[key] : "TITLE";
            var unit = (columnUnits[key]) ? columnUnits[key] : "";
            var txt = "<div class='dashboard-entry'><span class='dashboard-title'>" + t + " </span>" + "<span class='dashboard-value'>" + line[key] + " </span><span class='dashboard-unit'>" + unit + "</span></div>";
            if (key !== 'user_id')
                $(target).append(txt);
        }
    }

    var legend = "<div class='dashboard-legend'><span class='legend-title'> Tranportation Legend  &nbsp;&nbsp;&nbsp; </span>"
            + "<span style='color:" + transColor['Stop'] + "'>  " + transModeSymbola['Stop'] + "</span> "
            + "<span style='color:" + transColor['Walk'] + "'>" + transModeSymbola['Walk'] + "</span> "
            + "<span style='color:" + transColor['Bike'] + "'>" + transModeSymbola['Bike'] + "</span> "
            + "<span style='color:" + transColor['Drive'] + "'>" + transModeSymbola['Drive'] + "</span> "
            + "<span style='color:" + transColor['Fly'] + "'>" + transModeSymbola['Fly'] + "</span> "
            + "<span style='color:" + transColor['undefined'] + "'>" + transModeSymbola['undefined'] + "</span> "
            + "</div>";
    $(target).append(legend);
    /*
     averageSpeed = Math.round(totalDistance / totalTime * 100) / 100;
     $('#speed-value').text(averageSpeed + " mph");
     $('#distance-value').text(totalDistance + " miles");
     $('#time-value').text(totalTime + " hours");
     $('#count-value').text(totalPoints + " points");
     */
}

function prepareSummaryData(summary) {
    var summaryChartData = {
        'time': [],
        'distance': []
    };
    for (var i = 0, j = summary.length; i < j; i++) {
        var line = summary[i];
        var time = parseFloat(line['total_time_hr']);
        var distance = parseFloat(line['total_distance_mi']);
        var mode = line['trans_mode'];
        if (line['trans_mode'] !== '')
            totalTime += time;
        totalDistance += distance;
        var temp = parseInt(line['track_count']);
        totalPoints += (temp) ? temp : 0;
        summaryChartData['time'].push({
            'name': mode,
            'value': time
        });
        summaryChartData['distance'].push({
            'name': mode,
            'value': distance
        });
    }
    return summaryChartData;
}

/**
 * @param {type} data in [{name: string, value: float}]
 * @param {type} target
 * @param {type} id
 * @param {type} classes
 * @returns {undefined}
 */
function drawDonutChart(data, target, id, classes, title) {
    console.log(data);
    var total = 0;
    for (var i in data)
    {
        if (data[i])
        {
            console.log(data[i]['value']);
            total += data[i]['value'];
        }
    }
    console.log('total=' + total);
    $(target).empty().css('display', 'inline-block');
    $(target).append("<div class='donut-title'>" + title + "</div>");
    //    alert($(target).children('.donut-title').height());
    var divW = parseInt($(target).width());
    var w = (divW < 100) ? divW * parseInt($(target).parent().width()) / 100 : divW,
            h = parseInt($(target).height()) - 50,
            r = Math.min(w, h) / 2,
            deltaX = (w - 2 * r) / 2,
            deltaY = (h - 2 * r) / 2,
            labelr = r + 30, // radius for label anchor
//            color = d3.scale.category20c(),
            donut = d3.layout.pie(),
            arc = d3.svg.arc().innerRadius(r * .6).outerRadius(r);
    var vis = d3.select(target)
            .append("svg:svg")
            .attr('xmlns', "http://www.w3.org/2000/svg")
            .data([data])
            .attr("width", w)
            .attr("height", h)
            .attr("id", id)
            .attr('class', classes);
    var arcs = vis.selectAll("g.arc")
            .data(donut.value(function(d) {
                return d.value;
            }))
            .enter().append("svg:g")
            .attr("class", function(d, i) {
                //                console.log(d);
                return "arc summary-arc summary-arc-" + d.data.name;
            })
            .attr('data-name', function(d) {
                return d.data.name;
            })
            .attr('data-percentage', function(d, i) {
//                console.log(d);
//                return (d.endAngle - d.startAngle) / 360;
                return d.value / total;
            })
            .attr('data-value', function(d, i) {
//                console.log(d);
                return d.value;
            })
            .attr("transform", "translate(" + (r + deltaX) + "," + (r + deltaY) + ")");
    arcs.append("svg:path")
            .attr("fill", function(d, i) {
                return transColor[d.data.name];
            })
            .attr('d', arc)
            .attr('class', 'summary-path');
    /*
     vis.append('text')
     .text(title)
     .attr({width: w,
     height: 50,
     x: w / 2,
     y: h - 50,
     class: 'donut-title',
     'text-anchor': 'middle'
     
     });
     */
    var fo = vis.append('foreignObject')
            .attr({
                width: r,
                height: r,
                x: w / 2 - r / 2,
                y: h / 2 - r / 2,
                class: 'donut-trans-icon'
            })

            .append('link').attr({
        rel: 'stylesheet',
        href: '_css/main.css'
    });
    vis.select('.donut-trans-icon')
            .append('xhtml:div').attr({
        'class': 'donut-trans-icon-text'
    });
}
/**
 * @param {type} data in [{name: string, value: float}]
 * @param {type} target
 * @param {type} id
 * @param {type} classes
 * @returns {undefined}
 */
function drawBarChart(data, target, id, classes, title)
{

    var w = parseInt($(target).width()) * parseInt($(target).parent().width()) / 100,
            h = parseInt($(target).height()) - 50,
            hW = 100, gap = 10, pad = 10;

    color = d3.scale.category20c()
    barwidth = 1;
    $(target).empty().css('display', 'inline block');
    $(target).append("<div class='donut-title'>" + title + "</div>");
//    console.log(h + "\t" + w);
    //((h - 40 ) /data.length);
    var height = h - 2 * gap;
    var barWidth = (height - gap * data.length) / data.length;
    var width = w - hW - 2 * pad;
    t = h;
    var y = d3.scale.linear().domain([0, data.length]).range([0, height]);
    var x = d3.scale.linear().domain([0, data[0].value]).range([0, width]);
    var color = d3.scale.linear().domain([0, data[0].value]).range(["Red", "Blue"]);

    var barDemo = d3.select(target).
            append("svg:svg").
            attr("width", w).
            attr("height", height)
            .attr("id", id);
    
    barDemo.selectAll("rect").
            data(data).
            enter().
            append("svg:rect")
            .attr({"transform": "translate(" + hW + " , " + pad + " )",
                "y": function(datum, index) {
                    return (barWidth + gap) * index;
                },
                "x": function(datum) {
                    return 0;
                },
                "width": function(datum) {
                    return x(datum.value);
                },
                "height": barWidth,
                "fill": function(datum, index) {
                    if (datum.user_id)
                        return colorScale(datum.user_id);
                    else
                    {
                        var blue = 255 - Math.ceil(datum.value / data[0].value * 175);
                        console.log(blue);
                        return 'rgb(0,0,' + blue + ')'
//                        return 'rgb(0,0,' + (100+ (index / data.length) * 155) + ')';
//                        return color(datum.value);
                    }
                }});
    barDemo.selectAll("text").
            data(data).
            enter().
            append("svg:text")
            .attr({
                y: function(datum, index) {
                    return (barWidth + gap) * index + 2*pad + barWidth / 2 - 2;
                },
//                "transform": "translate(" + hW + ", " + (2 * gap) + " )",
                x: function(datum, index) {
                    // return width - x(datum.value);
                    var dt = x(datum.value);
                    if (dt < 60)
                        return dt + hW + 10;
                    else
                        return dt + hW - 60;
                },
//                "dy": "1.5em",
                "class": "bar-data"
            })
            .text(function(datum) {
                return datum.value;
            });
    barDemo.selectAll("text.yAxis").
            data(data).
            enter().append("svg:text")
            .attr({
                x: pad,
                y: function(datum, index) {
                    return (barWidth + gap) * index + 2*pad + barWidth / 2 - 2;
                },
//                "transform": "translate(" + pad + ", " + (2 * gap) + " )",
                "class": "yAxis bar-header"
            })
            .text(function(datum) {
                return datum.name;
            })
}

function addIconEvents()
{
    $('svg .summary-arc').unbind('mouseenter').unbind('mouseleave');
    $('svg .summary-arc').on('mouseenter', function() {
        var self = $(this);
        var name = self.attr('data-name');
        var fo = self.siblings('.donut-trans-icon');
//        console.log(fo.children('.donut-trans-icon-text').attr('class'));
        var donutIcon = fo.children('.donut-trans-icon-text');
        var perc = Math.round(parseFloat(self.attr('data-percentage')) * 100);
//        donutIcon.empty().append(transModeSymbola[name] + " "+perc);
        var txt = "<span class='donut-trans-icon-symbol'>" + transModeSymbola[name] + "</span><br>"
                + "<span class='donut-trans-icon-value'>" + perc + "%</span>";
        donutIcon.empty().append(txt);
        fo.css('display', 'block');
        donutIcon.css('display', 'block');
        console.log(name);
        self.css('opacity', '.5');
    }).on('mouseleave', function() {
        var self = $(this);
        var name = self.attr('data-name');
//        name = name.toLowerCase();
        console.log(name);
        self.css('opacity', '1');
        var fo = self.siblings('.donut-trans-icon');
//        console.log(fo.children('.donut-trans-icon-text').attr('class'));
        fo.children('.donut-trans-icon-text').css('display', 'none');
//        self.siblings('.donut-trans-icon').css('display', 'none');
    });
}

function getCarSvg() {
    return '<path xmlns="http://www.w3.org/2000/svg" d="M550.463,752.801c-22.197,0-40.184,17.985-40.184,40.182c0,22.194,17.986,40.185,40.184,40.185  c22.193,0,40.182-17.99,40.182-40.185C590.645,770.786,572.656,752.801,550.463,752.801z M550.463,822.243  c-16.164,0-29.26-13.097-29.26-29.261c0-16.163,13.096-29.262,29.26-29.262c16.162,0,29.266,13.099,29.266,29.262  C579.729,809.146,566.625,822.243,550.463,822.243z M554.664,792.982c0-2.322-1.881-4.201-4.201-4.201  c-2.322,0-4.199,1.879-4.199,4.201c0,2.318,1.877,4.199,4.199,4.199C552.783,797.182,554.664,795.301,554.664,792.982z   M542.25,769.007c-4.32,1.479-8.111,4.095-11.027,7.488l14.896,8.412L542.25,769.007z M546.957,818.075l0.75-18.421l-13.701,12.594  C537.594,815.314,542.051,817.396,546.957,818.075z M525.371,796.513c0.682,4.878,2.75,9.31,5.795,12.886l11.875-13.29  L525.371,796.513z M528.537,780.277c-1.994,3.435-3.203,7.372-3.389,11.582l16.961-1.259L528.537,780.277z M558.777,769.042  c-2.604-0.906-5.4-1.401-8.314-1.401c-1.463,0-2.889,0.131-4.283,0.368l6.76,15.499L558.777,769.042z M575.609,796.085  c0.123-1.017,0.193-2.055,0.193-3.103c0-3.979-0.914-7.738-2.547-11.09l-15.096,9.923L575.609,796.085z M552.561,818.23  c4.434-0.364,8.553-1.863,12.045-4.218l-11.764-14.45C552.842,799.562,552.674,810.848,552.561,818.23z M563.486,771.242  l-6.254,14.689l14-7.456C569.191,775.55,566.553,773.082,563.486,771.242z M568.834,810.429c2.549-2.687,4.521-5.929,5.705-9.528  l-17.029-2.925L568.834,810.429z M282.76,749.437c-23.125,0-41.862,18.743-41.862,41.864c0,23.123,18.737,41.866,41.862,41.866  c23.12,0,41.862-18.743,41.862-41.866C324.623,768.18,305.88,749.437,282.76,749.437z M282.76,821.786  c-16.837,0-30.484-13.646-30.484-30.485c0-16.838,13.647-30.486,30.484-30.486c16.839,0,30.487,13.648,30.487,30.486  C313.248,808.141,299.599,821.786,282.76,821.786z M287.138,791.301c0-2.417-1.96-4.375-4.377-4.375  c-2.418,0-4.376,1.958-4.376,4.375c0,2.418,1.958,4.377,4.376,4.377C285.178,795.678,287.138,793.719,287.138,791.301z   M256.618,794.981c0.712,5.083,2.865,9.698,6.038,13.425l12.374-13.844L256.618,794.981z M259.919,778.065  c-2.076,3.578-3.34,7.682-3.532,12.064l17.67-1.309L259.919,778.065z M291.423,766.358c-2.715-0.939-5.626-1.459-8.663-1.459  c-1.521,0-3.01,0.134-4.459,0.383l7.037,16.147L291.423,766.358z M274.203,766.323c-4.503,1.544-8.451,4.266-11.486,7.803  l15.52,8.764L274.203,766.323z M284.946,817.604c4.623-0.376,8.909-1.938,12.548-4.392l-12.253-15.055  C285.241,798.158,285.061,809.912,284.946,817.604z M279.109,817.443l0.782-19.189l-14.276,13.12  C269.356,814.57,273.995,816.738,279.109,817.443z M308.954,794.538c0.133-1.061,0.207-2.142,0.207-3.237  c0-4.142-0.954-8.062-2.655-11.55l-15.722,10.336L308.954,794.538z M296.329,768.654l-6.521,15.304l14.594-7.771  C302.274,773.144,299.522,770.567,296.329,768.654z M301.902,809.478c2.657-2.797,4.707-6.176,5.938-9.926l-17.736-3.047  L301.902,809.478z M608.381,751.213c-2.236-6.908-7.838-6.722-4.291-13.255c2.469-4.554,1.852-6.473-0.574-7.283  c0.346-1.707,0.1-3.067-0.205-3.935c1.172-0.194,2.439-1.039,0.404-4.276c-3.174-5.04-24.08-28.749-41.441-33.604  c0,0-3.924-0.846-4.254,0.416c-2.338-1.271-3.881-1.626-4.57-1.724c-4.186-3.312-64.736-51.108-85.643-60.296  c-21.65-9.523-50.212-14.002-65.333-14.002c-15.122,0-114.812,10.642-115.372,11.574c-0.558,0.932-1.31,3.175-1.496,8.96  c-0.174,5.43-25.308,36.801-27.968,46.376c-0.079,0.056-0.152,0.126-0.196,0.222c-0.038,0.075-0.912,1.902-0.208,3.466  c0.238,0.529,0.636,0.94,1.154,1.263c-0.61,0.545-1.415,1.356-1.623,1.981c-8.36,4.887-4.841,18.152-4.688,18.724  c0.006,0.015,0.016,0.023,0.02,0.034v0.622c-5.156,6.44-2.558,17.005-1.724,19.854c-1.357,1.879-5.428,7.418-7.889,9.574  c-2.989,2.612-13.067,35.096-8.402,57.126c0,0,1.938,3.202,3.973,3.659c-0.216-1.768-0.334-3.563-0.334-5.389  c0-24.834,20.203-45.038,45.039-45.038c24.833,0,45.041,20.204,45.041,45.038c0,4.784-0.758,9.391-2.143,13.718  c2.87,0.66,6.646,1.267,10.916,1.267c9.519,0,148.409-4.482,163.909-1.682l7.98-0.847c-0.887-3.446-1.361-7.055-1.361-10.774  c0-23.909,19.455-43.361,43.361-43.361c23.91,0,43.359,19.452,43.359,43.361c0,1.79-0.123,3.55-0.334,5.282  c0.527,0.771,0.928,1.689,1.08,2.794c0.746,5.413,8.586,9.892,11.385-0.935C608.756,789.296,610.623,758.121,608.381,751.213z   M251.431,725.633c-0.838-3.07-2.87-12.371,1.352-18.093c2.962,0.309,14.577,1.959,14.577,9.041  C267.359,723.785,254.365,725.368,251.431,725.633z M253.047,704.684c-0.613-2.925-2.139-12.859,4.405-16.603  c2.428,1.156,11.026,4.032,11.026,9.036C268.479,701.906,256.529,704.133,253.047,704.684z M281.5,707.48  c-0.839-1.258,9.523-1.119,9.523-1.119c0.978,4.2,21,25.479,21,25.479C291.858,723.304,282.341,708.743,281.5,707.48z   M546.031,698.38c-2.74-0.039-13.43-1.044-28.465-2.561c-15.035-19.604-34.514-30.889-34.711-31  c-0.008-0.007-0.014-0.004-0.02-0.007c-33.332-31.701-59.424-34.767-70.284-36.3c-10.922-1.538-46.064,0.563-46.064,0.563  l-0.557,52.643c27.299-0.138,117.466,12.459,117.466,12.459v-27.633c4.271,2.65,19.836,12.918,32.527,29.108  c-8.656-0.872-18.654-1.905-29.348-3.019v5.195l-3.619-0.503c-0.896-0.129-90.253-12.569-117.01-12.431l-3.226,0.015l0.014-1.7  l-8.239,0.391c-1.103,4.712-6.529,12.8-30.614,13.085c-1.135-2.924-4.392-13.405,0.663-27.095  c4.649,0.301,23.566,2.05,29.202,10.869l5.879-0.282l0.701-50.125c0,0-27.637-6.865-36.581,38.255  c-5.487,14.044-2.521,24.75-1.154,28.39c-0.007,0-0.013,0-0.021,0c0,0,0.037,0.084,0.11,0.238c0.251,0.644,0.432,1.022,0.474,1.104  c0.033,0.071,0.083,0.13,0.138,0.182c5.197,10.789,37.702,75.855,68.255,79.963c33.326,4.482,97.449,11.764,97.449,11.764  s-3.361,7.004-6.162,8.962l-105.847-8.123c0,0-10.079,0-28.843-24.361c-18.761-24.36-57.407-71.967-57.407-71.967  s-5.877-6.722-14.275-7.562c0,0,3.244-2.173-16.502-2.37c-0.042-0.027-0.088-0.054-0.144-0.07c-0.764-0.214-1.252-0.57-1.488-1.097  c-0.314-0.692-0.134-1.527,0.026-2.021l0.764,0.004c12.37,0.083,17.075,0.844,19.062,2.129  c7.105-11.969,26.344-48.109,42.337-60.698c0,0,46.67-4.761,82.514-3.079c35.841,1.679,57.31,9.615,131.425,72.711  c0,0,21.412,4.222,20.447-2.12c-0.018-0.075-0.023-0.151-0.039-0.226c-0.07-0.32-0.197-0.665-0.381-1.034  c0.949,0.303,2.363,0.884,4.207,2.022c0.084,0.056,0.178,0.077,0.27,0.083c0.049,0.052,0.082,0.1,0.139,0.155  C562.83,695.207,558.16,698.566,546.031,698.38z M602.357,730.389c-0.85-0.154-1.836-0.232-2.936-0.272  c-5.412-0.186-27.812-1.492-39.203-21.093c0,0,0.559-5.227,6.158-5.227c5.605,0,16.803,6.161,35.66,22.96  C602.312,727.371,602.697,728.648,602.357,730.389z M326.118,674.392c0,0-3.73,9.147,0,15.68c0,0,23.431,0.656,23.431-5.503  C349.549,678.407,329.011,674.11,326.118,674.392z M564.793,707.433c-2.52-2.055-2.43,2.243-2.43,2.243  c-0.652,3.078,14.656,16.238,17.828,14.843C583.365,723.112,567.312,709.486,564.793,707.433z"/>'
}

function drawBicycle(target, w, h) {
    /*
     var vis = d3.select(target)
     ;.append("svg:svg")
     //           .attr("id", id)
     //            .attr('class', classes);
     var bike = vis.selectAll('g').append('circle')
     .attr({
     'cy':2*h/3, cx:
     })
     <g xmlns="http://www.w3.org/2000/svg" id="g3138" transform="translate(-90.847666,-19.594595)" inkscape:export-xdpi="4.2362185" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" inkscape:export-ydpi="4.2362185">
     <circle transform="matrix(0.612193,0,0,0.612193,156.40859,178.29391)" r="161" cy="409" cx="215" style="fill:none;fill-opacity:1;stroke:#000000;stroke-width:40px;stroke-opacity:1" id="FrontWheel" sodipodi:cx="215" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" sodipodi:cy="409" sodipodi:rx="161" sodipodi:ry="161"/>
     <circle transform="matrix(0.612193,0,0,0.612193,156.40859,178.29391)" r="161" cy="406" cx="790" style="fill:none;fill-opacity:1;stroke:#000000;stroke-width:40px;stroke-opacity:1" id="RearWheel" sodipodi:cx="790" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" sodipodi:cy="406" sodipodi:rx="161" sodipodi:ry="161"/>
     <path style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:#000000;stroke-width:0.61219299;stroke-opacity:1" id="Frame" d="M 419.33591,187.76277 C 338.17965,188.55377 351.94299,179.37821 308.27997,319.70103 C 272.71002,431.81886 276.58445,419.592 276.39842,427.45646 C 276.26805,433.56628 281.20005,438.4105 287.39765,438.82515 C 300.28652,437.52193 294.86517,440.2191 339.55071,301.45538 C 502.83002,473.69932 441.57171,445.76834 529.44266,449.2663 C 644.92819,448.15891 654.31469,455.27788 655.68575,438.35055 C 655.52755,432.60263 652.83816,429.17498 573.58029,252.78271 L 581.17385,231.90039 L 607.27675,231.42579 L 606.32755,209.59428 L 509.03495,209.59428 C 500.43945,221.35377 512.51534,221.30103 556.02016,230.9512 L 548.42659,252.3081 L 354.31598,252.78271 C 367.39379,207.11583 360.01116,209.96341 418.86132,210.06888 L 419.33591,187.76277 z M 348.70707,276.18977 L 538.64814,275.85299 L 483.75383,423.36041 L 348.70707,276.18977 z M 561.54883,284.94591 L 507.66484,426.39139 L 625.53607,426.72816 L 561.54883,284.94591 z "/>
     </g>*/
}
