const Tracker = require("./Tracker");
const VLC_client = require("./VLC-client");
const Helper = require("./Helper");

const tracker = new Tracker();
const vlc = new VLC_client();

vlc.on("metachange", async (meta) => {
	let series = await tracker.fetch();

	tracker.consume(meta, series);
});
