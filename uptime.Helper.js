function getDateString(inputDate) {
				var returnString = new Array();
				
				if (parseInt(inputDate.getMonth()+1) < 10) {
					stringMonth = "0"+parseInt(inputDate.getMonth()+1);
				} else stringMonth = inputDate.getMonth()+1;
				if (inputDate.getDate() < 10) {
					stringDate = "0"+inputDate.getDate();
				} else stringDate = inputDate.getDate();
				if (inputDate.getHours() < 10) {
					stringHour = "0"+inputDate.getHours();
				} else stringHour = inputDate.getHours();
				if (inputDate.getMinutes() < 10) {
					stringMinute = "0"+inputDate.getMinutes();
				} else stringMinute = inputDate.getMinutes();
				if (inputDate.getSeconds() < 10) {
					stringSecond = "0"+inputDate.getSeconds();
				} else stringSecond = inputDate.getSeconds();
				
				return [stringMonth, stringDate, stringHour, stringMinute, stringSecond]
				
			}