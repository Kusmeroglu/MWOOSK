var mechObj;
var mechXML;
var itemXML;
var urldata = getURLParamObject();
var limbList = ['leftArm', 'leftTorso','centerTorso','rightTorso','rightArm','leftLeg','rightLeg','head'];
var classLookup = {
    1:'critOne',
    2:'critTwo',
    3:'critThree',
    4:'critFour',
    5:'critFive',
    6:'critSix',
    7:'critSeven',
    8:'critEight',
    9:'critNine',
    10:'critTen'
};

var ECMID = "IGE";

var settings = {
			showArrows: true,
			autoReinitialise: true,
			autoReinitializeDelay: 500}

$(function () {

	$('#reset').click(function(){
		window.location.href = "index.html";
	});

    function createItemDivFromData(data){
        var itemObj = data["itemObj"];
        var div = $("<div></div>")
            .attr("class", "item critThree " + itemObj.type + " " + itemObj.id)
            // store all the weapon information in this div
            .data({'itemObj':itemObj, rosechartdata:itemObj.rosechartdata})
            .disableSelection()
            .text(itemObj.itemName);
        if( itemObj.rosechartdata && itemObj.rosechartdata.length ){
            div.hover(
                function(){
                    updateRoseChartData($(this).data("itemObj")["rosechartdata"], $(this).data("itemObj")['itemName']);
                },
                function(){
                    resetRoseChartData("-N/A-");
                })
        }
        return div;
    }

    function parseItemXML(xml){
        $(xml).find("weapons > item").each(function () {
            var itemObj = new item($(this).attr("id"), $(this).text(), $(this).attr("slots"), $(this).attr("tons"), "weapon", $(this).attr("type"));
            itemObj.damage = parseFloat($(this).attr("damage"));
            itemObj.heat = parseFloat($(this).attr("heat"));
            itemObj.cooldown = parseFloat($(this).attr("cooldown"));
            itemObj.maxRange = parseFloat($(this).attr("maxrange"));
            itemObj.dpsmax = parseFloat($(this).attr("dpsmax"));
            itemObj.hps = parseFloat($(this).attr("hps"));
            itemObj.ammoper = parseFloat($(this).attr("ammoper"));
            itemObj.ehs = parseFloat($(this).attr("ehs"));
            itemObj.rosechartdata = [
                { name:"Damage",   value:$(this).attr("damage")},
                { name:"Heat",     value:$(this).attr("heat")},
                { name:"HPS",      value:(Number($(this).attr("heat")) == 0)?"0":(Number($(this).attr("damage"))/Number($(this).attr("heat"))).toFixed(2)},
                { name:"Weight",   value:$(this).attr("tons")},
                { name:"Slots",    value:$(this).attr("slots")},
                { name:"Cooldown", value:$(this).attr("cooldown")},
                { name:"DPS",      value:$(this).attr("dpsmax")},
                //{ name:"Ammo/Ton", value:$(this).attr("ammoper")?$(this).attr("ammoper"):0},
                { name:"Range",    value:$(this).attr("maxrange")}
            ];
			itemObj.type = $(this).attr("type");
            $("#"+itemObj.type+"Weapon").append(createItemDivFromData({itemObj: itemObj}));
        });
        $(xml).find("ammos > item").each(function () {
            var itemObj = new item($(this).attr("id"), $(this).text(), $(this).attr("slots"), $(this).attr("tons"), $(this).attr("type"));
            //$("#ballisticAmmo").append(createItemDivFromData({itemObj: itemObj}));
			itemObj.type = $(this).attr("type");
            $("#"+itemObj.type+"Ammo").append(createItemDivFromData({itemObj: itemObj}));
        });
        $(xml).find("internals > item").each(function () {
            var itemObj = new item($(this).attr("id"), $(this).text(), $(this).attr("slots"), $(this).attr("tons"), $(this).attr("type"), $(this).attr("hardpoint"));
            if ( $(this).attr("minTons") ){
                itemObj.mintonnage = parseInt( $(this).attr("minTons") );
            }
            if ( $(this).attr("maxTons") ){
                itemObj.maxtonnage = parseInt( $(this).attr("maxTons") );
            }
            $("#internals").append(createItemDivFromData({itemObj: itemObj}));
        });

        $(xml).find("engines > plant").each(function () {
            var itemObj = new item($(this).attr("id"), $(this).text(), parseInt($(this).attr("slots")), $(this).attr("tons"), $(this).attr("type"), "engine");
            itemObj.heatsinkslots = parseInt($(this).attr("heatsinkslots"));
            itemObj.rosechartdata = [];
			itemObj.type = $(this).attr("type");
            itemObj.engineSize = $(this).attr("size");
            $("#"+itemObj.type+"Engine").append(createItemDivFromData({itemObj: itemObj}));
        });

        $("#detailContainer div").find('.item').draggable({
            revert: "invalid",
            helper: "clone",
            appendTo: 'body',
            snap: ".area",
            snapMode: "inner"
        });
    }

    function parseMechXML(xml){
        mechXML.find("class").each(function () {
            $("#mechClass").append($("<option></option>").attr("value",$(this).attr("type")).text($(this).attr("type")));
            $("#mechClassDiv").append($("<div class='selectItem' id='"+$(this).attr("type")+"'>"+$(this).attr("type")+"</div>"));
        });
        $("#mechClassDiv").children(".selectItem").click(function(event) {
            if ($($(this).parent()).hasClass('active')){
                event.stopPropagation();
                var selectItem = $(this).attr('id');
                $($(this).parent()).find("select").attr("value", selectItem);
                $($(this).parent()).find("select").change();
                $(this).parent().removeClass("active");
                $(this).show(); // force a show, incase this was triggered programmatically
                $(this).siblings(".selectItem").hide();
                $(this).siblings("#classBlank").hide();
                $(this).siblings(".selectItem, #variantBlank").removeClass('selected');
                $(this).addClass('selected');
            } else { // falls to this case if the pulldown is set to a value and clicked on again.
                $(this).removeClass('selected');
            }
        });

        // make the secondary pull down go
        $("#mechClass").on("change", function (event) {
            var selectedClass = $("#mechClass").val();
            $("#mechChassis").empty().append($("<option></option>").attr("value", "0").attr('id','chassisBlank').text("Select mech name..."));
            $("#mechChassisDiv .selectBlank, #mechChassisDiv .selectItem").remove();
            $("#mechChassisDiv").append($("<div class='selectBlank selected' id='chassisBlank'>Select mech Chassis...</div>"));
            $("#mechVariant").empty().append($("<option></option>").attr("value", "0").attr('id','variantBlank').text("Select Mech Variant..."));
            $("#mechVariantDiv .selectBlank, #mechVariantDiv .selectItem").remove();
            $("#mechVariantDiv").append($("<div class='selectBlank selected' id='variantBlank'>Select mech Variant...</div>"));
            mechXML.find('class[type="' + selectedClass + '"] > mech').each(function () {
                $("#mechChassis").append($("<option></option>").attr("value", $(this).attr("type")).text($(this).attr("type")));
                $("#mechChassisDiv").append($("<div class='selectItem' id='"+$(this).attr("type")+"'>"+$(this).attr("type")+"</div>"));
            });
            $("#mechChassisDiv").children(".selectItem").click(function(event) {
                if ($(this).parent().hasClass('active')){
                    event.stopPropagation();
                    var selectItem = $(this).attr('id');
                    $("#mechChassis").attr("value", selectItem);
                    $("#mechChassis").change();
                    $(this).parent().removeClass("active");
                    $(this).show(); // force a show, incase this was triggered programmatically
                    $(this).siblings(".selectItem").hide();
                    $(this).siblings("#chassisBlank").hide();
                    $(this).siblings(".selectItem, #variantBlank").removeClass('selected');
                    $(this).addClass('selected');
                } else { // falls to this case if the pulldown is set to a value and clicked on again.
                    $(this).removeClass('selected');
                }
            });
        });

        // make the tertiary pull down go
        $("#mechChassis").on("change", function (event) {
            var selectedChassis = $("#mechChassis").val();
            $("#mechVariant").empty().append($("<option></option>").attr("value", "0").attr('id','variantBlank').text("Select mech variant..."));
            $("#mechVariantDiv .selectBlank, #mechVariantDiv .selectItem").remove();
            $("#mechVariantDiv").append($("<div class='selectBlank selected' id='variantBlank'>Select mech Variant...</div>"));
            mechXML.find('class > mech[type="' + selectedChassis + '"] > variant').each(function () {
                $("#mechVariant").append($("<option></option>").attr("value", $(this).attr("name").replace(" ","_")).text($(this).attr("name").replace(" ","_")));
                $("#mechVariantDiv").append($("<div class='selectItem' id='"+$(this).attr("name").replace(" ","_")+"'>"+$(this).attr("name")+"</div>"));
            });
            $("#mechVariantDiv").children(".selectItem").click(function(event) {
                if ($(this).parent().hasClass('active')){
                    event.stopPropagation();
                    var selectItem = $(this).attr('id');
                    $("#mechVariant").attr("value", selectItem);
                    $("#mechVariant").change();
                    $(this).parent().removeClass("active");
                    $(this).show(); // force a show, incase this was triggered programmatically
                    $(this).siblings(".selectItem").hide();
                    $(this).siblings("#variantBlank").hide();
                    $(this).siblings(".selectItem, #variantBlank").removeClass('selected');
                    $(this).addClass('selected');
                } else { // falls to this case if the pulldown is set to a value and clicked on again.
                    $(this).removeClass('selected');
                }
                // lock selects
                $("#mechClassDiv").unbind('click');
                $("#mechClassDiv").addClass('inactive');
                $("#mechClassDiv").children(".selectItem").unbind('click');
                $("#mechChassisDiv").unbind('click');
                $("#mechChassisDiv").addClass('inactive');
                $("#mechChassisDiv").children(".selectItem").unbind('click');
                $("#mechVariantDiv").addClass('inactive');
                $("#mechVariantDiv").unbind('click');
                $("#mechVariantDiv").children(".selectItem").unbind('click');
            });
        });

        $("#mechVariant").on("change", function (event) {
            if ($("#mechVariant").val() == "0"){
                return;
            }
            mechXML.find('mech[type="' + $("#mechChassis").val() + '"]').each(function () {
                mechObj = new mech($("#mechChassis").val(), $("#mechVariant").val().replace(" ", "_"), parseFloat($(this).attr("tonnage")));
                mechObj.currentTons = mechObj.chassisTons = parseFloat($(this).attr("chassis"));
            });
            mechXML.find('mech[type="' + mechObj.chassis + '"] variant[name="' + mechObj.variant.replace("_"," ") + '"]').each(function () {
                mechObj.ecm = Boolean($(this).attr("ecm") == "yes");
                mechObj.jumpjets = parseInt($(this).attr("jets")) > 0;
                mechObj.jumpjetmax = parseInt($(this).attr("jets"));
                mechObj.minEngineSize = parseInt($(this).attr("minengine"));
                mechObj.maxEngineSize = parseInt($(this).attr("maxengine"));
            });

            // weights are added to chart when limbs created.
            createChart("#weightChart", mechObj.maxTons, mechObj.chassisTons, mechObj.currentTons);

            // add all the limbs.
            mechXML.find('mech[type="' + mechObj.chassis + '"] variant[name="' + mechObj.variant.replace("_"," ") + '"] > limbs > limb').each(function () {
                var limbObj = new limb($(this).attr("name"), $(this).attr("crits"), parseInt($(this).attr("maxArmor")));
                mechObj.addLimb(limbObj.limbName, limbObj);
                // set initial armor for mech
                mechObj.setArmorForLimb(limbObj.limbName, parseInt($(this).attr("armorFront")), parseInt($(this).attr("armorRear")));
                // find the hardpoints
                $(this).find('hardpoint').each(function(){
                    var hardPointObj = new hardPoint($(this).attr('type'));
                    limbObj.addHardPoint(hardPointObj);
                });
                // handle the internals
                $(this).find('internal').each(function(){
                    limbObj.addItem(new item('', $(this).text(), $(this).attr('slots'), 0, 'internal', ''));
                });
                // init everything else.
                limbObj.initVisuals();
            });

            /*
                 Filtering out all the items that don't belong on this mech (with no upgrades)
             */
            // default to single HS and non-artemis
            mechObj.removeDualHeatSinks();
            mechObj.removeArtemis();
            // filter out jumpjets
            if (mechObj.jumpjets){
                $("#internals .jumpjet").filter(function(){
                    var itemObj = $(this).data('itemObj');
                    if ((mechObj.maxTons < itemObj.mintonnage) || (mechObj.maxTons > itemObj.maxtonnage)){
                        return true; // hide this object
                    } else {
                        return false;
                    }
                }).remove();
            } else {
                $("#internals .jumpjet").remove();
            }
            // filter ecm
            if (! mechObj.ecm){
                $("#internals ."+ECMID).remove();
            }
            //filter engines
            if (mechObj.minEngineSize && mechObj.maxEngineSize){
                $("#engines .item").filter(function(){
                    var itemObj = $(this).data('itemObj');
                    if ((mechObj.minEngineSize > itemObj.engineSize) || (mechObj.maxEngineSize < itemObj.engineSize)){
                        return true; // hide this object
                    } else {
                        return false;
                    }
                }).remove();
            }

            //check for info in URLs
            if (urldata.hasOwnProperty('variant')){
                // check for upgrades
                if (urldata.hasOwnProperty('endo') && urldata['endo'] == "true"){
                    if (mechObj.addEndoSteel() ){
                        $("#endoCheckbox").prop("checked", true);
                    }
                }
                if (urldata.hasOwnProperty('ferro') && urldata['ferro'] == "true"){
                    if (mechObj.addFerroFibrous()){
                        $("#ferroCheckbox").prop("checked", true);
                    }
                }
                if (urldata.hasOwnProperty('dhs') && urldata['dhs'] == "true"){
                    if (mechObj.addDualHeatSinks()){
                        $("#dhsCheckbox").prop("checked", true);
                    }
                }
                if (urldata.hasOwnProperty('artemis') && urldata['artemis'] == "true"){
                    if (mechObj.addArtemis()){
                        $("#artemisCheckbox").prop("checked", true);
                    }
                }
            }

            $("#mechBay").fadeIn('fast', function() {
                createRoseGraph("#roseChart", "-N/A-");

                // (have to wait until we have graphs and items created.)
                if (urldata.hasOwnProperty('variant')){
                    // check for limbs data and load each, 4 letter code by 4 letter code.
                    limbList.forEach(function(limb){
                        if (urldata.hasOwnProperty(limb)){
                            var rawitems = urldata[limb];
                            var limbelem = $('#'+limb);
                            var i = 0;
                            while(i < rawitems.length)
                            {
                                var thisitemid = rawitems.substr(i, 4);
                                var thisitemelem = $('#detailContainer .'+thisitemid); // pull the data out of the dom element with the matching itemid (which is actually a class)
                                if ( thisitemelem ){ // if we found it
                                    var thisitemObj = jQuery.extend(true, {}, thisitemelem.data('itemObj'));// get copy of old data
                                    mechObj.addItemToLimb($(limbelem).attr('id'), thisitemObj);
                                }
                                i += 4;
                            }
                        }
                    });
                    // check for armor values in the url and load
                    if (urldata.hasOwnProperty('armor')){
                        var armorvalues = urldata['armor'];
                        armorvalues.split(',').forEach( function(bothvalues, i){
                            var limbName = limbList[i];
                            $('#'+limbName+' .armorspinner.front').attr('value', parseInt(bothvalues.split("-")[0]));
                            $('#'+limbName+' .armorspinner.rear').spinner('value', parseInt(bothvalues.split("-")[1]));
                        }, this);
                    }
                }
            });
        });

        //check for info in URLs - simulate selecting the variant
        if (urldata.hasOwnProperty('variant')){
            var mechVariant = urldata['variant'];
            // we have data to load
            mechXML.find('mech variant[name="' + mechVariant.replace("_"," ") + '"]').each(function () {
                //select the fake selects to trigger real select and set the visuals up correctly
                var mechClass = $(this).parents('class').attr('type').toString();
                $("#mechClassDiv #"+mechClass).parent().addClass('active');
                $("#mechClassDiv #"+mechClass).click();
                var mechChassis = $(this).parents('mech').attr('type').toString();
                $("#mechChassisDiv #"+mechChassis).parent().addClass('active');
                $("#mechChassisDiv #"+mechChassis).click();
            });
            $("#mechVariantDiv #"+mechVariant).parent().addClass('active');
            $("#mechVariantDiv #"+mechVariant).click();
        }
    }

    /*
     SET UP event handlers on all the basic elements
     */
    // making the fake select boxes work
    $("#mechClassDiv").click(function() {
        $(this).children('.selectItem').show();
        $(this).children('#classBlank').show();
        $(this).addClass('active');
    });
    $("#mechChassisDiv").click(function() {
        $(this).children('.selectItem').show();
        $(this).children('#chassisBlank').show();
        $(this).addClass('active');
    });
    $("#mechVariantDiv").click(function() {
        $(this).children('.selectItem').show();
        $(this).children('#variantBlank').show();
        $(this).addClass('active');
    });

    // This allows you to click outside of the fake-div-dropbox to close it
    $(document).mouseup(function (e){
        var container = $(".selectBox");
        if (container.has(e.target).length === 0)
        {
            container.children(".selectItem").not('.selected').hide();
        }
    });

    // set the background to be droppable too, so we can 'drag off' to delete
    $("body").droppable({
        drop: function(event, ui) {
            // phantom dropped elements sometimes appear here, even though
            var data = $(ui.draggable).data();
            if ( ! data['itemObj']){
                return false;
            }
            mechObj.removeItemFromLimb($(ui.draggable).parents(".area").attr('id'), data['itemObj']);
            $(ui.draggable).remove(); // sometimes limb.removeItem doesn't appear to work..?
            // hack for the activeClass on the limbs not clearing itself in this case:
            $('.valid').removeClass('valid'); // todo: get to the bottom of this
        },
        accept: '.critItem'
    });

    // set the limb areas to be droppables
    $(".area").droppable({
        greedy: true,
        // use the same check for the accept attribute so we can show valid targets
        accept: function (ui) {
            var itemObj = ui.data('itemObj');
            if (! itemObj ){
                return false;
            }
            if (! mechObj.limbs[this.id] ){
                return false; //bail - sometimes the xml is missing limbs, otherwise this shouldn't happen.
            }
            // don't allow dragging to same limb item is already on
            if ( ui.parents(".area").attr('id') == $(this).attr('id') ){
                return false;
            }
            return mechObj.testIfValid(this.id, itemObj);
        },
        activeClass: "valid",
        drop: function (event, ui) {
            //get from original item - ignore cloned item which was not a deep clone and doesn't have the data.
            var data = $(ui.draggable).data();
            // check if dragged from another limb
            if ($(ui.draggable).parents(".area").length > 0){
                mechObj.removeItemFromLimb($(ui.draggable).parents(".area").attr('id'), data['itemObj']);
                $(ui.draggable).remove(); // sometimes limb.removeItem doesn't appear to work..?
            }
            mechObj.addItemToLimb($(this).attr('id'), jQuery.extend(true, {}, data['itemObj']));
            // hack for the activeClass on the limbs not clearing itself in this case:
            $('.valid').removeClass('valid'); // todo: get to the bottom of this
            return false;
        }
    }).disableSelection();

    /*
       --- Upgrade Checkboxes -----
     */

    $("#endoCheckbox").change( function(){
        if ($('#endoCheckbox').is(':checked') ){
            if (! mechObj.addEndoSteel()){
                $("#endoCheckbox").prop("checked", false);
                alert("Not enough free critical slots to add Endo Steel.");
            }
        } else {
            if (! mechObj.removeEndoSteel()){
                $("#endoCheckbox").prop("checked", true);
                alert("Not enough free weight to remove Endo Steel.");
            }
        }
    });

    $("#ferroCheckbox").change( function(){
        if ($('#ferroCheckbox').is(':checked') ){
            if ( ! mechObj.addFerroFibrous()){
                $("#ferroCheckbox").prop("checked", false);
                alert("Not enough free critical slots to add Ferro Fibrous.");
            }
        } else {
            if ( ! mechObj.removeFerroFibrous()){
                $("#ferroCheckbox").prop("checked", true);
                alert("Not enough free weight to remove Ferro Fibrous.");
            }
        }
    });

    $("#dhsCheckbox").change( function(){
        if ($('#dhsCheckbox').is(':checked') ){
            if ( ! mechObj.addDualHeatSinks()){
                $("#dhsCheckbox").prop("checked", false);
                alert("Could not add DHS.");
            }
        } else {
            if ( ! mechObj.removeDualHeatSinks()){
                $("#dhsCheckbox").prop("checked", true);
                alert("Could not remove DHS.");
            }
        }
    });

    $("#artemisCheckbox").change( function(){
        if ($('#artemisCheckbox').is(':checked') ){
            if ( ! mechObj.addArtemis()){
                $("#artemisCheckbox").prop("checked", false);
                alert("Could not add Artemis.");
            }
        } else {
            if ( ! mechObj.removeArtemis()){
                $("#artemisCheckbox").prop("checked", true);
                alert("Could not remove Artemis.");
            }
        }
    });

    /*
       --- Clear Armor/Items, Max Armor
     */

    $('#clearArmor').on('click', function(e){
        limbList.forEach(function(limbName){
            $('#'+limbName+' .armorspinner.front').attr('value', 0);
            $('#'+limbName+' .armorspinner.rear').attr('value', 0);
        });
    });
    $('#maxArmor').on('click', function(e){
        limbList.forEach(function(limbName){
            var maxarmor = mechObj.limbs[limbName].maxArmor;
            if ( $('#'+limbName+' .armorspinner.rear').length ){
                var armor = Math.round(maxarmor * .6);
                $('#'+limbName+' .armorspinner.rear').attr('value', maxarmor - armor);
            } else {
                var armor = maxarmor;
            }
            $('#'+limbName+' .armorspinner.front').attr('value', armor);
        });
    });

    $('#clearItems').on('click', function(e){
        limbList.forEach(function(limbName){
            var removelist = [];
            for (var x = 0; x < mechObj.limbs[limbName].items.length; x++) {
                if (mechObj.limbs[limbName].items[x].type != "internal"){
                    removelist.push(mechObj.limbs[limbName].items[x]);
                }
            }
            removelist.forEach(function(item){
                mechObj.removeItemFromLimb(limbName, item);
            });
        });
    });


    $('#tinyurlLink').on('click', function(e){
        e.preventDefault();
        makeTinyUrl(window.location.href);
        return false;
    });

    function makeTinyUrl(url)
    {
        //var apiKey = "AIzaSyBwChgwfU1FgX9dXWr7UJL7cpClk53T8mI";
        //gapi.client.setApiKey(apiKey);

        gapi.client.load('urlshortener', 'v1', function() {
            var request = gapi.client.urlshortener.url.insert({
                'resource': {
                    'longUrl': url
                }
            });
            var resp = request.execute(function(resp) {
                if (resp.error) {
                    console.log("error: " + resp.error.message);
                    var tinyurl = data.id;
                    $('#tinyurlLink').hide();
                    $('#tinyurlLink').insertAfter($("<div id='tinyurlResult'>"+resp.error.message+"</div>"));
                } else {
                    var tinyurl = resp.id;
                    console.log("tiny: " + tinyurl);
                    $('#tinyurlLink').hide();
                    $('#tinyurlLink').after($("<div id='tinyurlResult'>"+tinyurl+"</a>"));
                }
            });
        });
    }
	/*
	----     All the Crazy Menu Visibility Toggling     ----
	*/
	
	// Initiallizing the Scroll Bars to show up dynamically
	$(function(){
	
	// Generic button style toggling.  Purely Cosmetic.
	$('.toggleButton').click(function(){
		if ($(this).parent().hasClass('buttonWrapper')){
			$(this).siblings('.toggleButton').removeClass('activeButton');
			$(this).addClass('activeButton');
			}
	});
	
	// Show Ballistic List
	$('#ballisticButton').click(function(){
		$('#ballisticList').show();
		$('#energyList').hide();
		$('#missileList').hide();
	});
	
	// Show Energy List
	$('#energyButton').click(function(){
		$('#ballisticList').hide();
		$('#energyList').show();
		$('#missileList').hide();
		$('#energyWeapon').jScrollPane(settings);
	});
	
	// Show Missile List
	$('#missileButton').click(function(){
		$('#ballisticList').hide();
		$('#energyList').hide();
		$('#missileList').show();
		$('#missileWeapon').jScrollPane(settings);
		$('#missileAmmo').jScrollPane(settings);
	});
	
	// Ballistic Sublist Toggles
	$('#ballisticAButton').click(function(){
		$('#ballisticWeapon').hide();
		$('#ballisticAmmo').show().jScrollPane(settings);
	});
	$('#ballisticWButton').click(function(){
		$('#ballisticWeapon').show().jScrollPane(settings);
		$('#ballisticAmmo').hide();
	});
	
	// Missile Sublist Toggles
	$('#missileAButton').click(function(){
		$('#missileWeapon').hide();
		$('#missileAmmo').show();
	});
	$('#missileWButton').click(function(){
		$('#missileWeapon').show();
		$('#missileAmmo').hide();
	});
	
	// Show Utility List
	$('#internalsButton').click(function(){
		$('#internals').show();
		$('#engines').hide();
		$('#upgrades').hide();
	});
	// Show Engine List
	$('#enginesButton').click(function(){
		$('#internals').hide();
		$('#engines').show();
		$('#upgrades').hide();
		$('#stdEngine').jScrollPane(settings);
		$('#xlEngine').jScrollPane(settings);
	});
	// Show Upgrade List
	$('#upgradesButton').click(function(){
		$('#internals').hide();
		$('#engines').hide();
		$('#upgrades').show();
	});
	// Engine Sublist Toggles
	$('#stdEngineButton').click(function(){
		$('#stdEngine').show();
		$('#xlEngine').hide();
	});
	$('#xlEngineButton').click(function(){
		$('#stdEngine').hide();
		$('#xlEngine').show();
	});
	// Activate Armament Tab
	$('#armamentTab').parent('.tabWrapper').click(function(){
		$('#armament').show();
		$('#utilities').hide();
		$('#piloting').hide();
		$('statistics').hide();
		$('#comments').hide();
	});
	// Activate Utility Tab
	$('#utilityTab').parent('.tabWrapper').click(function(){
		$('#armament').hide();
		$('#utilities').show();
		$('#piloting').hide();
		$('statistics').hide();
		$('#comments').hide();
		$('#internals').jScrollPane(settings);
	});
	// Activate Pilot Tab
	$('#pilotingTab').parent('.tabWrapper').click(function(){
		$('#armament').hide();
		$('#utilities').hide();
		$('#piloting').show();
		$('statistics').hide();
		$('#comments').hide();
	});
	// Activate Stats Tab
	$('#statisticsTab').parent('.tabWrapper').click(function(){
		$('#armament').hide();
		$('#utilities').hide();
		$('#piloting').hide();
		$('statistics').show();
		$('#comments').hide();
	});
	$('#commentsTab').parent('.tabWrapper').click(function(){
		$('#armament').hide();
		$('#utilities').hide();
		$('#piloting').hide();
		$('statistics').hide();
		$('#comments').show();
	});
	});


    /*
     START UP - on initial loadup, get the xml, populate the screen
     */

    // load the item list
    $.get('data/items.xml', function (xml) {
        itemXML = xml;
        parseItemXML(xml);

        // now load XML just the once.
        $.get('data/mechs.xml', function (xml){
            mechXML = $(xml);
            parseMechXML(xml);
        });
    });

});