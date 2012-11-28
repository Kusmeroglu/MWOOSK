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
    this.limbs = {};

    this.armorWeight = 1/32;

    this.init = function init(){

    };

    this.addLimb = function addLimb(limbName, limbObj) {
        this.limbs[limbName] = limbObj;
    };

    this.addItemToLimb = function addItemToLimb(limbName, itemObj){
        this.addWeight(parseFloat(itemObj.weight));
        return this.limbs[limbName].addItem(itemObj);
    }

    this.removeItemFromLimb = function removeItemFromLimb(limbName, itemObj){
        if ( ! itemObj ){
            console.log('Removing null item!');
            return;
        }
        this.addWeight(0 - parseFloat(itemObj.weight));
        return this.limbs[limbName].removeItem(itemObj);
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
        var limbs, countLimbs = 0;
        for (limb in this.limbs) {
            countLimbs++;
        }
        return countLimbs;
    }

    this.init();
}