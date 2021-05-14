const axios = require('axios');

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

module.exports = { sendNotification };

