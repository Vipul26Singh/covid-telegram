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

module.exports = { validAge, validVaccine};

