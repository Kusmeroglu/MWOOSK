var mechObj;
var mechXML;
var itemXML;
var itemXMLsupplemental;
var urldata;
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

var ECMID = "9006";

var d = new Date();
var hourstr = d.setMinutes(0,0,0).toString();

var settings = {
    showArrows: true,
    autoReinitialise: true,
    autoReinitializeDelay: 500}

// --------------- DEAR DRUPAL: STOP this from running on all of the pages. Cause. Drupal.
if ( true ) { // window.location.href.indexOf('mechlab') > 0){

    urldata = getURLParamObject();
    window.location.hash='#'; // clear out all our random crap if loaded from a share page.

    jQuery(function () {
        // fix the login with the old subdomain stuff.
        jQuery("#user-login-form").attr("action","/?destination=node/6");
        // clear out checkboxes.. browser issue?
        jQuery("input[type=checkbox]").attr('checked', false);

        if ( !Array.prototype.forEach ) {
            Array.prototype.forEach = function(fn, scope) {
                for(var i = 0, len = this.length; i < len; ++i) {
                    fn.call(scope, this[i], i, this);
                }
            }
        }


        jQuery('#reset').click(function(){
            window.location.reload();
        });


        function createItemDivFromData(data){
            var itemObj = data["itemObj"];
            var div = jQuery("<div></div>")
                .attr("class", "item " + itemObj.type + " " + itemObj.id)
                // store all the weapon information in this div
                .data({'itemObj':itemObj, rosechartdata:itemObj.rosechartdata})
                .disableSelection()
            div.append(jQuery("<div class='itemName'>"+itemObj.itemName+"</div><div class='itemPrice'><div class='cbillCost'>"+itemObj.cbill+" cbills</div><div class='mcCost'></div><div class='clear'></div>"));
            if( itemObj.rosechartdata && itemObj.rosechartdata.length ){
                div.hover(
                    function(){
                        updateRoseChartData(jQuery(this).data("itemObj"), jQuery(this).data("itemObj")['itemName']);
                    },
                    function(){
                        resetRoseChartData("-N/A-");
                    })
            }
            //internal info
            div.append(jQuery("<div class='itemInfo'><div class='infoLabel itemweight' title='"+itemObj.weight+"'>Weight: "+itemObj.weight+" Tons</div></div>"));
            div.append(jQuery("<div class='itemInfo'><div class='infoLabel itemcrits' title='"+itemObj.critSlots+"'>Crit Slots: "+itemObj.critSlots+"</div></div>"));
            if (itemObj.isWeapon){
                div.append(jQuery("<div class='itemInfo'><div class='infoLabel'>Heat: " + itemObj.heat + "</div></div>"));
                div.append(jQuery("<div class='itemInfo'><div class='infoLabel'>Damage: " + itemObj.damage + "</div></div>"));
                div.append(jQuery("<div class='itemInfo'><div class='infoLabel'>Opt. Range: " + itemObj.optimalRange + "</div></div>"));
                div.append(jQuery("<div class='itemInfo'><div class='infoLabel'>Cooldown: "+itemObj.cooldown+"</div></div>"));
                div.append(jQuery("<div class='itemInfo'><div class='infoLabel'>Min. Range: "+itemObj.minRange+"</div></div>"));
                if ( itemObj.type == "ballistic"){
                    div.append(jQuery("<div class='itemInfo'><div class='infoLabel'>Ammo/Ton: "+itemObj.ammoper+"</div></div>"));
                }
                if ( itemObj.type == "energy"){
                    div.append(jQuery("<div class='itemInfo'><div class='infoLabel'>Beam Duration: "+itemObj.duration+"</div></div>"));
                }
                if ( itemObj.type == "missile"){
                    div.append(jQuery("<div class='itemInfo'><div class='infoLabel'>Ammo/Ton: "+itemObj.ammoper+"</div></div>"));
                }
                div.append(jQuery("<div class='itemInfo'><div class='infoLabel'>Max. Range: "+itemObj.maxRange+"</div></div>"));
                div.append(jQuery("<div class='itemInfo'><div class='infoLabel'>Health: " + itemObj.hp + "</div></div>"));
            }
            if (itemObj.isEngine){
                div.append(jQuery("<div class='itemInfo'><div class='infoLabel'>Base Heatsinks: "+(10 + ((itemObj.heatsinkslots < 0) ? itemObj.heatsinkslots : 0 ))+"</div></div>"));
                div.append(jQuery("<div class='itemInfo'><div class='infoLabel'>Extra Heatsinks: "+((itemObj.heatsinkslots > 0) ? itemObj.heatsinkslots : 0 )+"</div></div>"));
            }
            if (itemObj.isAmmo){
                div.append(jQuery("<div class='itemInfo'><div class='infoLabel'>Ammo/Ton: "+itemObj.ammoper+"</div></div>"));
                div.append(jQuery("<div class='itemInfo'><div class='infoLabel'>Health: " + itemObj.hp + "</div></div>"));
                div.append(jQuery("<div class='clear'></div>"));
                div.append(jQuery("<div class='destructionInfo'><div class='infoLabel'>Destruction Dmg: "+itemObj.ammodamage+" per munition</div></div>"));
            }
            if (itemObj.explodeDamage){
                div.append(jQuery("<div class='destructionInfo'><div class='infoLabel'>Destruction Dmg: "+itemObj.explodeDamage+" dmg</div></div>"));
            }
            div.append(jQuery("<div class='clear'></div>"));
            return div;
        }

        function parseItemXML(xml){
            jQuery(itemXMLsupplemental).find("weapons > item").each(function () {
                // get the supplemental
                var supplement = jQuery(this);
                var itemxml = jQuery(xml).find('weapons > item[id="' + supplement.attr("id") + '"]');
                var itemObj = new item(supplement.attr("id"), supplement.attr('longname'), itemxml.attr("slots"), itemxml.attr("tons"), itemxml.attr("type"), itemxml.attr("type"));
                itemObj.isWeapon = true;
                itemObj.damage = parseFloat(supplement.attr("damage") || itemxml.attr("damage"));
                itemObj.shortName = supplement.attr('shortname');
                itemObj.cbill = supplement.attr('cbill');
                itemObj.hp = supplement.attr('hp');
                itemObj.heat = parseFloat(itemxml.attr("heat"));
                itemObj.cooldown = parseFloat(itemxml.attr("cooldown"));
                itemObj.minRange = parseFloat(itemxml.attr("minrange"));
                itemObj.optimalRange = parseFloat(itemxml.attr("range"));
                itemObj.maxRange = parseFloat(itemxml.attr("maxrange"));
                itemObj.dpsmax = parseFloat(itemxml.attr("dpsmax"));
                itemObj.dpsmaxperslot = (Math.round( 100 * (itemObj.dpsmax / itemObj.critSlots)) / 100);
                itemObj.dpsmaxperton = (Math.round(100 * (itemObj.dpsmax / itemObj.weight)) / 100);
                itemObj.dpsmaxperheat = (Math.round(100 * (itemObj.dpsmax / itemObj.heat)) / 100);
                itemObj.hps = parseFloat(itemxml.attr("hps"));
                itemObj.ammoper = parseFloat(itemxml.attr("ammoper"));
                if ( supplement.attr("internaldamage")){
                    itemObj.explodeDamage = supplement.attr("internaldamage");
                }
                if (!itemxml.attr("duration")){
                    itemObj.duration = supplement.attr('duration');
                }
                else {
                    itemObj.duration = parseFloat(itemxml.attr("duration"));
                }
                itemObj.ehs = parseFloat(itemxml.attr("ehs"));

                itemObj.rosechartdata = [
                    { name:"Damage",   value:itemxml.attr("damage"), minvalue:0},
                    { name:"Heat",     value:itemxml.attr("heat"), minvalue:0},
                    { name:"HPS",      value:itemxml.attr("hps"), minvalue:0},
                    { name:"Weight",   value:itemxml.attr("tons"), minvalue:0},
                    { name:"Slots",    value:itemxml.attr("slots"), minvalue:0},
                    { name:"Cooldown", value:itemxml.attr("cooldown"), minvalue:0},
                    { name:"DPS",      value:itemxml.attr("dpsmax"), minvalue:0},
                    { name:"Range",    value:itemxml.attr("maxrange"), minvalue: (itemxml.attr("minrange")?itemxml.attr("minrange"):0)}
                    //{ name:"Ammo/Ton", value:jQuery(this).attr("ammoper")?jQuery(this).attr("ammoper"):0},
                ];
                jQuery("#"+itemObj.type+"Weapon").append(createItemDivFromData({itemObj: itemObj}));
            });
            jQuery(itemXMLsupplemental).find("ammos > item").each(function () {
                var supplement = jQuery(this);
                var itemxml = jQuery(xml).find('ammos > item[id="' + supplement.attr("id") + '"]');
                var itemObj = new item(supplement.attr("id"), supplement.attr('longname'), itemxml.attr("slots"), itemxml.attr("tons"), itemxml.attr("type"));
                itemObj.isAmmo = true;
                itemObj.ammoper = supplement.attr('apt');
                itemObj.hp = supplement.attr('hp');
                itemObj.shortName = supplement.attr('shortname');
                itemObj.cbill = supplement.attr('cbill');
                itemObj.ammodamage = itemxml.attr('internaldamage');
                //jQuery("#ballisticAmmo").append(createItemDivFromData({itemObj: itemObj}));
                jQuery("#"+itemObj.type+"Ammo").append(createItemDivFromData({itemObj: itemObj}));
            });
            jQuery(itemXMLsupplemental).find("internals > item").each(function () {
                var supplement = jQuery(this);
                var itemxml = jQuery(xml).find('item[id="' + supplement.attr("id") + '"]');
                var itemObj = new item(supplement.attr("id"), supplement.attr('longname'), supplement.attr("slots"), supplement.attr("tons"), supplement.attr("type"), supplement.attr("hardpoint"));
                itemObj.isInternal = true;
                itemObj.shortName = supplement.attr('shortname');
                itemObj.cbill = supplement.attr('cbill');
                if ( itemxml.attr('internaldamage')){
                    itemObj.ammodamage = itemxml.attr('internaldamage');
                    itemObj.isAmmo = true;
                }
                if ( supplement.attr("minTons") ){
                    itemObj.mintonnage = parseInt( supplement.attr("minTons") );
                }
                if ( supplement.attr("maxTons") ){
                    itemObj.maxtonnage = parseInt( supplement.attr("maxTons") );
                }
                jQuery("#internals").append(createItemDivFromData({itemObj: itemObj}));
            });
            jQuery('#ballisticWeapon').jScrollPane(settings);
            jQuery('#ballisticAmmo').jScrollPane(settings);
            jQuery(itemXMLsupplemental).find("engines > plant").each(function () {
                var supplement = jQuery(this);
                var itemxml = jQuery(xml).find('engines > plant[id="' + supplement.attr("id") + '"]');
                var itemObj = new item(supplement.attr("id"), supplement.attr('longname'), parseInt(itemxml.attr("slots")), itemxml.attr("tons"), itemxml.attr("type"), "engine");
                itemObj.isEngine = true;
                itemObj.shortName = supplement.attr('shortname');
                itemObj.cbill = supplement.attr('cbill');
                itemObj.heatsinkslots = parseInt(itemxml.attr("heatsinkslots"));
                itemObj.rosechartdata = [];
                itemObj.type = itemxml.attr("type");
                itemObj.engineSize = itemxml.attr("size");
                jQuery("#"+itemObj.type+"Engine").append(createItemDivFromData({itemObj: itemObj}));
            });

            jQuery("#detailContainer div").find('.item').draggable({
                revert: "invalid",
                // make a div used for dragging
                helper: function( event ) {
                    var data = jQuery(this).data();
                    if ( ! data['itemObj']){
                        return false;
                    }
                    itemObj = data['itemObj'];
                    if (!itemObj) {
                        console.log("Empty itemObj in add");
                        return false;
                    }

                    var visiblecritslots = itemObj.critSlots;
                    var itemtypeclass = itemObj.type;
                    var itemname = itemObj.itemName;
                    if ( itemObj.isAmmo){
                        itemname = itemObj.shortName;
                    }
                    // fix xl engines
                    if (itemObj.type == "xl") {
                        visiblecritslots = 6;
                    }
                    // add to the limb
                    var div = jQuery("<div style='width:159px'></div>")
                        .addClass('critItem')
                        .addClass(itemObj.hardpointType)
                        .addClass(itemtypeclass)
                        // store all the weapon information in this div
                        .data({'itemObj':itemObj, rosechartdata:itemObj.rosechartdata})
                        .disableSelection()
                        .append(jQuery('<div/>')
                            .addClass(classLookup[ visiblecritslots ])
                            .append('<div class="critLabel">' + itemname + '</div>')
                        );
                    for (var emptyCrit = 1; emptyCrit < visiblecritslots; emptyCrit++) {
                        div.children("div").append('<div class="emptyCrit">- - - - - - - - - - - - - - - -</div>')
                    }
                    return div;
                },
                appendTo: 'body',
                snap: ".area",
                snapMode: "inner"
            });
        }

        function parseMechXML(xml){
            mechXML.find("class").each(function () {
                jQuery("#mechClass").append(jQuery("<option></option>").attr("value",jQuery(this).attr("type")).text(jQuery(this).attr("type")));
                jQuery("#mechClassDiv").append(jQuery("<div class='selectItem' id='"+jQuery(this).attr("type")+"'>"+jQuery(this).attr("type")+"</div>"));
            });
            jQuery("#mechClassDiv").children(".selectItem").click(function(event) {
                if (jQuery(jQuery(this).parent()).hasClass('active')){
                    event.stopPropagation();
                    var selectItem = jQuery(this).attr('id');
                    jQuery(jQuery(this).parent()).find("select").attr("value", selectItem);
                    jQuery(jQuery(this).parent()).find("select").change();
                    jQuery(this).parent().removeClass("active");
                    jQuery(this).show(); // force a show, incase this was triggered programmatically
                    jQuery(this).siblings(".selectItem").hide();
                    jQuery(this).siblings("#classBlank").hide();
                    jQuery(this).siblings(".selectItem, #variantBlank").removeClass('selected');
                    jQuery(this).addClass('selected');
                } else { // falls to this case if the pulldown is set to a value and clicked on again.
                    jQuery(this).removeClass('selected');
                }
            });

            // make the secondary pull down go
            jQuery("#mechClass").on("change", function (event) {
                var selectedClass = jQuery("#mechClass").val();
                jQuery("#mechChassis").empty().append(jQuery("<option></option>").attr("value", "0").attr('id','chassisBlank').text("Select mech name..."));
                jQuery("#mechChassisDiv .selectBlank, #mechChassisDiv .selectItem").remove();
                jQuery("#mechChassisDiv").append(jQuery("<div class='selectBlank selected' id='chassisBlank'>Select mech Chassis...</div>"));
                jQuery("#mechVariant").empty().append(jQuery("<option></option>").attr("value", "0").attr('id','variantBlank').text("Select Mech Variant..."));
                jQuery("#mechVariantDiv .selectBlank, #mechVariantDiv .selectItem").remove();
                jQuery("#mechVariantDiv").append(jQuery("<div class='selectBlank selected' id='variantBlank'>Select mech Variant...</div>"));
                mechXML.find('class[type="' + selectedClass + '"] > mech').each(function () {
                    jQuery("#mechChassis").append(jQuery("<option></option>").attr("value", jQuery(this).attr("type")).text(jQuery(this).attr("type")));
                    jQuery("#mechChassisDiv").append(jQuery("<div class='selectItem' id='"+jQuery(this).attr("type")+"'>"+jQuery(this).attr("type")+"</div>"));
                });
                jQuery("#mechChassisDiv").children(".selectItem").click(function(event) {
                    if (jQuery(this).parent().hasClass('active')){
                        event.stopPropagation();
                        var selectItem = jQuery(this).attr('id');
                        jQuery("#mechChassis").attr("value", selectItem);
                        jQuery("#mechChassis").change();
                        jQuery(this).parent().removeClass("active");
                        jQuery(this).show(); // force a show, incase this was triggered programmatically
                        jQuery(this).siblings(".selectItem").hide();
                        jQuery(this).siblings("#chassisBlank").hide();
                        jQuery(this).siblings(".selectItem, #variantBlank").removeClass('selected');
                        jQuery(this).addClass('selected');
                    } else { // falls to this case if the pulldown is set to a value and clicked on again.
                        jQuery(this).removeClass('selected');
                    }
                });
            });

            // make the tertiary pull down go
            jQuery("#mechChassis").on("change", function (event) {
                var selectedChassis = jQuery("#mechChassis").val();
                jQuery("#mechVariant").empty().append(jQuery("<option></option>").attr("value", "0").attr('id','variantBlank').text("Select mech variant..."));
                jQuery("#mechVariantDiv .selectBlank, #mechVariantDiv .selectItem").remove();
                jQuery("#mechVariantDiv").append(jQuery("<div class='selectBlank selected' id='variantBlank'>Select mech Variant...</div>"));
                mechXML.find('class > mech[type="' + selectedChassis + '"] > variant').each(function () {
                    jQuery("#mechVariant").append(jQuery("<option></option>").attr("value", jQuery(this).attr("name").replace(new RegExp(" ", 'g'),"_")).text(jQuery(this).attr("name").replace(new RegExp(" ", 'g'),"_")));
                    jQuery("#mechVariantDiv").append(jQuery("<div class='selectItem' id='"+jQuery(this).attr("name").replace(new RegExp(" ", 'g'),"_")+"'>"+jQuery(this).attr("name")+"</div>"));
                });
                jQuery("#mechVariantDiv").children(".selectItem").click(function(event) {
                    if (jQuery(this).parent().hasClass('active')){
                        event.stopPropagation();
                        var selectItem = jQuery(this).attr('id');
                        jQuery("#mechVariant").attr("value", selectItem);
                        jQuery("#mechVariant").change();
                        jQuery(this).parent().removeClass("active");
                        jQuery(this).show(); // force a show, incase this was triggered programmatically
                        jQuery(this).siblings(".selectItem").hide();
                        jQuery(this).siblings("#variantBlank").hide();
                        jQuery(this).siblings(".selectItem, #variantBlank").removeClass('selected');
                        jQuery(this).addClass('selected');
                    } else { // falls to this case if the pulldown is set to a value and clicked on again.
                        jQuery(this).removeClass('selected');
                    }
                    // lock selects
                    jQuery("#mechClassDiv").unbind('click');
                    jQuery("#mechClassDiv").addClass('inactive');
                    jQuery("#mechClassDiv").children(".selectItem").unbind('click');
                    jQuery("#mechChassisDiv").unbind('click');
                    jQuery("#mechChassisDiv").addClass('inactive');
                    jQuery("#mechChassisDiv").children(".selectItem").unbind('click');
                    jQuery("#mechVariantDiv").addClass('inactive');
                    jQuery("#mechVariantDiv").unbind('click');
                    jQuery("#mechVariantDiv").children(".selectItem").unbind('click');
                });
            });

            jQuery("#mechVariant").on("change", function (event) {
                if (jQuery("#mechVariant").val() == "0"){
                    return;
                }
                mechXML.find('mech[type="' + jQuery("#mechChassis").val() + '"]').each(function () {
                    mechObj = new mech(jQuery("#mechChassis").val(), jQuery("#mechVariant").val().replace(new RegExp(" ", 'g'), "_"), parseFloat(jQuery(this).attr("tonnage")));
                    mechObj.currentTons = mechObj.chassisTons = parseFloat(jQuery(this).attr("chassis"));
                    mechObj.endoweight = parseFloat(jQuery(this).attr("endoweight"));
                });
                mechXML.find('mech[type="' + mechObj.chassis + '"] variant[name="' + mechObj.variant.replace(new RegExp("_", 'g')," ") + '"]').each(function () {
                    mechObj.ecm = Boolean(jQuery(this).attr("ecm") == "yes");
                    mechObj.jumpjets = parseInt(jQuery(this).attr("jets")) > 0;
                    mechObj.jumpjetmax = parseInt(jQuery(this).attr("jets"));
                    mechObj.minEngineSize = parseInt(jQuery(this).attr("minengine"));
                    mechObj.maxEngineSize = parseInt(jQuery(this).attr("maxengine"));
                });

                // weights are added to chart when limbs created.
                // createChart("#weightChart", mechObj.maxTons, mechObj.chassisTons, mechObj.currentTons);

                // add all the limbs.
                mechXML.find('mech[type="' + mechObj.chassis + '"] variant[name="' + mechObj.variant.replace(new RegExp("_", 'g')," ") + '"] > limbs > limb').each(function () {
                    var limbObj = new limb(jQuery(this).attr("name"), jQuery(this).attr("crits"), parseInt(jQuery(this).attr("maxArmor")));
                    mechObj.addLimb(limbObj.limbName, limbObj);
                    // set initial armor for mech
                    mechObj.setArmorForLimb(limbObj.limbName, parseInt(jQuery(this).attr("armorFront")), parseInt(jQuery(this).attr("armorRear")));
                    // find the hardpoints
                    jQuery(this).find('hardpoint').each(function(){
                        var hardPointObj = new hardPoint(jQuery(this).attr('type'));
                        limbObj.addHardPoint(hardPointObj);
                    });
                    // handle the internals
                    jQuery(this).find('internal').each(function(){
                        limbObj.addItem(new item('', jQuery(this).text(), jQuery(this).attr('slots'), 0, 'internal', ''));
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
                    jQuery("#internals .jumpjet").filter(function(){
                        var itemObj = jQuery(this).data('itemObj');
                        if ((mechObj.maxTons < itemObj.mintonnage) || (mechObj.maxTons > itemObj.maxtonnage)){
                            return true; // hide this object
                        } else {
                            return false;
                        }
                    }).remove();
                } else {
                    jQuery("#internals .jumpjet").remove();
                }
                // filter ecm
                if (! mechObj.ecm){
                    jQuery("#internals ."+ECMID).remove();
                }
                //filter engines
                if (mechObj.minEngineSize && mechObj.maxEngineSize){
                    jQuery("#engines .item").filter(function(){
                        var itemObj = jQuery(this).data('itemObj');
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
                            jQuery("#endoCheckbox").prop("checked", true);
                        }
                    }
                    if (urldata.hasOwnProperty('ferro') && urldata['ferro'] == "true"){
                        if (mechObj.addFerroFibrous()){
                            jQuery("#ferroCheckbox").prop("checked", true);
                        }
                    }
                    if (urldata.hasOwnProperty('dhs') && urldata['dhs'] == "true"){
                        if (mechObj.addDualHeatSinks()){
                            jQuery("#dhsCheckbox").prop("checked", true);
                        }
                    }
                    if (urldata.hasOwnProperty('artemis') && urldata['artemis'] == "true"){
                        if (mechObj.addArtemis()){
                            jQuery("#artemisCheckbox").prop("checked", true);
                        }
                    }
                }

                jQuery("#mechBay").fadeIn('fast', function() {
                    createRoseGraph("#roseChart", "-N/A-");

                    // (have to wait until we have graphs and items created.)
                    if (urldata.hasOwnProperty('variant')){
                        // check for limbs data and load each, 4 letter code by 4 letter code.
                        limbList.forEach(function(limb){
                            if (urldata.hasOwnProperty(limb)){
                                var rawitems = urldata[limb];
                                var limbelem = jQuery('#'+limb);
                                var i = 0;
                                while(i < rawitems.length)
                                {
                                    var thisitemid = rawitems.substr(i, 4);
                                    var thisitemelem = jQuery('#detailContainer .'+thisitemid); // pull the data out of the dom element with the matching itemid (which is actually a class)
                                    if ( thisitemelem ){ // if we found it
                                        var thisitemObj = jQuery.extend(true, {}, thisitemelem.data('itemObj'));// get copy of old data
                                        mechObj.addItemToLimb(jQuery(limbelem).attr('id'), thisitemObj);
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
                                jQuery('#'+limbName+' .armorspinner.rear').attr('value', parseInt(bothvalues.split("-")[1]));
                                jQuery('#'+limbName+' .armorspinner.front').spinner('value', parseInt(bothvalues.split("-")[0]));
                            }, this);
                        }
                    }
                });
            });

            //check for info in URLs - simulate selecting the variant
            if (urldata.hasOwnProperty('variant')){
                var mechVariant = urldata['variant'];
                if (urldata.hasOwnProperty('name')){
                    var mechname = jQuery("#mechNickName").val(decodeURIComponent(urldata['name']));
                }
                // we have data to load
                mechXML.find('mech variant[name="' + mechVariant.replace(new RegExp("_", 'g')," ") + '"]').each(function () {
                    //select the fake selects to trigger real select and set the visuals up correctly
                    var mechClass = jQuery(this).parents('class').attr('type').toString();
                    jQuery("#mechClassDiv #"+mechClass).parent().addClass('active');
                    jQuery("#mechClassDiv #"+mechClass).click();
                    var mechChassis = jQuery(this).parents('mech').attr('type').toString();
                    jQuery("#mechChassisDiv #"+mechChassis).parent().addClass('active');
                    jQuery("#mechChassisDiv #"+mechChassis).click();
                });
                jQuery("#mechVariantDiv #"+mechVariant).parent().addClass('active');
                jQuery("#mechVariantDiv #"+mechVariant).click();
            }
        }

        /*
         SET UP event handlers on all the basic elements
         */
        // making the fake select boxes work
        jQuery("#mechClassDiv").click(function() {
            jQuery(this).children('.selectItem').show();
            jQuery(this).children('#classBlank').show();
            jQuery(this).addClass('active');
        });
        jQuery("#mechChassisDiv").click(function() {
            jQuery(this).children('.selectItem').show();
            jQuery(this).children('#chassisBlank').show();
            jQuery(this).addClass('active');
        });
        jQuery("#mechVariantDiv").click(function() {
            jQuery(this).children('.selectItem').show();
            jQuery(this).children('#variantBlank').show();
            jQuery(this).addClass('active');
        });

        // This allows you to click outside of the fake-div-dropbox to close it
        jQuery(document).mouseup(function (e){
            var container = jQuery(".selectBox");
            if (container.has(e.target).length === 0)
            {
                container.children(".selectItem").not('.selected').hide();
            }
        });

        // set the background to be droppable too, so we can 'drag off' to delete
        jQuery("body").droppable({
            drop: function(event, ui) {
                // phantom dropped elements sometimes appear here, even though
                var data = jQuery(ui.draggable).data();
                if ( ! data['itemObj']){
                    return false;
                }
                mechObj.removeItemFromLimb(jQuery(ui.draggable).parents(".area").attr('id'), data['itemObj']);
                jQuery(ui.draggable).remove(); // sometimes limb.removeItem doesn't appear to work..?
                // hack for the activeClass on the limbs not clearing itself in this case:
                jQuery('.valid').removeClass('valid'); // todo: get to the bottom of this
            },
            accept: '.critItem'
        });

        // set the limb areas to be droppables
        jQuery(".area").droppable({
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
                if ( ui.parents(".area").attr('id') == jQuery(this).attr('id') ){
                    return false;
                }
                return mechObj.testIfValid(this.id, itemObj);
            },
            activeClass: "valid",
            drop: function (event, ui) {
                //get from original item - ignore cloned item which was not a deep clone and doesn't have the data.
                var data = jQuery(ui.draggable).data();
                // check if dragged from another limb
                if (jQuery(ui.draggable).parents(".area").length > 0){
                    mechObj.removeItemFromLimb(jQuery(ui.draggable).parents(".area").attr('id'), data['itemObj']);
                    jQuery(ui.draggable).remove(); // sometimes limb.removeItem doesn't appear to work..?
                }
                mechObj.addItemToLimb(jQuery(this).attr('id'), jQuery.extend(true, {}, data['itemObj']));
                // hack for the activeClass on the limbs not clearing itself in this case:
                jQuery('.valid').removeClass('valid'); // todo: get to the bottom of this
                return false;
            }
        }).disableSelection();

        /*
         --- Upgrade Checkboxes -----
         */

        jQuery("#endoCheckbox").change( function(){
            if (jQuery('#endoCheckbox').is(':checked') ){
                if (! mechObj.addEndoSteel()){
                    jQuery("#endoCheckbox").prop("checked", false);
                    alert("Not enough free critical slots to add Endo Steel.");
                }
            } else {
                if (! mechObj.removeEndoSteel()){
                    jQuery("#endoCheckbox").prop("checked", true);
                    alert("Not enough free weight to remove Endo Steel.");
                }
            }
        });

        jQuery("#ferroCheckbox").change( function(){
            if (jQuery('#ferroCheckbox').is(':checked') ){
                if ( ! mechObj.addFerroFibrous()){
                    jQuery("#ferroCheckbox").prop("checked", false);
                    alert("Not enough free critical slots to add Ferro Fibrous.");
                }
            } else {
                if ( ! mechObj.removeFerroFibrous()){
                    jQuery("#ferroCheckbox").prop("checked", true);
                    alert("Not enough free weight to remove Ferro Fibrous.");
                }
            }
        });

        jQuery("#dhsCheckbox").change( function(){
            if (jQuery('#dhsCheckbox').is(':checked') ){
                if ( ! mechObj.addDualHeatSinks()){
                    jQuery("#dhsCheckbox").prop("checked", false);
                    alert("Could not add DHS.");
                }
            } else {
                if ( ! mechObj.removeDualHeatSinks()){
                    jQuery("#dhsCheckbox").prop("checked", true);
                    alert("Could not remove DHS.");
                }
            }
        });

        jQuery("#artemisCheckbox").change( function(){
            if (jQuery('#artemisCheckbox').is(':checked') ){
                if ( ! mechObj.addArtemis()){
                    jQuery("#artemisCheckbox").prop("checked", false);
                    alert("Could not add Artemis.");
                }
            } else {
                if ( ! mechObj.removeArtemis()){
                    jQuery("#artemisCheckbox").prop("checked", true);
                    alert("Could not remove Artemis.");
                }
            }
        });

        /*
         --- Clear Armor/Items, Max Armor
         */

        jQuery('#clearArmor').on('click', function(e){
            limbList.forEach(function(limbName){
                jQuery('#'+limbName+' .armorspinner.rear').attr("value", "0");
                jQuery('#'+limbName+' .armorspinner.front').spinner("value", "0");
            });
        });
        jQuery('#maxArmor').on('click', function(e){
            limbList.forEach(function(limbName){
                var maxarmor = mechObj.limbs[limbName].maxArmor;
                jQuery('#'+limbName+' .armorspinner.front').spinner('value', 0);
                if ( jQuery('#'+limbName+' .armorspinner.rear').length ){
                    var armor = Math.round(maxarmor * .6);
                    jQuery('#'+limbName+' .armorspinner.rear').attr('value', maxarmor - armor);
                } else {
                    var armor = maxarmor;
                }
                jQuery('#'+limbName+' .armorspinner.front').spinner('value', armor);
            });
        });

        jQuery('#clearItems').on('click', function(e){
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


        /*
         ------ SHARING CODE -------
         */

        jQuery( "#dialog-form" ).dialog({
            autoOpen: false,
            height: 500,
            width: 700,
            modal: true,
            dialogClass: "modalwindow",
            buttons: {
            },
            close: function() {
                jQuery("#dialog-form input").val("");
            }
        });

        jQuery('#tinyurlLink').on('click', function(e){
            e.preventDefault();
            if ( ! mechObj ){
                alert("Nothing to share -- please select a variant first!");
                return;
            }
            // remove ?'s from the mech name because. NO.
            var mechname = jQuery("#mechNickName").val() || "";
            mechname = mechname.replace('?', '');
            jQuery("#mechNickName").val(mechname);
            var clearmechname = encodeURIComponent(mechname) || "";
            setURLParameter("name", clearmechname);
            //var apiKey = "AIzaSyBwChgwfU1FgX9dXWr7UJL7cpClk53T8mI";
            //gapi.client.setApiKey(apiKey);
            gapi.client.load('urlshortener', 'v1', function() {
                var request = gapi.client.urlshortener.url.insert({
                    'resource': {
                        'longUrl': getFullURL()
                    }
                });
                var resp = request.execute(function(resp) {
                    if (resp.error) {
                        console.log("error: " + resp.error.message);
                        var tinyurl = data.id;
                        jQuery('#tinyurlLink').hide();
                        jQuery('#tinyurlLink').insertAfter(jQuery("<div id='tinyurlResult'>"+resp.error.message+"</div>"));
                    } else {
                        var tinyurl = resp.id;
                        var description = getMechShortDescription();

//                        <input type="text" name="shortURL" id="shortURL" class="dialog" />
                        jQuery('#shortURL').val(tinyurl);
//                        <input type="text" name="shortDesc" id="shortDesc" value="" class="dialog" />
                        jQuery('#shortDesc').val(mechname + " " + description);
//                        <input type="text" name="shortDescForum" id="shortDescForum" value="" class="dialog" />
                        jQuery('#shortDescForum').val('[url="' + tinyurl + '"]' + mechname + " " + description + '[/url]' );
//                        <input type="text" name="shortDescHTML" id="shortDescHTML" value="" class="dialog" />
                        jQuery('#shortDescHTML').val("<a href='" + tinyurl + "'>" + mechname + " " + description + "</a>" );
                        jQuery( "#dialog-form" ).dialog( "open" );
                    }
                });
            });
            return false;
        });



        /*
         ----     All the Crazy Menu Visibility Toggling     ----
         */

        // Initiallizing the Scroll Bars to show up dynamically
        jQuery(function(){
            // Generic button style toggling.  Purely Cosmetic.
            jQuery('.toggleButton').click(function(){
                if (jQuery(this).parent().hasClass('buttonWrapper')){
                    jQuery(this).siblings('.toggleButton').removeClass('activeButton');
                    jQuery(this).addClass('activeButton');
                }
            });

            // Show Ballistic List
            jQuery('#ballisticButton').click(function(){
                jQuery('#ballisticList').show();
                jQuery('#energyList').hide();
                jQuery('#missileList').hide();
                if(jQuery('#ballisticAButton').hasClass('activeButton')){
                    jQuery('#itemInfo').hide();
                }
                else{
                    jQuery('#itemInfo').show();
                }
            });

            // Show Energy List
            jQuery('#energyButton').click(function(){
                jQuery('#ballisticList').hide();
                jQuery('#energyList').show();
                jQuery('#missileList').hide();
                jQuery('#energyWeapon').jScrollPane(settings);
                jQuery('#itemInfo').show();
            });

            // Show Missile List
            jQuery('#missileButton').click(function(){
                jQuery('#ballisticList').hide();
                jQuery('#energyList').hide();
                jQuery('#missileList').show();
                jQuery('#missileWeapon').jScrollPane(settings);
                jQuery('#missileAmmo').jScrollPane(settings);
                if(jQuery('#missileAButton').hasClass('activeButton')){
                    jQuery('#itemInfo').hide();
                }
                else{
                    jQuery('#itemInfo').show();
                }
            });

            // Ballistic Sublist Toggles
            jQuery('#ballisticAButton').click(function(){
                jQuery('#ballisticWeapon').hide();
                jQuery('#ballisticAmmo').show().jScrollPane(settings);
                jQuery('#itemInfo').hide();
            });
            jQuery('#ballisticWButton').click(function(){
                jQuery('#ballisticWeapon').show().jScrollPane(settings);
                jQuery('#ballisticAmmo').hide();
                jQuery('#itemInfo').show();
            });

            // Missile Sublist Toggles
            jQuery('#missileAButton').click(function(){
                jQuery('#missileWeapon').hide();
                jQuery('#missileAmmo').show();
                jQuery('#itemInfo').hide();
            });
            jQuery('#missileWButton').click(function(){
                jQuery('#missileWeapon').show();
                jQuery('#missileAmmo').hide();
                jQuery('#itemInfo').show();
            });

            // Show Utility List
            jQuery('#internalsButton').click(function(){
                jQuery('#internals').show();
                jQuery('#engines').hide();
                jQuery('#upgrades').hide();
            });
            // Show Engine List
            jQuery('#enginesButton').click(function(){
                jQuery('#internals').hide();
                jQuery('#engines').show();
                jQuery('#upgrades').hide();
                jQuery('#stdEngine').jScrollPane(settings);
                jQuery('#xlEngine').jScrollPane(settings);
            });
            // Show Upgrade List
            jQuery('#upgradesButton').click(function(){
                jQuery('#internals').hide();
                jQuery('#engines').hide();
                jQuery('#upgrades').show();
            });
            // Engine Sublist Toggles
            jQuery('#stdEngineButton').click(function(){
                jQuery('#stdEngine').show();
                jQuery('#xlEngine').hide();
            });
            jQuery('#xlEngineButton').click(function(){
                jQuery('#stdEngine').hide();
                jQuery('#xlEngine').show();
            });
            // Activate Armament Tab
            jQuery('#armamentTab').parent('.tabWrapper').click(function(){
                jQuery('#armament').show();
                jQuery('#utilities').hide();
                jQuery('#piloting').hide();
                jQuery('statistics').hide();
                jQuery('#comments').hide();
            });
            // Activate Utility Tab
            jQuery('#utilityTab').parent('.tabWrapper').click(function(){
                jQuery('#armament').hide();
                jQuery('#utilities').show();
                jQuery('#piloting').hide();
                jQuery('statistics').hide();
                jQuery('#comments').hide();
                jQuery('#internals').jScrollPane(settings);
            });
            // Activate Pilot Tab
            jQuery('#pilotingTab').parent('.tabWrapper').click(function(){
                jQuery('#armament').hide();
                jQuery('#utilities').hide();
                jQuery('#piloting').show();
                jQuery('statistics').hide();
                jQuery('#comments').hide();
            });
            // Activate Stats Tab
            jQuery('#statisticsTab').parent('.tabWrapper').click(function(){
                jQuery('#armament').hide();
                jQuery('#utilities').hide();
                jQuery('#piloting').hide();
                jQuery('statistics').show();
                jQuery('#comments').hide();
            });
            jQuery('#commentsTab').parent('.tabWrapper').click(function(){
                jQuery('#armament').hide();
                jQuery('#utilities').hide();
                jQuery('#piloting').hide();
                jQuery('statistics').hide();
                jQuery('#comments').show();
            });
        });


        /*
         START UP - on initial loadup, get the xml, populate the screen
         */
        jQuery.get('data/itemsupplement.xml?rand='+hourstr, function(xml){
            itemXMLsupplemental = xml;
            // load the item list
            jQuery.get('data/items.xml?rand='+hourstr, function (xml) {
                itemXML = xml;
                parseItemXML(xml);

                // now load XML just the once.
                jQuery.get('data/mechs.xml?rand='+hourstr, function (xml){
                    mechXML = jQuery(xml);

                    parseMechXML(mechXML);
                });
            });
        });

    });
}