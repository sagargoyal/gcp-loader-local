(function ($) {

  /**
 * An interval to add new data points
 */
  var cCPUPostion = 0;
  var cRAMPostion = 0;
  var cNetworkPostion = 0;
  var interval;
  var playing = true;
  var cpuDataUrl = '';
  var cpuloadFactor = 1;
  var networkloadFactor = 1;
  var networkDataUrl = '';
  moveCharts();

  var cpuThreshold = 100;
  var ramThreshold = 64;
  var networkThreshold = 100;
  var cpuReductionFactor = 1;
  var ramReductionFactor = 1;
  var isThresholdForecast = false;
  var low_critical = 10;
  var low_warning = 20;
  var high_critical = 95;
  var high_warning = 85;
  var recommendation_increase = 85;
  var recommendation_decrease = 20;

  var currentMachineType = "n1-standard-2";
  var currentMachinesCount = 1;
  var machineNames = [];
  (function () {
    console.log('calling list');
    $.ajax({
      method: 'POST',
      url: 'http://gcp-loader.herokuapp.com/list',
      dataType: 'json',
      contentType: "application/json",
      success: function (data) {
        currentMachinesCount = data.length;
        machineNames = data.map((v) => v.name);
        showPresentConfig();
      },
      error: function (err) {
        console.log("error : ", err);
      }
    })
  }());

  function showPresentConfig(){
    $('#cpu-chart .present-config').text(currentMachineType + ' x ' + currentMachinesCount);
    $('#ram-chart .present-config').text(currentMachineType + ' x ' + currentMachinesCount);
    $('#network-chart .present-config').text(currentMachineType + ' x ' + currentMachinesCount);
  }

  $('#computer-load').on('click', 'button', function () {
    $this = $(this);

    if ($this.hasClass('js-add')) {
      console.log('add');
      var value = parseFloat($('#cpuLoad').val());
      value = (value+0.1).toFixed(1);
      $('#cpuLoad').val(value);
      $(this).parent().parent().find('.js-minus').removeAttr('disabled');
      if(value >= 3){
        $(this).attr('disabled', true);
      }
      //loadNewData('./data/CPU_boost_n.json', cpuChart);
      cpuloadFactor = value;
      loadNewData('./data/CPU_n.json', cpuChart);
      loadNewData('./data/RAM_n.json', ramChart);

    } else if ($this.hasClass('js-minus')) {
      console.log('minus');
      //$(this).parent().parent().find('input').val(1);
      var value = parseFloat($('#cpuLoad').val());
      value = (value-0.1).toFixed(1);
      $('#cpuLoad').val(value);
      $(this).parent().parent().find('.js-add').removeAttr('disabled');
      if(value <= 1){
        $(this).attr('disabled', true);
      }
      cpuloadFactor = value;
      loadNewData('./data/CPU_n.json', cpuChart);
      loadNewData('./data/RAM_n.json', ramChart);

    }

  });

  $('#network-load').on('click', 'button', function () {
    $this = $(this);

    if ($this.hasClass('js-add')) {
      console.log('add');
      //$(this).parent().parent().find('input').val(2);

      var value = parseFloat($('#networkLoad').val());
      value = (value+0.1).toFixed(1);
      $('#networkLoad').val(value);
      $(this).parent().parent().find('.js-minus').removeAttr('disabled');
      if(value >= 3){
        $(this).attr('disabled', true);
      }
      networkloadFactor = value;
      //loadNewData('./data/Network_boost_n.json', networkChart);
      loadNewData('./data/Network_n.json', networkChart);

    } else if ($this.hasClass('js-minus')) {
      console.log('minus');
      //$(this).parent().parent().find('input').val(1);

      var value = parseFloat($('#networkLoad').val());
      value = (value-0.1).toFixed(1);
      $('#networkLoad').val(value);
      $(this).parent().parent().find('.js-add').removeAttr('disabled');
      if(value <= 1){
        $(this).attr('disabled', true);
      }
      networkloadFactor = value;
      loadNewData('./data/Network_n.json', networkChart);
    }

  });

  $("#play").click(function () {
    playing = true;
  });
  $("#pause").click(function () {
    playing = false;
  });
  function loadNewData(url, chart) {
    console.log("SAGAR LOAD", url);
    $.ajax({
      url: url,
      dataType: 'json',
      contentType: "application/json",
      success: function (data) {

        var newChartData = [];
        var history = data.metrics_history;
        var forecast = data.forecast_result["0"].metrics_forecast;
        var recommended = data.forecast_result["0"].recommendation_forecast;

        //console.log(data);
        // cpuData = [];
        var oldCpuData = [];
        var newHistoryData = [];
        var newForeCastData = [];

        if (chart == cpuChart) {
    console.log("SAGAR LOAD CPU CHART");
          // cpuChart.dataProvider = newChartData;
          // cpuChart.validateData();

          for (let i = 0; i < 200; i++) {
            const smallData = cpuData.forecast[i];

            if (new Date(smallData.timestamp) <= new Date(cpuChart.endDate)) {
              newChartData.push({
                date: new Date(smallData.timestamp),
                forecast: smallData.value,
                history: cpuData.history[i].value
              });
              newHistoryData.push({timestamp:(smallData.timestamp),value:cpuData.history[i].value});
              newForeCastData.push({timestamp:(smallData.timestamp),value:smallData.value});
            } else {
              newChartData.push({
                date: new Date(forecast[i].timestamp),
                //history: history[i] ? history[i].value : '',
                history: history[i] ? (cpuHistoryMultiplier(history[i].value)) : '',
                //forecast: forecast[i].value,
                forecast: (cpuForecastMultiplier(forecast[i].value)),
              });

              newHistoryData.push({timestamp:(smallData.timestamp),value:(history[i] ? (cpuHistoryMultiplier(history[i].value)) : '')});
              newForeCastData.push({timestamp:(smallData.timestamp),value:(cpuForecastMultiplier(forecast[i].value))});
            }

          }

          cpuData = [];
          cpuDataUrl = url;
          cpuData.history = newHistoryData;
          cpuData.forecast = newForeCastData;
          cpuData.recommended = recommended;
        }

        // if (url === './data/RAM_n.json') {
        //   cpuData = [];
        //   cpuData.history = newHistoryData;
        //   cpuData.forecast = newForeCastData;
        //   cpuChart.validateData();
        // }

        if (chart == ramChart) {
    console.log("SAGAR LOAD RAM CHART");
          for (let i = 0; i < 200; i++) {
            const smallData = ramData.forecast[i];

            if (new Date(smallData.timestamp) <= new Date(ramChart.endDate)) {
              newChartData.push({
                date: new Date(smallData.timestamp),
                forecast: smallData.value,
                history: networkData.history[i].value
              });
              newHistoryData.push({timestamp:(smallData.timestamp),value:ramData.history[i].value});
              newForeCastData.push({timestamp:(smallData.timestamp),value:smallData.value});
            } else {
              newChartData.push({
                date: new Date(forecast[i].timestamp),
                history: history[i] ? (ramHistoryMultiplier(history[i].value)) : '',
                forecast: (ramForecastMultiplier(forecast[i].value)),
              });

              newHistoryData.push({timestamp:(smallData.timestamp),value:(history[i] ? (ramHistoryMultiplier(history[i].value)) : '')});
              newForeCastData.push({timestamp:(smallData.timestamp),value:(ramForecastMultiplier(forecast[i].value))});
            }

          }
          ramData = [];
          ramData.history = newHistoryData;
          ramData.forecast = newForeCastData;
          ramData.recommended = recommended;
          ramDataUrl = url;
        }

        if (chart == networkChart) {
    console.log("SAGAR LOAD NETOWRK CHART");
          console.log(networkData)
          for (let i = 0; i < 200; i++) {
            const smallData = networkData.forecast[i];

            if (new Date(smallData.timestamp) <= new Date(cpuChart.endDate)) {
              newChartData.push({
                date: new Date(smallData.timestamp),
                forecast: smallData.value,
                history: networkData.history[i].value
              });
              newHistoryData.push({timestamp:(smallData.timestamp),value:networkData.history[i].value});
              newForeCastData.push({timestamp:(smallData.timestamp),value:smallData.value});
            } else {
              newChartData.push({
                date: new Date(forecast[i].timestamp),
                history: history[i] ? (networkHistoryMultiplier(history[i].value)) : '',
                forecast: (networkForecastMultiplier(forecast[i].value)),
              });

              newHistoryData.push({timestamp:(smallData.timestamp),value:(history[i] ? (networkHistoryMultiplier(history[i].value)) : '')});
              newForeCastData.push({timestamp:(smallData.timestamp),value:(networkForecastMultiplier(forecast[i].value))});
            }

          }
          networkData = [];
          networkData.history = newHistoryData;
          networkData.forecast = newForeCastData;
          networkData.recommended = recommended;
          networkDataUrl = url;
        }
        chart.dataProvider = newChartData;
        chart.validateData();


      },
      error: function (err) {
        console.log(err)
      }
    })
  }

  function cpuHistoryMultiplier(value){
      // var x = ((cpuloadFactor *  (value/cpuReductionFactor)))/currentMachinesCount;
      var x = value * 100;
      // var load = ((((0.2)*(Math.pow(x,2))) + (0.6*x) + 0.2));
      var load = x * (((0.25)*Math.pow(cpuloadFactor,2)) + (0.7*cpuloadFactor) + 0.15);
      //var load = x;
      //console.log("history value : " + value + " load :" + load);
      return load>cpuThreshold?cpuThreshold:load;
  }

  function cpuForecastMultiplier(value){
      // var x = ((cpuloadFactor *  (value/cpuReductionFactor))/100)/currentMachinesCount;
      // var load = ((((0.25)*(Math.pow(x,2))) + (0.7*x) + 0.15)*100);
      // if(isThresholdForecast){
      //   return load>cpuThreshold?cpuThreshold:load;
      // } else {
      //   return load;
      // }

      // var x = ((cpuloadFactor *  (value/cpuReductionFactor)))/currentMachinesCount;
      var x = value * 100;
      var load = x * (((0.25)*Math.pow(cpuloadFactor,2)) + (0.7*cpuloadFactor) + 0.15);
      // var load = ((((0.2)*(Math.pow(x,2))) + (0.6*x) + 0.2));
    //  var load = x;
    //console.log("forecast value : " + value + " load :" + load);
      // return load>cpuThreshold?cpuThreshold:load;
      return load;
  }

  function ramHistoryMultiplier(value){
      var x = ((cpuloadFactor *  (value/ramReductionFactor))/100)/currentMachinesCount;
      var load = ((((0.2)*(Math.pow(x,2))) + (0.6*x) + 0.2)*100);
      return load>ramThreshold?ramThreshold:load;
  }

  function ramForecastMultiplier(value){
      var x = ((cpuloadFactor *  (value/ramReductionFactor))/100)/currentMachinesCount;
      var load = ((((0.25)*(Math.pow(x,2))) + (0.7*x) + 0.15)*100);
      if(isThresholdForecast){
        return load>ramThreshold?ramThreshold:load;
      } else {
        return load;
      }
  }

  function networkHistoryMultiplier(value){
      value = (value/1024)/1024;
      var x = ((networkloadFactor *  value)/100)/currentMachinesCount;
      var load = ((((0.5)*(Math.pow(x,2))) + (0.3*x) + 0.2)*100);
      return load>networkThreshold?networkThreshold:load;

  }

  function networkForecastMultiplier(value){
      value = (value/1024)/1024;
      var x =  ((networkloadFactor *  value)/100)/currentMachinesCount;
      var load = ((((0.5)*(Math.pow(x,2))) + (0.3*x) + 0.2)*100);
      if(isThresholdForecast){
        return load>networkThreshold?networkThreshold:load;
      } else {
        return load
      }

  }

  function updateChart(chart, url) {
    $.ajax({
      url: url,
      dataType: 'json',
      contentType: "application/json",
      success: function (data) {

        var history = data.metrics_history;
        var forecast = data.forecast_result["0"].metrics_forecast;
        var recommended = data.forecast_result["0"].recommendation_forecast;
        var chartData = [];
        var newHistoryData = [];
        var newForecastData = [];
        for (var i = 0; i < 200; i++) {

          var historyValue =  history[i] ? history[i].value : '';
          var forecastValue =  forecast[i] ? forecast[i].value : '';

          if(chart == cpuChart){
            if(historyValue){
              historyValue = cpuHistoryMultiplier(historyValue);
            }
            if(forecastValue){
              forecastValue = cpuForecastMultiplier(forecastValue);
            }
          } else if(chart == networkChart){
            if(historyValue){
              historyValue = networkHistoryMultiplier(historyValue);
            }
            if(forecastValue){
              forecastValue = networkForecastMultiplier(forecastValue);
            }

          } else if(chart == ramChart){
            if(historyValue){
              historyValue = ramHistoryMultiplier(historyValue);
            }
            if(forecastValue){
              forecastValue = ramForecastMultiplier(forecastValue);
            }

          }



          chartData.push({
            date: new Date(forecast[i].timestamp),
            //history: history[i] ? history[i].value : '',
            history: history[i] ? historyValue : '',
            forecast: forecastValue,
            //forecast: forecast[i].value,
            // recommended: forecast[i].value
          });
          newHistoryData.push({timestamp:(forecast[i].timestamp),value:(history[i] ? historyValue : '')});
          newForecastData.push({timestamp:(forecast[i].timestamp),value:(forecastValue)});
        }
        if (chart == cpuChart) {
          cpuData.history = newHistoryData;
          cpuData.forecast = newForecastData;
          cpuData.recommended = recommended;
        }  else if (chart == ramChart) {
          ramData.history = newHistoryData;
          ramData.forecast = newForecastData;
          ramData.recommended = recommended;
        } else {
          ramData.history = newHistoryData;
          ramData.forecast = newForecastData;
          ramData.recommended = recommended;
        }
        chart.dataProvider = chartData;
        chart.validateData();
      },
      error: function (err) {

      }
    });
  }

  function fetchEventsLog() {
    // console.log(cpuChart);
    var start = cpuChart.startDate;
    var end = cpuChart.endDate;
    // console.log(start, end);

    var html = '';
    var html2 = '';
    for (let i = 0; i < 200; i++) {

      var recCPUData = cpuData.history[i];
      var recRAMData = ramData.history[i];
      var recNetworkData = networkData.history[i];

      var recCPUDataValue = recCPUData.value;
      var recRAMDataValue = recRAMData.value;
      var recNetworkDataValue = recNetworkData.value;

      var cpuHealth = (recCPUDataValue/cpuThreshold)*100;
      var ramHealth = (recRAMDataValue/ramThreshold)*100;
      var networkHealth = (recNetworkDataValue/networkThreshold)*100;

      //console.log(recCPUData.recomendation)
      //console.log(cpuHealth)

      if (new Date(recCPUData.timestamp) >= start && new Date(recCPUData.timestamp) <= end ) {
        // console.log(recCPUData.recomendation)
        if (cpuHealth < low_critical) {
          // CPU outage
          html += '<tr>';
          html += '<td>' + recCPUData.timestamp +'</td>';
          html += '<td style="color:red">Critical - Low CPU Utilization</td>';
          html += '</tr>';

          // CPU  deprovision
          html2 += '<tr>';
          html2 += '<td>' + recCPUData.timestamp + '</td>';
          html2 += '<td style="color:red">Critical - Decrease Cores</td>';
          html2 += '</tr>';
        } else if (cpuHealth < low_warning) {
          // CPU excess
          html += '<tr>';
          html += '<td>' + recCPUData.timestamp + '</td>';
          html += '<td style="color:blue">Warning - Low CPU Utilization</td>';
          html += '</tr>';

          // CPU overprovision
          html2 += '<tr>';
          html2 += '<td>' + recCPUData.timestamp + '</td>';
          html2 += '<td style="color:blue">Warning - Decrease Cores</td>';
          html2 += '</tr>';
        } else if (cpuHealth > high_warning && cpuHealth < high_critical) {
          // CPU excess
          html += '<tr>';
          html += '<td>' + recCPUData.timestamp + '</td>';
          html += '<td style="color:blue">Warning - High CPU Utilization</td>';
          html += '</tr>';

          // CPU overprovision
          html2 += '<tr>';
          html2 += '<td>' + recCPUData.timestamp + '</td>';
          html2 += '<td style="color:blue">Warning - Increase Cores</td>';
          html2 += '</tr>';
        } else if (cpuHealth > high_critical) {
          // CPU excess
          html += '<tr>';
          html += '<td>' + recCPUData.timestamp + '</td>';
          html += '<td style="color:red">Critical - High CPU Utilization</td>';
          html += '</tr>';

          // CPU overprovision
          html2 += '<tr>';
          html2 += '<td>' + recCPUData.timestamp + '</td>';
          html2 += '<td style="color:red">Critical - Increase Cores</td>';
          html2 += '</tr>';
        }


         if (ramHealth < low_critical) {
          // CPU outage
          html += '<tr>';
          html += '<td>' + recCPUData.timestamp +'</td>';
          html += '<td style="color:red">Critical - Low RAM Utilization</td>';
          html += '</tr>';

          // CPU  deprovision
          html2 += '<tr>';
          html2 += '<td>' + recCPUData.timestamp + '</td>';
          html2 += '<td style="color:red">Critical - Decrease RAM</td>';
          html2 += '</tr>';
        } else if (ramHealth < low_warning) {
          // CPU excess
          html += '<tr>';
          html += '<td>' + recCPUData.timestamp + '</td>';
          html += '<td style="color:blue">Warning - Low RAM Utilization</td>';
          html += '</tr>';

          // CPU overprovision
          html2 += '<tr>';
          html2 += '<td>' + recCPUData.timestamp + '</td>';
          html2 += '<td style="color:blue">Warning - Decrease RAM</td>';
          html2 += '</tr>';
        } else if (ramHealth > high_warning && ramHealth <high_critical) {
          // CPU excess
          html += '<tr>';
          html += '<td>' + recCPUData.timestamp + '</td>';
          html += '<td style="color:blue">Warning - High RAM Utilization</td>';
          html += '</tr>';

          // CPU overprovision
          html2 += '<tr>';
          html2 += '<td>' + recCPUData.timestamp + '</td>';
          html2 += '<td style="color:blue">Warning - Increase RAM</td>';
          html2 += '</tr>';
        } else if (ramHealth > high_critical) {
          // CPU excess
          html += '<tr>';
          html += '<td>' + recCPUData.timestamp + '</td>';
          html += '<td style="color:red">Critical - High RAM Utilization</td>';
          html += '</tr>';

          // CPU overprovision
          html2 += '<tr>';
          html2 += '<td>' + recCPUData.timestamp + '</td>';
          html2 += '<td style="color:red">Critical - Increase RAM</td>';
          html2 += '</tr>';
        }

        if (networkHealth < low_warning) {
          // CPU outage
          html += '<tr>';
          html += '<td>' + recCPUData.timestamp +'</td>';
          html += '<td style="color:red">Critical - Low Network Bandwidth Utilization</td>';
          html += '</tr>';

          // CPU  deprovision
          html2 += '<tr>';
          html2 += '<td>' + recCPUData.timestamp + '</td>';
          html2 += '<td style="color:red">Critical - Decrease Bandwidth Allocation</td>';
          html2 += '</tr>';
        } else if (networkHealth < low_critical) {
          // CPU excess
          html += '<tr>';
          html += '<td>' + recCPUData.timestamp + '</td>';
          html += '<td style="color:blue">Warning - Low Network Bandwidth Utilization</td>';
          html += '</tr>';

          // CPU overprovision
          html2 += '<tr>';
          html2 += '<td>' + recCPUData.timestamp + '</td>';
          html2 += '<td style="color:blue">Warning - Decrease Bandwidth Allocation</td>';
          html2 += '</tr>';
        } else if (networkHealth > high_warning && networkHealth <high_critical) {
          // CPU excess
          html += '<tr>';
          html += '<td>' + recCPUData.timestamp + '</td>';
          html += '<td style="color:blue">Warning - High Network Bandwidth Utilization</td>';
          html += '</tr>';

          // CPU overprovision
          html2 += '<tr>';
          html2 += '<td>' + recCPUData.timestamp + '</td>';
          html2 += '<td style="color:blue">Warning - Increase Bandwidth Allocation</td>';
          html2 += '</tr>';
        } else if (networkHealth > high_critical) {
          // CPU excess
          html += '<tr>';
          html += '<td>' + recCPUData.timestamp + '</td>';
          html += '<td style="color:red">Critical - High Network Bandwidth Utilization</td>';
          html += '</tr>';

          // CPU overprovision
          html2 += '<tr>';
          html2 += '<td>' + recCPUData.timestamp + '</td>';
          html2 += '<td style="color:red">Critical - Increase Bandwidth Utilization</td>';
          html2 += '</tr>';
        }

      }

    }
    $('#events').find('tbody').html(html);
    $('#triggers').find('tbody').html(html2);

    // loop through data
    // >= startDate <= endDate
    // if increase or decrease generate text
    // render html
  }

  function fetchTriggersLog() {

  }

  function fetchRecommendationData() {
    var start = cpuChart.startDate;
    var end = cpuChart.endDate;
    var recCPUData;
    var recRAMData;
    var recNetworkData;

    var chart_start_index = -1;
    var chart_end_index = -1;

    for (let i = 0; i < 200; i++) {
       recCPUData = cpuData.history[i];
       if (new Date(recCPUData.timestamp) >= start && chart_start_index < 0){
         chart_start_index = i;
       }

       if(new Date(recCPUData.timestamp) <= end) {

         chart_end_index = i;
       } else {
         break;
       }

    }

    let i = (chart_start_index+chart_end_index)/2;


    recCPUData = cpuData.history[i];
    recRAMData = ramData.history[i];
    recNetworkData = networkData.history[i];
    var recCPUDataValue = recCPUData.value;
    var recRAMDataValue = recRAMData.value;
    var recNetworkDataValue = recNetworkData.value;

    var cpuHealth = (recCPUDataValue/cpuThreshold)*100;
    var ramHealth = (recRAMDataValue/ramThreshold)*100;
    var networkHealth = (recNetworkDataValue/networkThreshold)*100;

    showRecommendedConfig("cpu",getHealthStatus(cpuHealth));
    showRecommendedConfig("ram",getHealthStatus(ramHealth));
    showRecommendedConfig("network",getHealthStatus(networkHealth));

  }

  function getHealthStatus(value){

    if(value > recommendation_increase){

      return "increase";
    } else if (value < recommendation_decrease){

      return "decrease";
    } else {

      return "healthy";
    }

  }

  function moveCharts() {
    interval = setInterval(function () {

      //fetchEventsLog();
      //fetchTriggersLog();

      if (playing) {
         fetchEventsLog();
         fetchTriggersLog();

        if ($("#play").hasClass('btn-success'))
          $("#play").removeClass('btn-success');

        if (!$("#pause").hasClass('btn-danger'))
          $("#pause").addClass('btn-danger');
        if (cCPUPostion == cpuChart.dataProvider.length - 21) {
          cCPUPostion = 0;
          updateChart(cpuChart, cpuDataUrl);
        }
        else
          cCPUPostion++;

        cpuChart.zoomToIndexes(cCPUPostion, cCPUPostion + 20);

        if (cRAMPostion == ramChart.dataProvider.length - 21) {
          cRAMPostion = 0;

        }
        else
          cRAMPostion++;

        ramChart.zoomToIndexes(cRAMPostion, cRAMPostion + 20);

        if (cNetworkPostion == networkChart.dataProvider.length - 21) {
          cNetworkPostion = 0;
          updateChart(networkChart, networkDataUrl);
        }
        else
          cNetworkPostion++;

        networkChart.zoomToIndexes(cNetworkPostion, cNetworkPostion + 20);
        fetchRecommendationData();
      } else {
        if (!$("#play").hasClass('btn-success'))
          $("#play").addClass('btn-success');


        if ($("#pause").hasClass('btn-danger'))
          $("#pause").removeClass('btn-danger');

      }

   //   fetchRecommendationData();

    }, 900);
  }

  // CPU ustilization chart
  var cpuChart = createChart(_el('cpu-chart-container'), './data/CPU_n.json');

  // RAM Util chart
  var ramChart = createChart(_el('ram-chart-container'), './data/RAM_n.json');

  // Network load chart
  var networkChart = createChart(_el('network-chart-container'), './data/Network_n.json');

  var theLoop;
  var cpuData = {};
  var ramData = {};
  var networkData = {};

  function createChart(chartEl, url) {

    var chart;
    var chartData = [];
    // console.log(url);
    AmCharts.ready(function () {
      // console.log(url);
      // generate some random data first
      generateChartData(url);

      // SERIAL CHART
      chart = new AmCharts.AmSerialChart();

      chart.dataProvider = chartData;
      chart.hideCredits = true;
      chart.categoryField = "date";

      // listen for "dataUpdated" event (fired when chart is inited) and call zoomChart method when it happens
      chart.addListener("dataUpdated", zoomChart);

      chart.synchronizeGrid = true; // this makes all axes grid to be at the same intervals

      // AXES
      // category
      var categoryAxis = chart.categoryAxis;
      categoryAxis.parseDates = true; // as our data is date-based, we set parseDates to true
      categoryAxis.minPeriod = "hh"; // our data is daily, so we set minPeriod to DD
      categoryAxis.minorGridEnabled = true;
      categoryAxis.axisColor = "#DADADA";
      categoryAxis.twoLineMode = true;

      // first value axis (on the left)
      var valueAxis1 = new AmCharts.ValueAxis();
      valueAxis1.axisColor = "#FF6600";
      valueAxis1.axisThickness = 2;
      chart.addValueAxis(valueAxis1);

      // second value axis (on the right)
      //   var valueAxis2 = new AmCharts.ValueAxis();
      //   valueAxis2.position = "right"; // this line makes the axis to appear on the right
      //   valueAxis2.axisColor = "#FCD202";
      //   valueAxis2.gridAlpha = 0;
      //   valueAxis2.axisThickness = 2;
      //   chart.addValueAxis(valueAxis2);

      // GRAPHS
      // first graph
      var graph1 = new AmCharts.AmGraph();
      graph1.valueAxis = valueAxis1; // we have to indicate which value axis should be used
      graph1.title = "Live Data";
      graph1.valueField = "history";
      graph1.bullet = "round";
      graph1.hideBulletsCount = 24;
      graph1.bulletBorderThickness = 1;
      chart.addGraph(graph1);

      // second graph
      var graph2 = new AmCharts.AmGraph();
      graph2.valueAxis = valueAxis1; // we have to indicate which value axis should be used
      graph2.title = "Predictions";
      graph2.valueField = "forecast";
      graph2.bullet = "square";
      graph2.hideBulletsCount = 24;
      graph2.bulletBorderThickness = 1;
      chart.addGraph(graph2);

      // third graph
      //   var graph3 = new AmCharts.AmGraph();
      //   graph3.valueAxis = valueAxis1; // we have to indicate which value axis should be used
      //   graph3.title = "Recommended data";
      //   graph3.valueField = "recommended";
      //   graph3.bullet = "square";
      //   graph3.hideBulletsCount = 24;
      //   graph3.bulletBorderThickness = 1;
      //   chart.addGraph(graph3);

        var graph3 = new AmCharts.AmGraph();
        graph3.valueAxis = valueAxis1; // we have to indicate which value axis should be used
        graph3.title = "Raw data";
        graph3.valueField = "raw";
        graph3.bullet = "round";
        graph3.hideBulletsCount = 24;
        graph3.bulletBorderThickness = 1;
        chart.addGraph(graph3);

      // CURSOR
      var chartCursor = new AmCharts.ChartCursor();
      chartCursor.cursorAlpha = 0.1;
      chartCursor.fullWidth = true;
      chartCursor.valueLineBalloonEnabled = true;
      chart.addChartCursor(chartCursor);

      // SCROLLBAR
      var chartScrollbar = new AmCharts.ChartScrollbar();
      // chartScrollbar.dragIconWidth = 55;
      chartScrollbar.mouseWheelZoomEnabled = false;
      chart.addChartScrollbar(chartScrollbar);

      // LEGEND
      var legend = new AmCharts.AmLegend();
      legend.marginLeft = 110;
      legend.useGraphSettings = true;
      legend.valueText = '';
      chart.addLegend(legend);

      // WRITE
      chart.write(chartEl);
    });

    // generate some random data, quite different range
    function generateChartData(url) {

      $.ajax({
        url: url,
        dataType: 'json',
        contentType: "application/json",
        success: function (data) {

          var firstDate = new Date();
          firstDate.setDate(firstDate.getDate() - 50);

          var history = data.metrics_history;
          var forecast = data.forecast_result["0"].metrics_forecast;
          var recommended = data.forecast_result["0"].recommendation_forecast;

          var newHistoryData = [];
          var newForecastData = [];


          // console.log('reco',recommended);
          for (var i = 0; i < 200; i++) {
            // we create date objects here. In your data, you can have date strings
            // and then set format of your dates using chart.dataDateFormat property,
            // however when possible, use date objects, as this will speed up chart rendering.
            var newDate = new Date(firstDate);
            newDate.setDate(newDate.getDate() + i);

            var historyValue =  history[i] ? history[i].value : '';
            var forecastValue =  forecast[i] ? forecast[i].value : '';

            if (url === './data/CPU_n.json') {
              if(historyValue){
                historyValue = cpuHistoryMultiplier(historyValue);
              }
              if(forecastValue){
                forecastValue = cpuForecastMultiplier(forecastValue);
              }
            } else if (url === './data/Network_n.json') {
              if(historyValue){
                historyValue = networkHistoryMultiplier(historyValue);
              }
              if(forecastValue){
                forecastValue = networkForecastMultiplier(forecastValue);
              }

            } else if (url === './data/RAM_n.json') {
              if(historyValue){
                historyValue = ramHistoryMultiplier(historyValue);
              }
              if(forecastValue){
                forecastValue = ramForecastMultiplier(forecastValue);
              }

            }


            chartData.push({
              date: new Date(forecast[i].timestamp),
              //history: history[i] ? history[i].value : '',
              history: history[i] ? historyValue : '',
              forecast: forecastValue,
              //forecast: forecast[i].value,
              // recommended: forecast[i].value
            });

            newHistoryData.push({timestamp:(forecast[i].timestamp),value:(history[i] ? historyValue : '')});
            newForecastData.push({timestamp:(forecast[i].timestamp),value:(forecastValue)});


          }
          $('.amcharts-chart-div a').hide();
          $('svg image').hide();
          $('svg image').next('rect').hide();

          chart.dataProvider = chartData;

          if (url === './data/CPU_n.json') {
            cpuChart = chart;
            cpuData.history = newHistoryData;
            cpuData.forecast = newForecastData;
            cpuData.recommended = recommended;
          }

          if (url === './data/RAM_n.json') {
            ramChart = chart;
            ramData.history = newHistoryData;
            ramData.forecast = newForecastData;
            ramData.recommended = recommended;
          }

          if (url === './data/Network_n.json') {
            networkChart = chart;
            networkData.history = newHistoryData;
            networkData.forecast = newForecastData;
            networkData.recommended = recommended;
          }
          //   console.log(chartData);

          chart.validateData();
        },
        error: function (err) {

        }
      });


    }

    // this method is called when chart is first inited as we listen for "dataUpdated" event
    function zoomChart() {
      // different zoom methods can be used - zoomToIndexes, zoomToDates, zoomToCategoryValues
      chart.zoomToIndexes(0, 20);
    }
    return chart;
  }

  function _el(id) {
    return document.getElementById(id);
  }
  function isEmpty(obj) {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop))
        return false;
    }
    return true;
  }

  function showRecommendedConfig(type /* type can be cpu, network or ram */, health /* health can be decrease, increase or healthy */){
    console.log(type, health);
    //call this function when graph value updates
    const keyVal = {
      'decrease' : currentMachineType + ' x ' + (((currentMachinesCount / 2) < 1) ? 1 :  currentMachinesCount / 2),
      'increase' : currentMachineType + ' x ' + currentMachinesCount * 2 ,
      'healthy' : 'No Changes required'
    };
    $('#'+ type +'-chart .recommended-config').text(keyVal[health]);
  }

  $('.apply-button').click(function () {
    var machinesRequested = parseInt($('#'+this.id.split('-')[0] + '-chart .recommended-config').text().split('x')[1] );
    const type = this.id.split('-')[0];
    console.log("SAGAR ",type);
    if(machinesRequested === currentMachinesCount){
      alert('Machine is already in healthy state.');
    }
    else if (machinesRequested < currentMachinesCount){
      // delete machinesRequested
      for(let i = 0; i < machinesRequested ; i++){
        $.ajax({
          method: 'POST',
          url: 'http://gcp-loader.herokuapp.com/delete',
          dataType: 'json',
          contentType: "application/json",
          data: JSON.stringify({"name":machineNames[i]}),
          success: function (data) {
            console.log("error : ", data);
            // Do something when new machine is created
            currentMachinesCount--;
            responseFromHeroku(type);
          },
          error: function (err) {
            console.log("error : ", err);
            //currentMachinesCount++;
            //responseFromHeroku(type);
          }
        })
      }
    }
    else{
      for(let i = 0; i < currentMachinesCount ; i++){
        $.ajax({
          method: 'POST',
          url: 'http://gcp-loader.herokuapp.com/add',
          dataType: 'json',
          contentType: "application/json",
          data: JSON.stringify({"instanceType":"n1-standard-2"}),
          success: function (data) {
            console.log("success : ", data);
            machineNames.push(data);
            // Do something when new machine is created
            currentMachinesCount++;
            responseFromHeroku(type);
          },
          error: function (err) {
            console.log("error : ", err);
            currentMachinesCount++;
            responseFromHeroku(type);
          }
        })
      }
      //add currentMachinesCount;
    }
  });

  function responseFromHeroku(type){

    // Do something when new machine is created
    console.log("Sagar kk",type);
    //if(type.toUpperCase() == "RAM"){
      console.log("SAGAR calling ram",currentMachinesCount);
      loadNewData('./data/RAM_n.json', ramChart);
      loadNewData('./data/CPU_n.json', cpuChart);
      loadNewData('./data/Network_n.json', networkChart);
    //} else if(type.toUpperCase() == "CPU"){
    //  console.log("SAGAR calling cpu",currentMachinesCount);
    //  loadNewData('./data/CPU_n.json', cpuChart);
    //} else if(type.toUpperCase() == "NETWORK"){
    //  console.log("SAGAR calling network",currentMachinesCount);
    //  loadNewData('./data/Network_n.json', networkChart);
    //}
    showPresentConfig();

  }

})(jQuery);
