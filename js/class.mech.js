function mech(chassisName, chassisVariant, maxTons) {
    this.mechName = chassisName;
    this.variant = chassisVariant;
    this.maxTons = maxTons;
    this.dhs = false;
    this.endo = false;
    this.ferro = false;
    this.currentTons = 0;
    this.limbs = new Array();

    this.addLimb = addLimb;
    this.countLimbs = countLimbs;

    function addLimb(limbName, limbObj) {
        this.limbs[limbName] = limbObj;
    }


    function countLimbs() {
        var limbs, countLimbs = 0;
        for (limb in this.limbs) {
            countLimbs++;
        }
        return countLimbs;
    }


}