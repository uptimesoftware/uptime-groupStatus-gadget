if (typeof UPTIME == "undefined") {
        var UPTIME = {};
}

if (typeof UPTIME.GroupCurrentStatusPieChart == "undefined") {
        UPTIME.GroupCurrentStatusPieChart = function(options) {
                Highcharts.setOptions({
                        global: {
                                useUTC: false
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
				//console.log("  defining includeSubgroup="+includeSubgroup);
				
				var seriesData = [	 
								{
									id : 'OK',
									name : 'OK',
									y : 0,
									color: '#67B10B',
									type:"pie"
								}, 		 {
									id : 'WARN',
									name : 'WARN',
									y : 0,
									color: '#DAD60B',
									type:"pie"
		                        },		{
									id : 'CRIT',
									name : 'CRIT',
									y : 0,
									color: '#B61211',
									type:"pie"
								},		{
									id: 'MAINT', 
									name : 'MAINT',
									y : 0,
									color: '#555B98',
									type:"pie"
								},		{
									id : 'UNKNOWN',
									name : 'UNKNOWN',
									y : 0,
									color: '#AEAEAE'									
								}
							];
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
						 
						 //console.log("options.includeSubgroup="+options.includeSubgroup);
						//console.log("chartDivId="+chartDivId+" entityGroupId="+entityGroupId+" entityGroupName="+entityGroupName+" statusType="+statusType+" refreshInterval="+refreshInterval+" refreshIntervalDivId="+refreshIntervalDivId+ " includeSubgroup="+includeSubgroup);
						
                }

                var chart;
                chart = new Highcharts.Chart({
                        chart: {
                                renderTo: chartDivId,
								height: 200,
                                plotBackgroundColor: null,
                                plotBorderWidth: null,
                                plotShadow: false,
                                events: {
                                        //load: requestData(statusType)
                                        load: requestData
                                },
                                yAxis: {
                                        allowDecimals:false
                                }               
                        },
						credits: { enabled: false },
                        
                        title: {
								text: entityGroupName
                        },
                        tooltip: {
                                
                                formatter: function() {
										var plural = "";
										if (this.y>1){
											plural = "s";
										}
										if (statusType == "hostStatusType") {
											return '<b>'+ this.point.name +'</b> - '+ this.y +" element"+plural;
										} else {
											return '<b>'+ this.point.name +'</b> - '+ this.y +" monitor"+plural;
										}
                                }
                        },
                        plotOptions: {
                                pie: {
                                        allowPointSelect: true,
                                        cursor: 'pointer',
                                        dataLabels: {
                                                enabled: true,
												distance: -1,
												style: {
													width: '100px'
												}, 
                                                color: '#000000',
                                                connectorColor: '#000000',
                                                formatter: function() {
                                                        return '<b>'+ this.point.name +'</b> ('+ this.y+") "+Math.floor(this.percentage)+' %';
                                                }
                                        },
										animation: true,
										showInLegend: true
                                }
                        },
                        series: [   {
							type: 'pie',
							name: 'Browser share',
			                data: seriesData
						}]
								
                });
         
                //function requestData(statusType) {
				function requestData() {
					var statusCount = { 'OK': 0, 'WARN': 0, 'CRIT': 0, 'UNKNOWN': 0, 'MAINT': 0};
					var groupIdsToInclude = [entityGroupId];
					
					var reloadMs = refreshInterval * 60 * 1000;
					var currentTime = new Date();
					stringTime = getDateString(currentTime);
					$("#lastRefresh").html("Last Refresh:  "+currentTime.getFullYear()+"-"+stringTime[0]+"-"+stringTime[1]+" "+stringTime[2]+":"+stringTime[3]+":"+stringTime[4]);
					
					//console.log("includeSubgroup="+includeSubgroup);
					if (includeSubgroup) {
						//uptime_api.emptySubgroupIds();
						uptime_api.getSubGroups(entityGroupId, function(subGroupId){
						
							uptime_api.getGroupStatus(subGroupId, function(groupStatus) {
								if (statusType == "hostStatusType") {
									chart.setTitle({text: entityGroupName + " Hosts"});
									$.each(groupStatus.elementStatus, function(index,element) {
										statusCount[element.status]++;
										//console.log("groupId="+subGroupId+" Group name="+ element.name + " status=" + element.status);
									});
								}
								//monitorStatusType
								else {
									chart.setTitle({text: entityGroupName + " Monitors"});
									$.each(groupStatus.monitorStatus, function(index,monitor) {
										if ((monitor.isMonitored) && !(monitor.isHidden)) {
											statusCount[monitor.status]++;
											//console.log("groupId="+subGroupId+" monitor.elementId="+ monitor.elementId + " status=" + monitor.status);
										}
									});
								}
								
								$.each(seriesData, function(i, item) {
										var sliceData = statusCount[item.id];
										item.y = 0;
										if (sliceData){
										console.log("if->item.y="+item.y+" sliceData="+sliceData);
											item.y = sliceData;
										}
										else {
										console.log("else->item.y="+item.y+" sliceData="+sliceData);
											item.visible=false;
										}
									});

								chart.series[0].setData(seriesData, true);
							},function(jqXHR, textStatus, errorThrown) {
								var statusBar = $(statusBarDivId);
								statusBar.css("color", "red");
								statusBar.text("Can't connect to the up.time API.");
								statusBar.show();
							});
							
						});
					}
				//console.log("in uptime_api.getSubGroups");
				
					
				
					uptime_api.getGroupStatus(entityGroupId, function(groupStatus) {
						
						if (statusType == "hostStatusType") {
							chart.setTitle({text: entityGroupName + " Hosts"});
							$.each(groupStatus.elementStatus, function(index,element) {
								statusCount[element.status]++;
								//console.log("entityGroupId="+entityGroupId+" Group name="+ element.name + " status=" + element.status);
							});
						}
						//monitorStatusType
						else {
							chart.setTitle({text: entityGroupName + " Monitors"});
							$.each(groupStatus.monitorStatus, function(index,monitor) {
							
								if ((monitor.isMonitored) && !(monitor.isHidden)) {
									statusCount[monitor.status]++;
									//console.log("monitor.elementId="+ monitor.elementId + " status=" + monitor.status);
								}
							});
						}
						
						$.each(seriesData, function(i, item) {
								var sliceData = statusCount[item.id];
								item.y = 0;
								if (sliceData){
									item.y = sliceData;
								}
								else {
									item.visible=false;
								}
							});

						chart.series[0].setData(seriesData, true);
						
						
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
