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

    this.addLimb = addLimb;
    function addLimb(limbName, limbObj) {
        this.limbs[limbName] = limbObj;
    }

    this.addItemToLimb = addItemToLimb;
    function addItemToLimb(limbName, itemObj){
        this.limbs[limbName].addItem(itemObj);
        this.addWeight(parseFloat(itemObj.weight));
    }

    this.removeItemFromLimb = removeItemFromLimb;
    function removeItemFromLimb(limbName, itemObj){
        this.limbs[limbName].removeItem(itemObj);
        this.addWeight(0 - parseFloat(itemObj.weight));
    }

    this.setArmorForLimb = setArmorForLimb;
    function setArmorForLimb(limbName, frontArmor, rearArmor){
        // add (subtract) the difference to the current weight
        this.addWeight( (frontArmor + rearArmor - this.limbs[limbName].totalArmor) * this.armorWeight );
        this.limbs[limbName].setArmor(frontArmor, rearArmor);
    }

    this.addWeight = addWeight;
    function addWeight(weight){
        this.currentTons += weight;
        updateChart(this.maxTons, this.chassisTons, this.currentTons);
    }

    this.countLimbs = countLimbs;
    function countLimbs() {
        var limbs, countLimbs = 0;
        for (limb in this.limbs) {
            countLimbs++;
        }
        return countLimbs;
    }


}