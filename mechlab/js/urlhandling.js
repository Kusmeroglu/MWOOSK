/**
 * http://stackoverflow.com/a/10997390/11236
 * &&
 * https://developer.mozilla.org/en-US/docs/DOM/Manipulating_the_browser_history
 */
var urlHistoryStack = [];
var urlHistorySteps = 0;
var urlHistoryListener = function () {
    window.location.reload();
};

// Check the visitor's URL every half second and check if they are moving 
// forward in history, otherwise reload the page
$(function () {
    var historyCheck = function () {
	var steps = urlHistoryStack.length;
	if(urlHistoryStack.length>1 && urlHistoryStack[steps-1]!=getURLHash()[1]) {
	    if(urlHistorySteps < steps) {
		urlHistorySteps = steps;
	    } else {
		urlHistoryListener();
	    }
	}
    };

    var tempHash = getURLHash();
    urlHistoryStack.push(tempHash!=null?tempHash[1]:'');

    setInterval(historyCheck, 500);
});

function getURLHash() {
    return window.location.hash.match(/^#?([^#]+)$/);
}

function setURLHash(newHash) {
    try {
	window.location.assign('#' + newHash);
	urlHistoryStack.push(newHash);
    } catch (e) {
	alert('Browser compatibility problem');
    }
}

function setURLParameter(param, paramVal){
    var tempArray = [];
    var dataHash = getURLHash();
    var newHash = '';
    var temp = '';
    if (dataHash != null) {
        tempArray = dataHash[1].split("&");
        for (i=0; i<tempArray.length; i++){
            if(tempArray[i].split('=')[0] != param){
                newHash += temp + tempArray[i];
                temp = "&";
            }
        }
    }

    var rows_txt = temp + "" + param + "=" + paramVal;
//    console.log("Setting URL " + param + " = " + paramVal);
//    console.log("URL: " + baseURL + "?" + newAdditionalURL + rows_txt);
    setURLHash(newHash + rows_txt);
    //window.history.replaceState({}, "Title doesn't do anything", baseURL + "?" + newAdditionalURL + rows_txt)
    //return baseURL + "?" + newAdditionalURL + rows_txt;

    //reset the tiny rul thing
    $('#tinyurlresult').remove();
    $('#tinyurllink').show();
}

function getURLParameter(param){
    var dataHash = getURLHash();
    if (dataHash != null) {
        tempArray = dataHash[1].split("&");
        for (i=0; i<tempArray.length; i++){
            if(tempArray[i].split('=')[0] == param){
                return tempArray[i].split('=')[1];
            }
        }
    }
    return "";
}

function getURLParamObject(){
    var o = {};
    var dataHash = getURLHash();
    if (dataHash != null) {
        tempArray = dataHash[1].split("&");
        for (i=0; i<tempArray.length; i++){
            o[tempArray[i].split('=')[0]] = tempArray[i].split('=')[1];
        }
    }
    return o;
}
