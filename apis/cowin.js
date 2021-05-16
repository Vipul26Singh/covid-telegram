const helpers = require('../utils/helpers')
const axios = require('axios');
const telegram_api = require('../apis/telegram')

let telegram_api_key = process.env.telegram_api_key;
let telegram_error_channel = '@' + process.env.telegram_error_channel;



function find_by_district_and_date(district_id, date) {
        return new Promise((resolve, reject) => {axios.get("https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id=" + district_id +"&date=" + date, {
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


async function find_by_district(district_id) {
	date = new Date();
	date = helpers.stringToDate(date);
	let apiCalls = [];

	apiCalls.push(find_by_district_and_date(district_id, date));


	let validResults = [];
	await Promise.all(apiCalls).then(result => {
		result.forEach(function(res, ind) {
			if(res.centers.length > 0) {
				validResults.push(res.centers)
			}
		})
	}).catch( error => {
		console.log(error);
		if(telegram_error_channel) {
			let msg = error.message + ' for district ' + global_district_id;
			let telegram_api_key = process.env.telegram_api_key;
			let telegram_error_channel = '@' + process.env.telegram_error_channel;

			telegram_api.sendNotification(telegram_api_key, telegram_error_channel, msg);
		}
	});

	return validResults;
}



module.exports = { find_by_district, find_by_district_and_date };
