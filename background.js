console.log('qashto reddit-uhd start');
// match pattern for the URLs to redirect
var pattern = '*://*/*/comments/*';

// cancel function returns an object
// which contains a property `cancel` set to `true`
function cancel(details) {
	console.log('Canceling: ' + details.url);
	return {
		cancel: true
	};
}

if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
	chrome.webRequest.onBeforeRequest.addListener(
		cancel, {
			urls: [pattern],
			types: ['image', 'media']
		}, ['blocking']
	);
} else {
	browser.webRequest.onBeforeRequest.addListener(
		cancel, {
			urls: [pattern],
			types: ['image', 'media']
		}, ['blocking']
	);
}
