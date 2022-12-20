const METADATA = {
    website: "https://github.com/RevenMyst/ShapeZMod",
    author: "Reven",
    name: "Logic Clock",
    version: "1.0.1",
    id: "reven-logic-clock-mod",
    description: "Adds a programmable clock on the wire level",
    minimumGameVersion: ">=1.5.0",
    modId: "1791904"
};

class ClockComponent extends shapez.Component {
    static getId() {
        return "Clock";
    }
    constructor() {
        super();
        this.lastTime = 0;
        this.isOn = false;
        this.up = 1;
        this.down = 1;
        
    }
    static getSchema() {
        return {
            isOn: shapez.types.bool,
            up: shapez.types.int,
            down: shapez.types.int,
        };
    }
}

class ClockSystem extends shapez.GameSystemWithFilter {
    constructor(root) {
        super(root, [ClockComponent]);
        this.on = new shapez.BooleanItem(1);
        this.off = new shapez.BooleanItem(0);

        this.root.signals.entityManuallyPlaced.add(entity => {
            const editorHud = this.root.hud.parts.ClockEdit;
            
            if (editorHud) {
                editorHud.editClockValues(entity, { deleteOnCancel: true });
            }
        });
    }



    update() {
        for (let i = 0; i < this.allEntities.length; ++i) {

            const entity = this.allEntities[i];
            const wireComp = entity.components.WiredPins;
            const clockComp = entity.components.Clock;

            

            if (clockComp.isOn && this.root.time.now() - clockComp.lastTime > clockComp.up/10) {
                

                clockComp.lastTime = this.root.time.now()
                clockComp.isOn = false;
                wireComp.slots[0].value = this.off
            } else if(!clockComp.isOn && this.root.time.now() - clockComp.lastTime > clockComp.down/10) {
                clockComp.lastTime = this.root.time.now()
                clockComp.isOn = true;
                wireComp.slots[0].value = this.on
            }
                
            
        }
    }

}

class MetaClockBuilding extends shapez.ModMetaBuilding {
    constructor() {
        super("Clock");
    }

    getIsUnlocked(root) {
        return shapez.enumHubGoalRewards.reward_constant_signal;
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: shapez.defaultBuildingVariant,
                name: "Clock",
                description: "Activates the wire given a certain interval",

                regularImageBase64: RESOURCES["clock.png"],
                blueprintImageBase64: RESOURCES["clockBlueprint.png"],
                tutorialImageBase64: RESOURCES["clock.png"],
            },
        ];
    }

    getLayer() {
        return "wires";
    }


    getRenderPins() {
        return false;
    }
    

    setupEntityComponents(entity) {

        // add ejector
        entity.addComponent(
            new shapez.WiredPinsComponent({
                slots: [
                    {
                        pos: new shapez.Vector(0, 0),
                        direction: shapez.enumDirection.top,
                        type: shapez.enumPinSlotType.logicalEjector
                    },
                ],
            })
        );

        // set custom processor 
        entity.addComponent(new ClockComponent());

    }
}

class HUDClockEdit extends shapez.BaseHUDPart {
    initialize() {
        this.root.camera.downPreHandler.add(this.downPreHandler, this);
    }

    
    downPreHandler(pos, button) {
        

        const tile = this.root.camera.screenToWorld(pos).toTileSpace();
        const contents = this.root.map.getLayerContentXY(tile.x, tile.y, "wires");
        if (contents) {
            const clockComp = contents.components.Clock;
            if (clockComp) {
                if (button === shapez.enumMouseButton.left) {
                    this.editClockValues(contents, {
                        deleteOnCancel: false,
                    });
                    return shapez.STOP_PROPAGATION;
                }
            }
        }
    }

    
    editClockValues(entity, { deleteOnCancel = true }) {
        const clockComp = entity.components.Clock;
        if (!clockComp) {
            return;
        }

        const uid = entity.uid;

        const upInput = new shapez.FormElementInput({
            id: "up",
            placeholder: "UP period",
            defaultValue: clockComp.up.toString(),
            validator: val => parseInt(val) > 0 ,
        });
        console.log(clockComp.perSec)
        const downInput = new shapez.FormElementInput({
            id: "down",
            placeholder: "DOWN period",
            defaultValue: clockComp.down.toString(),
            validator: val => parseInt(val) > 0 ,
        });

        // create the dialog & show it
        const dialog = new shapez.DialogWithForm({
            app: this.root.app,
            title: "Logic Clock",
            desc: "Enter the number of tenth of second you want the signal to be up (true) or down (false)",
            formElements: [upInput,downInput],
            buttons: ["cancel:bad:escape", "ok:good:enter"],
            closeButton: false,
        });
        this.root.hud.parts.dialogs.internalShowDialog(dialog);

        // When confirmed, set the text
        dialog.buttonSignals.ok.add(() => {
            if (!this.root || !this.root.entityMgr) {
                // Game got stopped
                return;
            }

            const entityRef = this.root.entityMgr.findByUid(uid, false);
            if (!entityRef) {
                // outdated
                return;
            }

            const clockComp = entityRef.components.Clock;
            if (!clockComp) {
                // no longer interesting
                return;
            }

            // set the text
            clockComp.up = parseInt(upInput.getValue());
            clockComp.down = parseInt(downInput.getValue());
        });

        // When cancelled, destroy the entity again
        if (deleteOnCancel) {
            dialog.buttonSignals.cancel.add(() => {
                if (!this.root || !this.root.entityMgr) {
                    // Game got stopped
                    return;
                }

                const entityRef = this.root.entityMgr.findByUid(uid, false);
                if (!entityRef) {
                    // outdated
                    return;
                }

                const clockComp = entityRef.components.Clock;
                if (!clockComp) {
                    // no longer interesting
                    return;
                }

                this.root.logic.tryDeleteBuilding(entityRef);
            });
        }
    }
}

class Mod extends shapez.Mod {
    init() {

        this.modInterface.registerComponent(ClockComponent);
        // Register the new building
        this.modInterface.registerNewBuilding({
            metaClass: MetaClockBuilding,
            buildingIconBase64: RESOURCES["clock.png"],
        });

        this.modInterface.addNewBuildingToToolbar({
            toolbar: "wires",
            location: "secondary",
            metaClass: MetaClockBuilding,
        });

        this.modInterface.registerGameSystem({
            id: "clock",
            systemClass: ClockSystem,
            before: "constantSignal",
        });

        this.modInterface.registerHudElement("ClockEdit", HUDClockEdit);


    }
}

////////////////////////////////////////////////////////////////////////

const RESOURCES = {
    "clock.png":
        " data:image/png;base64,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",

    "clockBlueprint.png":
        " data:image/png;base64,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",
};