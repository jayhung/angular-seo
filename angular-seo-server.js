var system = require('system');

if (system.args.length == 3) {
    console.log("NOTE: Running in single site mode, snapping only "+system.args[2]);
} else if (system.args.length == 2) {
    console.log("NOTE: Running in Nginx mode, snapping urls in Host header");
} else {
    console.log("Missing arguments.");
    phantom.exit();
}

var server = require('webserver').create();
var port = parseInt(system.args[1]);

var renderHtml = function(url, cb) {
	console.log('calling renderHtml():', url);

	var page = require('webpage').create();
	// page.isCallbackFired = false;
	page.settings.loadImages = false;
    page.settings.localToRemoteUrlAccessEnabled = true;
	page.customHeaders = {
		"X-Prerenderer": "phantomjs"
	};

	// page.settings.resourceTimeout = 5000; // 5 seconds
	page.settings.resourceTimeout = 10000; // 10 seconds
	page.onResourceTimeout = function(e) {
		console.log(e.errorCode + ' ' + e.errorString + ': ' + e.url + "\n");	// it'll probably be 408 + 'Network timeout on resource' + {url whose request timed out}
		page.close();
	};

    page.onCallback = function() {
        cb(page.content);
    	// if ( ! page.isCallbackFired) {
	    	// page.isCallbackFired = true;
	        page.close();
    	// }
    };

    // page.onConsoleMessage = function(msg, lineNum, sourceId) {
    //    console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
    // };

    page.onInitialized = function() {
       page.evaluate(function() {
            setTimeout(function() {
                window.callPhantom();
            }, 5000);	// how long to wait in ms before marking page rendering as completed (page can call window.callPhantom() to specify completion earlier)
        });
    };

    page.open(url);
};

server.listen(port, function (request, response) {
    var host = request.headers.Host;
    var urlPrefix = (typeof system.args[2] == 'undefined') ? 'http://' + host : system.args[2];
    var route = request.url.replace("_escaped_fragment_","_prerender_");	// rename param '_escaped_fragment_' to prevent getting caught in a loop w/ httpd daemon
    var url = urlPrefix + decodeURIComponent(route);

    renderHtml(url , function(html) {
        response.statusCode = 200;
        response.write(html);
        response.close();
    });
});

console.log('Listening on ' + port + '...');
console.log('Press Ctrl+C to stop.');