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

$(function () {

    function createItemDivFromData(data){
        var itemObj = data["itemObj"];
        var div = $("<div></div>")
            .attr("class", "item critThree " + itemObj.hardpointType + " " + itemObj.id)
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
			var itemType = $(this).attr("type");
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
            $("#"+itemType+"List").append(createItemDivFromData({itemObj: itemObj}));
        });
        $(xml).find("ammos > item").each(function () {
            var itemObj = new item($(this).attr("id"), $(this).text(), $(this).attr("slots"), $(this).attr("tons"), $(this).attr("type"), "");
            $("#armament").append(createItemDivFromData({itemObj: itemObj}));
        });
        $(xml).find("internals > item").each(function () {
            var itemObj = new item($(this).attr("id"), $(this).text(), $(this).attr("slots"), $(this).attr("tons"), $(this).attr("type"), "");
            $("#utilities").append(createItemDivFromData({itemObj: itemObj}));
        });

        $(xml).find("engines > plant").each(function () {
            var itemObj = new item($(this).attr("id"), $(this).text(), parseInt($(this).attr("slots")) - parseInt($(this).attr("heatsinkslots")), $(this).attr("tons"), $(this).attr("type"), "engine");
            itemObj.heatsinkslots = parseInt($(this).attr("heatsinkslots"));
            itemObj.rosechartdata = [];
            $("#utilities").append(createItemDivFromData({itemObj: itemObj}));
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
                $("#mechVariant").append($("<option></option>").attr("value", $(this).attr("name")).text($(this).attr("name")));
                $("#mechVariantDiv").append($("<div class='selectItem' id='"+$(this).attr("name")+"'>"+$(this).attr("name")+"</div>"));
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
                mechObj = new mech($("#mechChassis").val(), $("#mechVariant").val(), parseFloat($(this).attr("tonnage")));
                mechObj.currentTons = mechObj.chassisTons = parseFloat($(this).attr("chassis"));
            });
            mechXML.find('mech[type="' + mechObj.chassis + '"] variant[name="' + mechObj.variant + '"]').each(function () {
                mechObj.ecm = Boolean($(this).attr("ecm") == "yes");
                mechObj.jumpjets = Boolean($(this).attr("jets") == "yes");
                mechObj.maxEngineSize = parseInt($(this).attr("maxengine"));
            });

            // weights are added to chart when limbs created.
            createChart("#weightChart", mechObj.maxTons, mechObj.chassisTons, mechObj.currentTons);
            // add all the limbs.
            mechXML.find('mech[type="' + mechObj.chassis + '"] variant[name="' + mechObj.variant + '"] > limbs > limb').each(function () {
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

            $("#mechContainer").fadeIn('fast', function() {
                $("#itemList").fadeIn('fast');
                createRoseGraph("#roseChart", "-N/A-");
                mechObj.removeDualHeatSinks();
                mechObj.removeArtemis();

                //check for info in URLs
                // (have to wait until we have graphs and items created.)
                if (urldata.hasOwnProperty('variant')){
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
                    limbList.forEach(function(limb){
                        if (urldata.hasOwnProperty(limb)){
                            var rawitems = urldata[limb];
                            var limbelem = $('#'+limb);
                            var i = 0;
                            while(i < rawitems.length)
                            {
                                var thisitemid = rawitems.substr(i, 3);
                                var thisitemelem = $('#itemList .'+thisitemid);
                                var thisitemObj = jQuery.extend(true, {}, thisitemelem.data('itemObj'));// get copy of old data
                                mechObj.addItemToLimb($(limbelem).attr('id'), thisitemObj);

                                i += 3;
                            }
                        }
                    })
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
            mechXML.find('mech variant[name="' + mechVariant + '"]').each(function () {
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
            $('.valid').removeClass('valid');
        },
        accept: '.critItem'
    })

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
            $('.valid').removeClass('valid');
            return false;
        }
    }).disableSelection();

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


    $('#tinyurllink').on('click', function(e){
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
                    $('#tinyurllink').hide();
                    $('#tinyurllink').insertAfter($("<div id='tinyurlresult'>"+resp.error.message+"</div>"));
                } else {
                    var tinyurl = resp.id;
                    console.log("tiny: " + tinyurl);
                    $('#tinyurllink').hide();
                    $('#tinyurllink').after($("<a id='tinyurlresult' href='"+tinyurl+"'>"+tinyurl+"</a>"));
                }
            });
        });
    }


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