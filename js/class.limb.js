function limb(limbName, critSlots, maxArmor) {
    this.limbName = limbName;
    this.critSlots = parseInt(critSlots);
    this.engineHeatSinks = 0;
    this.engineHeatSinksItems = [];
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
            var max = this.getTotalHardpointsForType(hardpointtype);
            if ( max > 0 ){
                $('#'+this.limbName+' .hardpoints').append($("<div></div>").addClass('hardpoint').addClass(''+hardpointtype).text(""+max));
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
                .append('<div class="critLabel">[ empty ]</div>'))
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
        var sortOrder = ['internal','engine','engineheatsink','ams','ecm','util','energy','ballistic','missile','heatsink','jumpjet','ammo','xl','dynamic','empty'];
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

        var visiblecritslots = itemObj.critSlots;
        if ( itemObj.hardpointType == "engine" && itemObj.heatsinkslots > 0 ){
            visiblecritslots -= itemObj.heatsinkslots;
        }
        if ( this.limbName == "centerTorso" && itemObj.type == "xl"){
            visiblecritslots -= 6;
        }
        // clear out the critslots needed
        if ( itemObj.type == "heatsink" && (this.engineHeatSinks - this.engineHeatSinksItems.length) > 0 ){
            var displacedheatsink = $('#'+this.limbName).find('.critWrap .engineheatsink').slice(0, 1).detach();
            displacedheatsink.data("itemObj").critSlots = 1 - itemObj.critSlots; // set the ehs objects critslots to negative the heatsinks crits, so we can calculate which heatsinks are in the engine.
            this.items.splice(this.items.indexOf(displacedheatsink.data('itemObj')), 1);
            this.engineHeatSinksItems.push(displacedheatsink);
            visiblecritslots = 1;
        } else if ( itemObj.type != "internal"){
            $('#'+this.limbName).find('.critWrap .empty').slice(0, visiblecritslots).remove();
        }

        // add to the limb
        var div = $("<div></div>")
            .addClass('critItem')
            .addClass(itemObj.hardpointType)
            .addClass(itemObj.type)
            // store all the weapon information in this div
            .data({'itemObj':itemObj, rosechartdata:itemObj.rosechartdata})
            .disableSelection()
            .append($('<div/>')
                .addClass(classLookup[ visiblecritslots ])
                .append('<div class="critLabel">'+itemObj.itemName+'</div>')
                )
			.appendTo($('#'+this.limbName+' .critWrap'))
            .fadeIn();
			for(var emptyCrit = 1; emptyCrit < visiblecritslots; emptyCrit++){
				div.children("div").append('<div class="emptyCrit">- - - - - - - - - - - - - - - -</div>')
				}
        // if this is a top level item (with an id), make it draggable
        if (itemObj.id){
            div.draggable({
                    helper: 'clone',
                    revert: false,
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
            itemObj.relatedItems['rightTorso'] = [rightxlwing];
            itemObj.relatedItems['leftTorso'] = [leftxlwing];
        }
        // hack for engine heatslots - add the engine heat sink slots
        if ( this.limbName == "centerTorso" && itemObj.hardpointType == "engine" && itemObj.heatsinkslots > 0){
            itemObj.relatedItems['centerTorso'] = [];
            this.engineHeatSinks = itemObj.heatsinkslots;
            this.engineHeatSinksItems = []
            for(var i = 0; i < itemObj.heatsinkslots; i++){
                var heatsinkitem = new item("", "[Engine Heat Sink]", 1, 0, "engineheatsink", "");
                mechObj.addItemToLimb('centerTorso', heatsinkitem);
                itemObj.relatedItems['centerTorso'].push( heatsinkitem );
            }
        }
        this.items.push(itemObj);
        this.resetURLParam();
        this.sortItems();
        return div;
    };

    this.removeItem = function removeItem(itemObj)
    {
        if ( ! itemObj ){
            console.log("Empty itemObj in remove");
            return false;
        }

        if (this.engineHeatSinksItems.indexOf(itemObj) != -1){
            // this item isn't currently in the thing
            return true;
        }

        if (this.items.indexOf(itemObj) == -1){
            // this item isn't currently in the thing
            return true;
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


        // if removing engine, remove heat sinks in engine too
        if ( this.limbName == "centerTorso" && itemObj.hardpointType == "engine" && this.engineHeatSinks > 0){
            if ( this.engineHeatSinksItems ){
                // remove a heatsink for each engine heat sink used
                var heatsinksinlimb = this.items.filter(function(item){ return item.type == "heatsink"});
                heatsinksinlimb = heatsinksinlimb.slice(0, this.engineHeatSinksItems.length);
                heatsinksinlimb.forEach(function(item){
                    mechObj.removeItemFromLimb("centerTorso", item);
                });
            }
            this.engineHeatSinks = 0;
            this.engineHeatSinksItems = [];
        }

        // remove all related items (xl wings and engine heatsinks)
        for ( var limb in itemObj.relatedItems ){
            if (itemObj.relatedItems.hasOwnProperty(limb)){
                for ( var i in itemObj.relatedItems[limb]){
                    mechObj.removeItemFromLimb(limb, itemObj.relatedItems[limb][i]);
                }
            }
        }

        // reinstate empty crit slots (or engine heat sinks slots..)
        if ( itemObj.type == "heatsink" && (this.engineHeatSinksItems.length) > 0 ){
            var replacedengineheatsink = this.engineHeatSinksItems.pop();
            replacedengineheatsink.data("itemObj").critSlots = 1;
            $('#'+this.limbName+' .critWrap').append(replacedengineheatsink);
            this.items.push(replacedengineheatsink.data('itemObj'));
            this.sortItems();
        } else if ( itemObj.hardpointType == "engine" &&  itemObj.type == "xl" && itemObj.heatsinkslots > 0 ){
            this.addEmptyCritSlots(itemObj.critSlots - 6 - itemObj.heatsinkslots);
        } else if ( itemObj.hardpointType == "engine" && itemObj.heatsinkslots > 0 ){
            this.addEmptyCritSlots(itemObj.critSlots - itemObj.heatsinkslots);
        } else {
            this.addEmptyCritSlots(itemObj.critSlots);
        }
        return true;
    };

    this.testIfValid = function testIfValid(itemObj)
    {
        if ( ! itemObj ){
            console.log("Empty itemObj in test");
            return false;
        }
        //First: is there available space? (check engine heatsink first, then crit slots)
        if ( itemObj.type == "heatsink" && (this.engineHeatSinks - this.engineHeatSinksItems.length) > 0 ){
            return true; // heatsinks don't have a hardpoint type
        }
        // hack for XL engines- check for crit slots in the other torsos
        if ( this.limbName == "centerTorso" && itemObj.type == "xl"){
            if (6 > this.getFreeCritSlots()) { // xl's only use 6 slots in the torso
                return false;
            }
            //yuck on reaching into the limb like this
            if (mechObj.limbs['rightTorso'].getFreeCritSlots() < 3 || mechObj.limbs['leftTorso'].getFreeCritSlots() < 3){
                return false;
            }
        } else {
            if (itemObj.critSlots > this.getFreeCritSlots()) {
                return false;
            }
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
            if (  this.limbName == "centerTorso" && this.items[x].hardpointType == "engine" && this.items[x].heatsinkslots > 0){
                usedSlots = usedSlots + this.items[x].critSlots - this.items[x].heatsinkslots;
                if ( this.items[x].type == "xl"){
                    usedSlots -= 6;
                }
            } else if (this.items[x].type != "internal"){
                usedSlots = usedSlots + this.items[x].critSlots;
            }
        }
        for (var x = 0; x < this.engineHeatSinksItems.length; x++) {
            var itemObj = this.engineHeatSinksItems[x].data('itemObj');
            usedSlots += itemObj.critSlots;
        }
        return this.critSlots - usedSlots;
    };

    this.getEquivalentHeatSinks = function getEquivalentHeatSinks(isDualHeatSink){
        var heatsinks = 0;
        for (var x = 0; x < this.items.length; x++) {
            if (this.items[x].type == "heatsink"){
                heatsinks += isDualHeatSink ? 1.4 : 1;
            }
            // add heatsinks from the engine
            if (this.items[x].hardpointType == "engine"){
                heatsinks += ( isDualHeatSink ? 2 : 1 ) * (  10 + ((this.items[x].heatsinkslots < 0) ? this.items[x].heatsinkslots : 0 ) );
            }
        }
        return heatsinks;
    };

    this.init();
}
