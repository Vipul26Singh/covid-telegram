# Covid Vaccine notification

## Description

The project is meant to notify the telegram channel if the slot is available. One can control the time delay between the lookups using env params.

## Installation

1. Install node 
2. Then run npm install

## Env params in .env file

1. **telegram_api_key:** This is the API key which you will when you create new Bot using bot father
2. **delay_between_telegram_call:**  Time in ms to wait between subsequent api call of the Telegram
3. **delay_between_cowin_api_call:** Time is ms to wait between subsequent api call of cowin
4. **invoke_call_after_minute:**  Time is minute after which the application will repeat the process
5. **future_dates:** Number of days to be looked for the availability. Each date will invoke one cowin api call
6. **telegram_error_channel:** Telegram channel id at which the error message will be send.



## Usage:

**node app.js --district_id 670 --vaccine COVAXIN/COVISHIELD/BOTH --age 30 --telegram_channel_id my_channel_id**

### Mandatory params:

1. district_id
2. telegram_channel_id

### Param details

1. **district_id:** 
  One can get it by making API call to covaxin API's
  First need to call state API: https://cdn-api.co-vin.in/api/v2/admin/location/states
  Then you need to call : https://cdn-api.co-vin.in/api/v2/admin/location/districts/<state_id>, where state_id can be fetched from the above API
  Finally note the id of the district for which one need to monitor
  
2. **vaccine:**
    This is for the preferance of vaccine type. It has 3 values:
    BOTH
    COVISHIELD
    COVAXIN
    
    Default is BOTH
    
3. **age:**
    Age for which the slot should be find. You can give any age between 18 and 45 to get notification for this age group 
    similary between 45 and 60 for 45+
    and above 60 for 60+
    
    By default it will search for all age group 
    
4. **telegram_channel_id:**
    Channel id of the telegram on which notifications will be send
    

# Other References

## Linking bot with channel

1. Create bot using botfather
2. Create channel on telegram
3. Add the newly created bot as the admin of channel

After creating bot you will get the API Key for the bot
Also, suppose link of the channel is https://t.me/vip_bgpt_vaccine_notifier than vip_bgpt_vaccine_notifier is the **telegram_channel_id**


## Roadmap

1. Adding state and city in params
2. Simple UI for faster search

# Thank You

Feel free to make contributions and add any issues.


