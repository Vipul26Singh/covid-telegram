require('dotenv').config()
const helpers = require('./utils/helpers')
const cowin_filters = require('./validators/validate')
const telegram_api = require('./apis/telegram')
const cowin_api = require('./apis/cowin')

const http = require('http');

isString = function(a) {
	return typeof a === 'string' || a instanceof String;
};

let futureDates = process.env.future_dates;
let telegram_api_key = process.env.telegram_api_key;
let delay_between_telegram_call = process.env.delay_between_telegram_call;
let global_invoke_call_after_minute = parseInt(process.env.invoke_call_after_minute.toString(), 10) * 60 * 1000;
let telegram_error_channel = '@' + process.env.telegram_error_channel;

let global_vaccine_type = 'BOTH';
let global_district_id = 0;
let global_filter_age = 0;
let telegram_channel_id = '';




function filterResponse(sessions, myAge = 0, myVacc = 'BOTH' ) {
	let validSess = [];
	sessions.forEach(function (sess, i) {
		if(cowin_filters.validAge(myAge, sess.min_age_limit) && cowin_filters.validVaccine(myVacc, sess.vaccine)) {
			validSess.push(sess);
		}
	})
	return validSess;
}


function initiate_search() {
	cowin_api.find_by_district(global_district_id).then(async function (allResults) {
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
				telegram_api.sendNotification(telegram_api_key, telegram_channel_id, msg);
				await helpers.delay(delay_between_telegram_call);
				msg = '';
			}
		}

		if(msg != '') {
			telegram_api.sendNotification(telegram_api_key, telegram_channel_id, msg);
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

