function limb(limbName, critSlots, frontArmor, rearArmor, maxArmor) {
    this.limbName = limbName;
    this.critSlots = critSlots;
    this.frontArmor = frontArmor;
    this.rearArmor = rearArmor;
    this.totalArmor = this.frontArmor + this.rearArmor;
    this.maxArmor = maxArmor;
    this.hardPoints = new Array();
    this.items = new Array();

    this.addHardPoint = addHardPoint;
    this.getHardPointType = getHardPointType;
    this.addItem = addItem;
    this.getFreeCritSlots = getFreeCritSlots;

    function addHardPoint(hardPointObj)
    {
        this.hardPoints.push(hardPointObj);
    }

    function getHardPointType(indexNumber)
    {
        return this.hardPoints[indexNumber].pointType;
    }

    function addItem(itemObj)
    {
        //First: is there available space?
        if (itemObj.critSlots > this.getFreeCritSlots()) {
            alert("error: not enough space");
            return false;
        }
        alert("has enough space");
        //Applicable free hard point?
        var typePoints = 0;
        for (var x = 0; x < this.hardPoints.length; x++) {
            if (this.hardPoints[x].pointType == itemObj.weaponType) typePoints++;
        }
        if (typePoints == 0) {
            alert("Error: not a valid hard point in this limb");
            return false;
        }
        //Okay, so this has a valid hard point for the item type. But does it have a FREE hard point?
        var occupiedHardPointsOfSameType = 0;
        for (var x = 0; x < this.items.length; x++) {
            if (this.items[x].weaponType == itemObj.weaponType) occupiedHardPointsOfSameType++;
        }
        if (occupiedHardPointsOfSameType == typePoints) {
            alert("Not enough free hard points of type " + itemObj.weaponType);
            return false;
        }
        alert("able to add item");
        this.items.push(itemObj);
        return true;
    }

    function getFreeCritSlots()
    {
        var usedSlots = 0;
        for (var x = 0; x < this.items.length; x++) {
            usedSlots = usedSlots + this.items[x].critSlots;
        }
        return this.critSlots - usedSlots;
    }
}
