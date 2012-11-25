function item(id, itemName, critSlots, weight, weaponType) {
    this.id = id;
    this.itemName = itemName;
    this.weaponType = weaponType;
    this.weight = weight;
    this.critSlots = parseInt(critSlots);
    this.damage = 0;
    this.heat = 0;
    this.cooldown = 0;
    this.range = 0;
    this.maxRange = 0;
    this.dpsmax = 0;
    this.appoper = 0;
    this.hps = 0;
    this.ehs = 0;
    this.rosechartdata = null;
}