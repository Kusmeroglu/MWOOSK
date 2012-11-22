function limb(limbName, critSlots, maxArmor) {
    this.limbName = limbName;
    this.critSlots = critSlots;
    this.frontArmor = 0;
    this.rearArmor = 0;
    this.totalArmor = 0;
    this.maxArmor = maxArmor;
    this.hardPoints = new Array();
    this.items = new Array();
    this.internals = new Array();

    this.init = function init(){
        // reset url parameter
        setURLParameter(this.limbName, "");
        // empty out the crit slots, just in case
        $('#'+this.limbName+' .critWrap').empty();
    }

    this.initVisuals = function initVisuals(){
        // display hardpoints
        ['ballistic', 'energy', 'missile', 'ams'].forEach(function(hardpointtype){
            var max = this.getTotalHardpointsForType(hardpointtype)
            if ( max > 0 ){
                $('#'+this.limbName+' .hardpoints').append($("<div></div>").addClass('hardpoint').addClass(''+hardpointtype).text(""+hardpointtype+": "+max));
            }
        }.bind(this));
        // mech xml specifies open crit slots
        for ( var i=0; i < this.critSlots; i++){
            $('<div></div>')
                .addClass('critItem')
                .addClass('empty')
                .append($('<div/>')
                .addClass(classLookup[1])
                .append('<div class="critLabel">[empty]</div>'))
                .appendTo($('#'+this.limbName+' .critWrap'))
        }
        // Build Armor Spinners
        // handles saving the values once they are changed
        var onSpinnerChange = function(e, ui){
            var frontspinner = $('#'+this.limbName+' .armorspinner.front');
            var rearspinner = $('#'+this.limbName+' .armorspinner.rear');
            var frontvalue = frontspinner.spinner("value");
            var rearvalue = 0;
            if ( rearspinner.length ){ // logic for the shared armor pool
                rearvalue = rearspinner.spinner("value");
                frontspinner.spinner("option","max",this.maxArmor - rearvalue);
                rearspinner.spinner("option", "max",this.maxArmor - frontvalue);
            }
            mechObj.setArmorForLimb(this.limbName, frontvalue, rearvalue);
        }.bind(this);
        // handles keeping user from going over the max armor or weight limit.
        var checkMaxArmor = function(e, ui){
            var frontvalue = $('#'+this.limbName+' .armorspinner.front').spinner("value");
            var rearspinner = $('#'+this.limbName+' .armorspinner.rear');
            var rearvalue = 0;
            if ( rearspinner.length ){ // logic for the shared armor pool
                rearvalue = rearspinner.spinner("value");
            }
            return (e.target.value > ui.value) || ((frontvalue + rearvalue) < this.maxArmor) && ((mechObj.currentTons + mechObj.armorWeight) < mechObj.maxTons);
        }.bind(this);

        $('#'+this.limbName+' .armorspinner.front').attr('value', this.frontArmor);
        $('#'+this.limbName+' .armorspinner.rear').attr('value', this.rearArmor);
        $('#'+this.limbName+' .maxarmor').text("Max: " + this.maxArmor);

        var spinner = $('#'+this.limbName+' .armorspinner').spinner({
            min: 0,
            max: this.maxArmor,
            change: onSpinnerChange,
            stop: onSpinnerChange,
            spin: checkMaxArmor
        });
    }

    this.addHardPoint = function addHardPoint(hardPointObj)
    {
        this.hardPoints.push(hardPointObj);
    }

    this.getHardPointType = function getHardPointType(indexNumber)
    {
        return this.hardPoints[indexNumber].pointType;
    }

    this.setArmor = function setArmor(front, rear){
        this.frontArmor = front;
        this.rearArmor = rear;
        this.totalArmor = front + rear;
    }

    this.getTotalHardpointsForType = function getTotalHardpointsForType(hardPointType){
        return this.hardPoints.filter(function(hardpoint){
            return hardpoint.pointType == hardPointType;
        }).length;
    };

    this.resetURLParam = function resetURLParam(){
        var s = "";
        $.each(this.items, function(i, itemObj){
            s += itemObj.id.toString();
        });
        setURLParameter(this.limbName, s);
    }

    this.addItem = function addItem(itemObj)
    {
        this.items.push(itemObj);
        this.resetURLParam();
        return true;
    }

    this.removeItem = function removeItem(itemObj)
    {
        // only remove the first one. This could be a bug in the future with multiple copies of an item
        this.items.pop(this.items.indexOf(itemObj));
        //console.log('removing ' + itemObj.itemName + ' from ' + limbName);
        this.resetURLParam();
        return true;
    }

    this.addInternal = function addInternal(itemObj)
    {
        this.internals.push(itemObj);
        $('<div></div>')
            .addClass('critItem')
            .addClass('internal')
            .append($('<div/>')
            .addClass(classLookup[itemObj.critSlots])
            .append('<div class="critLabel">'+itemObj.itemName+'</div>'))
            .appendTo($('#'+this.limbName+' .critWrap'))
        return true;
    }


    this.testIfValid = function testIfValid(itemObj)
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

    this.getFreeCritSlots = function getFreeCritSlots()
    {
        var usedSlots = 0;
        for (var x = 0; x < this.items.length; x++) {
            usedSlots = usedSlots + this.items[x].critSlots;
        }
        return this.critSlots - usedSlots;
    }

    this.init();
}
