if (typeof UPTIME == "undefined") {
	var UPTIME = {};
}

if (typeof UPTIME.GroupCurrentStatusBarChart == "undefined") {
	UPTIME.GroupCurrentStatusBarChart = function(options, displayStatusBar, clearStatusBar) {
		Highcharts.setOptions({
			global : {
				useUTC : false
			}
		});

		var chartDivId = null;
		var elementGroupId = null;
		var elementGroupName = null;
		var statusType = null;
		var refreshInterval = 30;
		var chartTimer = null;
		var includeSubgroup = true;
		var api = new apiQueries();

		var textStyle = {
			fontFamily : "Verdana, Arial, Helvetica, sans-serif",
			fontSize : "9px",
			lineHeight : "11px",
			color : "#565E6C"
		};

		if (typeof options == "object") {
			chartDivId = options.chartDivId;
			elementGroupId = options.elementGroupId;
			elementGroupName = options.elementGroupName;
			statusType = options.statusType;
			refreshInterval = options.refreshInterval;
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
				animation : true,
				style : textStyle
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
				text : '<a href="' + uptimeGadget.getGroupUrls(elementGroupId, elementGroupName).services + '" target="_top">'
						+ elementGroupName + '</a>',
				y : 5,
				style : $.extend({
					fontWeight : "bold"
				}, textStyle),
				useHTML : true
			},
			subtitle : {
				text : statusType == "hostStatusType" ? "Element Status" : "Monitor Status",
				y : 20,
				style : textStyle,
				useHTML : true
			},
			xAxis : {
				labels : {
					enabled : false
				}
			},
			yAxis : {
				labels : {
					style : textStyle,
				},
				allowDecimals : false,
				min : 0,
				title : {
					text : ''
				}
			},
			tooltip : {
				style : textStyle,
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
			legend : {
				enabled : false
			},
			series : seriesData,
			spacingTop : 5,
			spacingRight : 5,
			spacingBottom : 5,
			spacingLeft : 5
		});

		function requestData() {
			api.getStatusCounts(elementGroupId, statusType, includeSubgroup).then(function(statusCount) {
				for ( var severity in statusCount) {
					var bar = chart.get(severity);
					if (statusCount.hasOwnProperty(severity)) {
						bar.show();
						bar.setData([ statusCount[severity] ]);
					} else {
						bar.hide();
					}
				}
				clearStatusBar();
				chart.hideLoading();
			}).then(null, function(error) {
				chart.hideLoading();
				displayStatusBar(error, "Error Loading Chart Data");
			});
			if (refreshInterval > 0) {
				chartTimer = setTimeout(requestData, refreshInterval * 1000);
			}
		}

		// public functions for this function/class
		var publicFns = {
			render : function() {
				chart.showLoading();
				requestData();
			},
			stopTimer : function() {
				if (chartTimer) {
					window.clearTimeout(chartTimer);
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