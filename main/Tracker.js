const WPAPI = require("wpapi");
const config = require("../config/config.json")["series-tracker"];

class Tracker {
	constructor() {
		this.username = config.username;
		this.password = config.password;

		this.wpEndpoint = "http://localhost/series-tracker/wp-json";
		this.wpNamespace = "wp/v2";
		this.wpRoute = "/series/(?P<id>\\d+)";

		this.wp = null;

		this.init();
	}

	async init() {
		if (!this.username || !this.password) return this.handleError({ code: "missing_credentials" });

		// authenticate
		this.wp = new WPAPI({
			endpoint: this.wpEndpoint,

			username: this.username,
			password: this.password,
		});

		this.wp.series = this.wp.registerRoute(this.wpNamespace, this.wpRoute);
	}

	create(args) {
		if (!args.series_number) args.series_number = "01";
		if (!args.episode_number) args.episode_number = "01";

		args.status = "publish";

		this.wp
			.series()
			.create(args)
			.then(() => {
				log(`Added "${args.title}" to tracking.`);
			})
			.catch((err) => this.handleError(err));
	}

	update(args) {
		const id = args.id;
		delete args.id;

		args.status = "publish";

		this.wp
			.series()
			.id(id)
			.update(args)
			.then(() => {
				this.log(`Succesfully updated "${args.title}".`);
			})
			.catch((err) => this.handleError(err));
	}

	fetch() {
		return new Promise(async (resolve) => {
			this.wp
				.series()
				.param("status", "any")
				.then(async (series) => {
					let result = await getOnlyNeededInfo(series);
					resolve(result);
				})
				.catch((err) => {
					this.handleError(err);
					resolve(false);
				});
		});

		function getOnlyNeededInfo(series) {
			let filteredSeries = [];

			return new Promise((resolve) => {
				series.forEach((object) => {
					object.title.rendered = object.title.rendered.replace("Private: ", "");

					filteredSeries.push({
						id: object.id,
						title: object.title.rendered,
						series_number: object.series_number,
						episode_number: object.episode_number,
					});
				});

				resolve(filteredSeries);
			});
		}
	}

	consume(meta, series) {
		let upToDate = true;

		// remove diacritic
		meta.title = meta.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

		let result = null;

		for (let i = 0; i < series.length - 1; i++) {
			// remove diacrtic
			let title = series[i].title
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "")
				.toLowerCase();

			if (title == meta.title.toLowerCase()) {
				if (meta.series_number != series[i].series_number || meta.episode_number != series[i].episode_number) upToDate = false;
				result = meta;
				result.title = series[i].title;
				result.id = series[i].id;
				break;
			}
		}

		if (!result) return this.create(meta);

		if (!upToDate) return this.update(result);
	}

	getNameFromUser() {
		return new Promise(async (resolve) => {
			let name = await this.askUser("Please type your name: ");

			resolve(name);
		});
	}

	getPasswordFromUser() {
		return new Promise(async (resolve) => {
			let password = await this.askUser("Please enter your password: ");

			console.clear();

			resolve(password);
		});
	}

	/* DEPRECATED | may be used in future!
	askUser(text) {
		return new Promise(async (resolve) => {
			const rl = createInterface({
				input: process.stdin,
				output: process.stdout,
			});

			rl.question(`Tracker | ${text}`, (answer) => {
				rl.close();
				resolve(answer);
			});
		});
	}
	*/

	handleError(err) {
		switch (err.code) {
			case "incorrect_password":
				this.log("Incorrect name or password, please update your creds in config!");
				break;
			case "missing_credentials":
				this.log("Missing login credentials, please fill them in config!");
				break;
			case "invalid_username":
				this.log("Your username is not valid, please update your creds in config!");
				break;
			default:
				this.log(`ERROR!: ${err.code}`);
				break;
		}

		process.exit(1);
	}

	log(message) {
		console.log(`Tracker | ${message}`);
	}
}

module.exports = Tracker;
