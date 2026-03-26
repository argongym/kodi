const config = require('./config.js');
const server = require('./server.js');
const movies = require('./movies.js');
const torrents = require('./torrents.js');
const templates = require('./templates.js');
const rutracker = require('./rutracker.js');

server.start({ port: config.http_port }).addRoutes({

	'/': async (req, res) => {
		let list = await movies.getAll();
		let unknowns = await movies.unknowns();
		let content = templates.fetch('media', { URL: req.url, movies: list, unknowns: unknowns } );
		res.html(content);
	},

	'/search': async (req, res) => {
		let items = await rutracker.search({ days: req.parsedURL.query.days, phrase: req.parsedURL.query.phrase, order: req.parsedURL.query.order });
		let content = templates.fetch('search', { URL: req.url, torrents: items, phrase: req.parsedURL.query.phrase} );
		res.html(content);
	},

	'/torrents/add': async (req, res) => {
		const filename = req.parsedURL.query.name + '.' + req.parsedURL.query.year;
		const torrentData = await rutracker.download(req.parsedURL.query.tid);
		const info = await torrents.add(torrentData, req.parsedURL.query.tid, filename);
		res.stringify(info);
	},

	'/torrents/status': async (req, res) => {
		let info = await torrents.status();
		res.stringify(info);
	},

	'/torrents/remove': async (req, res) => {
		let info = await torrents.remove(req.parsedURL.query.tid);
		res.stringify(info);
	},

	'/torrents/pause': async (req, res) => {
		let info = await torrents.pause(req.parsedURL.query.tid);
		res.stringify(info);
	},

	'/torrents/resume': async (req, res) => {
		let info = await torrents.resume(req.parsedURL.query.tid);
		res.stringify(info);
	},

	'/movies/rename': async (req, res) => {
		let info = await movies.rename(req.parsedURL.query.source, req.parsedURL.query.target);
		res.stringify(info);
	},

	'/movies/play': async (req, res) => {
		let info = await movies.play(req.parsedURL.query.path);
		res.stringify(info);
	},

	'/movies/delete': async (req, res) => {
		let info = await movies.deletePath(req.parsedURL.query.path);
		res.stringify(info);
	},

	'/movies/clean': async (req, res) => {
		let info = movies.cleanGarbage();
		res.stringify(info);
	},

	'/movies/kodi': async (req, res) => {
		let info = movies.kodi();
		res.stringify(info);
	},

	'/movies/wakeup/': async (req, res) => {
		let info = movies.wakeup();
		res.stringify(info);
	},

	'/test-flow': async (req, res) => {
		const fs = require('fs');
		const path = require('path');
		try {
			let result = [];
			const config = require('./config.js');
			if (!fs.existsSync(config.torrents_tmp)) fs.mkdirSync(config.torrents_tmp, { recursive: true });
			if (!fs.existsSync(config.torrents_dest)) fs.mkdirSync(config.torrents_dest, { recursive: true });
			if (!fs.existsSync(config.movies_dest)) fs.mkdirSync(config.movies_dest, { recursive: true });

			const mockRelativePath = 'TestFolder/TestMovie.mp4';
			const mockAbsolutePath = path.join(config.torrents_tmp, mockRelativePath);
			if (!fs.existsSync(path.dirname(mockAbsolutePath))) fs.mkdirSync(path.dirname(mockAbsolutePath), { recursive: true });
			fs.writeFileSync(mockAbsolutePath, 'mock_movie_data');
			result.push(`Created mock file at: ${mockAbsolutePath}`);

			const filename = 'Tested_Movie';
			const torrent = { files: [{ path: mockAbsolutePath }] };

			const movieFiles = torrent.files.filter(file => file.path.match(config.video_extensions ?? /\.(avi|mkv|mp4|mov|wmv|mpg|mpeg|m4v|mpe|mpv)$/i));
			movieFiles.forEach((file, index) => {
				const ext = path.extname(file.path);
				const dir = path.dirname(file.path);
				const newName = path.join(dir, `${filename}${movieFiles.length > 1 ? `.${index + 1}` : ''}${ext}`);
				fs.renameSync(file.path, newName);
				result.push(`Renamed: ${file.path} -> ${newName}`);
				file.renamedPath = newName;
			});

			torrent.files.forEach(function(file){
				let currentPath = file.renamedPath || file.path;
				let dest = config.torrents_dest + currentPath.replace(config.torrents_tmp, '');
				if(config.torrents_tmp != config.torrents_dest){
					result.push(`Copying from ${currentPath} to ${dest}`);
					fs.cpSync(currentPath, dest, {recursive:true, force:true});
					fs.rmSync(currentPath, {recursive:true, force:true});
				};
				if(config.movies_dest != config.torrents_dest){
					let target = config.movies_dest + currentPath.replace(config.torrents_tmp, '');
					result.push(`Renaming to target ${target}`);
					if (!fs.existsSync(path.dirname(target))) fs.mkdirSync(path.dirname(target), { recursive: true });
					fs.renameSync(dest, target); // Simulate movies.rename logic roughly
				}
			});

			res.stringify({ status: 'SUCCESS', log: result });
		} catch(e) {
			res.stringify({ status: 'FAILED', error: e.stack });
		}
	},
});