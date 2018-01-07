$(function () {
	const log = console.log;
	let opt = {
		v: true
	};

	let curPageUrl = window.location.href;
	let commentsPage = curPageUrl.includes('/comments');
	let submitPage = curPageUrl.includes('/submit');
	let prefsPage = curPageUrl.includes('/prefs');
	let redditPage = !(commentsPage || submitPage || prefsPage);

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
			return '<div class="full-res-content col-12 m-0 p-0"><center>' + content + '</center></div>';
		}
		if (url.includes('/comments/') || !parsedURL.pathname.includes('.') || parsedURL.pathname.split('.').pop() == 'html') {
			if (url.includes('v.redd.it')) {
				return 'expando';
			}
			if (url.slice(0, 5) != 'https') {
				url = 'https' + url.slice(4);
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
				log('error: ' + url);
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
		return '<div class="full-res-content col-12 m-0 p-0"><center>' + content + '</center></div>';
	}

	async function editThing($thing) {
		let content;
		// data-whitelist-status="promo_adult_nsfw"
		if (((redditPage && !$thing.hasClass('spoiler')) || commentsPage) && !opt.l) {
			try {
				let data_url = $thing.attr('data-url');
				if (data_url) {
					if ((commentsPage && $thing.hasClass('spoiler')) || redditPage) {
						content = await getContent(data_url);
					}
					if ((commentsPage && data_url.includes('comments')) || content == 'expando') {
						content = $thing.find('.expando').attr('data-cachedhtml');
						content = '<div class="full-res-content col-12 m-0 p-0"><center>' + content + '</center></div>';
					}
					if (content) {
						$thing.prepend(content);
						$thing.find('.thumbnail-div').remove();
					}
				}
			} catch (err) {
				log(err);
			}
		}
		$thing.find('.parent').remove();
		$thing.find('.rank').remove();

		let entryClass;
		if (commentsPage) {
			entryClass = 'col-12 m-0 p-0';
		} else if (content) {
			entryClass = 'col-11 col-md-9 col-lg-7 m-0 p-0';
		} else {
			entryClass = 'col-10 col-md-8 col-lg-6 m-0 p-0';
		}
		$thing.find('.entry').addClass(entryClass);

		$thing.find('.top-matter').addClass('row m-0 p-0');
		let $topMatter = $thing.find('.top-matter');
		$topMatter.find('.title').eq(0).wrapAll('<div class="title-div col-12 m-0 px-0 pb-0"></div>');
		$topMatter.find('.tagline').eq(0).wrapAll('<div class="tagline-div col-auto mr-auto m-0 p-0"></div>');
		$topMatter.find('.flat-list').eq(0).wrapAll('<div class="tagline-div col-auto m-0 p-0"></div>');
		$thing.find('.child').addClass('col-12 m-0 p-0');
		$thing.find('.clearleft').addClass('col-12 m-0 p-0');


		$thing.find('.arrow').addClass('material-icons mx-auto my-0 p-0');

		let $interact = $thing.find('.flat-list');

		let $bylinks = $interact.find('.bylink').text('');
		$bylinks.parent().attr('style', 'display:none!important');

		let $crosspost = $interact.find('.crosspost-button').children();
		$crosspost.text('');
		$crosspost.prepend('<i class="material-icons md-light"> repeat </i>');

		let modalName = $crosspost.attr('data-crosspost-fullname') + '_qaru-modal';
		let $comment = $interact.find('.first');
		$comment.children().text('');
		if (redditPage) {
			$thing.find('.midcol').addClass('col-1 mx-0 my-auto p-0');
			let commentsUrl = $comment.children().attr('href');
			$comment.after(`
<li class="comment-popup-button">
	<a target="_blank" href="${$thing.attr('data-permalink')}">
		<i class="material-icons md-light"> comment </i>
	</a>
</li>`);
			let $save = $interact.find('.save-button').children();
			$save.text('');
			$save.prepend('<i class="material-icons md-light"> bookmark_border </i>');

			let $share = $interact.find('.share').children();
			$share.text('');
			$share.children().text('');
			$share.addClass('post-sharing-button');
			$share.prepend('<i class="material-icons md-light"> link </i>');

			$interact.find('.hide-button').parent().addClass('hidepost-button');
			let hide = $interact.find('.hide-button').find('span').children();
			hide.text('');
			hide.prepend('<i class="material-icons md-light"> highlight_off </i>');

			let $report = $interact.find('.report-button').children();
			$report.text('');
			$report.prepend('<i class="material-icons md-light"> report </i>');
			$thing.find('.expando').attr('style', 'display: none!important');
			$thing.find('.expando-button').attr('style', 'display: none!important');
			$thing.find('a.title').attr('target', '_blank');
		} else if (commentsPage) {
			$comment.attr('style', 'display:block!important;');
			$comment.children().eq(0).prepend('<i class="material-icons md-light md-8"> code </i>');

			let $embed = $interact.find('.embed-comment');
			$embed.parent().attr('style', 'display: none!important');

			let $save = $interact.find('.save-button').children();
			$save.text('');
			$save.prepend('<i class="material-icons md-ligh md-8"> bookmark_border </i>');

			let $gold = $interact.find('.give-gold-button').children();
			$gold.text('');
			$gold.prepend('<i class="material-icons md-light md-8"> star_border </i>');

			let $reply = $interact.find('.reply-button').children();
			$reply.text('');
			$reply.prepend('<i class="material-icons md-light md-8"> reply </i>');

			let $del = $interact.find('.togglebutton');
			$del.text('');
			$del.eq(0).prepend('<i class="material-icons md-light md-8"> do_not_disturb_on </i>');
			$del.eq(1).prepend('<i class="material-icons md-light md-8"> delete </i>');

			let $edit = $interact.find('.edit-usertext');
			$edit.text('');
			$edit.prepend('<i class="material-icons md-light md-8"> mode_edit </i>');

			$thing.find('.sitetable').addClass('col-12 m-0');
			$thing.find('.flat-list').addClass('m-0');
			for (let j = 0; j < 3; j++) {
				let $score = $thing.find('.score').eq(j);
				$score.text($score.text().split(' ')[0]);
				$score.addClass('md-8 mx-0 my-auto p-0 comment-score-text');
				$thing.find('.arrow').eq(0).after($score.detach());
			}
			$thing.find('.arrow').addClass('md-8 comment-vote-arrow mx-0 my-auto');
			$thing.find('.midcol').addClass('comment-vote m-0 p-0');
			$thing.find('.flat-list').addClass('comment-button-list');
			$thing.find('p.tagline').eq(0).after($thing.find('.midcol').eq(0));
			$thing.find('.midcol').eq(0).after($thing.find('.flat-list').eq(0));
			$thing.find('div.usertext-body').addClass('col-12 m-0 p-0');
		}
	}

	async function mutationCallback(mutationsList) {
		for (let mutation of mutationsList) {
			if (mutation.type == 'childList') {
				log('A child node has been added or removed.');
				let newNodes = mutation.addedNodes;
				if (newNodes) {
					let $nodes = $(newNodes);
					for (let i = 0; i < $nodes.length; i++) {
						let $node = $nodes[i];
						if ($node.hasClass('thing')) {
							try {
								await editThing($node);
							} catch (err) {
								log(err);
							}
						}
					}
				}
			}
		}
	}

	async function editPage() {
		$('head').append(`
<link href="https://fonts.googleapis.com/icon?family=Material+Icons"
rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.3/umd/popper.min.js" integrity="sha384-vFJXuSJphROIrBnz7yo7oB41mKfc8JzQZiCq4NCceLEaO4IHwicKwpJf9c9IpFgh" crossorigin="anonymous"></script>
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.2/css/bootstrap.min.css" integrity="sha384-PsH8R72JQ3SOdhVi3uxftmaW6Vc51MKb0q5P2rRUpPvrszuE4W1povHYgTpBfshb" crossorigin="anonymous">
`);
		$('.listing-chooser').attr('style', 'display: none!important');
		$('.infobar').attr('style', 'display: none!important');
		$('iframe').remove();
		$('body').addClass('container-fluid');
		$('input[type=text]').addClass('form-control m-0');
		$('input[type=url]').addClass('form-control m-0');
		$('textarea').addClass('form-control');

		if (redditPage) {
			$('#header').addClass('row');
			$('#sr-header-area').addClass('col-8 px-1');
			$('#header-bottom-left').addClass('col-8 col-lg-10 px-1');
			$('#header-bottom-left').children().eq(0).remove();
			$('form#search').children().eq(0).addClass('form-control-sm reddit-search mx-0 my-auto p-auto');
			$('form#search').children().eq(1).remove();
			$('ul.sr-bar').eq(1).remove();
			$('#header-bottom-left').eq(0).after($('form#search').detach());
			$('form#search').eq(0).wrap('<div class="col-4 col-lg-2 px-1 py-auto"></div>');
			$('#sr-header-area').after($('#header-bottom-right').detach());
			$('#header-bottom-right').addClass('col-4 px-1 py-0 text-right');
			$('span.separator').remove();

			let $bar = $('ul.sr-bar').children();
			$bar.eq(0).children().eq(0).text('');
			$bar.eq(0).children().eq(0).prepend('<i class="material-icons md-light md-8 px-1"> home </i>');
			$bar.eq(1).children().eq(0).text('');
			$bar.eq(1).children().eq(0).prepend('<i class="material-icons md-light md-8 px-1"> people </i>');
			$bar.eq(2).children().eq(0).text('');
			$bar.eq(2).children().eq(0).prepend('<i class="material-icons md-light md-8 px-1"> public </i>');
			$bar.eq(3).children().eq(0).text('');
			$bar.eq(3).children().eq(0).prepend('<i class="material-icons md-light md-8 px-1"> shuffle </i>');
			$bar.eq(4).children().eq(0).text('');
			$bar.eq(4).children().eq(0).prepend('<i class="material-icons md-light md-8 px-1"> face </i>');
			let $tabs = $('ul.tabmenu').children();
			$tabs.eq(0).children().eq(0).text('');
			$tabs.eq(0).children().eq(0).prepend('<i class="material-icons md-light"> whatshot </i>');
			$tabs.eq(1).children().eq(0).text('');
			$tabs.eq(1).children().eq(0).prepend('<i class="material-icons md-light"> fiber_new </i>');
			$tabs.eq(2).children().eq(0).text('');
			$tabs.eq(2).children().eq(0).prepend('<i class="material-icons md-light"> trending_up </i>');
			$tabs.eq(3).children().eq(0).text('');
			$tabs.eq(3).children().eq(0).prepend('<i class="material-icons md-light"> announcement </i>');
			$tabs.eq(4).children().eq(0).text('');
			$tabs.eq(4).children().eq(0).prepend('<i class="material-icons md-light"> vertical_align_top </i>');
			$tabs.eq(5).children().eq(0).text('');
			$tabs.eq(5).children().eq(0).prepend('<i class="material-icons md-light"> account_balance </i>');
			$tabs.eq(6).children().eq(0).text('');
			$tabs.eq(6).children().eq(0).prepend('<i class="material-icons md-light"> language </i>');

			let $prof = $('#header-bottom-right');
			$prof.find('span.user').attr('style', 'vertical-align: text-top;');
			$prof.find('.beta-hint').remove();
			let $mail = $prof.find('#mail');
			$mail.text('');
			$mail.prepend('<i class="material-icons md-light md-8"> mail_outline </i>');
			$mail.addClass('px-1');
			let $chat = $prof.find('#chat');
			$chat.text('');
			$chat.prepend('<i class="material-icons md-light md-8"> chat_bubble_outline </i>');
			$chat.addClass('px-1');
			let $settings = $prof.find('a.pref-lang');
			$settings.text('');
			$settings.prepend('<i class="material-icons md-light md-8"> settings </i>');
			$settings.addClass('px-1');
			let $logout = $prof.find('form.logout').children().last();
			$logout.text('');
			$logout.prepend('<i class="material-icons md-light md-8"> exit_to_app </i>');
			$logout.addClass('px-1');

			$('.menuarea').attr('style', 'display: none!important');
			$('.spacer').replaceWith($('.spacer').last());
			$('.spacer').addClass('row');
		} else if (commentsPage || submitPage || prefsPage) {
			$('#header').remove();
			$('div.footer-parent').remove();
			$('.side').eq(0).remove();
		}
		if (commentsPage) {
			$('.tabmenu').remove();
			if (!$('full-res-content')) {
				$('#siteTable').addClass('col-xl-4 col-lg-6 col-md-8 col-sm-10 col-xs-12 m-0 p-0');
			} else {
				$('#siteTable').addClass('col-12 m-0 p-0');
			}
			$('.commentarea').addClass('col-xl-4 col-lg-6 col-md-8 col-sm-10 col-xs-12 m-0 p-0');
			$('.nestedlisting').eq(0).addClass('p-3');
			$('#siteTable').wrap('<div class="row justify-content-center">');
			$('.commentarea').wrap('<div class="row justify-content-center">');
			$('.panestack-title').addClass('row justify-content-center m-0');
			$('.menuarea').addClass('m-0 pl-3');
			$('.menuarea').children().eq(0).attr('style', 'vertical-align: -webkit-baseline-middle;');
			$('.panestack-title').append($('.menuarea').detach());
			$('.panestack-title').children().wrapAll('<div class="col-10"><div class="row justify-content-center"></div></div>');
			$('.panestack-title').prepend('<div class="col-1"></div>');
			$('.panestack-title').append(`
<div class="col-1 ml-auto mr-0 my-auto">
<a class="close-comments-page" onclick="window.close();">
	<i class="material-icons md-light"> close </i>
</a>
</div>
`);
			$('.title-button').addClass('px-0 my-auto');
			$('.usertext-edit').parent().addClass('row justify-content-center');
			$('.usertext-edit').addClass('col-10');
			$('.usertext-edit').children().eq(0).children().eq(0).addClass('mx-auto my-auto');
			$('.help-hoverable').parent().attr('style', 'display: none!important;');
		} else if (submitPage) {
			let $tabs = $('ul.tabmenu').children();
			$tabs.eq(0).children().eq(0).text('');
			$tabs.eq(0).children().eq(0).prepend('<i class="material-icons md-light"> link </i>');
			$tabs.eq(1).children().eq(0).text('');
			$tabs.eq(1).children().eq(0).prepend('<i class="material-icons md-light"> text_fields </i>');

			$('br').remove();
			$('div.content').addClass('row justify-content-center');
			$('form.submit').addClass('col-1');
			$('div.content').children().eq(0).remove();

			$('div#url-field').children().eq(0).remove();
			$('div#image-field').children().eq(0).remove();
			$('div#title-field').children().eq(0).remove();
			$('div#text-field').children().eq(0).remove();
			$('div#text-field').children().eq(0).remove();
			$('div#reddit-field').children().eq(0).remove();
			$('div#items-required').remove();
			$('input#submit_type_profile').next().attr('style', 'display:none!important');
			$('input#submit_type_subreddit').next().attr('style', 'display:none!important');
			$('input#submit_type_profile').attr('style', 'display:none!important');
			$('input#submit_type_subreddit').attr('style', 'display:none!important');
			$('input#sendreplies').parent().prev().remove();
			$('input#url').attr('placeholder', 'url');
			$('textarea').eq(0).attr('placeholder', 'title');
			$('textarea').eq(1).attr('placeholder', 'text');
			$('input#sr-autocomplete').attr('placeholder', 'subreddit');
		}

		$('#chat-app').attr('style', 'display: none!important');

		$('.content').attr('style', 'width: 100vw!important; max-width: 100vw!important;');
		$('#siteTable').addClass('col-12 m-0 p-0');
		$('.thumbnail').wrap('<div class="thumbnail-div col-1 mx-0 my-auto p-0"></div>');

		let $things = [];
		$('.thing').each(function (i, elem) {
			$(this).addClass('row m-0 p-0' + ((redditPage) ? ' justify-content-center' : ''));
			$things[i] = $(this);
		});
		for (let i = 0; i < $things.length; i++) {
			let $thing = $things[i];
			try {
				await editThing($thing);
			} catch (err) {
				log(err);
			}
			if (commentsPage && i == 0) {
				if ($thing.hasClass('spoiler') || $thing.find('.usertext').length) {
					$thing.find('.expando').addClass('col-12 m-0 px-auto py-0');
					$thing.prepend($thing.find('.expando').detach());
				} else {
					$thing.remove();
				}
				$thing.find('.thumbnail').remove();
				$thing.find('.midcol').attr('style', 'display: none!important');
				$thing.find('.entry').attr('style', 'display: none!important');
			}
		}
		// removes all spaces from the body, they are not elements
		// so this can't be done with jquery
		$('body').html($('body').html().split('&nbsp;').join(''));

		if (commentsPage) {
			// Select the node that will be observed for mutations
			let targetNode = document.getElementsByClassName('nestedlisting').item(0);

			// Options for the observer (which mutations to observe)
			let config = {
				attributes: false,
				childList: true
			};

			// Create an observer instance linked to the callback function
			let observer = new MutationObserver(mutationCallback);

			// Start observing the target node for configured mutations
			observer.observe(targetNode, config);
		}
	}

	log('qashto reddit-uhd loading...');
	editPage();
});
