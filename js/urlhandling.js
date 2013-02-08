/**
 * http://stackoverflow.com/a/10997390/11236
 * &&
 * https://developer.mozilla.org/en-US/docs/DOM/Manipulating_the_browser_history
 */
function setURLParameter(param, paramVal){
    var newAdditionalURL = "";
    var tempArray = window.location.href.split("?");
    var baseURL = tempArray[0];
    var additionalURL = tempArray[1];
    var temp = "";
    paramVal = paramVal.replace(new RegExp(" ", 'g'), "_");
    if (additionalURL) {
        tempArray = additionalURL.split("&");
        for (i=0; i<tempArray.length; i++){
            if(tempArray[i].split('=')[0] != param){
                newAdditionalURL += temp + tempArray[i];
                temp = "&";
            }
        }
    }

    var rows_txt = temp + "" + param + "=" + paramVal;
//    console.log("Setting URL " + param + " = " + paramVal);
//    console.log("URL: " + baseURL + "?" + newAdditionalURL + rows_txt);
    var title = "MWOOSK v.01a";
    if ( mechObj && mechObj.variant){
        title += ": " + mechObj.variant;
    }
    History.replaceState({}, title, baseURL + "?" + newAdditionalURL + rows_txt)
    //return baseURL + "?" + newAdditionalURL + rows_txt;

    //reset the tiny rul thing
    $('#tinyurlresult').remove();
    $('#tinyurllink').show();
}

function getURLParameter(param){
    var tempArray = window.location.href.split("?");
    var additionalURL = tempArray[1];
    if (additionalURL) {
        tempArray = additionalURL.split("&");
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
    var tempArray = window.location.href.split("?");
    var additionalURL = tempArray[1];
    if (additionalURL) {
        tempArray = additionalURL.split("&");
        for (i=0; i<tempArray.length; i++){
            o[tempArray[i].split('=')[0]] = tempArray[i].split('=')[1];
        }
    }
    return o;
}
