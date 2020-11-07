const { VLC } = require("node-vlc-http");
const config = require("../config/config.json").vlc;
const Helper = require("./Helper");

const helper = new Helper();

class vlc_client extends VLC {
	constructor() {
        config.triesInterval = config.refreshMs;
		config.tickLengthMs = config.refreshMs;
		delete config.refreshMs;
        
		super(config);
        
		this.justStarted = true;
        
        this.events();
	}

	events() {
		super.addListener("metachange", (meta) => meta);

		super.on("statuschange", async (prev = null, status = null) => {
			if (!await helper.isStatusOK(status)) return;

			if (this.justStarted || (!await helper.isStatusOK(prev) || prev.information.category.meta.filename) !== status.information.category.meta.filename) {
				const formattedMeta = await helper.tryFormat(status.information.category.meta);

				if(!formattedMeta) return;

				super.emit("metachange", formattedMeta);
			}

			if (this.justStarted) this.justStarted = false;
		});

		super.on("connect", () => {
			console.log("Connected to VLC.");
		});

		super.on("error", (err) => {
			if (!err.message.includes("ECONNREFUSED")) {
				console.log(`VLC | ${err.message}`);
			}
		});
	}
}

module.exports = vlc_client;
