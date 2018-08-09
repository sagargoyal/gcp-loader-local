(function($){
  var chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    legend: {
      display: true,
      fill: true,
      position: 'right'
    },
    pan: {
      enabled: true,
      mode: 'x',
    },
    elements: {
      point: { 
        radius: 1
      }
    },
    
  };

  var chartDatasets = [
    {
      label: "History data",
      borderWidth: 1 ,
      fill: false,
      borderColor: 'rgb(127,127,127)',
      backgroundColor: 'rgb(127,127,127)',
      data: [],
    },
    {
      label: "Recommended data",
      borderWidth: 1,
      fill: false,
      borderColor: 'rgb(3, 169, 244)',
      backgroundColor: 'rgb(3, 169, 244)',
      data: [],
    },
    {
      label: "Prediction data",
      borderWidth: 1,
      fill: false,
      borderColor: 'rgb(33,150, 243)',
      backgroundColor: 'rgb(33,150, 243)',
      data: [],
    },
  ];

  // CPU ustilization chart
  var cpuChart = generateChart(_el('cpu-util-chart'));

  // RAM Util chart
  var ramChart = generateChart(_el('ram-util-chart'));

  // Network load chart
  var networkChart = generateChart(_el('network-load-chart'));

  // load CPU chart data
  loadData('/data/CPU_response.json', 'cpu', cpuChart);
  loadData('/data/RAM_response.json', 'ram', ramChart);
  loadData('/data/Network_response.json', 'network', ramChart);

  function loadData(url, target, chart) {
    $.ajax({
      url: url,
      // url: '/data/data.json',   
      // data: dataParam,
      dataType: 'json',
      contentType: "application/json",
      success: function (data) {
        // console.log(data);

        if(target === 'cpu') {
          cpuData.history = data.metrics_history;
          cpuData.forecast = data.forecast_result["0"].metrics_forecast;
        }
        
        if(target === 'ram') {
          ramData.history = data.metrics_history;
          ramData.forecast = data.forecast_result["0"].metrics_forecast;
        }

        if (target === 'network') {
          networkData.history = data.metrics_history;
          networkData.forecast = data.forecast_result["0"].metrics_forecast;
        }

        if(!isEmpty(cpuData) && !isEmpty(ramData) && !isEmpty(networkData)) {
          handleData();
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

  $('#timeline-slider').on('change', function() {
    $this = $(this);

    loopDelay = 2000 - $this.val();
    console.log($this.val(), loopDelay)
  })

  function allChartData() {

  }
  function handleData() {
    theLoop = setTimeout(function() {
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
  function generateChart(chartEl) {
    var ctx = chartEl.getContext('2d');
    ctx.height = 300;
    var chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: chartDatasets
      },
      options: chartOptions
    });

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