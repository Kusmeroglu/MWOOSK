function item(id, itemName, critSlots, weight, type, hardpointtype) {
    this.id = id; // little three letter ID
    this.itemName = itemName; // human readable text
    this.type = type; // and extra modifier on hardpointType - ie std or xl, weapon, etc.
    this.hardpointType = hardpointtype; // this is added to the physical item as a class
    this.weight = weight;
    this.critSlots = parseInt(critSlots);
    this.heatsinkslots = 0; // how many heat sinks are included (for engines)
    this.engineSize = 100; // for engines, the rating

    this.mintonnage = 0; // just for jumpjets so far
    this.maxtonnage = 100; // just for jumpjets so far

    this.damage = 0;
    this.heat = 0;
    this.cooldown = 0;
    this.range = 0;
    this.maxRange = 0;
    this.dpsmax = 0; // maximum dps
    this.ammoper = 0; // ammo per ton
    this.hps = 0; // heat per second
    this.ehs = 0; // effective heatsinks
    this.rosechartdata = null; // object for chart secret information
    this.elements = []; // track actual on screen elements associated with this item
    this.relatedItems = {}; //track related 'internal' style stuff related to item (xl engine wings)
}