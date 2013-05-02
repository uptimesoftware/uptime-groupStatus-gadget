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
				var refreshIntervalDivId = null;
				var chartTimer = null;
				var statusBarDivId = null;
				var includeSubgroup = true;
				var uptime_api = null;

                if (typeof options == "object") {
                        chartDivId = options.chartDivId;
						entityGroupId = options.entityGroupId;
						entityGroupName = options.entityGroupName;
						statusType = options.statusType;
						refreshInterval = options.refreshInterval;
						refreshIntervalDivId = options.refreshIntervalDivId;
						statusBarDivId = options.statusBarDivId;
						uptime_api = options.uptime_api;
						includeSubgroup = options.includeSubgroup;
                }
                
                
				var seriesData = [ 	 
								{
									id : 'OK',
									name : 'OK',
									data : [ 0],
									color: '#67B10B'
								}, 		 {
									id : 'WARN',
									name : 'WARN',
									data : [ 0],
									color: '#DAD60B'                        
		                        },		{
									id : 'CRIT',
									name : 'CRIT',
									data : [ 0],
									color: '#B61211'                        
								},		{
									id: 'MAINT', 
									name : 'MAINT',
									data : [0],
									color: '#555B98'
								},		{
									id : 'UNKNOWN',
									name : 'UNKNOWN',
									data : [ 0],
									color: '#AEAEAE'
								}
						];
				var chart;
				

                chart = new Highcharts.Chart({
                        chart : {
                                renderTo : chartDivId,
								height: 200,
                                type : 'column',
								events: {
									load: requestData()
								},
                        },
						credits: { enabled: false },
						plotOptions: {
							series: {
								pointWidth: 20
							}
						},
                        title : {
                                text : entityGroupName
                        },
						xAxis: {
							labels: {
								enabled: false
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
									if (this.y>1){
										plural = "s";
									}
									if (statusType == "hostStatusType") {
											return '<b>'+ this.series.name +'</b> - '+ this.y +" element"+plural;
										} else {
											return '<b>'+ this.series.name +'</b> - '+ this.y +" monitor"+plural;
									}
                                }
                        },
                        series : seriesData
                });					  
	   
			   function requestData() {
				   //hostStatusType
				   //monitorStatusType
				   
					var statusCount = { 'OK': 0, 'WARN': 0, 'CRIT': 0, 'UNKNOWN': 0, 'MAINT': 0};
					
					var reloadMs = refreshInterval * 60 * 1000;
					var currentTime = new Date();
					stringTime = getDateString(currentTime);
					$("#lastRefresh").html("Last Refresh:  "+currentTime.getFullYear()+"-"+stringTime[0]+"-"+stringTime[1]+" "+stringTime[2]+":"+stringTime[3]+":"+stringTime[4]);
					
					if (includeSubgroup) {
						uptime_api.getSubGroups(entityGroupId, function(subGroupId){
												
							uptime_api.getGroupStatus(subGroupId, function(groupStatus) {
								if (statusType == "hostStatusType") {
									chart.setTitle({text: entityGroupName + " Hosts"});
									
									$.each(groupStatus.elementStatus, function(index,element) {
										statusCount[element.status]++;
										//console.log("2name="+ element.name + " status=" + element.status);
									});
								}
								else {
									chart.setTitle({text: entityGroupName + " Monitors"});
									$.each(groupStatus.monitorStatus, function(index,monitor) {
									
										if ((monitor.isMonitored) && !(monitor.isHidden)) {
											statusCount[monitor.status]++;
											//console.log("monitor.elementId="+ monitor.elementId + " status=" + monitor.status);
										}
									});
								}

								for (var severity in statusCount ){						
									var bar = chart.get(severity);					
									if (statusCount.hasOwnProperty(severity)){
										bar.show();
										bar.setData([statusCount[severity]]);
									}
									else {
										bar.hide();
									}						
									//console.log("index=" + severity + " statusCount=" + statusCount[severity]);
								}						
							},function(jqXHR, textStatus, errorThrown) {
								var statusBar = $(statusBarDivId);
								statusBar.css("color", "red");
								statusBar.text("Can't connect to the up.time API.");
								statusBar.show();
							});
						});
					}
					////////////////////////////////////
					uptime_api.getGroupStatus(entityGroupId, function(groupStatus) {
						if (statusType == "hostStatusType") {
							chart.setTitle({text: entityGroupName + " Hosts"});
							
							$.each(groupStatus.elementStatus, function(index,element) {
								statusCount[element.status]++;
								//console.log("2name="+ element.name + " status=" + element.status);
							});
						}
						else {
							chart.setTitle({text: entityGroupName + " Monitors"});
							$.each(groupStatus.monitorStatus, function(index,monitor) {
							
								if ((monitor.isMonitored) && !(monitor.isHidden)) {
									statusCount[monitor.status]++;
									//console.log("monitor.elementId="+ monitor.elementId + " status=" + monitor.status);
								}
							});
						}
						
						
						
						for (var severity in statusCount ){						
							var bar = chart.get(severity);					
							if (statusCount.hasOwnProperty(severity)){
								bar.show();
								bar.setData([statusCount[severity]]);
							}
							else {
								bar.hide();
							}						
							//console.log("index=" + severity + " statusCount=" + statusCount[severity]);
						}						
					},function(jqXHR, textStatus, errorThrown) {
						var statusBar = $(statusBarDivId);
						statusBar.css("color", "red");
						statusBar.text("Can't connect to the up.time API.");
						statusBar.show();
					});
					
					chartTimer = setTimeout(requestData, reloadMs);
					
			   
					
				}
			
			// public functions for this function/class
				var public = {
					stopTimer: function() {
						if (chartTimer) {
							window.clearInterval(chartTimer);
						}
					}
				};
				return public;	// Important: we need to return the public functions/methods
			
			
                
        };
}