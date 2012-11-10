function limb(limbName, critSlots, maxArmor) {
    this.limbName = limbName;
    this.critSlots = critSlots;
    this.frontArmor = 0;
    this.rearArmor = 0;
    this.totalArmor = 0;
    this.maxArmor = maxArmor;
    this.hardPoints = new Array();
    this.items = new Array();

    this.addHardPoint = addHardPoint;
    this.getHardPointType = getHardPointType;
    this.addItem = addItem;
    this.removeItem = removeItem;
    this.testIfValid = testIfValid;
    this.getFreeCritSlots = getFreeCritSlots;

    function addHardPoint(hardPointObj)
    {
        this.hardPoints.push(hardPointObj);
    }

    function getHardPointType(indexNumber)
    {
        return this.hardPoints[indexNumber].pointType;
    }

    this.setArmor = function(front, rear){
        this.frontArmor = front;
        this.rearArmor = rear;
        this.totalArmor = front + rear;
    }

    this.getTotalHardpointsForType = function(hardPointType){
        return this.hardPoints.filter(function(hardpoint){
            return hardpoint.pointType == hardPointType;
        }).length;
    };

    this.resetURLParam = function(){
        var s = "";
        $.each(this.items, function(i, itemObj){
            s += itemObj.id.toString();
        });
        setURLParameter(this.limbName, s);
    }

    function addItem(itemObj)
    {
        this.items.push(itemObj);
        console.log('adding ' + itemObj.itemName + ' to ' + limbName);
        this.resetURLParam();
        return true;
    }

    function removeItem(itemObj)
    {
        // only remove the first one. This could be a bug in the future with multiple copies of an item
        this.items.pop(this.items.indexOf(itemObj));
        console.log('removing ' + itemObj.itemName + ' from ' + limbName);
        this.resetURLParam();
        return true;
    }

    function testIfValid(itemObj)
    {
        //First: is there available space?
        if (itemObj.critSlots > this.getFreeCritSlots()) {
            return false;
        }
        //Applicable free hard point?
        var typePoints = 0;
        for (var x = 0; x < this.hardPoints.length; x++) {
            if (this.hardPoints[x].pointType == itemObj.weaponType) typePoints++;
        }
        if (typePoints == 0) {
            return false;
        }
        //Okay, so this has a valid hard point for the item type. But does it have a FREE hard point?
        var occupiedHardPointsOfSameType = 0;
        for (var x = 0; x < this.items.length; x++) {
            if (this.items[x].weaponType == itemObj.weaponType) occupiedHardPointsOfSameType++;
        }
        if (occupiedHardPointsOfSameType == typePoints) {
            return false;
        }
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
