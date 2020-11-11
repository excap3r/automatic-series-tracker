const Tracker = require("./Tracker");
const VLC_client = require("./VLC-client");

const tracker = new Tracker();
const vlc = new VLC_client();

vlc.on("metachange", async (meta) => {
	const series = await tracker.fetch();

	if (!series) return;
	
	tracker.consume(meta, series);
});
