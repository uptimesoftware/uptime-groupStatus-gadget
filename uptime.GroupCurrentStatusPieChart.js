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

		var dimensions = new UPTIME.pub.gadgets.Dimensions(100, 100);
		var chartDivId = null;
		var elementGroupId = null;
		var statusType = null;
		var refreshInterval = 30;
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

		var dataLabelsEnabled = false;
		var chart = new Highcharts.Chart({
			chart : {
				renderTo : chartDivId,
				width : dimensions.width,
				height : dimensions.height,
				plotBackgroundColor : null,
				plotBorderWidth : null,
				plotShadow : false,
				yAxis : {
					allowDecimals : false
				},
				style : textStyle
			},
			credits : {
				enabled : false
			},
			tooltip : {
				style : textStyle,
				formatter : function() {
					if (dataLabelsEnabled) {
						return '<b>' + this.point.name + '</b> - ' + objectCount(statusType, this.y);
					} else {
						return '';
					}
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
						connectorColor : '#565E6C',
						style : textStyle,
						formatter : function() {
							if (dataLabelsEnabled) {
								return '<b>' + this.point.name + '</b> (' + this.y + ") " + Math.floor(this.percentage) + '%';
							} else {
								return '';
							}
						}
					},
					animation : true
				}
			},
			series : [ {
				type : 'pie',
				name : 'Status',
				data : seriesData
			} ],
			spacingTop : 5,
			spacingRight : 5,
			spacingBottom : 5,
			spacingLeft : 5
		});

		function requestData() {
			api.getStatusCounts(elementGroupId, statusType, includeSubgroup).then(
					function(result) {
						if (!result.groupId || !result.groupName) {
						alert("!?");
						}
						chart.setTitle({
							text : '<a href="' + uptimeGadget.getGroupUrls(result.groupId, result.groupName).services
									+ '" target="_top">' + escapeHtml(result.groupName)
									+ (result.hasSubgroups ? " and subgroups" : "") + '</a>',
						}, {
							text : objectCount(statusType, result.total),
						});
						$.each(seriesData, function(i, item) {
							var sliceData = result.statusCount[item.id];
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
						chart.series[0].setData(seriesData, true);
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
			resize : function(newDimensions) {
				chart.setSize(newDimensions.width, newDimensions.height);
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
