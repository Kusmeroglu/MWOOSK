/**
 * http://stackoverflow.com/a/10997390/11236
 * &&
 * https://developer.mozilla.org/en-US/docs/DOM/Manipulating_the_browser_history
 */
var urlHistoryStack = [];
var urlHistorySteps = 0;
var urlHistoryListener = function () {
    window.location.reload();
    //console.log('A reload would have occurred, but I ran into a problem on line 108 of class.limb.js rebuilding the mech from the url');
};

// Check the visitor's URL every half second and check if they are moving 
// forward in history, otherwise reload the page
$(function () {
    var historyCheck = function () {
        var steps = urlHistoryStack.length;
        if(urlHistoryStack.length>1 && window.location.hash.replace('#', '') != urlHistoryStack[steps-1]) {
            if(urlHistorySteps < steps) {
                urlHistorySteps = steps;
                window.location.assign('#' + urlHistoryStack[steps-1]);
            } else {
                urlHistoryListener();
            }
        }
    };
    
    if(window.location.href.indexOf('?')!=-1) {
        window.location.replace(window.location.href.replace('?','#'));
        return;
    }
    
    var tempHash = getURLHash();
    urlHistoryStack.push(tempHash!=null?tempHash:'');

    setInterval(historyCheck, 500);
});

function printLog(message) {
    try {
        console.log(message);
    } catch (e) { 
        // No logging available 
    }
}

var benchTimes = {};
function startBench(type) {
    if(typeof benchTimes[type] != 'undefined')
        printLog('Benchmark '+type+' has already been started');
    else
        benchTimes[type] = new Date().getTime();
}

function stopBench(type) {
    var elapsed = 0;
    var now = new Date().getTime();
    if(typeof benchTimes[type] != 'undefined') {
        elapsed = now - benchTimes[type];
        delete benchTimes[type];

        printLog(type+' took '+(elapsed/1000)+' seconds');
    }
}

function getURLHash() {
    if(urlHistoryStack.length>1) {
        return urlHistoryStack[urlHistoryStack.length-1];
    } else {
        var hash = window.location.hash.match(/^#?([^#]+)$/);
        return ( hash == null ) ? hash : hash[1];
    }
}

function setURLHash(newHash) {
    try {
        window.location.assign('#' + newHash);
        urlHistoryStack.push(newHash);
    } catch (e) {
        printLog('Browser compatibility problem');
    }
}

function setURLParameter(param, paramVal){
    var tempArray = [];
    var dataHash = getURLHash();
    var newHash = '';
    var temp = '';
    if (dataHash != null) {
        paramVal = paramVal.replace(new RegExp(" ", 'g'), "_");
        tempArray = dataHash.split("&");
        for (i=0; i<tempArray.length; i++){
            if(tempArray[i].split('=')[0] != param){
                newHash += temp + tempArray[i];
                temp = "&";
            }
        }
    }

    var rows_txt = temp + "" + param + "=" + paramVal;
    setURLHash(newHash + rows_txt);

    //reset the tiny url thing
    $('#tinyurlresult').remove();
    $('#tinyurllink').show();
}

function getURLParameter(param) {
    var dataHash = getURLHash();
    if (dataHash != null) {
        tempArray = dataHash.split("&");
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
    var split = [];
    if (dataHash != null) {
        tempArray = dataHash.split("&");
        for (i=0; i<tempArray.length; i++){
	    split = tempArray[i].split('=');
            o[split[0]] = split.length>1?split[1]:'';
        }
    }
    return o;
}
