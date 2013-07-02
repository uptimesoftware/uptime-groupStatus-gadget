$(function() {
	var api = new apiQueries();
	var myChart = null;
	var myChartDimensions = null;
	var groupStatusSettings = {
		groupId : -1,
		statusTypeId : "hostStatusType",
		refreshInterval : 30,
		includeSubgroup : true,
		chartTypeId : "pieChartType"
	};
	var divsToDim = [ '#widgetChart', '#widgetSettings' ];

	$("#widgetSettings").hide();

	$('.group-status-setting').change(settingChanged);

	$("#closeSettings").click(function() {
		$("#widgetSettings").slideUp();
	});

	uptimeGadget.registerOnEditHandler(showEditPanel);
	uptimeGadget.registerOnLoadHandler(function(onLoadData) {
		myChartDimensions = toMyChartDimensions(onLoadData.dimensions);
		if (onLoadData.hasPreloadedSettings()) {
			goodLoad(onLoadData.settings);
		} else {
			uptimeGadget.loadSettings().then(goodLoad, onBadAjax);
		}
	});
	uptimeGadget.registerOnResizeHandler(resizeGadget);

	escapeHtml = function(str) {
		return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	};

	objectCount = function(statusType, count) {
		if (count == 0) {
			return statusType == "hostStatusType" ? "No elements" : "No monitors";
		} else if (count == 1) {
			return statusType == "hostStatusType" ? "1 element" : "1 monitor";
		}
		return count + (statusType == "hostStatusType" ? " elements" : " monitors");
	};

	function resizeGadget(dimensions) {
		myChartDimensions = toMyChartDimensions(dimensions);
		if (myChart) {
			myChart.resize(myChartDimensions);
		}
		$("body").height($(window).height());
	}

	function toMyChartDimensions(dimensions) {
		return new UPTIME.pub.gadgets.Dimensions(Math.max(100, dimensions.width - 5), Math.max(100, dimensions.height - 5));
	}

	function settingChanged() {
		groupStatusSettings.chartTypeId = $("#widgetOptions input[name=chartType]:radio:checked").val();
		groupStatusSettings.groupId = $('#elementGroupId').find(":selected").val();
		groupStatusSettings.statusTypeId = $("#widgetOptions input[name=statusType]:radio:checked").val();
		groupStatusSettings.refreshInterval = $("#refreshRate").val();
		groupStatusSettings.includeSubgroup = $("#includeSubgroup").is(":checked");
		uptimeGadget.saveSettings(groupStatusSettings).then(onGoodSave, onBadAjax);
	}

	function displayStatusBar(error, msg) {
		gadgetDimOn();
		var statusBar = $("#statusBar");
		statusBar.empty();
		var errorBox = uptimeErrorFormatter.getErrorBox(error, msg);
		errorBox.appendTo(statusBar);
		statusBar.slideDown();
	}

	function clearStatusBar() {
		gadgetDimOff();
		var statusBar = $("#statusBar");
		statusBar.slideUp().empty();
	}

	function showEditPanel() {
		if (myChart) {
			myChart.stopTimer();
		}

		$("#widgetOptions input[name=chartType]").filter('[value=' + groupStatusSettings.chartTypeId + ']').prop('checked', true);
		$('#elementGroupId').val(groupStatusSettings.groupId);
		$("#widgetOptions input[name=statusType]").filter('[value=' + groupStatusSettings.statusTypeId + ']').prop('checked',
				true);
		$("#refreshRate").val(groupStatusSettings.refreshInterval);
		$("#includeSubgroup").prop("checked", groupStatusSettings.includeSubgroup);

		$("#widgetSettings").slideDown();
		$("body").height($(window).height());
		return populateIdSelector().then(function() {
			if (!myChart) {
				settingChanged();
			}
		}, function(error) {
			displayStatusBar(error, "Error Loading the List of Groups from up.time Controller");
		});
	}

	function disableSettings() {
		$('.group-status-setting').prop('disabled', true);
		$('#closeButton').prop('disabled', true).addClass("ui-state-disabled");
	}

	function enableSettings() {
		$('.group-status-setting').prop('disabled', false);
		$('#closeButton').prop('disabled', false).removeClass("ui-state-disabled");
	}

	function groupSort(arg1, arg2) {
		return naturalSort(arg1.name, arg2.name);
	}

	function populateIdSelector() {
		disableSettings();
		$('#elementGroupId').empty().append($("<option />").val(-1).text("Loading..."));
		return api.getAllGroups().then(function(groups) {
			clearStatusBar();
			enableSettings();
			// fill in element drop down list
			groups.sort(groupSort);
			var groupSelector = $('#elementGroupId').empty();
			var hasMyInfrastructure = false;
			$.each(groups, function() {
				groupSelector.append($("<option />").val(this.id).text(this.name));
				if (this.id == 1) {
					hasMyInfrastructure = true;
				}
			});
			if (groupStatusSettings.groupId >= 0) {
				groupSelector.val(groupStatusSettings.groupId);
			} else if (hasMyInfrastructure) {
				groupSelector.val(1);
			}
		});
	}

	function goodLoad(settings) {
		clearStatusBar();
		if (settings) {
			$("#elementGroupId").val(settings.groupId);
			$("#" + settings.chartTypeId).prop("checked", true);
			$("#" + settings.statusTypeId).prop("checked", true);
			$("#refreshRate").val(settings.refreshInterval);
			$("#includeSubgroup").val(settings.includeSubgroup);
			$.extend(groupStatusSettings, settings);
			displayChart();
		} else if (uptimeGadget.isOwner()) {
			$('#widgetChart').hide();
			showEditPanel();
		}
	}

	function onGoodSave() {
		clearStatusBar();
		displayChart();
	}

	function onBadAjax(error) {
		displayStatusBar(error, "Error Communicating with up.time");
	}

	function gadgetDimOn() {
		$.each(divsToDim, function(i, d) {
			var div = $(d);
			if (div.is(':visible') && div.css('opacity') > 0.6) {
				div.fadeTo('slow', 0.3);
			}
		});
	}

	function gadgetDimOff() {
		$.each(divsToDim, function(i, d) {
			var div = $(d);
			if (div.is(':visible') && div.css('opacity') < 0.6) {
				div.fadeTo('slow', 1);
			}
		});
	}

	function displayChart() {
		if (myChart) {
			myChart.stopTimer();
			myChart.destroy();
			myChart = null;
		}
		$("#widgetChart").show();

		if (groupStatusSettings.chartTypeId == "pieChartType") {
			myChart = new UPTIME.GroupCurrentStatusPieChart({
				dimensions : myChartDimensions,
				chartDivId : "widgetChart",
				elementGroupId : groupStatusSettings.groupId,
				statusType : groupStatusSettings.statusTypeId,
				refreshInterval : groupStatusSettings.refreshInterval,
				includeSubgroup : groupStatusSettings.includeSubgroup
			}, displayStatusBar, clearStatusBar);
		} else {
			myChart = new UPTIME.GroupCurrentStatusBarChart({
				dimensions : myChartDimensions,
				chartDivId : "widgetChart",
				elementGroupId : groupStatusSettings.groupId,
				statusType : groupStatusSettings.statusTypeId,
				refreshInterval : groupStatusSettings.refreshInterval,
				includeSubgroup : groupStatusSettings.includeSubgroup
			}, displayStatusBar, clearStatusBar);
		}
		myChart.render();
		$("body").height($(window).height());
	}

});
