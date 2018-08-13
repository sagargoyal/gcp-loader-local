(function ($) {

	var cCPUPostion = 0;
	var cRAMPostion = 0;
	var cPCloadPostion = 0;
  var cpuloadFactor = 1;
  var networkloadFactor = 1;
  var interval;
  var pcloadDataUrl = '';
  var networkDataUrl = '';

  var cpuThreshold = 100;
  var ramThreshold = 64;
  var networkThreshold = 100;
  var cpuReductionFactor = 1;
  var isThresholdForecast = false;


	var playing = true;

	moveCharts();

	$( "#play" ).click(function() {
	 playing = true;
	});
	$( "#pause" ).click(function() {
		playing = false;
  });

  $('#compute-load').on('click', 'button', function () {
    $this = $(this);

    if ($this.hasClass('js-add')) {
      console.log('add');
      //$(this).parent().parent().find('input').val(2);

      var value = parseFloat($('#cpuLoad').val());
      value = (value+0.1).toFixed(1);
      $('#cpuLoad').val(value);
      $(this).parent().parent().find('.js-minus').removeAttr('disabled');
      if(value >= 3){
        $(this).attr('disabled', true);
      }
      //loadNewData('./data/CPU_boost_n.json', cpuChart);
      cpuloadFactor = value;

      //loadNewData('./data/PC_load_boost_n.json', pcloadChart);
      loadNewData('./data/PC_load_n.json', pcloadChart);

    } else if ($this.hasClass('js-minus')) {
      console.log('minus');
      var value = parseFloat($('#cpuLoad').val());
      value = (value-0.1).toFixed(1);
      $('#cpuLoad').val(value);
      $(this).parent().parent().find('.js-add').removeAttr('disabled');
      if(value <= 1){
        $(this).attr('disabled', true);
      }
      cpuloadFactor = value;

      loadNewData('./data/PC_load_n.json', pcloadChart);
    }

  });
  $('#network-load').on('click', 'button', function () {
    $this = $(this);

    if ($this.hasClass('js-add')) {
      console.log('add');

      var value = parseFloat($('#networkLoad').val());
      value = (value+0.1).toFixed(1);
      $('#networkLoad').val(value);
      $(this).parent().parent().find('.js-minus').removeAttr('disabled');
      if(value >= 3){
        $(this).attr('disabled', true);
      }
      networkloadFactor = value;


      //loadNewData('./data/Network_load_boost_n.json', networkChart);
      loadNewData('./data/Network_load_n.json', networkChart);

    } else if ($this.hasClass('js-minus')) {
      console.log('minus');

      var value = parseFloat($('#networkLoad').val());
      value = (value-0.1).toFixed(1);
      $('#networkLoad').val(value);
      $(this).parent().parent().find('.js-add').removeAttr('disabled');
      if(value <= 1){
        $(this).attr('disabled', true);
      }
      networkloadFactor = value;


      loadNewData('./data/Network_load_n.json', networkChart);
    }

  });
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
        for (var i = 0; i < 200; i++) {


          var historyValue =  history[i] ? history[i].value : '';
          var forecastValue =  forecast[i] ? forecast[i].value : '';

          if(chart == pcloadChart){
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

          }

          chartData.push({
            date: new Date(forecast[i].timestamp),
            //history: history[i] ? history[i].value : '',
            history: historyValue,
            //forecast: forecast[i].value,
            forecast: forecastValue,
            // recommended: forecast[i].value
          });
        }

        chart.dataProvider = chartData;
        chart.validateData();
      },
      error: function (err) {

      }
    });
  }
  function loadNewData(url, chart) {
    $.ajax({
      url: url,
      dataType: 'json',
      contentType: "application/json",
      success: function (data) {

        var newChartData = [];
        var history = data.metrics_history;
        var forecast = data.forecast_result["0"].metrics_forecast;
        var recommended = data.forecast_result["0"].recommendation_forecast;

        var newHistoryData = [];
        var newForeCastData = [];

        if (chart == pcloadChart) {
          console.log(cpuloadFactor);
          for (let i = 0; i < 200; i++) {
            const smallData = pcloadData.forecast[i];

            if (new Date(smallData.timestamp) <= new Date(pcloadChart.endDate)) {
              newChartData.push({
                date: new Date(smallData.timestamp),
                forecast: smallData.value,
                history: pcloadData.history[i].value
              });
              newHistoryData.push(pcloadData.history[i].value);
              newForeCastData.push(smallData.value);
            } else {
              newChartData.push({
                date: new Date(forecast[i].timestamp),
                //history: history[i] ? history[i].value : '',
                history: history[i] ? cpuHistoryMultiplier(history[i].value) : '',
                forecast: cpuForecastMultiplier(forecast[i].value),
              });

              newHistoryData.push(history[i] ? cpuHistoryMultiplier(history[i].value) : '');
              newForeCastData.push(cpuForecastMultiplier(forecast[i].value));
            }
          }

          pcloadChart = [];
          pcloadDataUrl = url;
          pcloadChart.history = newHistoryData;
          pcloadChart.forecast = newForeCastData;
        }

        if (chart == networkChart) {
          console.log(networkData)
          for (let i = 0; i < 200; i++) {
            const smallData = networkData.forecast[i];

            if (new Date(smallData.timestamp) <= new Date(networkChart.endDate)) {
              newChartData.push({
                date: new Date(smallData.timestamp),
                forecast: smallData.value,
                history: networkData.history[i].value
              });
              newHistoryData.push(networkData.history[i].value);
              newForeCastData.push(smallData.value);
            } else {
              newChartData.push({
                date: new Date(forecast[i].timestamp),
                history: history[i] ? networkHistoryMultiplier(history[i].value) : '',
                forecast: networkForecastMultiplier(forecast[i].value),
              });

              newHistoryData.push(history[i] ? networkHistoryMultiplier(history[i].value) : '');
              newForeCastData.push(networkForecastMultiplier(forecast[i].value));
            }
          }
          networkData = [];
          networkData.history = newHistoryData;
          networkData.forecast = newForeCastData;
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

	function moveCharts(){
		interval = setInterval( function() {
			if(playing){
			  if($( "#play" ).hasClass('btn-success'))
				$( "#play" ).removeClass('btn-success');

			  if(!$( "#pause" ).hasClass('btn-danger'))
				$( "#pause" ).addClass('btn-danger');

				if(cCPUPostion == networkChart.dataProvider.length - 21) {
					cCPUPostion = 0;
          updateChart(networkChart, networkDataUrl);
        }
				else
					cCPUPostion++;

				networkChart.zoomToIndexes(cCPUPostion, cCPUPostion + 20);

				if(cRAMPostion == pcloadChart.dataProvider.length - 21) {
					cRAMPostion = 0;

        }
				else
					cRAMPostion++;

				pcloadChart.zoomToIndexes(cRAMPostion, cRAMPostion + 20);

				if(cPCloadPostion == cpuChart.dataProvider.length - 21) {
          cPCloadPostion = 0;
          updateChart(pcloadChart, pcloadDataUrl);

        }
				else
					cPCloadPostion++;

				cpuChart.zoomToIndexes(cPCloadPostion, cPCloadPostion + 20);
			}else{
			  if(!$( "#play" ).hasClass('btn-success'))
				$( "#play" ).addClass('btn-success');

			  if($( "#pause" ).hasClass('btn-danger'))
				$( "#pause" ).removeClass('btn-danger');
		  }
		}, 900 );
	}




  // CPU ustilization chart
  var networkChart = createChart(_el('android-chart-container'), './data/Network_load_n.json');

  // RAM Util chart
  var pcloadChart = createChart(_el('ios-chart-container'), './data/PC_load_n.json');
  var cpuChart = createChart(_el('pcload-chart-container'), './data/CPU_n.json');

  // Network load chart
  // var networkChart = createChart(_el('network-chart-container'), './data/Network_response.json');

  var loopDelay = 2000;

  var theLoop;
  var index = 0;
  var cpuData = {};
  var pcloadData = {};
  var networkData = {};

  // $('#timeline-slider').on('change', function () {
  //   $this = $(this);

  //   loopDelay = 2000 - $this.val();
  //   console.log($this.val(), loopDelay)
  // })

  $('.js-chart-type').on('change', function() {
    var url = $(this).val();
    // console.log(type);

    $.ajax({
      url: url,
      dataType: 'json',
      contentType: "application/json",
      success: function (data) {
        var history = data.metrics_history;
        var newChartData = [];
        // console.log(history, forecast)
        for (var i = 0; i < data.metrics_history.length; i++) {
          // we create date objects here. In your data, you can have date strings
          // and then set format of your dates using chart.dataDateFormat property,
          // however when possible, use date objects, as this will speed up chart rendering.

          newChartData.push({
            date: history[i].timestamp,
            history: history[i].value,
          });
        }

        var allCharts = AmCharts.charts;
        allCharts[2].dataProvider = newChartData;
        allCharts[2].validateData();
      }
    })
  });

  function handleData() {
    theLoop = setTimeout(function () {
      // cpu data chart update
      networkChart.data.labels.push(cpuData.history[index].timestamp.replace('Z', ''));

      if (cpuData.history[index]) {
        networkChart.data.datasets[0].data.push({
          y: cpuData.history[index].value,
          x: cpuData.history[index].timestamp.replace('Z', '')
        });
      }

      if (cpuData.forecast[index]) {
        networkChart.data.datasets[0].data.push({
          y: cpuData.forecast[index].value,
          x: cpuData.forecast[index].timestamp.replace('Z', '')
        });
      }

      //ram data chart update
      pcloadChart.data.labels.push(pcloadData.history[index].timestamp.replace('Z', ''));
      if (pcloadData.history[index]) {
        pcloadChart.data.datasets[2].data.push({
          y: pcloadData.history[index].value,
          x: pcloadData.history[index].timestamp.replace('Z', '')
        });
      }
      if (pcloadData.forecast[index]) {
        pcloadChart.data.datasets[2].data.push({
          y: pcloadData.forecast[index].value,
          x: pcloadData.forecast[index].timestamp.replace('Z', '')
        });
      }

      //network data chart update
      networkChart.data.labels.push(networkData.history[index].timestamp.replace('Z', ''));
      if (networkData.history[index]) {
        networkChart.data.datasets[2].data.push({
          y: networkData.history[index].value,
          x: networkData.history[index].timestamp.replace('Z', '')
        });
      }
      if (networkData.forecast[index]) {
        networkChart.data.datasets[2].data.push({
          y: networkData.forecast[index].value,
          x: networkData.forecast[index].timestamp.replace('Z', '')
        });
      }

      if (cpuData.history[index] || cpuData.forecast[index]) {
        networkChart.update();
      }

      if (pcloadData.history[index] || pcloadData.forecast[index]) {
        pcloadChart.update();
      }

      if (networkData.history[index] || networkData.forecast[index]) {
        networkChart.update();
      }

      index++;
      handleData();
    }, loopDelay);
  }
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
      chart.categoryField = "date";
      chart.hideCredits = true;

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

      // CURSOR
      var chartCursor = new AmCharts.ChartCursor();
      chartCursor.cursorAlpha = 0.1;
      chartCursor.fullWidth = true;
      chartCursor.valueLineBalloonEnabled = true;
      chart.addChartCursor(chartCursor);

      // SCROLLBAR
      var chartScrollbar = new AmCharts.ChartScrollbar();
      chartScrollbar.dragIconWidth = 55;
      chart.addChartScrollbar(chartScrollbar);

      // LEGEND
      var legend = new AmCharts.AmLegend();
      legend.marginLeft = 110;
      legend.useGraphSettings = true;
      chart.addLegend(legend);

      console.log(chart);
      // return chart;
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

          // console.log(history, forecast)
          for (var i = 0; i < data.metrics_history.length; i++) {
            // we create date objects here. In your data, you can have date strings
            // and then set format of your dates using chart.dataDateFormat property,
            // however when possible, use date objects, as this will speed up chart rendering.
            var newDate = new Date(firstDate);
            newDate.setDate(newDate.getDate() + i);

            var historyValue =  history[i].value;

            if (url === './data/CPU_n.json') {
              if(historyValue){
                historyValue = cpuHistoryMultiplier(historyValue);
              }
            } else if (url === './data/Network_load_n.json') {
              if(historyValue){
                historyValue = networkHistoryMultiplier(historyValue);
              }

            } else if (url === './data/PC_load_n.json') {
              if(historyValue){
                historyValue = cpuHistoryMultiplier(historyValue);
              }

            }



            chartData.push({
              date: history[i].timestamp,
              //history: history[i].value,
              history: historyValue,
            });

            $('.amcharts-chart-div a').hide();
            $('svg image').hide();
            $('svg image').next('rect').hide();
          }

          chart.dataProvider = chartData;

		   if (url === './data/Network_load_n.json') {
         networkChart = chart;
         networkData.history = history;
         networkData.forecast = forecast;

			}

			if (url === './data/PC_load_n.json') {
        pcloadChart = chart;
        pcloadData.history = history;
        pcloadData.forecast = forecast;
			}

			if (url ===  './data/CPU_n.json') {
        cpuChart = chart;
        cpuData.history = history;
        cpuData.forecast = forecast;
      }

      console.log(cpuData);

          // console.log(chartData);

          chart.validateData();
        },
        error: function (err) {

        }
      });

      var firstDate = new Date();
      firstDate.setDate(firstDate.getDate() - 50);


    }

    // this method is called when chart is first inited as we listen for "dataUpdated" event
    function zoomChart() {
      // different zoom methods can be used - zoomToIndexes, zoomToDates, zoomToCategoryValues
      chart.zoomToIndexes(10, 20);
    }
    console.log(chart);
    return chart;
  }

    function cpuHistoryMultiplier(value){
      var x = (cpuloadFactor *  (value/cpuReductionFactor))/100;
      var load = (((0.2)*(Math.pow(x,2))) + (0.6*x) + 0.2)*100;
      console.log(load);
      return load>cpuThreshold?cpuThreshold:load;
    }

    function cpuForecastMultiplier(value){
      var x = (cpuloadFactor *  (value/cpuReductionFactor))/100;
      var load = (((0.25)*(Math.pow(x,2))) + (0.7*x) + 0.15)*100
      if(isThresholdForecast){
        return load>cpuThreshold?cpuThreshold:load;
      } else {
        return load;
      }
    }

    function networkHistoryMultiplier(value){
      value = (value/1024)/1024;
      var x = (networkloadFactor *  value)/100;
      var load = (((0.2)*(Math.pow(x,2))) + (0.6*x) + 0.2)*100;
      return load>networkThreshold?networkThreshold:load;

    }

    function networkForecastMultiplier(value){
      value = (value/1024)/1024;
      var x =  (networkloadFactor *  value)/100;
      var load = (((0.25)*(Math.pow(x,2))) + (0.7*x) + 0.15)*100;
      if(isThresholdForecast){
        return load>networkThreshold?networkThreshold:load;
      } else {
        return load;
      }

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
$(window).on('load', function() {
  setTimeout(function() {
    // $('svg image').hide();
    // $('svg image').next('rect').hide();
  }, 500);
})
})(jQuery)
