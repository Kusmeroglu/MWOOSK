var mechObj;
var mechXML;
var itemXML;
var urldata = getURLParamObject();


$(function () {

    function createItemDivFromData(data){
        return $("<div></div>")
            .attr("class", "item " + data["type"] + " " + data["id"])
            // store all the weapon information in this div
            .data(data)
            .hover(
            function(){
                updateRoseChartData($(this).data("rosechartdata"), $(this).data("name"));
            },
            function(){
                resetRoseChartData("-N/A-");
            })
            .disableSelection()
            .text(data['name']);
    }

    function parseItemXML(xml){
        $(xml).find("weapons > item").each(function () {
            var itemdata = {
                id:$(this).attr("id"),
                type:$(this).attr("type"),
                damage:$(this).attr("damage"),
                heat:$(this).attr("heat"),
                cooldown:$(this).attr("cooldown"),
                range:$(this).attr("range"),
                maxrange:$(this).attr("maxrange"),
                slots:$(this).attr("slots"),
                tons:$(this).attr("tons"),
                dpsmax:$(this).attr("dpsmax"),
                ammoper:$(this).attr("ammoper"),
                hps:$(this).attr("hps"),
                ehs:$(this).attr("ehs"),
                name:$(this).text(),
                itemObj: new item($(this).attr("id"), $(this).text(), $(this).attr("slots"), $(this).attr("tons"), $(this).attr("type")),
                rosechartdata:[
                    { name:"Damage",   value:$(this).attr("damage")},
                    { name:"Heat",     value:$(this).attr("heat")},
                    { name:"HPS",      value:(Number($(this).attr("heat")) == 0)?"0":(Number($(this).attr("damage"))/Number($(this).attr("heat"))).toFixed(2)},
                    { name:"Weight",   value:$(this).attr("tons")},
                    { name:"Slots",    value:$(this).attr("slots")},
                    { name:"Cooldown", value:$(this).attr("cooldown")},
                    { name:"DPS",      value:$(this).attr("dpsmax")},
                    //{ name:"Ammo/Ton", value:$(this).attr("ammoper")?$(this).attr("ammoper"):0},
                    { name:"Range",    value:$(this).attr("maxrange")}
                ]
            };
            $("#itemList").append(createItemDivFromData(itemdata));
        });
        $("#itemList div").draggable({
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
            // weights are added to chart when limbs created.
            createChart("#weightChart", mechObj.maxTons, mechObj.chassisTons, mechObj.currentTons);
            // add all the limbs.
            mechXML.find('mech[type="' + mechObj.chassis + '"] variant[name="' + mechObj.variant + '"] > limbs > limb').each(function () {
                var limbObj = new limb($(this).attr("name"), $(this).attr("crits"), parseInt($(this).attr("maxArmor")));
                mechObj.addLimb(limbObj.limbName, limbObj);
                // set initial armor for mech
                mechObj.setArmorForLimb(limbObj.limbName, parseInt($(this).attr("armorFront")), parseInt($(this).attr("armorRear")));
                // set url parameter
                setURLParameter(limbObj.limbName, "");
                // find and display the hardpoints
                $(this).find('hardpoint').each(function(){
                    var hardPointObj = new hardPoint($(this).attr('type'));
                    limbObj.addHardPoint(hardPointObj);
                });
                ['ballistic', 'energy', 'missile', 'ams'].forEach(function(hardpointtype){
                    var max = limbObj.getTotalHardpointsForType(hardpointtype)
                    if ( max > 0 ){
                        $('#'+limbObj.limbName+' .hardpoints').append($("<div></div>").addClass('hardpoint').text("("+hardpointtype[0]+") " + max));
                    }
                })
                // Build Armor Spinners
                var onSpinnerChange = function(e, ui){
                    var frontspinner = $('#'+limbObj.limbName+' .armorspinner.front');
                    var rearspinner = $('#'+limbObj.limbName+' .armorspinner.rear');
                    var frontvalue = frontspinner.spinner("value");
                    var rearvalue = 0;
                    if ( rearspinner.length ){ // logic for the shared armor pool
                        rearvalue = rearspinner.spinner("value");
                        frontspinner.spinner("option","max",limbObj.maxArmor - rearvalue);
                        rearspinner.spinner("option", "max",limbObj.maxArmor - frontvalue);
                    }
                    mechObj.setArmorForLimb(limbObj.limbName, frontvalue, rearvalue);
                };
                var checkMaxArmor = function(e, ui){
                    var frontvalue = $('#'+limbObj.limbName+' .armorspinner.front').spinner("value");
                    var rearspinner = $('#'+limbObj.limbName+' .armorspinner.rear');
                    var rearvalue = 0;
                    if ( rearspinner.length ){ // logic for the shared armor pool
                        rearvalue = rearspinner.spinner("value");
                    }
                    return (e.target.value > ui.value) || ((frontvalue + rearvalue) < limbObj.maxArmor) && ((mechObj.currentTons + mechObj.armorWeight) < mechObj.maxTons);
                }
                $('#'+limbObj.limbName+' .armorspinner.front').attr('value', limbObj.frontArmor);
                $('#'+limbObj.limbName+' .armorspinner.rear').attr('value', limbObj.rearArmor);
                $('#'+limbObj.limbName+' .maxarmor').text("/" + limbObj.maxArmor);
                var spinner = $('#'+limbObj.limbName+' .armorspinner').spinner({
                    min: 0,
                    max: limbObj.maxArmor,
                    change: onSpinnerChange,
                    stop: onSpinnerChange,
                    spin: checkMaxArmor
                });
            });

            $("#mechContainer").fadeIn('fast', function() {
                $("#itemList").fadeIn('fast');
                createRoseGraph("#roseChart", "-N/A-");
                //check for info in URLs
                // (have to wait until we have graphs created.)
                if (urldata.hasOwnProperty('variant')){
                    ['leftArm', 'leftTorso','centerTorso','rightTorso','rightArm','leftLeg','rightLeg','head'].forEach(function(limb){
                        if (urldata.hasOwnProperty(limb)){
                            var rawitems = urldata[limb];
                            var limbelem = $('#'+limb);
                            var i = 0;
                            while(i < rawitems.length)
                            {
                                var thisitemid = rawitems.substr(i, 2);
                                var thisitemelem = $('#itemList .'+thisitemid);
                                var thisdata = jQuery.extend(true, {}, thisitemelem.data());// get copy of old data
                                mechObj.addItemToLimb(limb, thisdata.itemObj);
                                addItem(createItemDivFromData(thisdata), limbelem);
                                i += 2;
                            }
                        }
                    })
                }

            });
        });

        //check for info in URLs
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

    function addItem($item, $target) {
        $item
            .append('<div class="close">X</div>')
            .appendTo($target)
            .fadeIn();
        // This does not work. I have no idea why not..
        /*
         $($item).draggable({
         revert: false,
         appendTo: 'body',
         snap: ".area",
         snapMode: "inner"
         });
         */
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

    $(".area").droppable({
        // use the same check for the accept attribute so we can show valid targets
        accept: function (ui) {
            var itemObj = ui.data('itemObj');
            if (! mechObj.limbs[this.id] ){
                return; //bail - sometimes the xml is missing limbs, otherwise this shouldn't happen.
            }
            return mechObj.limbs[this.id].testIfValid(itemObj);
        },
        activeClass: "valid",
        drop: function (event, ui) {
            //get from original item - ignore cloned item which was not a deep clone and doesn't have the data.
            var data = $(ui.draggable).data();
            mechObj.addItemToLimb(this.id, data['itemObj']);
            addItem(createItemDivFromData(data), this);
        }
    }).disableSelection();

    $("#mechBay div div .close").live("click", function () {
        var itemObj = $(this).parent().data('itemObj');
        mechObj.removeItemFromLimb($(this).parents('.area')[0].id, itemObj);
        $(this).parent().remove();
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