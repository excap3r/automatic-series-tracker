const { VLC } = require("node-vlc-http");
const config = require("../config/config.json").vlc;
const Helper = require("./Helper");

const helper = new Helper();

class VLC_client extends VLC {
	constructor() {
		config.username = "";
		config.triesInterval = config.refreshMs;
		config.tickLengthMs = config.refreshMs;
		delete config.refreshMs;

		super(config);

		this.justStarted = true;
		
		this.events();

		this.log(`Listening on port ${config.port}.`);
	}

	events() {
		super.addListener("metachange", (meta) => meta);

		super.on("statuschange", async (prev = null, status = null) => {
			if (!(await this.isStatusOK(status))) return;

			if (this.justStarted || !(await this.isStatusOK(prev)) || prev.information.category.meta.filename !== status.information.category.meta.filename) {
				const formattedMeta = await helper.tryFormat(status.information.category.meta);

				if (!formattedMeta) return;

				super.emit("metachange", formattedMeta);
			}

			if (this.justStarted) this.justStarted = false;
		});

		super.on("connect", () => {
			this.log("Succesfully connected.");
		})

		super.on("error", (err) => {
			if (err.message.includes("ECONNREFUSED")) return;

			this.log(err.message);
		});
	}

	isStatusOK(status) {
		return new Promise((resolve) => {
			if (
				typeof status === "undefined" ||
				typeof status.information === "undefined" ||
				typeof status.information.category === "undefined" ||
				typeof status.information.category.meta === "undefined"
			) {
				return resolve(false);
			}

			return resolve(true);
		});
	}

	log(message) {
		console.log(`VLC | ${message}`);
	}
}

module.exports = VLC_client;
