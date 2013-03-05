/*
    Generate short descriptions for mechs - kinda like:

         TBT-5J: 4 MLAS, TAG, LRM 20, XL300, 5 JJ, ENDO, Artemis, DHS [http://goo.gl/V9Dv6]

    Might add some other description formats later. This could be the place to check builds against named builds too..

 */

function getMechShortDescription(){
    var descriptionObj = {};
    var engine = "";

    // add all the weapons / engine
    limbList.forEach(function(limbName){
        if ( mechObj.limbs.hasOwnProperty(limbName)){ // not all the limbs have been loaded yet..
            for (var x=0; x < mechObj.limbs[limbName].items.length; x++) {
                if ( ! mechObj.limbs[limbName].items[x].hardpointType ){
                    continue;
                }
                if ( mechObj.limbs[limbName].items[x].hardpointType == "engine" ){
                    engine = mechObj.limbs[limbName].items[x].shortName;
                    continue;
                }
                var text = mechObj.limbs[limbName].items[x].shortName;
                if ( text ){
                    if ( descriptionObj.hasOwnProperty(text) ){
                        descriptionObj[text] += 1;
                    } else {
                        descriptionObj[text] = 1;
                    }
                }
            }
        }
    });

    // turn it into a string
    var description = "["+ mechObj.variant + "]: ";

    for ( var item in descriptionObj ){
        if ( descriptionObj[item] > 1){
            description += descriptionObj[item] + "x";
        }
        description += item + ", ";
    }

    // add the engine
    description += engine + "";

    // add notes for the upgrades
    if ( mechObj.dhs ){
        description += ", DHS";
    }
    if ( mechObj.artemis ){
        description += ", Artemis";
    }
    if ( mechObj.endo ){
        description += ", Endo";
    }
    if ( mechObj.ferro){
        description += ", Ferro";
    }

    console.log(description);
    return description;
}
