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

		var dimensions = new UPTIME.pub.gadgets.Dimensions(100, 100);
		var chartDivId = null;
		var elementGroupId = null;
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
			dimensions = options.dimensions;
			chartDivId = options.chartDivId;
			elementGroupId = options.elementGroupId;
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

		var dataLabelsEnabled = false;
		var chart = new Highcharts.Chart({
			chart : {
				renderTo : chartDivId,
				width : dimensions.width,
				height : dimensions.height,
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
				text : '&nbsp;',
				y : 5,
				style : $.extend({
					fontWeight : "bold"
				}, textStyle),
				useHTML : true
			},
			subtitle : {
				text : '&nbsp;',
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
					if (dataLabelsEnabled) {
						return '<b>' + this.series.name + '</b> - ' + objectCount(statusType, this.y);
					} else {
						return '';
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
			api.getStatusCounts(elementGroupId, statusType, includeSubgroup).then(
					function(result) {
						chart.setTitle({
							text : '<a href="' + uptimeGadget.getGroupUrls(result.groupId, result.groupName).services
									+ '" target="_top">' + escapeHtml(result.groupName)
									+ (result.hasSubgroups ? " and subgroups" : "") + '</a>',
						}, {
							text : objectCount(statusType, result.total),
						});
						for ( var severity in result.statusCount) {
							var bar = chart.get(severity);
							if (result.statusCount.hasOwnProperty(severity)) {
								bar.show();
								bar.setData([ result.statusCount[severity] ]);
							} else {
								bar.hide();
							}
						}
						clearStatusBar();
						dataLabelsEnabled = true;
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
			resize : function(dimensions) {
				chart.setSize(dimensions.width, dimensions.height);
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