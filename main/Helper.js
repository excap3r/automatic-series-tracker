class Helper {
	tryFormat(meta) {
		return new Promise(async (resolve) => {
			if (!meta.showName && (meta.title || meta.filename)) meta.showName = await extractMeta(meta.title || meta.filename);

			if (!meta.showName) return resolve(false);

			const result = {
				title: meta.showName,
				series_number: meta.seasonNumber,
				episode_number: meta.episodeNumber,
			};

			return resolve(result);
		});

		function extractMeta(title) {
			return new Promise((resolve) => {
				const clearFilename = /.mkv|.mp4|.mp3|.avi|.wmv|.flv|.3gp/g;
				const clearSymbols = /[^a-zA-Z0-9ÁÉĚÍÝÓÚŮŽŠČŘĎŤŇáéěíýóúůžščřďťňs]/g;
				const reduceSpaces = /\s\s+/g;

				title = title.replace(clearFilename, "");
				title = title.replace(clearSymbols, " ");
				title = title.replace(reduceSpaces, " ").trim();

				// s = season, e = episode
				let seRegex = /S\d+E\d+|S\d+xE\d+|\d+x\d+/gi;
				let onlyNumsReg = /[^\d]/g;

				const regTest = seRegex.test(title);

				if (!meta.seasonNumber || !meta.episodeNumber) {
					let chosenRegex = regTest ? seRegex : null;

					if (!chosenRegex) return resolve(false);

					chosenRegex.lastIndex = 0;

					let SeasonAndEpisode = chosenRegex.exec(title)[0].split(/[ex]/ig);

					SeasonAndEpisode = SeasonAndEpisode.filter((element) => element.length);

					let season = SeasonAndEpisode[0].replace(onlyNumsReg, "");
					let episode = SeasonAndEpisode[1].replace(onlyNumsReg, "");

					if (!meta.seasonNumber) meta.seasonNumber = season;
					if (!meta.episodeNumber) meta.episodeNumber = episode;

					let cleanTitle = seRegex ? /(S\d+E\d+.*)|(S\d+xE\d+.*)/gim : /(\d+x\d+.*)/gim;

					title = title.replace(cleanTitle, "").trim();
					
					return resolve(title);
				}
			});
		}
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
}

module.exports = Helper;
