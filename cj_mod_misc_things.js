// @ts-nocheck
const METADATA = {
    website: "example.com",
    author: "cj",
    name: "Misc CJ things",
    version: "1",
    id: "cj_mod_misc_things",
    description: "Fixes a bug and makes the game better",
    minimumGameVersion: ">=1.5.0",

    // You can specify this parameter if savegames will still work
    // after your mod has been uninstalled
    doesNotAffectSavegame: true,
};

const BeltExtension = ({ $super, $old }) => ({
    show() {
        if (document.body.getAttribute("class") === 'gameState arrived active uiHidden') {
		document.body.setAttribute("class", 'gameState arrived active');
	}
	this.visible = true;
        this.root.app.inputMgr.makeSureAttachedAndOnTop(this.inputReciever);

        const totalMinutesPlayed = Math.ceil(this.root.time.now() / 60);

        if (this.root.gameMode.hasHub()) {
            /** @type {HTMLElement} */
            const playtimeElement = this.statsElement.querySelector(".playtime");
            /** @type {HTMLElement} */
            const buildingsPlacedElement = this.statsElement.querySelector(".buildingsPlaced");
            /** @type {HTMLElement} */
            const beltsPlacedElement = this.statsElement.querySelector(".beltsPlaced");

		playtimeElement.innerText = "couldn't get this things to work and I don't gaf";
		playtimeElement.innerText = shapez.T.global.time.xMinutes.replace("<x>", `${totalMinutesPlayed}`);

        buildingsPlacedElement.innerText = shapez.formatBigNumberFull(
            this.root.entityMgr.getAllWithComponent(shapez.StaticMapEntityComponent).length -
                this.root.entityMgr.getAllWithComponent(shapez.BeltComponent).length
        );

        beltsPlacedElement.innerText = shapez.formatBigNumberFull(
            this.root.entityMgr.getAllWithComponent(shapez.BeltComponent).length
        );
	}
    },
});

class Mod extends shapez.Mod {
    init() {
        this.modInterface.extendClass(shapez.HUDSettingsMenu, BeltExtension);
        // Register keybinding
	var zoomedOutExists = 1;
        this.modInterface.registerIngameKeybinding({
            id: "cj_mod_zoomed_outness",
            keyCode: shapez.KEYCODES.F1,
            translation: "Toggle the zoomed out view existing",
            modifiers: {},
            handler: root => {
		zoomedOutExists = !zoomedOutExists;
		if (zoomedOutExists) {
			shapez.globalConfig.mapChunkOverviewMinZoom = 0.9;
		} else {
			shapez.globalConfig.mapChunkOverviewMinZoom = -1;
		}
                return shapez.STOP_PROPAGATION;
            },
        });
    }
}