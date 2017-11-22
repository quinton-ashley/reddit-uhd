$(function () {
	const log = console.log;
	let opt = {
		v: true
	};

	function makeRequest(method, url) {
		return new Promise(function (resolve, reject) {
			var xhr = new XMLHttpRequest();
			xhr.open(method, url);
			xhr.onload = function () {
				if (this.status >= 200 && this.status < 300) {
					resolve(xhr.responseText);
				} else {
					reject({
						status: this.status,
						statusText: xhr.statusText
					});
				}
			};
			xhr.onerror = function () {
				reject({
					status: this.status,
					statusText: xhr.statusText
				});
			};
			xhr.send();
		});
	}

	async function getContent(url) {
		let content = '';
		if (!url || url.slice(0, 1) == '/') {
			return null;
		}
		let parsedURL;
		try {
			parsedURL = new URL(url);
		} catch (err) {
			log(err);
			return null;
		}
		if (!parsedURL.pathname.includes('.') || parsedURL.pathname.split('.').pop() == 'html') {
			if (url.includes('v.redd.it')) {
				return 'expando';
			}
			if (url.includes('gfycat.com')) {
				return null;
			}
			let xhr = '<div>' + await makeRequest("GET", url) + '</div>';
			let xml = $($.parseHTML(xhr));
			try {
				let special;
				if (url.includes('flickr')) {
					special = xml.find('img.main-photo').attr('src');
					if (special) {
						special = 'https://' + special.slice(2);
					}
				}
				if (!special) {
					url = xml.find('meta[property="og:image"]').attr('content');
				} else {
					url = special;
				}
				if (opt.v) {
					log('RUHD log og:image: ' + url);
				}
			} catch (err) {
				log('RUHD error no reponse from url: ' + url + '\n' + err);
				return '';
			}
			if (!url || url.slice(0, 1) == '/') {
				return null;
			}
			parsedURL = new URL(url);
			if (!parsedURL.pathname.includes('.')) {
				return null;
			}
		}
		url = parsedURL.origin + parsedURL.pathname.match(/[^.]*[^\/]*/)[0];
		if (url.slice(0, 5) != 'https') {
			url = 'https' + url(4);
		}
		let ext = parsedURL.pathname.split('.').pop();
		switch (ext) {
			case 'com':
			case 'html':
				return null;
			case 'gifv':
				content = '<img src="' + url.slice(0, -1) + '" style="max-width:100%; max-height:100vh"';
				break;
			default:
				content = '<img src="' + url + '" style="max-width:100%; max-height:100vh"';
		}
		content += ' onerror="this.style=\'display:none\'">';
		return '<center>' + content + '</center>';
	}

	async function editPage(url) {
		$('head').append(`
<link href="https://fonts.googleapis.com/icon?family=Material+Icons"
rel="stylesheet">
`);
		$('.listing-chooser').remove();
		$('.side').remove();
		$('.infobar').remove();
		$('.menuarea').remove();
		$('.content').attr('style', 'margin:0px; margin-top:40px');
		let analogPage = url.includes('analog');
		let commentsPage = url.includes('comments');
		if (analogPage && !commentsPage) {
			$('.tabmenu').attr('style', 'top: 115px!important');
		} else if (commentsPage) {
			$('.tabmenu').remove();
			$('#siteTable').remove();
			$('#header').remove();
		}
		$('.spacer').replaceWith($('.spacer').last());
		$('#chat').remove();
		let things = [];
		$('.thing').each(function (i, elem) {
			things[i] = $(this);
		});
		for (let i = 0; i < things.length; i++) {
			try {
				if (!opt.l) {
					let data_url = things[i].attr('data-url');
					let content = await getContent(data_url);
					if (content == 'expando') {
						// will implement reddit videos in the future
						content = '';
					}
					if (content) {
						things[i].prepend(content);
						things[i].children('.thumbnail').remove();
					}
				}
				things[i].children('.parent').remove();

				let interact = things[i].find('.flat-list').children();

				let comment = interact.eq(0);
				comment.addClass('comment-popup-button');
				comment.removeClass('first');
				comment.children().text('');
				let commentsUrl = comment.children().attr('href');
				comment.children().remove();
				comment.prepend('<a class="comment-load-page" href="javascript: void 0;"></a>');
				comment.children().prepend('<i class="material-icons md-light"> mode_comment </i>');

				let share = interact.eq(1).children();
				share.text('');
				share.children().text('');
				share.prepend('<i class="material-icons md-light"> link </i>');

				let save = interact.eq(2).children();
				save.text('');
				save.prepend('<i class="material-icons md-light"> bookmark_border </i>');

				things[i].find('.expando').remove();
				things[i].find('.expando-button').remove();
			} catch (err) {
				log(err);
			}
		}
	}

	log('qashto reddit-uhd loading...');
	editPage(window.location.href);
});
