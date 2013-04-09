function mech(chassisName, chassisVariant, maxTons) {
    this.chassis = chassisName;
    this.variant = chassisVariant;
    setURLParameter("variant", chassisVariant);
    this.maxTons = maxTons;

    this.dhs = false;
    this.artemis = false;
    this.chassisTons = 0;
    this.currentTons = 0;
    this.currentFreeCritSlots = 0;
    this.currentEquivalentHeatSinks = 0;
    this.currentComponentCost = 0;
    this.limbs = {};
    this.ecm = false;
    this.ecmcount = 0;
	this.bapcount = 0;
    this.ecmmax = 1;
	this.bapmax = 1;
    this.jumpjets = false;
    this.jumpjetcount = 0;
    this.jumpjetmax = 5;

    this.minEngineSize = 100;
    this.maxEngineSize = 400;

    this.armorWeight = 1/32;
    this.totalArmor = 0;
    this.totalMaxArmor = 0;

    // Endo Steel info
    this.endo = false;
    this.endoweight = 0;
    this.endoCritSlots = 14;

    // Ferro Fibrous info
    this.ferro = false;
    this.ferroweight = this.armorWeight * .88;
    this.ferroCritSlots = 14;

    this.jumpjetitemIDs = ["1500", "1501", "1502", "1503", "1504"];

    this.heatBreakdown = {'engine':0,'chassis':0,'heatsinks':0,'ammo':0,'energy':0,'ballistic':0,'missile':0,'other':0};
    this.weightBreakdown = {'engine':0,'chassis':0,'heatsinks':0,'ammo':0,'energy':0,'ballistic':0,'missile':0,'other':0};
    this.critsBreakdown = {'engine':0,'chassis':0,'heatsinks':0,'ammo':0,'energy':0,'ballistic':0,'missile':0,'other':0};

    this.updateMech = function updateMech(){
        //reset the breakdowns
        this.heatBreakdown = {'engine':0,'chassis':0,'heatsinks':0,'ammo':0,'energy':0,'ballistic':0,'missile':0,'other':0};
        this.weightBreakdown = {'engine':0,'chassis':0,'heatsinks':0,'ammo':0,'energy':0,'ballistic':0,'missile':0,'other':0};
        this.critsBreakdown = {'engine':0,'chassis':0,'heatsinks':0,'ammo':0,'energy':0,'ballistic':0,'missile':0,'other':0};

        // also counting heatsinks
        this.currentEquivalentHeatSinks = 0;
        this.currentActualHeatSinks = 0;
        this.currentFreeCritSlots = 0;
        this.currentComponentCost = 0;
        this.currentTons = this.chassisTons - (this.endo ? this.endoweight : 0); // chassis weight
        this.currentTons += this.totalArmor * (this.ferro ? this.ferroweight : this.armorWeight); //armor
        this.weightBreakdown['chassis'] = this.currentTons;

        for (var limbName in this.limbs) {
            this.currentFreeCritSlots += this.limbs[limbName].getFreeCritSlots();
            for ( var item in this.limbs[limbName].items){
                var itemData = this.limbs[limbName].items[item]
                this.currentTons += itemData.weight;
                this.currentEquivalentHeatSinks += itemData.getEquivalentHeatSinks(this.dhs);
                this.currentActualHeatSinks += itemData.getActualHeatSinks();
                this.currentComponentCost += itemData.getComponentCost();

                if ( itemData.isAmmo ){
                    this.weightBreakdown.ammo += itemData.weight;
                    this.critsBreakdown.ammo += itemData.critSlots;
                }
                else if ( itemData.type == "heatsink" ){
                    this.weightBreakdown.heatsinks += itemData.weight;
                    this.critsBreakdown.heatsinks += itemData.critSlots;
                }
                else if ( itemData.type == "util" ){
                    this.weightBreakdown.other += itemData.weight;
                    this.critsBreakdown.other += itemData.critSlots;
                }
                else if ( itemData.hardpointType ) {
                    this.weightBreakdown[itemData.hardpointType] += itemData.weight;
                    this.critsBreakdown[itemData.hardpointType] += itemData.critSlots;
                    this.heatBreakdown[itemData.hardpointType] += itemData.heat;
                }
                else {
                    // Internals, which we're not counting now.
                    //console.log(itemData.name);
                }
            }
        }

        // update heatsink information
        $("#heat").text("Installed Heat Sinks: " + this.currentActualHeatSinks + " ");
        $("#effectiveheat").text("Effective Heat Sinks: " + (Math.round(10 * this.currentEquivalentHeatSinks) / 10));

        // update weight data
        $("#tonnage").text("Weight: " + parseFloat(Math.round(100*this.currentTons)/100) + " / " + this.maxTons );
        $("#freetonnage").text("(Free: "+ parseFloat(Math.round(10000*(this.maxTons - this.currentTons))/10000) +")");

        // update engine speed data
        if ( $("#centerTorso .engine").length > 0 ){
            var enginedata = $("#centerTorso .engine").data("itemObj");
            var maxspeed = 16.2 * enginedata.engineSize/this.maxTons;
            var speedtweak = maxspeed * 1.1;
            $("#speed").text("Max Speed: " + Math.round(10*maxspeed)/10 + " kph (" + Math.round(10*speedtweak)/10 + ")");
            // also check if having enough heatsinks
            if ( enginedata.heatsinkslots < 0 && $("#mechContainerWrap .heatsink").length < -enginedata.heatsinkslots ){
                $("#heat").append("<span class='hserror'>(10)</span>");
            }
        } else {
            $("#speed").text("No engine selected.");
        }

        // update crit and cost information.
        var structureSlots = (this.endo ? this.endoCritSlots : 0) + (this.ferro ? this.ferroCritSlots : 0);
        this.critsBreakdown['chassis'] = structureSlots;
        this.currentFreeCritSlots -= structureSlots;
        $("#freeCrits").text("Free Crits: " + (this.currentFreeCritSlots));
        $("#costInfo").text("Components: " + this.currentComponentCost + " cbills");

        return this.currentFreeCritSlots;
    };

    this.addLimb = function addLimb(limbName, limbObj) {
        this.limbs[limbName] = limbObj;
        this.updateMech();
        this.totalMaxArmor += limbObj.maxArmor;
    };

    this.testIfValid = function testIfValid(limbName, itemObj){
        // is there weight on the mech?
        if (this.maxTons < (this.currentTons + parseFloat(itemObj.weight))){
            return false;
        }
        // are there crit slots (on the whole mech, endo and ferro, I'm looking at you)
        if ( (this.currentFreeCritSlots) < itemObj.critSlots){
            // return false only if this is not the center torso and this is a heatsink and there are extra heatsink slots
            if ( ! (limbName == "centerTorso" && itemObj.type == "heatsink" && (this.limbs[limbName].engineHeatSinks - this.limbs[limbName].engineHeatSinksItems.length) > 0)){
                return false;
            }
        }
        // ecm check
        if ( itemObj.id == "9006" && (this.ecm == false || this.ecmcount >= this.ecmmax) ){
            return false;
        }
		// bap check
        if ( itemObj.id == "9002" && (this.bap == false || this.bapcount >= this.bapmax) ){
            return false;
        }
        // jumpjet check
        // can't add jumpjet to arms or head
        if (  $.inArray(itemObj.id, this.jumpjetitemIDs) > -1 && ($.inArray(limbName, ['leftArm','rightArm','head']) > -1 ) ){
            return false;
        }
        // see if we're over the max
        if (  $.inArray(itemObj.id, this.jumpjetitemIDs) > -1 && (this.jumpjets == false || this.jumpjetcount >= this.jumpjetmax) ){
            return false;
        }
        // is the item valid for this limb?
        return this.limbs[limbName].testIfValid(itemObj);
    };

    this.addItemToLimb = function addItemToLimb(limbName, itemObj){
        var success = this.limbs[limbName].addItem(itemObj);
        // ecm check
        if ( itemObj.id == "9006" ){
            this.ecmcount += 1;
        }
		// bap check
        if ( itemObj.id == "9002" ){
            this.bapcount += 1;
        }
        // jumpjet check
        if ( $.inArray(itemObj.id, this.jumpjetitemIDs) > -1 ){
            this.jumpjetcount += 1;
        }
        this.showStructureSlots();
        this.updateMech();
        return success;
    };

    this.removeItemFromLimb = function removeItemFromLimb(limbName, itemObj){
        if ( ! itemObj ){
            console.log('Removing null item!');
            return;
        }
        var success = this.limbs[limbName].removeItem(itemObj);
        // ecm check
        if ( itemObj.id == "9006" ){
            this.ecmcount -= 1;
        }
		// bap check
        if ( itemObj.id == "9002" ){
            this.bapcount -= 1;
        }
        // jumpjet check
        if ( $.inArray(itemObj.id, this.jumpjetitemIDs) > -1 ){
            this.jumpjetcount -= 1;
        }
        this.showStructureSlots();
        this.updateMech();
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
        this.limbs[limbName].setArmor(frontArmor, rearArmor);
        this.resetArmorURLParam();
        //console.log("Equipped Armor: " + this.totalArmor);
    };

    this.resetArmorURLParam = function resetArmorURLParam(){
        var s = "";
        this.totalArmor = 0;
        limbList.forEach(function(limbName){
            if ( this.limbs.hasOwnProperty(limbName)){ // not all the limbs have been loaded yet..
                s += this.limbs[limbName].frontArmor.toString() + "-" + this.limbs[limbName].rearArmor.toString() + ",";
                this.totalArmor += this.limbs[limbName].totalArmor;
            } else {
                s +="0-0,";
            }
        }, this);
        setURLParameter("armor", s);
        $("#totalArmor").text("Armor: " + this.totalArmor + " / " + this.totalMaxArmor);
        this.updateMech();
    };

    this.resetLimbCritSlots = function resetLimbCritSlots(limbName){
        this.limbs[limbName].addEmptyCritSlots();
    };

    this.addEndoSteel = function addEndoSteel(){
        if ( this.currentFreeCritSlots < 14 ){
            return false;
        }
        this.endo = true;
        setURLParameter('endo', 'true');
        this.showStructureSlots();
        this.updateMech();
        return true;
    };

    this.removeEndoSteel = function removeEndoSteel(){
        if ( (this.maxTons - this.currentTons) < (this.chassisTons - this.endoweight) ){
            return false;
        }
        this.endo = false;
        setURLParameter('endo', 'false');
        this.showStructureSlots();
        this.updateMech();
        return true;
    };

    this.addFerroFibrous = function addFerroFibrous(){
        if ( this.currentFreeCritSlots < 14 ){
            return false;
        }
        this.ferro = true;

        setURLParameter('ferro', 'true');
        this.showStructureSlots();
        this.updateMech();
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
        setURLParameter('ferro', 'false');
        this.showStructureSlots();
        this.updateMech();
        return true;
    };

    this.singleHeatSinkIDs = ["3000"];
    this.dualHeatSinkIDs = ["3001"];
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
        this.updateMech();
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
        this.updateMech();
        return true;
    };

    this.artemisCapableMissileIDs = ["1004","1026","1002","1028","1030","1031","1027"];
    this.nonArtemisAmmoIDs = ["2027","2028"];
    this.artemisAmmoIDs = ["2030","2031"];
    this.addArtemis = function addArtemis(){
        // remove all the current non artemis missiles and ammo
        this.removeAllItemsByIDs(this.artemisCapableMissileIDs.concat(this.nonArtemisAmmoIDs));

        // hide the non-artemis missile ammo and show the artemis missile ammo in the item list.
        this.nonArtemisAmmoIDs.forEach(function (id) {
            $("#detailContainer ." + id).hide();
        });
        this.artemisAmmoIDs.forEach(function (id) {
            $("#detailContainer ." + id).show();
        });

        if (this.artemis == true){
            return;
        }

        // Add a ton and a crit slot to each
        this.artemisCapableMissileIDs.forEach(function (id) {
            var itemObj = $("#detailContainer ." + id).data('itemObj');
            if (itemObj){
                itemObj.trueName = itemObj.itemName;
                itemObj.itemName = itemObj.itemName + " + Artemis";
                $("#detailContainer ." + id + " .itemName").text(itemObj.itemName);
                itemObj.trueWeight = itemObj.weight;
                itemObj.weight = itemObj.trueWeight + 1;
                itemObj.trueCrits = itemObj.critSlots;
                itemObj.critSlots = itemObj.trueCrits + 1;
                $("#detailContainer ." + id + " .itemweight").text("Weight: "+itemObj.weight+" Tons");
                $("#detailContainer ." + id + " .itemcrits").text("Crit Slots: "+itemObj.critSlots);
            }
        });

        this.artemis = true;
        setURLParameter('artemis', 'true');
        return true;
    };

    this.removeArtemis = function removeArtemis(){
        // remove all the current non artemis missiles
        this.removeAllItemsByIDs(this.artemisCapableMissileIDs.concat(this.artemisAmmoIDs));

        // hide the non-artemis missiles and show the artemis missiles in the item list.
        this.nonArtemisAmmoIDs.forEach(function (id) {
            $("#detailContainer ." + id).show();
        });
        this.artemisAmmoIDs.forEach(function (id) {
            $("#detailContainer ." + id).hide();
        });

        if (this.artemis == false){
            return;
        }

        // remove a ton and a crit slot to each
        this.artemisCapableMissileIDs.forEach(function (id) {
            var itemObj = $("#detailContainer ." + id).data('itemObj');
            if (itemObj){
                itemObj.itemName = itemObj.trueName;
                $("#detailContainer ." + id + " .itemName").text(itemObj.trueName);
                itemObj.weight = itemObj.trueWeight;
                itemObj.critSlots = itemObj.trueCrits;
                $("#detailContainer ." + id + " .itemweight").text("Weight: "+itemObj.weight+" Tons");
                $("#detailContainer ." + id + " .itemcrits").text("Crit Slots: "+itemObj.critSlots);
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
}