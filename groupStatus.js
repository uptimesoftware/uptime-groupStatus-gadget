$(function() {
	var uptime_api = new uptimeApi();
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
		$("#widgetSettings").height($(window).height() - 10);
		$("#widgetChart").height($(window).height() - 10);
	}

	function showEditPanel() {
		if (myChart) {
			myChart.stopTimer();
			myChart = null;
		}
		$("#widgetSettings").show();
		$("#widgetChart").hide();
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
		var statusBar = $("#statusBar");

		uptime_api.getGroups("", function(groups) {
			statusBar.css("color", "green");
			statusBar.text("Loaded and READY!");
			statusBar.show().fadeOut(2000);
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
		}, function(jqXHR, textStatus, errorThrown) {
			var statusBar = $(statusBarDivId);
			statusBar.css("color", "red");
			statusBar.text("Can't connect to the up.time API.");
			statusBar.show();
		});

	}

	function onGoodSave(savedSettings) {
		var statusBar = $("#statusBar");

		statusBar.css("color", "green");
		statusBar.text("Updated settings!");
		statusBar.show().fadeOut(2000);

		displayPanel(savedSettings);
	}

	function onBadAjax(errorObject) {
		var statusBar = $("#statusBar");
		statusBar.css("color", "red");

		statusBar.text(errorObject.code + ": " + errorObject.description);
		statusBar.show().fadeOut(2000);
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
				uptime_api : uptime_api,
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
				uptime_api : uptime_api,
				includeSubgroup : includeSubgroup
			});
		}
	}

});
