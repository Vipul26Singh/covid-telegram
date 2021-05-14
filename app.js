require('dotenv').config()
const http = require('http');
const axios = require('axios');

isString = function(a) {
	return typeof a === 'string' || a instanceof String;
};

let futureDates = process.env.future_dates;
let telegram_api_key = process.env.telegram_api_key;
let delay_between_telegram_call = process.env.delay_between_telegram_call;
let delay_between_cowin_api_call = parseInt(process.env.delay_between_cowin_api_call.toString(), 10)
let global_invoke_call_after_minute = parseInt(process.env.invoke_call_after_minute.toString(), 10) * 60 * 1000;
let telegram_error_channel = '@' + process.env.telegram_error_channel;

let global_vaccine_type = 'BOTH';
let global_district_id = 0;
let global_filter_age = 0;
let telegram_channel_id = '';

const delay = ms => new Promise(res => setTimeout(res, ms));

formatDate = function(da) {
	let date = da;
	let dd = String(date.getDate()).padStart(2, '0');
        let mm = String(date.getMonth() + 1).padStart(2, '0');
        let yyyy = date.getFullYear();

        let formatDate = dd + '-' + mm + '-' + yyyy;
        return formatDate;

}

stringToDate = function(strD) {
	let date = new Date(strD);
	return formatDate(date);
}

function GetDates(startDate, daysToAdd) {
    var aryDates = [];

    for (var i = 0; i <= daysToAdd; i++) {
        var currentDate = new Date();
        currentDate.setDate(startDate.getDate() + i);
        aryDates.push(formatDate(currentDate));
    }

    return aryDates;
}

function find_by_district_and_date(district_id, date) {
	return new Promise((resolve, reject) => {axios.get("https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByDistrict?district_id=" + district_id +"&date=" + date, {
			headers: {
				"user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.85 Safari/537.36",
				"accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
				"accept-encoding": "gzip, deflate, br",
				"accept-language": "en-US,en;q=0.9"
			}
		})
		.then(response => {
			resolve(response.data);
		})
		.catch(error => {
			reject(error);
		})
	}
	)
}

function sendNotification(api_key, chat_id, notification) {
        let msg = notification;
        let params = new URLSearchParams({
                "chat_id": chat_id,
                "text": msg,
        });

        axios.get("https://api.telegram.org/bot"+api_key+"/sendMessage?"+params.toString()).
                then(response => {
                })
                .catch(error => {
                        console.log(error);
                });
}


async function find_by_district(district_id, date = false) {
	let allDate = [];
	if(!date) {
		let startDate = new Date();
		let fDate = startDate;
		allDate = GetDates(startDate, futureDates);
	} else if(isString(date)) {
		allDate.push(stringToDate(date));	
	}

	let apiCalls = [];

	for(let i = 0; i < allDate.length; i++) {
		apiCalls.push(find_by_district_and_date(district_id, allDate[i]));
		await delay(delay_between_cowin_api_call);
	}

	let validResults = [];
	await Promise.all(apiCalls).then(result => {
		result.forEach(function(res, ind) {
			if(res.sessions.length > 0) {
				validResults.push(res.sessions)
			}
		})
	}).catch( error => {
		console.log(error);
		if(telegram_error_channel) {
			let msg = error.message + ' for district ' + global_district_id;
			sendNotification(telegram_api_key, telegram_error_channel, msg);
		}
	});
	return validResults;
}

validAge = function(myAge, sessAge) {
	if(myAge == 0 || (myAge > 0 && myAge >= sessAge)) {
		return true;
	}

	return false;
}

validVaccine = function(myVacc, sessVacc) {
        if(myVacc == 'BOTH') {
                return true;
        } else if(myVacc.toUpperCase() == 'COVISHIELD' && myVacc.toUpperCase() == sessVacc.toUpperCase()) {
		return true;
	} else if(myVacc.toUpperCase() == 'COVAXIN' && sessVacc.toUpperCase() != 'COVISHIELD') {
		return true;
	}

        return false;
}


function filterResponse(sessions, myAge = 0, myVacc = 'BOTH' ) {
	let validSess = [];
	sessions.forEach(function (sess, i) {
		if(validAge(myAge, sess.min_age_limit) && validVaccine(myVacc, sess.vaccine)) {
			validSess.push(sess);
		}
	})
	return validSess;
}


function initiate_search() {
	find_by_district(global_district_id).then(async function (allResults) {
		let validResults = [];
		allResults.forEach(function(res) {
			let filterd = filterResponse(res, global_filter_age, global_vaccine_type);
			if(filterd.length > 0) {
				filterd.forEach(function(fil) {
					validResults.push(fil)
				});
			}
		})

		let msg = '';
		for(let i = 0; i < validResults.length; i++) {
			if(validResults[i].available_capacity > 0 && validResults[i].slots.length > 0) {
				msg += 'Date:         ' + validResults[i].date + "\n";
				msg += 'Block:        ' + validResults[i].block_name + "\n";
				msg += 'Pincode:      ' + validResults[i].pincode + "\n";
				msg += 'Age Limit:    ' + validResults[i].min_age_limit + "\n";
				msg += "Vaccine:      " + validResults[i].vaccine + "\n";
				msg += "\n\n";
			}
			if(i > 0 && i % 10 == 0) {
				sendNotification(telegram_api_key, telegram_channel_id, msg);
				await delay(delay_between_telegram_call);
				msg = '';
			}
		}

		if(msg != '') {
			sendNotification(telegram_api_key, telegram_channel_id, msg);
		}
	});
}


function main() {
	const args = require('minimist')(process.argv.slice(2));
	console.log("Usage:\n node app.js --district_id 670 --vaccine COVAXIN/COVISHIELD/BOTH --age 30 --telegram_channel_id my_channel_id")
	console.log("distric and telgram_channel_id are mandatory");
	console.log("\n\n");

	if(args.v) {
		global_vaccine_type = args.v.toString().toUpperCase()
	} else if(args.vaccine) {
		global_vaccine_type = args.vaccine.toString().toUpperCase()
	}

	if(!args.d && !args.district_id) {
		console.log("District id is required");
		return 0;
	} else if(args.d){
		global_district_id = parseInt(args.d.toString(), 10);
	} else if(args.district_id) {
		global_district_id = parseInt(args.district_id.toString(), 10);
	}

	if(args.a) {
                global_filter_age = parseInt(args.a.toString(), 10);
        } else if(args.age) {
		global_filter_age = parseInt(args.age.toString(), 10);
        }

	if(args.c) {
		telegram_channel_id = '@' + args.c.toString();
	} else if(args.telegram_channel_id) {
		telegram_channel_id = '@' + args.telegram_channel_id.toString();
	} else {
		console.log("Telegram channel id is required");
                return 0;
	}

	initiate_search();
	setInterval(function () {
		initiate_search();
	}, global_invoke_call_after_minute);
}


main();


/**const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Got the api');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});**/

