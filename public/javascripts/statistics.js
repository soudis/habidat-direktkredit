  $(document).ready(function(){
    var dynamicColors = function() {
        var r = Math.floor(Math.random() * 255);
        var g = Math.floor(Math.random() * 255);
        var b = Math.floor(Math.random() * 255);
        return "rgb(" + r + "," + g + "," + b + ")";
    };

    var valuesSorted = (data) => {
      return Object.values(data).sort(function(a,b){return a-b})
    }

    var keysSorted = (data)  => {
      var labels = Object.keys(data).sort(function(a,b){return data[a]-data[b]})
      return labels;
    }

    function loadChart(container, url, callback) {
        $.ajax({
            type: 'get',     
            dataType: 'json',
            url: url,
            complete: function (result) {
              var data = JSON.parse(result.responseText);
              var ctx = $(container).get(0).getContext('2d');
              var colors = [];
              for (var i in data) {
                colors.push(dynamicColors());
              }
              var chart = new Chart(ctx,{
                  type: 'pie',
                  data: {
                    datasets: [{data: valuesSorted(data), backgroundColor: colors}],
                    labels: keysSorted(data)
                  }
              }); 
              callback(chart);
            }
        });     	
    }    

    var byRelationChart;
    $('#by-relation').each(() => {
    	loadChart('#by-relation', '/statistics/byrelation', function(chart) {
    		byRelationChart = chart;
    	})
    })
 	
 	var byRegionChart;
    $('#by-region').each(function () {
    	loadChart('#by-region', '/statistics/byregion/country', function(chart) {
    		byRegionChart = chart;
    	})
    })

	$("#by-region").click( 
	    function(evt){
	        var activePoints = byRegionChart.getElementsAtEvent(evt);
	        if (activePoints && activePoints.length > 0 ) {
	        	byRegionChart.destroy();
				var label = byRegionChart.data.labels[activePoints[0]._index];
				$('#by-region-level').text('PLZ (' + label.split(' ')[0] + ')')
		        var url = '/statistics/byregion/zip-' + label.split(' ')[0];
		    	loadChart('#by-region', url, function(chart) {
		    		byRegionChart = chart;
		    	})
	        }	        
	    }
	);     

    $('#by-month').each(() => {
        $.ajax({
            type: 'get',     
            dataType: 'json',
            url: '/statistics/bymonth',
            complete: function (result) {
              var data = JSON.parse(result.responseText);
              var min = Math.min.apply(Math, Object.values(data));
              var max = Math.max.apply(Math, Object.values(data));
              var ctx = $("#by-month").get(0).getContext('2d');

              var byMonthChart = new Chart(ctx,{
                  type: 'line',
                  data: {
                    datasets: [{data: Object.values(data), backgroundColor: dynamicColors(), label: "Verschuldung"}],
                    labels: Object.keys(data)
                  },
                  options: {
                    responsive: true,
                    title: {
                      display: true,
                      text: 'Letzte 12 Monate'
                    },
                    scales: {
                      xAxes: [{
                        display: true,
                        scaleLabel: {
                          display: true,
                          labelString: 'Monat'
                        }
                      }],
                      yAxes: [{
                        display: true,
                        ticks: {
                          suggestedMin : min * 0.95,
                          suggestedMax : max * 1.05
                        },
                        scaleLabel: {
                          display: true,
                          labelString: 'Schuldenstand'
                        }
                      }]
                    }
                  }
              });              
            }
        }); 
    })

    $('#transactions-by-month').each(() => {
        $.ajax({
            type: 'get',     
            dataType: 'json',
            url: '/statistics/transactionsbymonth',
            complete: function (result) {
              var data = JSON.parse(result.responseText);
              var dataCombined = Object.values(data.deposits).concat(Object.values(data.withdrawals)).concat(Object.values(data.interest));
              var min = Math.min.apply(Math, dataCombined);
              var max = Math.max.apply(Math, dataCombined);
              var ctx = $("#transactions-by-month").get(0).getContext('2d');

              var byMonthChart = new Chart(ctx,{
                  type: 'line',
                  data: {
                    datasets: [
                      {data: Object.values(data.deposits), borderColor: dynamicColors(), label: "Einzahlungen", steppedLine: false, fill: false}, 
                      {data: Object.values(data.withdrawals), borderColor: dynamicColors(), label: "Rückzahlungen", steppedLine: false, fill: false},
                      {data: Object.values(data.notReclaimed), borderColor: dynamicColors(), label: "Nicht Rückgefordert", steppedLine: false, fill: false},
                      {data: Object.values(data.interest), borderColor: dynamicColors(), label: "Zinsen", steppedLine: false, fill: false}],
                    labels: Object.keys(data.deposits)
                  },
                  options: {
                    responsive: true,
                    title: {
                      display: true,
                      text: 'Letzte 12 Monate'
                    },
                    scales: {
                      xAxes: [{
                        display: true,
                        scaleLabel: {
                          display: true,
                          labelString: 'Monat'
                        }
                      }],
                      yAxes: [{
                        display: true,
                        ticks: {
                          suggestedMin : 0,
                          suggestedMax : max * 1.05
                        },
                        scaleLabel: {
                          display: true,
                          labelString: 'Transaktionen'
                        }
                      }]
                    }
                  }
              });              
            }
        }); 
    })

  });