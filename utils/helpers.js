
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


module.exports = { formatDate, stringToDate, GetDates, delay};
