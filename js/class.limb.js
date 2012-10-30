function limb(limbName, critSlots, frontArmor, rearArmor, maxArmor) {
    this.limbName = limbName;
    this.critSlots = critSlots;
    this.frontArmor = frontArmor;
    this.rearArmor = rearArmor;
    this.totalArmor = this.frontArmor + this.rearArmor;
    this.maxArmor = maxArmor;
    this.hardPoints = {};

    this.addHardPoint = addHardPoint;
    this.getCountHardPoints = getCountHardPoints;
    this.getHardPointType = getHardPointType;

    function addHardPoint(hardPointObj)
    {
        var pointNumber = this.getCountHardPoints() + 1;
        this.hardPoints[pointNumber] = hardPointObj;
    }

    function getCountHardPoints()
    {
        var point, countPoints = 0;
        for (point in this.hardPoints) {
            countPoints++;
        }
        return countPoints;
    }

    function getHardPointType(indexNumber)
    {
        return this.hardPoints[indexNumber].pointType;
    }
}