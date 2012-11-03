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
    this.limbs = new Array();

    this.addLimb = addLimb;
    this.countLimbs = countLimbs;

    function addLimb(limbName, limbObj) {
        this.limbs[limbName] = limbObj;
    }

    this.addItemToLimb = addItemToLimb;
    function addItemToLimb(limbName, itemObj){
        this.limbs[limbName].addItem(itemObj);
        this.currentTons += parseFloat(itemObj.weight);
        updateChart(this.maxTons, this.chassisTons, this.currentTons);
    }

    this.removeItemFromLimb = removeItemFromLimb;
    function removeItemFromLimb(limbName, itemObj){
        this.limbs[limbName].removeItem(itemObj);
        this.currentTons -= parseFloat(itemObj.weight);
        updateChart(this.maxTons, this.chassisTons, this.currentTons);
    }

    function countLimbs() {
        var limbs, countLimbs = 0;
        for (limb in this.limbs) {
            countLimbs++;
        }
        return countLimbs;
    }


}