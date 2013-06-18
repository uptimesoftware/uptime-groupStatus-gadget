if (typeof UPTIME == "undefined") {
	var UPTIME = {};
}

if (typeof UPTIME.GroupCurrentStatusPieChart == "undefined") {
	UPTIME.GroupCurrentStatusPieChart = function(options, displayStatusBar, clearStatusBar) {
		Highcharts.setOptions({
			global : {
				useUTC : false
			}
		});

		var chartDivId = null;
		var entityGroupId = null;
		var entityGroupName = null;
		var statusType = null;
		var refreshInterval = 1;
		var chartTimer = null;
		var includeSubgroup = true;
		var api = new apiQueries();

		var seriesData = [ {
			id : 'OK',
			name : 'OK',
			y : 0,
			color : '#67B10B',
			visible : false,
			type : "pie"
		}, {
			id : 'WARN',
			name : 'WARN',
			y : 0,
			color : '#DAD60B',
			visible : false,
			type : "pie"
		}, {
			id : 'CRIT',
			name : 'CRIT',
			y : 0,
			color : '#B61211',
			visible : false,
			type : "pie"
		}, {
			id : 'MAINT',
			name : 'MAINT',
			y : 0,
			color : '#555B98',
			visible : false,
			type : "pie"
		}, {
			id : 'UNKNOWN',
			name : 'UNKNOWN',
			y : 1,
			color : '#AEAEAE',
			visible : true,
			type : "pie"
		} ];

		if (typeof options == "object") {
			chartDivId = options.chartDivId;
			entityGroupId = options.entityGroupId;
			entityGroupName = options.entityGroupName;
			statusType = options.statusType;
			refreshInterval = options.refreshInterval;
			includeSubgroup = options.includeSubgroup;
		}

		var dataLabelsEnabled = false;
		var chart = new Highcharts.Chart({
			chart : {
				renderTo : chartDivId,
				height : 200,
				plotBackgroundColor : null,
				plotBorderWidth : null,
				plotShadow : false,
				yAxis : {
					allowDecimals : false
				}
			},
			credits : {
				enabled : false
			},
			title : {
				text : entityGroupName,
				style : {
					fontSize : '10px'
				},
				margin : 1
			},
			tooltip : {
				formatter : function() {
					var plural = "";
					if (this.y > 1) {
						plural = "s";
					}
					if (statusType == "hostStatusType") {
						return '<b>' + this.point.name + '</b> - ' + this.y + " element" + plural;
					} else {
						return '<b>' + this.point.name + '</b> - ' + this.y + " monitor" + plural;
					}
				}
			},
			legend : {
				enabled : false
			},
			plotOptions : {
				pie : {
					allowPointSelect : true,
					cursor : 'pointer',
					dataLabels : {
						enabled : true,
						distance : 10,
						style : {
							width : '100px'
						},
						color : '#000000',
						connectorColor : '#000000',
						formatter : function() {
							if (dataLabelsEnabled) {
								return '<b>' + this.point.name + '</b> (' + this.y + ") " + Math.floor(this.percentage) + '%';
							} else {
								return '';
							}
						}
					},
					animation : true,
				}
			},
			series : [ {
				type : 'pie',
				name : 'Status',
				data : seriesData
			} ]
		});

		function requestData() {
			var reloadMs = refreshInterval * 60 * 1000;

			if (statusType == "hostStatusType") {
				chart.setTitle({
					text : entityGroupName + " Elements"
				});
			} else {
				// monitorStatusType
				chart.setTitle({
					text : entityGroupName + " Monitors"
				});
			}

			api.getStatusCounts(entityGroupId, statusType, includeSubgroup).then(function(statusCount) {
				$.each(seriesData, function(i, item) {
					var sliceData = statusCount[item.id];
					item.y = 0;
					if (sliceData) {
						item.y = sliceData;
						item.visible = true;
					} else {
						item.visible = false;
					}
				});
				clearStatusBar();
				dataLabelsEnabled = true;
				chart.xAxis[0].isDirty = true;
				chart.redraw();
				chart.series[0].setData(seriesData, true);
				chart.hideLoading();
			}).then(null, function(error) {
				chart.hideLoading();
				displayStatusBar(error, "Error Loading Chart Data");
			});

			chartTimer = setTimeout(requestData, reloadMs);
		}
		// public functions for this function/class
		var publicFns = {
			render : function() {
				chart.showLoading();
				requestData();
			},
			stopTimer : function() {
				if (chartTimer) {
					window.clearInterval(chartTimer);
				}
			},
			destroy : function() {
				chart.destroy();
			}
		};
		return publicFns; // Important: we need to return the public
		// functions/methods
	};
}
