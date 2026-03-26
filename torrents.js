const fs = require('fs');
const path = require('path');
const client = new (require('webtorrent'))();
const movies = require('./movies.js');
const config = require('./config.js');

let torrents = {};

resumeTorrents();

async function add(torrentFile, tid, filename){
	filename = filename.replace(/[\:\?, ]+/g, ' ');
	return new Promise(function(resolve, reject){
		client.add(torrentFile, { path: config.torrents_tmp }, function (torrent){
			fs.writeFileSync(`${config.torrents_tmp}/${filename}.${tid}.torrent`, torrentFile);
			console.log('Downloading torrent: ', tid, '/', torrent.name, filename);
			torrent.tid = tid;
			torrents[tid] = torrent;
			torrent.on('done', function(){
				console.log('Finished downloading: ', tid, '/', torrent.name);
				const movieFiles = torrent.files.filter(file => isMovieFile(file.path));
				movieFiles.forEach((file, index) => {
					const ext = path.extname(file.path); // Get file extension
					const dir = path.dirname(file.path); // Get the directory of the file
					const relativeNewName = path.join(dir, `${filename}${movieFiles.length > 1 ? `.${index + 1}` : ''}${ext}`);
					
					const absoluteOld = path.join(config.torrents_tmp, file.path);
					const absoluteNew = path.join(config.torrents_tmp, relativeNewName);
					
					try {
						fs.renameSync(absoluteOld, absoluteNew);
						console.log(`Renamed: ${absoluteOld} -> ${absoluteNew}`);
					} catch(e) {
						console.error("Rename error:", e);
					}
					file.renamedPath = relativeNewName;
				});
				torrent.files.forEach(function(file){
					let currentRelativePath = file.renamedPath || file.path;
					let absoluteSrc = path.join(config.torrents_tmp, currentRelativePath);
					let absoluteDest = path.join(config.torrents_dest, currentRelativePath);

					if(config.torrents_tmp != config.torrents_dest){
						try {
							fs.cpSync(absoluteSrc, absoluteDest, {recursive:true, force:true});
							fs.rmSync(absoluteSrc, {recursive:true, force:true});
						} catch (e) {
							console.error("Copy error:", e);
						}
					};
					if(config.movies_dest != config.torrents_dest){
						let absoluteTarget = path.join(config.movies_dest, currentRelativePath);
						movies.rename(absoluteDest, absoluteTarget).catch(e => console.error(e));
					}
				});
				remove(tid, filename);
			});
			return resolve({
				tid: tid,
				name: torrent.name,
				downloaded: torrent.downloaded,
				downloadSpeed: torrent.downloadSpeed,
				progress: torrent.progress,
				size: torrent.length,
			});
		});
	});
}

async function remove(tid, filename){
	return new Promise(function(resolve, reject){
		client.remove(torrents[tid], function(){
			[
				config.torrents_tmp + '/' + torrents[tid].name + '/',
				config.torrents_tmp + '/' + torrents[tid].name,
				config.torrents_tmp + '/' + tid + '.torrent',
				config.torrents_tmp + '/' + filename + '.' + tid + '.torrent'
			].forEach(function(file){
				if((config.torrents_tmp == config.torrents_dest) && !file.match('.torrent')) return;
				if(fs.existsSync(file)) fs.rmSync(file, {recursive:true, force:true});
			})
			torrents[tid].destroy();
			delete torrents[tid];
			resolve({ status:"removed" });
		});
	});
}

function pause(tid){
	torrents[tid].pause();
	return { status:"paused" };
}

function resume(tid){
	torrents[tid].resume();
	return { status:"resumed" };
}

function status(){
	let status = {
		progress: formatProgress(client.progress),
		downloadSpeed: formatSpeed(client.downloadSpeed),
		uploadSpeed: formatSpeed(client.uploadSpeed),
		size: 0,
		torrents:[]
	};
	for(let tid in torrents){
		status.torrents.push({
			tid: tid,
			name: torrents[tid].name,
			downloaded: formatBytes(torrents[tid].downloaded),
			downloadSpeed: formatSpeed(torrents[tid].downloadSpeed),
			progress: formatProgress(torrents[tid].progress),
			size: formatBytes(torrents[tid].length),
		});
		status.size += torrents[tid].length;
	}
	status.active = status.torrents.length;
	status.size = formatBytes(status.size);
	return status;
}

async function resumeTorrents(){
	if(!fs.existsSync(config.torrents_tmp)){
		fs.mkdirSync(config.torrents_tmp);
		return false;
	}
	fs.readdirSync(config.torrents_tmp).forEach(file => {
		if (file.match('.torrent')) {
			console.log('Resuming torrent ' + file);
			const parts = file.split('.');
			const extension = parts.pop();
			const tid = parts.pop();
			const filename = parts.join('.');
			add(fs.readFileSync(config.torrents_tmp + '/' + file), tid, filename);
		}
	});
}

function isMovieFile(filePath) {
    return filePath.match(config.video_extensions ?? /\.(avi|mkv|mp4|mov|wmv|mpg|mpeg|m4v|mpe|mpv)$/i);
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatSpeed(bps){
	return (bps / 1024 / 1024).toFixed(2) + ' MBps';
}

function formatProgress(num){
	return (num * 100).toFixed(2) + '%';
}

module.exports = {
	add: add,
	status: status,
	remove: remove,
	pause: pause,
	resume: resume,
};
