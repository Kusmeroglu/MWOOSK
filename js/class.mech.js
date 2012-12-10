function mech(chassisName, chassisVariant, maxTons) {
    this.chassis = chassisName;
    this.variant = chassisVariant;
    setURLParameter("variant", chassisVariant);
    this.maxTons = maxTons;

    this.dhs = false;
    this.endo = false;
    this.ferro = false;
    this.chassisTons = 0;
    this.currentTons = 0;
    this.currentFreeCritSlots = 0;
    this.limbs = {};

    this.armorWeight = 1/32;

    this.init = function init(){

    };

    this.countFreeCritSlots = function countFreeCritSlots(){
        this.currentFreeCritSlots = 0;
        for (var limbName in this.limbs) {
            this.currentFreeCritSlots = this.limbs[limbName].getFreeCritSlots();
        }
        return this.currentFreeCritSlots;
    }

    this.addLimb = function addLimb(limbName, limbObj) {
        this.limbs[limbName] = limbObj;
        this.countFreeCritSlots();
    };

    this.testIfValid = function testIfValid(limbName, itemObj){
        // is there weight on the mech?
        if (this.maxTons < (this.currentTons + itemObj.weight)){
            return false;
        }
        // are there crit slots (on the whole mech, endo and ferro, I'm looking at you)
        if (this.currentFreeCritSlots < itemObj.critSlots){
            return false;
        }
        // is the item valid for this limb?
        return this.limbs[limbName].testIfValid(itemObj);
    };

    this.addItemToLimb = function addItemToLimb(limbName, itemObj){
        this.addWeight(parseFloat(itemObj.weight));
        this.countFreeCritSlots();
        return this.limbs[limbName].addItem(itemObj);
    };

    this.removeItemFromLimb = function removeItemFromLimb(limbName, itemObj){
        if ( ! itemObj ){
            console.log('Removing null item!');
            return;
        }
        this.addWeight(0 - parseFloat(itemObj.weight));
        var success = this.limbs[limbName].removeItem(itemObj);
        this.countFreeCritSlots();
        return success;
    }

    this.setArmorForLimb = function setArmorForLimb(limbName, frontArmor, rearArmor){
        // add (subtract) the difference to the current weight
        this.addWeight( (frontArmor + rearArmor - this.limbs[limbName].totalArmor) * this.armorWeight );
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
        updateChart(this.maxTons, this.chassisTons, this.currentTons);
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