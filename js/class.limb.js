function limb(limbName, critSlots, maxArmor) {
    this.limbName = limbName;
    this.critSlots = parseInt(critSlots);
    this.frontArmor = 0;
    this.rearArmor = 0;
    this.totalArmor = 0;
    this.maxArmor = maxArmor;
    this.hardPoints = new Array();
    this.items = new Array();

    this.init = function init(){
        // reset url parameter
        setURLParameter(this.limbName, "");
        // empty out the crit slots, just in case
        $('#'+this.limbName+' .critWrap').empty();
    }

    this.initVisuals = function initVisuals(){
        // display hardpoints (not engine)
        ['ballistic', 'energy', 'missile', 'ams'].forEach(function(hardpointtype){
            var max = this.getTotalHardpointsForType(hardpointtype)
            if ( max > 0 ){
                $('#'+this.limbName+' .hardpoints').append($("<div></div>").addClass('hardpoint').addClass(''+hardpointtype).text(""+hardpointtype+": "+max));
            }
        }.bind(this));
        // mech xml specifies open crit slots
        this.addEmptyCritSlots( this.critSlots );

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

    this.addEmptyCritSlots = function addEmptyCritSlots(count){
        // mech xml specifies open crit slots
        for ( var i=0; i < count; i++){
            $('<div></div>')
                .addClass('critItem')
                .addClass('empty')
                .append($('<div/>')
                .addClass(classLookup[1])
                .append('<div class="critLabel">[empty]</div>'))
                .appendTo($('#'+this.limbName+' .critWrap'))
        }
        this.sortItems();
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
    };

    this.sortItems = function sortItems(){
        var sorteditems = [];
        var sortOrder = ['internal','engine', 'energy','ballistic','missile', 'empty'];
        $.each(sortOrder, function(i, className){
            sorteditems = sorteditems.concat($('#'+this.limbName+' .critWrap').children('.'+className).get());
        }.bind(this));
        $('#'+this.limbName+' .critWrap').append(sorteditems); // actually moves them in place. jQuery ninja voodoo
    };

    this.addItem = function addItem(itemObj)
    {
        if ( ! itemObj ){
            console.log("Empty itemObj in add");
            return false;
        }

        // clear out the critslots needed
        if ( itemObj.type != "internal"){
            $('#'+this.limbName).find('.critWrap .empty').slice(0, itemObj.critSlots).remove();
        }

        // add to the limb
        var div = $("<div></div>")
            .addClass('critItem')
            .addClass(itemObj.hardpointType)
            // store all the weapon information in this div
            .data({'itemObj':itemObj, rosechartdata:itemObj.rosechartdata})
            .disableSelection()
            .append($('<div/>')
                .addClass(classLookup[itemObj.critSlots])
                .append('<div class="critLabel">'+itemObj.itemName+'</div>')
                )
            .appendTo($('#'+this.limbName+' .critWrap'))
            .fadeIn();
        // if this is a top level item (with an id), make it draggable
        if (itemObj.id){
            div.draggable({
                    appendTo: 'body',
                    snap: ".area",
                    snapMode: "inner"
            });
        }
        // if this is a weapon
        if( itemObj.type == "weapon" ){
            div.hover(
                function(){
                    updateRoseChartData($(this).data("itemObj")["rosechartdata"], $(this).data("itemObj")['itemName']);
                },
                function(){
                    resetRoseChartData("-N/A-");
                })
        }
        // save obj in item data?
        itemObj.elements = [div];
        // hack for XL engines
        if ( this.limbName == "centerTorso" && itemObj.type == "xl"){
            var rightxlwing = new item("", itemObj.itemName, 3, 0, "xl", "");
            var leftxlwing = new item("", itemObj.itemName, 3, 0, "xl", "");
            mechObj.addItemToLimb('rightTorso', rightxlwing);
            mechObj.addItemToLimb('leftTorso', leftxlwing);
            itemObj.relatedItems['rightTorso'] = rightxlwing;
            itemObj.relatedItems['leftTorso'] = leftxlwing;
        }
        this.items.push(itemObj);
        this.resetURLParam();
        this.sortItems();
        return div;
    }.bind(this);

    this.removeItem = function removeItem(itemObj)
    {
        if ( ! itemObj ){
            console.log("Empty itemObj in remove");
            return false;
        }

        this.items.splice(this.items.indexOf(itemObj), 1);

        //console.log('removing ' + itemObj.itemName + ' from ' + limbName);
        this.resetURLParam();

        if ( itemObj.elements){
            itemObj.elements.forEach(function(elem){
                   $(elem).remove();
                }
            );
        } else {
            console.log("no element!");
        }

        for ( var limb in itemObj.relatedItems ){
            if (itemObj.relatedItems.hasOwnProperty(limb)){
                mechObj.removeItemFromLimb(limb, itemObj.relatedItems[limb]);
            }
        }

        // reinstate empty crit slots
        this.addEmptyCritSlots(itemObj.critSlots);
        return true;
    };

    this.testIfValid = function testIfValid(itemObj)
    {
        if ( ! itemObj ){
            console.log("Empty itemObj in test");
            return false;
        }
        //First: is there available space?
        if (itemObj.critSlots > this.getFreeCritSlots()) {
            return false;
        }
        //Applicable free hard point?
        if (itemObj.hardpointType){
            var typePoints = 0;
            for (var x = 0; x < this.hardPoints.length; x++) {
                if (this.hardPoints[x].pointType == itemObj.hardpointType) typePoints++;
            }
            if (typePoints == 0) {
                return false;
            }
            //Okay, so this has a valid hard point for the item type. But does it have a FREE hard point?
            var occupiedHardPointsOfSameType = 0;
            for (var x = 0; x < this.items.length; x++) {
                if (this.items[x].hardpointType == itemObj.hardpointType) occupiedHardPointsOfSameType++;
            }
            if (occupiedHardPointsOfSameType == typePoints) {
                return false;
            }
        }
        return true;
    };

    this.getFreeCritSlots = function getFreeCritSlots()
    {
        var usedSlots = 0;
        for (var x = 0; x < this.items.length; x++) {
            if (this.items[x].type != "internal"){
                usedSlots = usedSlots + this.items[x].critSlots;
            }
        }
        return this.critSlots - usedSlots;
    };

    this.init();
}
