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
    window.history.replaceState({}, "Title doesn't do anything", baseURL + "?" + newAdditionalURL + rows_txt)
    //return baseURL + "?" + newAdditionalURL + rows_txt;
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
