$(function() {
	var api = new apiQueries();
	var myChart = null;

	$("#widgetSettings").hide();
	$("#widgetChart").hide();

	$("#saveSettings").click(function() {
		var chartTypeId = $("#widgetOptions input[name=chartType]:radio:checked").val();
		var groupId = $('#elementGroupId').find(":selected").val();
		var groupName = $('#elementGroupId').find(":selected").text();
		var statusTypeId = $("#widgetOptions input[name=statusType]:radio:checked").val();
		var refreshInterval = $("#widgetOptions #refreshInterval").val();
		var includeSubgroup = $("#widgetOptions #includeSubgroup").is(":checked");
		var settings = {
			'groupId' : groupId,
			'chartType' : chartTypeId,
			'groupName' : groupName,
			'statusType' : statusTypeId,
			'refreshInterval' : refreshInterval,
			'includeSubgroup' : includeSubgroup
		};
		uptimeGadget.saveSettings(settings).then(onGoodSave, onBadAjax);
	});

	$("#cancelSave").click(function() {
		$("#widgetChart").show();
		$("#lastRefresh").show();
		$("#widgetSettings").hide();
	});

	uptimeGadget.registerOnEditHandler(showEditPanel);
	uptimeGadget.registerOnLoadHandler(function() {
		uptimeGadget.loadSettings().then(goodLoad, onBadAjax);
	});
	uptimeGadget.registerOnResizeHandler(resizeGadget);

	function resizeGadget() {
		$("#widgetSettings").height($(window).height());
		$("#widgetChart").height($(window).height());
	}

	function displayStatusBar(error) {
		var statusBar = $("#statusBar");
		statusBar.empty();
		var errorBox = uptimeErrorFormatter.getErrorBox(error, "Error Communicating with up.time");
		errorBox.appendTo(statusBar);
		statusBar.slideDown();
	}

	function clearStatusBar() {
		var statusBar = $("#statusBar");
		statusBar.slideUp().empty();
	}

	function showEditPanel() {
		if (myChart) {
			myChart.stopTimer();
			myChart = null;
		}
		$("#widgetSettings").show();
		$("#widgetChart").hide();
		resizeGadget();
	}

	function displayPanel(settings) {
		$("#widgetChart").show();
		$("#widgetSettings").hide();
		displayChart(settings.chartType, settings.groupId, settings.groupName, settings.statusType, settings.refreshInterval,
				settings.includeSubgroup);
		resizeGadget();
	}

	function groupSort(arg1, arg2) {
		return naturalSort(arg1.name, arg2.name);
	}

	function goodLoad(settings) {
		clearStatusBar();
		api.getAllGroups().then(function(groups) {
			var optionsValues = '<select id="elementGroupId">';
			groups.sort(groupSort);
			$.each(groups, function(index, group) {
				optionsValues += '<option value="' + group.id + '">' + group.name + '</option>';
			});
			optionsValues += '</select>';
			$('#availableGroups').html(optionsValues);

			if (settings) {
				// update hidden edit panel with settings
				$("#elementGroupId").val(settings.groupId);
				$("#" + settings.chartType).prop("checked", true);
				$("#" + settings.statusType).prop("checked", true);
				$("#refreshInterval").val(settings.refreshInterval);
				$("#includeSubgroup").val(settings.includeSubgroup);

				displayPanel(settings);
			} else {
				showEditPanel();
			}
		}, function(error) {
			displayStatusBar(error);
		});

	}

	function onGoodSave(savedSettings) {
		clearStatusBar();
		displayPanel(savedSettings);
	}

	function onBadAjax(error) {
		displayStatusBar(error);
	}

	function displayChart(chartType, groupId, groupName, statusType, refreshInterval, includeSubgroup) {
		if (myChart) {
			myChart.stopTimer();
			myChart = null;
		}

		if (chartType == "pieChartType") {
			myChart = new UPTIME.GroupCurrentStatusPieChart({
				chartDivId : "widgetChart",
				entityGroupId : groupId,
				entityGroupName : groupName,
				statusType : statusType,
				refreshInterval : refreshInterval,
				statusBarDivId : "statusBar",
				includeSubgroup : includeSubgroup
			});
		} else {
			myChart = new UPTIME.GroupCurrentStatusBarChart({
				chartDivId : "widgetChart",
				entityGroupId : groupId,
				entityGroupName : groupName,
				statusType : statusType,
				refreshInterval : refreshInterval,
				statusBarDivId : "statusBar",
				includeSubgroup : includeSubgroup
			});
		}
		myChart.render();
	}

});
