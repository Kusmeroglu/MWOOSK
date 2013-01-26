function mech(chassisName, chassisVariant, maxTons) {
    this.chassis = chassisName;
    this.variant = chassisVariant;
    setURLParameter("variant", chassisVariant);
    this.maxTons = maxTons;

    this.dhs = false;
    this.ferro = false;
    this.dhs = false;
    this.artemis = false;
    this.chassisTons = 0;
    this.currentTons = 0;
    this.currentFreeCritSlots = 0;
    this.currentEquivalentHeatSinks = 0;
    this.limbs = {};
    this.ecm = false;
    this.ecmcount = 0;
    this.ecmmax = 1;
    this.jumpjets = false;
    this.jumpjetcount = 0;
    this.jumpjetmax = 5;

    this.minEngineSize = 100;
    this.maxEngineSize = 400;

    this.armorWeight = 1/32;

    // Endo Steel info
    this.endo = false;
    this.endoweight = parseFloat(maxTons * .05); // rounded from .25 to .5?
    this.endoCritSlots = 14;

    // Ferro Fibrous info
    this.ferro = false;
    this.ferroweight = this.armorWeight * .88;
    this.ferroCritSlots = 14;

    this.jumpjetitemIDs = ["IJJ", "IJK", "IJL", "IJM", "IJN"];

    this.init = function init(){

    };

    this.updateMech = function updateMech(){
        // also counting heatsinks
        this.currentEquivalentHeatSinks = 0;
        this.currentFreeCritSlots = 0;
        for (var limbName in this.limbs) {
            this.currentFreeCritSlots += this.limbs[limbName].getFreeCritSlots();
            this.currentEquivalentHeatSinks += this.limbs[limbName].getEquivalentHeatSinks(this.dhs);
        }
        $("#heat").text("Equivalent Heat Sinks: " + (Math.round(10 * this.currentEquivalentHeatSinks) / 10));

        // update engine speed
        if ( $("#centerTorso .engine").length > 0 ){
            var enginedata = $("#centerTorso .engine").data("itemObj");
            var maxspeed = 16.2 * enginedata.engineSize/this.maxTons;
            var speedtweak = maxspeed * 1.1;
            $("#speed").text("Max Speed: " + Math.round(10*maxspeed)/10 + " kph (" + Math.round(10*speedtweak)/10 + ")");
            // also check if having enough heatsinks
            if ( enginedata.heatsinkslots < 0 && $("#mechContainerWrap .heatsink").length < -enginedata.heatsinkslots ){
                $("#heat").text("Not enough heatsinks, " + (-enginedata.heatsinkslots - $("#mechContainerWrap .heatsink").length) + " more required.");
            }
        } else {
            $("#speed").text("No engine selected.");
        }
        return this.currentFreeCritSlots;
    };

    this.addLimb = function addLimb(limbName, limbObj) {
        this.limbs[limbName] = limbObj;
        this.updateMech();
    };

    this.testIfValid = function testIfValid(limbName, itemObj){
        // is there weight on the mech?
        if (this.maxTons < (this.currentTons + parseFloat(itemObj.weight))){
            return false;
        }
        // are there crit slots (on the whole mech, endo and ferro, I'm looking at you)
        var structureSlots = (this.endo ? this.endoCritSlots : 0) + (this.ferro ? this.ferroCritSlots : 0);
        if ( (this.currentFreeCritSlots - structureSlots) < itemObj.critSlots){
            // return false only if this is not the center torso and this is a heatsink and there are extra heatsink slots
            if ( ! (limbName == "centerTorso" && itemObj.type == "heatsink" && (this.limbs[limbName].engineHeatSinks - this.limbs[limbName].engineHeatSinksItems.length) > 0)){
                return false;
            }
        }
        // ecm check
        if ( itemObj.id == "IGE" && (this.ecm == false || this.ecmcount >= this.ecmmax) ){
            return false;
        }
        // jumpjet check
        if (  $.inArray(itemObj.id, this.jumpjetitemIDs) > -1 && (this.jumpjets == false || this.jumpjetcount >= this.jumpjetmax) ){
            return false;
        }
        // is the item valid for this limb?
        return this.limbs[limbName].testIfValid(itemObj);
    };

    this.addItemToLimb = function addItemToLimb(limbName, itemObj){
        this.addWeight(parseFloat(itemObj.weight));
        var success = this.limbs[limbName].addItem(itemObj);
        this.updateMech();
        // ecm check
        if ( itemObj.id == "IGE" ){
            this.ecmcount += 1;
        }
        // jumpjet check
        if ( $.inArray(itemObj.id, this.jumpjetitemIDs) > -1 ){
            this.jumpjetcount += 1;
        }
        this.showStructureSlots();
        return success;
    };

    this.removeItemFromLimb = function removeItemFromLimb(limbName, itemObj){
        if ( ! itemObj ){
            console.log('Removing null item!');
            return;
        }
        this.addWeight(0 - parseFloat(itemObj.weight));
        var success = this.limbs[limbName].removeItem(itemObj);
        this.updateMech();
        // ecm check
        if ( itemObj.id == "IGE" ){
            this.ecmcount -= 1;
        }
        // jumpjet check
        if ( $.inArray(itemObj.id, this.jumpjetitemIDs) > -1 ){
            this.jumpjetcount -= 1;
        }
        this.showStructureSlots();
        return success;
    };

    this.removeAllItemsByIDs = function removeAllItemsByIDs(itemIDList){
        limbList.forEach(function(limbName){
            if ( this.limbs.hasOwnProperty(limbName)){ // not all the limbs have been loaded yet..
                var found = true;
                while (found){
                    found = false;
                    for (var x=0; x < this.limbs[limbName].items.length; x++) {
                        if ( itemIDList.indexOf( this.limbs[limbName].items[x].id ) > -1 ){
                            this.removeItemFromLimb(limbName, this.limbs[limbName].items[x]);
                            found = true;
                        }
                    }
                }
            }
        }, this);
    };

    this.setArmorForLimb = function setArmorForLimb(limbName, frontArmor, rearArmor){
        // add (subtract) the difference to the current weight
        this.addWeight( (frontArmor + rearArmor - this.limbs[limbName].totalArmor) * (this.ferro ? this.ferroweight : this.armorWeight) );
        this.limbs[limbName].setArmor(frontArmor, rearArmor);
        this.resetArmorURLParam();
    };

    this.resetArmorURLParam = function resetArmorURLParam(){
        var s = "";
        limbList.forEach(function(limbName){
            if ( this.limbs.hasOwnProperty(limbName)){ // not all the limbs have been loaded yet..
                s += this.limbs[limbName].frontArmor.toString() + "-" + this.limbs[limbName].rearArmor.toString() + ",";
            } else {
                s +="0-0,";
            }
        }, this);
        setURLParameter("armor", s);
    };

    this.resetLimbCritSlots = function resetLimbCritSlots(limbName){
        this.limbs[limbName].addEmptyCritSlots();
    };

    this.addWeight = function addWeight(weight){
        this.currentTons += weight;
        updateChart(this.maxTons, (this.endo) ? this.endoweight : this.chassisTons, this.currentTons);
    };

    this.addEndoSteel = function addEndoSteel(){
        if ( this.currentFreeCritSlots < 14 ){
            return false;
        }
        this.endo = true;
        // remove the difference from the standard chassis weight
        this.addWeight(0 - this.endoweight);
        setURLParameter('endo', 'true');
        this.showStructureSlots();
        return true;
    };

    this.removeEndoSteel = function removeEndoSteel(){
        if ( (this.maxTons - this.currentTons) < (this.chassisTons - this.endoweight) ){
            return false;
        }
        this.endo = false;
        // add the difference from the standard chassis weight
        this.addWeight(this.endoweight);
        setURLParameter('endo', 'false');
        this.showStructureSlots();
        return true;
    };

    this.addFerroFibrous = function addFerroFibrous(){
        if ( this.currentFreeCritSlots < 14 ){
            return false;
        }
        this.ferro = true;
        // calculate weight savings
        var totalarmor = 0;
        for (var limbName in this.limbs) {
            totalarmor += this.limbs[limbName].totalArmor;
        }
        var difference = (totalarmor * this.armorWeight) - (totalarmor * this.ferroweight);
        this.addWeight(-difference);

        setURLParameter('ferro', 'true');
        this.showStructureSlots();
        return true;
    };

    this.removeFerroFibrous = function removeFerroFibrous(){
        // calculate weight savings
        var totalarmor = 0;
        for (var limbName in this.limbs) {
            totalarmor += this.limbs[limbName].totalArmor;
        }
        var difference = (totalarmor * this.armorWeight) - (totalarmor * this.ferroweight);

        if ( (this.maxTons - this.currentTons) < (difference) ){
            return false;
        }
        this.ferro = false;
        // calculate weight savings
        var totalarmor = 0;
        for (var limbName in this.limbs) {
            totalarmor += this.limbs[limbName].totalArmor;
        }
        var difference = (totalarmor * this.armorWeight) - (totalarmor * this.ferroweight);
        this.addWeight(difference);

        setURLParameter('ferro', 'false');
        this.showStructureSlots();
        return true;
    };

    this.singleHeatSinkIDs = ["IHS"];
    this.dualHeatSinkIDs = ["IHD"];
    this.addDualHeatSinks = function addDualHeatSinks() {
        // remove all the current single heat sinks on the mech
        this.removeAllItemsByIDs(this.singleHeatSinkIDs);

        // hide the single heat sinks and show the double heat sinks in the item list.
        this.singleHeatSinkIDs.forEach(function (id) {
            $("#detailContainer ." + id).hide();
        });
        this.dualHeatSinkIDs.forEach(function (id) {
            $("#detailContainer ." + id).show();
        });

        this.dhs = true;
        setURLParameter('dhs', 'true');
        return true;
    };

    this.removeDualHeatSinks = function removeDualHeatSinks(){
        // remove all the current heat sinks on the mech
        this.removeAllItemsByIDs(this.dualHeatSinkIDs);

        // hide the single heat sinks and show the double heat sinks.
        this.singleHeatSinkIDs.forEach(function(id){
            $("#detailContainer ."+id).show();
        });
        this.dualHeatSinkIDs.forEach(function(id){
            $("#detailContainer ."+id).hide();
        });

        this.dhs = false;
        setURLParameter('dhs', 'false');
        return true;
    };

    this.artemisCapableMissileIDs = ["WMB","WMC","WMD","WME","WMF","WMG","WMH"];
    this.addArtemis = function addArtemis(){
        if (this.artemis == true){
            return;
        }
        // remove all the current non artemis missiles
        this.removeAllItemsByIDs(this.artemisCapableMissileIDs);

        // Add a ton and a crit slot to each
        this.artemisCapableMissileIDs.forEach(function (id) {
            var itemObj = $("#detailContainer ." + id).data('itemObj');
            if (itemObj){
                itemObj.trueName = itemObj.itemName;
                itemObj.itemName = itemObj.itemName + " + Artemis";
                $("#detailContainer ." + id).text(itemObj.itemName);
                itemObj.trueWeight = itemObj.weight;
                itemObj.weight = itemObj.trueWeight + 1;
                itemObj.trueCrits = itemObj.critSlots;
                itemObj.critSlots = itemObj.trueCrits + 1;
            }
        });

        this.artemis = true;
        setURLParameter('artemis', 'true');
        return true;
    };

    this.removeArtemis = function removeArtemis(){
        if (this.artemis == false){
            return;
        }
        // remove all the current non artemis missiles
        this.removeAllItemsByIDs(this.artemisCapableMissileIDs);

        // remove a ton and a crit slot to each
        this.artemisCapableMissileIDs.forEach(function (id) {
            var itemObj = $("#detailContainer ." + id).data('itemObj');
            if (itemObj){
                itemObj.itemName = itemObj.trueName;
                $("#detailContainer ." + id).text(itemObj.trueName);
                itemObj.weight = itemObj.trueWeight;
                itemObj.critSlots = itemObj.trueCrits;
            }
        });

        this.artemis = false;
        setURLParameter('artemis', 'false');
        return true;
    };


    this.showStructureSlots = function showStructureSlots(){
        //clear old shown slots
        $("#mechContainer .structure .critLabel").text("[ empty ]");
        $("#mechContainer .structure").removeClass('structure');

        var structureSlots = (this.endo ? this.endoCritSlots : 0) + (this.ferro ? this.ferroCritSlots : 0);
        $("#mechContainer .empty").slice(0, structureSlots).addClass('structure');
        $("#mechContainer .structure .critLabel").text("[ Dynamic Structure ]");

    };

    this.countLimbs = function countLimbs() {
        var limb, countLimbs = 0;
        for (limb in this.limbs) {
            countLimbs++;
        }
        return countLimbs;
    };

    this.init();
}