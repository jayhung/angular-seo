!function(window, document, undefined) {
    var getModule = function(angular) {
        return angular.module('seo', [])
            .run([
                '$rootScope',
                function($rootScope) {
                	// mark page rendering as completed in phantomjs
                	// if not called, phantomjs will timeout based on what's configured in angular-seo-server.js
                    $rootScope.htmlReady = function() {
                    	console.log('$rootScope.htmlReady() fired!!');
                        $rootScope.$evalAsync(function() { // fire after $digest
                            setTimeout(function() { // fire after DOM rendering
                                if (typeof window.callPhantom == 'function') {
                                    window.callPhantom();
                                }
                            }, 0);
                        });
                    };
                }
            ]);
    };
    if (typeof define == 'function' && define.amd)
        define(['angular'], getModule);
    else
        getModule(angular);
}(window, document);