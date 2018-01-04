$(function () {
	const log = console.log;
	let opt = {
		v: true
	};

	$.fn.swapWith = function (that) {
		var $this = this;
		var $that = $(that);

		// create temporary placeholder
		var $temp = $("<div>");

		// 3-step swap
		$this.before($temp);
		$that.before($this);
		$temp.after($that).remove();

		return $this;
	}

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
		if (url.includes('gfycat.com')) {
			content = '<video controls="" name="media" loop=""><source src="' + url.replace('gfycat', 'giant.gfycat') + '.webm" type="video/webm" loop=""></video>';
			return '<div class="full-res-img col-12 m-0 p-0"><center>' + content + '</center></div>';
		}
		if (url.includes('/comments/') || !parsedURL.pathname.includes('.') || parsedURL.pathname.split('.').pop() == 'html') {
			if (url.includes('v.redd.it')) {
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
				if (url.includes('gfycat.com')) {
					return
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
<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.3/umd/popper.min.js" integrity="sha384-vFJXuSJphROIrBnz7yo7oB41mKfc8JzQZiCq4NCceLEaO4IHwicKwpJf9c9IpFgh" crossorigin="anonymous"></script>
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.2/css/bootstrap.min.css" integrity="sha384-PsH8R72JQ3SOdhVi3uxftmaW6Vc51MKb0q5P2rRUpPvrszuE4W1povHYgTpBfshb" crossorigin="anonymous">
`);
		$('.listing-chooser').attr('style', 'display: none!important');
		$('.infobar').attr('style', 'display: none!important');
		$('iframe').remove();

		let commentsPage = url.includes('comments');
		if (!commentsPage) {
			$('form#search').children().eq(0).addClass('form-control form-control-sm reddit-search mx-0 my-auto p-auto');
			$('form#search').children().eq(1).remove();
			$('ul.sr-bar').eq(1).remove();
			$('#header-bottom-left').eq(0).append($('form#search').detach());
			$('div.sr-list').eq(0).append($('#header-bottom-right').detach());
			$('span.separator').remove();

			let bar = $('ul.sr-bar').children();
			bar.eq(0).children().eq(0).text('');
			bar.eq(0).children().eq(0).prepend('<i class="material-icons md-light md-8 px-1"> home </i>');
			bar.eq(1).children().eq(0).text('');
			bar.eq(1).children().eq(0).prepend('<i class="material-icons md-light md-8 px-1"> people </i>');
			bar.eq(2).children().eq(0).text('');
			bar.eq(2).children().eq(0).prepend('<i class="material-icons md-light md-8 px-1"> public </i>');
			bar.eq(3).children().eq(0).text('');
			bar.eq(3).children().eq(0).prepend('<i class="material-icons md-light md-8 px-1"> shuffle </i>');
			bar.eq(4).children().eq(0).text('');
			bar.eq(4).children().eq(0).prepend('<i class="material-icons md-light md-8 px-1"> face </i>');
			let tabs = $('ul.tabmenu').children();
			tabs.eq(0).children().eq(0).text('');
			tabs.eq(0).children().eq(0).prepend('<i class="material-icons md-light"> whatshot </i>');
			tabs.eq(1).children().eq(0).text('');
			tabs.eq(1).children().eq(0).prepend('<i class="material-icons md-light"> fiber_new </i>');
			tabs.eq(2).children().eq(0).text('');
			tabs.eq(2).children().eq(0).prepend('<i class="material-icons md-light"> trending_up </i>');
			tabs.eq(3).children().eq(0).text('');
			tabs.eq(3).children().eq(0).prepend('<i class="material-icons md-light"> announcement </i>');
			tabs.eq(4).children().eq(0).text('');
			tabs.eq(4).children().eq(0).prepend('<i class="material-icons md-light"> vertical_align_top </i>');
			tabs.eq(5).children().eq(0).text('');
			tabs.eq(5).children().eq(0).prepend('<i class="material-icons md-light"> account_balance </i>');
			tabs.eq(6).children().eq(0).text('');
			tabs.eq(6).children().eq(0).prepend('<i class="material-icons md-light"> language </i>');

			$('#header-bottom-right').children().addClass('pl-1');
			$('.menuarea').attr('style', 'display: none!important');
			$('.spacer').replaceWith($('.spacer').last());
			$('.spacer').addClass('row');
		} else {
			$('.tabmenu').remove();
			$('#header').remove();
			$('div.footer-parent').remove();
			$('.side').eq(0).remove();
		}
		$('#chat-app').attr('style', 'display: none!important');

		$('.content').addClass('container');
		$('.content').attr('style', 'width: 100vw!important; max-width: 100vw!important;');
		$('#siteTable').addClass('col-12 m-0 p-0');
		$('.thumbnail').wrap('<div class="thumbnail-div col-1 mx-0 my-auto p-0"></div>');

		let things = [];
		$('.thing').each(function (i, elem) {
			$(this).addClass('row m-0 p-0' + ((!commentsPage) ? ' justify-content-center' : ''));
			things[i] = $(this);
		});
		for (let i = 0; i < things.length; i++) {
			try {
				let content;
				if (!commentsPage && !things[i].hasClass('spoiler')) {
					if (!opt.l) {
						let data_url = things[i].attr('data-url');
						if (!commentsPage) {
							content = await getContent(data_url);
						}
						if ((commentsPage && data_url.includes('comments')) || content == 'expando') {
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
				}
				things[i].find('.parent').remove();
				things[i].find('.rank').remove();
				let entryClass;
				if (commentsPage) {
					entryClass = 'col-12 m-0 p-0';
				} else if (content) {
					entryClass = 'col-11 col-md-9 col-lg-7 m-0 p-0';
				} else {
					entryClass = 'col-10 col-md-8 col-lg-6 m-0 p-0';
				}
				things[i].find('.entry').addClass(entryClass);

				things[i].find('.top-matter').addClass('row m-0 p-0');
				let topMatter = things[i].find('.top-matter');
				topMatter.find('.title').eq(0).wrapAll('<div class="title-div col-12 m-0 px-0 pb-0"></div>');
				topMatter.find('.tagline').eq(0).wrapAll('<div class="tagline-div col-auto mr-auto m-0 p-0"></div>');
				topMatter.find('.flat-list').eq(0).wrapAll('<div class="tagline-div col-auto m-0 p-0"></div>');
				things[i].find('.child').addClass('col-12 m-0 p-0');
				things[i].find('.clearleft').addClass('col-12 m-0 p-0');


				things[i].find('.arrow').addClass('material-icons mx-auto my-0 p-0');

				let interact = things[i].find('.flat-list');

				let bylinks = interact.find('.bylink').text('');
				bylinks.parent().attr('style', 'display:none!important');

				let crosspost = interact.find('.crosspost-button').children();
				crosspost.text('');
				crosspost.prepend('<i class="material-icons md-light"> repeat </i>');

				let modalName = crosspost.attr('data-crosspost-fullname') + '_qaru-modal';
				let comment = interact.find('.first');
				comment.children().text('');
				if (!commentsPage) {
					things[i].find('.midcol').addClass('col-1 mx-0 my-auto p-0');
					let commentsUrl = comment.children().attr('href');
					//					comment.after(`
					//<li class="comment-popup-button">
					//	<a type="button" data-toggle="modal" data-target="#modal${i}">
					//		<i class="material-icons md-light"> comment </i>
					//	</a>
					//</li>`);
					comment.after(`
<li class="comment-popup-button">
	<a target="_blank" href="${things[i].attr('data-permalink')}">
		<i class="material-icons md-light"> comment </i>
	</a>
</li>`);
					let save = interact.find('.save-button').children();
					save.text('');
					save.prepend('<i class="material-icons md-light"> bookmark_border </i>');

					let share = interact.find('.share').children();
					share.text('');
					share.children().text('');
					share.addClass('post-sharing-button');
					share.prepend('<i class="material-icons md-light"> link </i>');

					interact.find('.hide-button').parent().addClass('hidepost-button');
					let hide = interact.find('.hide-button').find('span').children();
					hide.text('');
					hide.prepend('<i class="material-icons md-light"> highlight_off </i>');

					let report = interact.find('.report-button').children();
					report.text('');
					report.prepend('<i class="material-icons md-light"> report </i>');
					things[i].find('.expando').attr('style', 'display: none!important');
					things[i].find('.expando-button').attr('style', 'display: none!important');
					things[i].find('a.title').attr('target', '_blank');
					//					$('body').append(`
					//<div class="modal fade" id="modal${i}" tabindex="-1" role="dialog" aria-hidden="true">
					//  <div class="modal-dialog" role="document">
					//    <div class="modal-content">
					//        <iframe src="${things[i].attr('data-permalink')}"></iframe>
					//    </div>
					//  </div>
					//</div>
					//					`);
				} else if (i == 0) {
					$('#siteTable').addClass('col-xl-4 col-lg-6 col-md-8 col-sm-10 col-xs-12 m-0 p-0');
					$('.commentarea').addClass('col-xl-4 col-lg-6 col-md-8 col-sm-10 col-xs-12 m-0 px-3 py-0');
					$('#siteTable').wrap('<div class="row justify-content-center">');
					$('.commentarea').wrap('<div class="row justify-content-center">');
					$('.panestack-title').addClass('row justify-content-center m-0');
					$('.menuarea').addClass('m-0 pl-3');
					$('.menuarea').children().eq(0).attr('style', 'vertical-align: -webkit-baseline-middle;');
					$('.panestack-title').append($('.menuarea').detach());
					$('.title-button').addClass('px-0 my-auto');
					$('.usertext-edit').parent().addClass('row justify-content-center');
					$('.usertext-edit').addClass('col-10');
					$('.usertext-edit').children().eq(0).children().eq(0).addClass('form-control mx-auto my-auto');
					$('.help-hoverable').parent().attr('style', 'display: none!important;');

					if (things[i].hasClass('spoiler') || things[i].find('.usertext').length) {
						things[i].find('.expando').addClass('col-12 m-0 px-auto py-0');
						things[i].prepend(things[i].find('.expando').detach());
					} else {
						things[i].remove();
					}
					things[i].find('.thumbnail').remove();
					things[i].find('.midcol').attr('style', 'display: none!important');
					things[i].find('.entry').attr('style', 'display: none!important');
				} else {
					comment.attr('style', 'display:block!important;');
					comment.children().eq(0).prepend('<i class="material-icons md-light md-8"> code </i>');

					let embed = interact.find('.embed-comment');
					embed.parent().attr('style', 'display: none!important');
					//					embed.text('');
					//					embed.prepend('<i class="material-icons md-light md-8"> code </i>');

					let save = interact.find('.save-button').children();
					save.text('');
					save.prepend('<i class="material-icons md-ligh md-8"> bookmark_border </i>');

					let gold = interact.find('.give-gold-button').children();
					gold.text('');
					gold.prepend('<i class="material-icons md-light md-8"> star_border </i>');

					let reply = interact.find('.reply-button').children();
					reply.text('');
					reply.prepend('<i class="material-icons md-light md-8"> reply </i>');

					let del = interact.find('.togglebutton');
					del.text('');
					del.eq(0).prepend('<i class="material-icons md-light md-8"> do_not_disturb_on </i>');
					del.eq(1).prepend('<i class="material-icons md-light md-8"> delete </i>');

					let edit = interact.find('.edit-usertext');
					edit.text('');
					edit.prepend('<i class="material-icons md-light md-8"> mode_edit </i>');

					things[i].find('.sitetable').addClass('col-12 m-0');
					things[i].find('.flat-list').addClass('m-0');
					for (let j = 0; j < 3; j++) {
						let score = things[i].find('.score').eq(j);
						score.text(score.text().split(' ')[0]);
						score.addClass('md-8 mx-0 my-auto p-0 comment-score-text');
						things[i].find('.arrow').eq(0).after(score.detach());
					}
					things[i].find('.arrow').addClass('md-8 comment-vote-arrow mx-0 my-auto');
					things[i].find('.midcol').addClass('comment-vote m-0 p-0');
					things[i].find('.flat-list').addClass('comment-button-list');
					//					things[i].find('p.tagline').eq(0).replaceWith(things[i].find('p.tagline').eq(0).children().wrap('<div class="tagline">'));
					things[i].find('p.tagline').eq(0).after(things[i].find('.midcol').eq(0));
					things[i].find('.midcol').eq(0).after(things[i].find('.flat-list').eq(0));
					things[i].find('div.usertext-body').addClass('col-12 m-0 p-0');
				}
			} catch (err) {
				log(err);
			}
		}
	}

	log('qashto reddit-uhd loading...');
	editPage(window.location.href);
});
