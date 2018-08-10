(function ($) {

 	/**
	 * An interval to add new data points
	 */
	var cCPUPostion = 0;
	var cRAMPostion = 0;
	var cNetworkPostion = 0;	
	var interval;
	
	moveCharts();
	
	

	function moveCharts(){
		interval = setInterval( function() {	  
			if(cCPUPostion == cpuChart.dataProvider.length - 21)
				cCPUPostion = 0;
			else
				cCPUPostion++;
			
			cpuChart.zoomToIndexes(cCPUPostion, cCPUPostion + 20);
			
			if(cRAMPostion == ramChart.dataProvider.length - 21)
				cRAMPostion = 0;
			else
				cRAMPostion++;
			
			ramChart.zoomToIndexes(cRAMPostion, cRAMPostion + 20);
			
			if(cNetworkPostion == networkChart.dataProvider.length - 21)
				cNetworkPostion = 0;
			else
				cNetworkPostion++;
			
			networkChart.zoomToIndexes(cNetworkPostion, cNetworkPostion + 20);
			
		}, 10 );
	}

  // CPU ustilization chart
  var cpuChart = createChart(_el('cpu-chart-container'), './data/CPU_n.json');

  // RAM Util chart
  var ramChart = createChart(_el('ram-chart-container'), './data/RAM_n.json');

  // Network load chart
  var networkChart = createChart(_el('network-chart-container'), './data/Network_n.json');

  // load CPU chart data
//   loadData('/data/CPU_n.json', 'cpu', cpuChart);
  // loadData('/data/RAM_response.json', 'ram', ramChart);
  // loadData('/data/Network_response.json', 'network', ramChart);

  function loadData(url, target, chart) {
    $.ajax({
      url: url,
      dataType: 'json',
      contentType: "application/json",
      success: function (data) {
        // console.log(data);

        if (target === 'cpu') {
          cpuData.history = data.metrics_history;
          cpuData.forecast = data.forecast_result["0"].metrics_forecast;

        }

        if (target === 'ram') {
          ramData.history = data.metrics_history;
          ramData.forecast = data.forecast_result["0"].metrics_forecast;
        }

        if (target === 'network') {
          networkData.history = data.metrics_history;
          networkData.forecast = data.forecast_result["0"].metrics_forecast;
        }

        if (!isEmpty(cpuData) && !isEmpty(ramData) && !isEmpty(networkData)) {
          // handleData();
        }

      },
      error: function (err) {
        console.log(err);
      }
    });
  }
  var loopDelay = 2000;

  var theLoop;
  var index = 0;
  var cpuData = {};
  var ramData = {};
  var networkData = {};

  // $('#timeline-slider').on('change', function () {
  //   $this = $(this);

  //   loopDelay = 2000 - $this.val();
  //   console.log($this.val(), loopDelay)
  // })

  function handleData() {
    theLoop = setTimeout(function () {
      // cpu data chart update
      cpuChart.data.labels.push(cpuData.history[index].timestamp.replace('Z', ''));

      if (cpuData.history[index]) {
        cpuChart.data.datasets[0].data.push({
          y: cpuData.history[index].value,
          x: cpuData.history[index].timestamp.replace('Z', '')
        });
      }

      if (cpuData.forecast[index]) {
        cpuChart.data.datasets[0].data.push({
          y: cpuData.forecast[index].value,
          x: cpuData.forecast[index].timestamp.replace('Z', '')
        });
      }

      //ram data chart update
      ramChart.data.labels.push(ramData.history[index].timestamp.replace('Z', ''));
      if (ramData.history[index]) {
        ramChart.data.datasets[2].data.push({
          y: ramData.history[index].value,
          x: ramData.history[index].timestamp.replace('Z', '')
        });
      }
      if (ramData.forecast[index]) {
        ramChart.data.datasets[2].data.push({
          y: ramData.forecast[index].value,
          x: ramData.forecast[index].timestamp.replace('Z', '')
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
        cpuChart.update();
      }

      if (ramData.history[index] || ramData.forecast[index]) {
        ramChart.update();
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
      // categoryAxis.dateFormats = [

      //   {
      //     period: 'fff',
      //     format: 'JJ:NN:SS'
      //   },
      //   {
      //     period: 'ss',
      //     format: 'JJ:NN:SS'
      //   },
      //   {
      //     period: 'mm',
      //     format: 'JJ:NN'
      //   },
      //   {
      //     period: 'hh',
      //     format: 'JJ:NN'
      //   },
      //   {
      //     period: 'DD',
      //     format: 'DD'
      //   },
      //   {
      //     period: 'WW',
      //     format: 'DD'
      //   },
      //   {
      //     period: 'MM',
      //     format: 'MMM'
      //   },
      //   {
      //     period: 'YYYY',
      //     format: 'YYYY'
      //   }
      // ];

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
      graph1.title = "History data";
      graph1.valueField = "history";
      graph1.bullet = "round";
      graph1.hideBulletsCount = 24;
      graph1.bulletBorderThickness = 1;
      chart.addGraph(graph1);

      // second graph
      var graph2 = new AmCharts.AmGraph();
      graph2.valueAxis = valueAxis1; // we have to indicate which value axis should be used
      graph2.title = "Forecast data";
      graph2.valueField = "forecast";
      graph2.bullet = "square";
      graph2.hideBulletsCount = 24;
      graph2.bulletBorderThickness = 1;
      chart.addGraph(graph2);

      // third graph
      var graph3 = new AmCharts.AmGraph();
      graph3.valueAxis = valueAxis1; // we have to indicate which value axis should be used
      graph3.title = "Recommended data";
      graph3.valueField = "recommended";
      graph3.bullet = "square";
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

            // console.log('reco',recommended);
          for (var i = 0; i < 400; i++) {
            // we create date objects here. In your data, you can have date strings
            // and then set format of your dates using chart.dataDateFormat property,
            // however when possible, use date objects, as this will speed up chart rendering.
            var newDate = new Date(firstDate);
            newDate.setDate(newDate.getDate() + i);
            console.log(recommended[i])
            chartData.push({
              date: new Date(forecast[i].timestamp),
              history: history[i] ? history[i].value : '',
              forecast: forecast[i].value,
                recommended: forecast[i].value
            });

            
          }
            $('.amcharts-chart-div a').hide();
            $('svg image').hide();
            $('svg image').next('rect').hide();

            
            chart.dataProvider = chartData;
            
            console.log('chdata', chartData);
	
		     if (url === './data/CPU_n.json') {
			   cpuChart = chart;
			}

			if (url === './data/RAM_n.json') {
			  ramChart = chart;
			}

			if (url ===  './data/Network_n.json') {
			  networkChart = chart;
			}
        //   console.log(chartData);

          chart.validateData();          
        },
        error: function(err) {

        }
      });

      var firstDate = new Date();
      firstDate.setDate(firstDate.getDate() - 50);

      
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

})(jQuery)

