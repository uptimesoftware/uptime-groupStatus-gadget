if (typeof UPTIME == "undefined") {
	var UPTIME = {};
}

if (typeof UPTIME.GroupCurrentStatusBarChart == "undefined") {
	UPTIME.GroupCurrentStatusBarChart = function(options) {
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
		var statusBarDivId = null;
		var includeSubgroup = true;
		var api = new apiQueries();

		if (typeof options == "object") {
			chartDivId = options.chartDivId;
			entityGroupId = options.entityGroupId;
			entityGroupName = options.entityGroupName;
			statusType = options.statusType;
			refreshInterval = options.refreshInterval;
			statusBarDivId = options.statusBarDivId;
			includeSubgroup = options.includeSubgroup;
		}

		var seriesData = [ {
			id : 'OK',
			name : 'OK',
			data : [ 0 ],
			color : '#67B10B'
		}, {
			id : 'WARN',
			name : 'WARN',
			data : [ 0 ],
			color : '#DAD60B'
		}, {
			id : 'CRIT',
			name : 'CRIT',
			data : [ 0 ],
			color : '#B61211'
		}, {
			id : 'MAINT',
			name : 'MAINT',
			data : [ 0 ],
			color : '#555B98'
		}, {
			id : 'UNKNOWN',
			name : 'UNKNOWN',
			data : [ 0 ],
			color : '#AEAEAE'
		} ];

		var chart = new Highcharts.Chart({
			chart : {
				renderTo : chartDivId,
				height : 200,
				type : 'column',
				animation : true
			},
			credits : {
				enabled : false
			},
			plotOptions : {
				series : {
					pointWidth : 20,
					animation : true
				}
			},
			title : {
				text : entityGroupName
			},
			xAxis : {
				labels : {
					enabled : false
				}
			},
			yAxis : {
				allowDecimals : false,
				min : 0,
				title : {
					text : ''
				}
			},
			tooltip : {
				formatter : function() {
					var plural = "";
					if (this.y > 1) {
						plural = "s";
					}
					if (statusType == "hostStatusType") {
						return '<b>' + this.series.name + '</b> - ' + this.y + " element" + plural;
					} else {
						return '<b>' + this.series.name + '</b> - ' + this.y + " monitor" + plural;
					}
				}
			},
			series : seriesData
		});

		function requestData() {
			chart.showLoading();
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
				for ( var severity in statusCount) {
					var bar = chart.get(severity);
					if (statusCount.hasOwnProperty(severity)) {
						bar.show();
						bar.setData([ statusCount[severity] ]);
					} else {
						bar.hide();
					}
				}
				chart.hideLoading();
			}).then(null, function(error) {
				// FIXME
				var statusBar = $(statusBarDivId);
				statusBar.css("color", "red");
				statusBar.text("Can't connect to the up.time API.");
				statusBar.show();
				chart.hideLoading();
			});

			chartTimer = setTimeout(requestData, reloadMs);

		}

		// public functions for this function/class
		var publicFns = {
			render : requestData,
			stopTimer : function() {
				if (chartTimer) {
					window.clearInterval(chartTimer);
				}
			}
		};
		return publicFns; // Important: we need to return the public
		// functions/methods

	};
}