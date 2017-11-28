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
		if (url.includes('/comments/') || !parsedURL.pathname.includes('.') || parsedURL.pathname.split('.').pop() == 'html') {
			if (url.includes('v.redd.it') || url.includes('gfycat.com')) {
				return 'expando';
			}
			try {
				let xhr = '<div>' + await makeRequest("GET", url) + '</div>';
				let xml = $($.parseHTML(xhr));
				let special;
				if (url.includes('flickr')) {
					special = xml.find('img.main-photo').attr('src');
					if (special) {
						special = 'https://' + special.slice(2);
					}
				}
				if (url.includes('/comments/')) {
					special = xml.find('.expando').html();
					if (special) {
						return special;
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
				log(err);
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
			url = 'https' + url.slice(4);
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
				content = '<img src="' + url + '" style="max-width:100vw; max-height:100vh"';
		}
		content += ' onerror="this.style=\'display:none\'">';
		return '<div class="full-res-img col-12 m-0 p-0"><center>' + content + '</center></div>';
	}

	async function editPage(url) {
		$('head').append(`
<link href="https://fonts.googleapis.com/icon?family=Material+Icons"
rel="stylesheet">
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.2/css/bootstrap.min.css" integrity="sha384-PsH8R72JQ3SOdhVi3uxftmaW6Vc51MKb0q5P2rRUpPvrszuE4W1povHYgTpBfshb" crossorigin="anonymous">
<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.3/umd/popper.min.js" integrity="sha384-vFJXuSJphROIrBnz7yo7oB41mKfc8JzQZiCq4NCceLEaO4IHwicKwpJf9c9IpFgh" crossorigin="anonymous"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.2/js/bootstrap.min.js" integrity="sha384-alpBpkh1PFOepccYVYDB4do5UnbKysX5WZXm3XxPqe5iKTfUKjNkCk9SaVuEZflJ" crossorigin="anonymous"></script>
`);
		$('.listing-chooser').attr('style', 'display: none!important');
		$('.infobar').attr('style', 'display: none!important');
		$('.menuarea').attr('style', 'display: none!important');
		let commentsPage = url.includes('comments');
		if (commentsPage) {
			$('.tabmenu').attr('style', 'display: none!important');
			$('#siteTable').attr('style', 'display: none!important');
			$('#header').attr('style', 'display: none!important');
		}
		$('.spacer').replaceWith($('.spacer').last());
		$('#chat').attr('style', 'display: none!important');

		$('.content').addClass('container');
		$('.content').attr('style', 'width: 100vw!important; max-width: 100vw!important;');
		$('.spacer').addClass('row');
		$('#siteTable').addClass('col-12 m-0 p-0');

		let list = $('.sr-list').children();
		list.eq(1).attr('style', 'display:none!important');
		list.eq(2).attr('style', 'display:none!important');

		let things = [];
		$('.thing').each(function (i, elem) {
			$(this).addClass('row m-0 p-0' + ((!commentsPage) ? ' justify-content-center' : ''));
			//			$(this).children().wrapAll('<div class="thing-children col-12 m-0 p-0"><div class="row justify-content-center m-0 p-0"></div></div>');
			things[i] = $(this);
		});
		for (let i = 0; i < things.length; i++) {
			try {
				things[i].find('.thumbnail').wrapAll('<div class="thumbnail-div col-1 mx-0 my-auto p-0"></div>');
				let content;
				if (!opt.l) {
					let data_url = things[i].attr('data-url');
					content = await getContent(data_url);
					if (content == 'expando') {
						content = things[i].find('.expando').attr('data-cachedhtml');
						content = '<div class="full-res-content col-12 m-0 p-0"><center>' + content + '</center></div>';
					}
					if (content) {
						try {
							things[i].prepend(content);
							things[i].find('.thumbnail-div').remove();
						} catch (err) {
							log(err);
						}
					}
				}
				if (!commentsPage) {
					things[i].find('.parent').remove();
					things[i].find('.rank').remove();

					let entryClass;
					if (content) {
						entryClass = 'col-11 col-md-9 col-lg-7 m-0 p-0';
					} else {
						entryClass = 'col-10 col-md-8 col-lg-6 m-0 p-0';
					}
					things[i].find('.midcol').addClass('col-1 mx-0 my-auto p-0');
					things[i].find('.entry').addClass(entryClass);

					things[i].find('.top-matter').addClass('row m-0 p-0');
					let topMatter = things[i].find('.top-matter');
					topMatter.find('.title').eq(0).wrapAll('<div class="title-div col-12 m-0 p-0"></div>');
					topMatter.find('.tagline').eq(0).wrapAll('<div class="tagline-div col-auto mr-auto m-0 p-0"></div>');
					topMatter.find('.flat-list').eq(0).wrapAll('<div class="tagline-div col-auto m-0 p-0"></div>');
					things[i].find('.child').addClass('col-12 m-0 p-0');
					things[i].find('.clearleft').addClass('col-12 m-0 p-0');
				}
				things[i].find('.arrow').addClass('material-icons mx-auto my-0 p-0');

				let interact = things[i].find('.flat-list');

				let bylinks = interact.find('.bylink').text('');
				bylinks.parent().attr('style', 'display:none!important');

				let comment = interact.find('.first');
				comment.children().text('');
				if (!commentsPage) {
					let commentsUrl = comment.children().attr('href');
					comment.after(`
<li class="comment-popup-button">
	<a class="comment-load-page" href="javascript: void 0;">
		<i class="material-icons md-light"> comment </i>
	</a>
</li>`);
				} else {
					let gold = interact.find('.give-gold-button').children();
					gold.text('');
					gold.prepend('<i class="material-icons md-light"> star_border </i>');

					let reply = interact.find('.reply-button').children();
					reply.text('');
					reply.prepend('<i class="material-icons md-light"> reply </i>');
				}
				let share = interact.find('.share').children();
				share.text('');
				share.children().text('');
				share.addClass('post-sharing-button');
				share.prepend('<i class="material-icons md-light"> link </i>');

				let save = interact.find('.save-button').children();
				save.text('');
				save.prepend('<i class="material-icons md-light"> bookmark_border </i>');

				interact.find('.hide-button').parent().addClass('hidepost-button');
				let hide = interact.find('.hide-button').find('span').children();
				hide.text('');
				hide.prepend('<i class="material-icons md-light"> highlight_off </i>');

				let report = interact.find('.report-button').children();
				report.text('');
				report.prepend('<i class="material-icons md-light"> report </i>');

				let crosspost = interact.find('.crosspost-button').children();
				crosspost.text('');
				crosspost.prepend('<i class="material-icons md-light"> repeat </i>');

				things[i].find('.expando').attr('style', 'display: none!important');
				things[i].find('.expando-button').attr('style', 'display: none!important');
			} catch (err) {
				log(err);
			}
		}
	}

	log('qashto reddit-uhd loading...');
	editPage(window.location.href);
});
