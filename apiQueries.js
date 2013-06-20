function apiQueries() {

	function getGroup(groupId) {
		var deferred = UPTIME.pub.gadgets.promises.defer();
		$.ajax("/api/v1/groups/" + groupId, {
			cache : false
		}).done(function(data, textStatus, jqXHR) {
			deferred.resolve(data);
		}).fail(function(jqXHR, textStatus, errorThrown) {
			deferred.reject(UPTIME.pub.errors.toDisplayableJQueryAjaxError(jqXHR, textStatus, errorThrown, this));
		});
		return deferred.promise;
	}

	function getGroupStatus(groupId) {
		var deferred = UPTIME.pub.gadgets.promises.defer();
		$.ajax("/api/v1/groups/" + groupId + "/status", {
			cache : false
		}).done(function(data, textStatus, jqXHR) {
			deferred.resolve(data);
		}).fail(function(jqXHR, textStatus, errorThrown) {
			deferred.reject(UPTIME.pub.errors.toDisplayableJQueryAjaxError(jqXHR, textStatus, errorThrown, this));
		});
		return deferred.promise;
	}

	function collectGroups(groups, groupId, idsToGroups, parentIdsToGroupIds) {
		groups.push(idsToGroups[groupId]);
		if (!parentIdsToGroupIds[groupId]) {
			return;
		}
		$.each(parentIdsToGroupIds[groupId], function(i, childGroupId) {
			collectGroups(groups, childGroupId, idsToGroups, parentIdsToGroupIds);
		});
	}

	function findGroups(groupId, data) {
		var groups = [];
		if (!groupId || !data || !$.isArray(data) || data.length <= 0) {
			return groups;
		}
		var idsToGroups = {};
		var parentIdsToGroupIds = {};
		$.each(data, function(i, group) {
			idsToGroups[group.id] = group;
			var parentGroupId = group.groupId == null ? -1 : group.groupId;
			if (!parentIdsToGroupIds[group.groupId]) {
				parentIdsToGroupIds[parentGroupId] = [];
			}
			parentIdsToGroupIds[parentGroupId].push(group.id);
		});
		collectGroups(groups, groupId, idsToGroups, parentIdsToGroupIds);
		return groups;
	}

	function getGroupWithSubGroups(groupId) {
		var deferred = UPTIME.pub.gadgets.promises.defer();
		$.ajax("/api/v1/groups", {
			cache : false
		}).done(function(data, textStatus, jqXHR) {
			if (data.length == 0) {
				deferred.reject("No groups found.");
			} else {
				var groups = findGroups(groupId, data);
				if (groups.length == 0) {
					deferred.reject("Group not found.");
				} else {
					deferred.resolve();
				}
			}
		}).fail(function(jqXHR, textStatus, errorThrown) {
			deferred.reject(UPTIME.pub.errors.toDisplayableJQueryAjaxError(jqXHR, textStatus, errorThrown, this));
		});
		return deferred.promise;
	}

	this.getAllGroups = function() {
		var deferred = UPTIME.pub.gadgets.promises.defer();
		$.ajax("/api/v1/groups", {
			cache : false
		}).done(function(data, textStatus, jqXHR) {
			if (data.length == 0) {
				deferred.reject("No groups found.");
			} else {
				deferred.resolve(data);
			}
		}).fail(function(jqXHR, textStatus, errorThrown) {
			deferred.reject(UPTIME.pub.errors.toDisplayableJQueryAjaxError(jqXHR, textStatus, errorThrown, this));
		});
		return deferred.promise;
	};

	this.getStatusCounts = function(entityGroupId, statusType, includeSubgroup) {
		var result = {
			groupId : entityGroupId,
			groupName : undefined,
			hasSubgroups : undefined,
			total : 0,
			statusCount : {
				'OK' : 0,
				'WARN' : 0,
				'CRIT' : 0,
				'UNKNOWN' : 0,
				'MAINT' : 0
			}
		};

		var groupsPromise = null;
		if (includeSubgroup) {
			groupsPromise = getGroupWithSubGroups(entityGroupId);
		} else {
			groupsPromise = getGroup(entityGroupId);
		}
		return groupsPromise.then(function(groups) {
			if (!$.isArray(groups)) {
				groups = [ groups ];
			}
			var groupStatuses = [];
			result.groupName = groups[0].name;
			result.hasSubgroups = groups.length > 1;
			$.each(groups, function(i, group) {
				groupStatuses.push(getGroupStatus(group.id));
			});
			return UPTIME.pub.gadgets.promises.all(groupStatuses);
		}).then(function(groupStatuses) {
			$.each(groupStatuses, function(i, groupStatus) {
				if (statusType == "hostStatusType") {
					$.each(groupStatus.elementStatus, function(index, element) {
						if (element.isMonitored) {
							result.statusCount[element.status]++;
							result.total++;
						}
					});
				} else {
					// monitorStatusType
					$.each(groupStatus.monitorStatus, function(index, monitor) {
						if ((monitor.isMonitored) && !(monitor.isHidden)) {
							result.statusCount[monitor.status]++;
							result.total++;
						}
					});
				}
			});
			return result;
		}).then(null, function() {
			return new UPTIME.pub.gadgets.promises.reject("Group not found");
		});
	};

}
