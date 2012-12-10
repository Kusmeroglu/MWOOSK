function mech(chassisName, chassisVariant, maxTons) {
    this.chassis = chassisName;
    this.variant = chassisVariant;
    setURLParameter("variant", chassisVariant);
    this.maxTons = maxTons;

    this.dhs = false;
    this.ferro = false;
    this.chassisTons = 0;
    this.currentTons = 0;
    this.currentFreeCritSlots = 0;
    this.limbs = {};

    this.armorWeight = 1/32;

    // Endo Steel info
    this.endo = false;
    this.endoweight = parseFloat(maxTons * .05);
    this.endoCritSlots = 14;

    // Ferro Fibrous info
    this.ferro = false;
    this.ferroweight = this.armorWeight * .88;
    this.ferroCritSlots = 14;

    this.init = function init(){

    };

    this.countFreeCritSlots = function countFreeCritSlots(){
        this.currentFreeCritSlots = 0;
        for (var limbName in this.limbs) {
            this.currentFreeCritSlots += this.limbs[limbName].getFreeCritSlots();
        }
        return this.currentFreeCritSlots;
    }

    this.addLimb = function addLimb(limbName, limbObj) {
        this.limbs[limbName] = limbObj;
        this.countFreeCritSlots();
    };

    this.testIfValid = function testIfValid(limbName, itemObj){
        // is there weight on the mech?
        if (this.maxTons < (this.currentTons + parseFloat(itemObj.weight))){
            return false;
        }
        // are there crit slots (on the whole mech, endo and ferro, I'm looking at you)
        var structureSlots = (this.endo ? this.endoCritSlots : 0) + (this.ferro ? this.ferroCritSlots : 0);
        if ((this.currentFreeCritSlots - structureSlots) < itemObj.critSlots){
            return false;
        }
        // is the item valid for this limb?
        return this.limbs[limbName].testIfValid(itemObj);
    };

    this.addItemToLimb = function addItemToLimb(limbName, itemObj){
        this.addWeight(parseFloat(itemObj.weight));
        this.countFreeCritSlots();
        var success = this.limbs[limbName].addItem(itemObj);
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
        this.countFreeCritSlots();
        this.showStructureSlots();
        return success;
    }

    this.setArmorForLimb = function setArmorForLimb(limbName, frontArmor, rearArmor){
        // add (subtract) the difference to the current weight
        this.addWeight( (frontArmor + rearArmor - this.limbs[limbName].totalArmor) * (this.ferro ? this.ferroweight : this.armorWeight) );
        this.limbs[limbName].setArmor(frontArmor, rearArmor);
        this.resetArmorURLParam();
    }

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
    }

    this.resetLimbCritSlots = function resetLimbCritSlots(limbName){
        this.limbs[limbName].addEmptyCritSlots();
    }

    this.addWeight = function addWeight(weight){
        this.currentTons += weight;
        updateChart(this.maxTons, (this.endo) ? this.endoweight : this.chassisTons, this.currentTons);
    }

    this.addEndoSteel = function addEndoSteel(){
        if ( this.currentFreeCritSlots < 14 ){
            return false;
        }
        this.endo = true;
        // remove the difference from the standard chassis weight
        this.addWeight(this.endoweight - this.chassisTons);
        setURLParameter('endo', 'true');
        this.showStructureSlots();
        return true;
    }

    this.removeEndoSteel = function removeEndoSteel(){
        if ( (this.maxTons - this.currentTons) < (this.chassisTons - this.endoweight) ){
            return false;
        }
        this.endo = false;
        // add the difference from the standard chassis weight
        this.addWeight(this.chassisTons - this.endoweight);
        setURLParameter('endo', 'false');
        this.showStructureSlots();
        return true;
    }

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
    }

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
    }

    this.showStructureSlots = function showStructureSlots(){
        //clear old shown slots
        $("#mechContainer .structure").removeClass('structure');

        var structureSlots = (this.endo ? this.endoCritSlots : 0) + (this.ferro ? this.ferroCritSlots : 0);
        $("#mechContainer .empty").slice(0, structureSlots).addClass('structure');
    }

    this.countLimbs = function countLimbs() {
        var limb, countLimbs = 0;
        for (limb in this.limbs) {
            countLimbs++;
        }
        return countLimbs;
    }

    this.init();
}