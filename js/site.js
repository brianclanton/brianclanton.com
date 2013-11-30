// Rolling Links
// Adapted from demo by Hakim El Hattab (hakim.se)
var supports3DTransforms =  document.body.style['webkitPerspective'] !== undefined || 
                            document.body.style['MozPerspective'] !== undefined;

function isMobile() {
    if (navigator.userAgent.match(/Android/i)
        || navigator.userAgent.match(/webOS/i)
        || navigator.userAgent.match(/iPhone/i)
        || navigator.userAgent.match(/iPad/i)
        || navigator.userAgent.match(/iPod/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/Windows Phone/i)) {
        return true;
    } else {
        return false;
    }
}

function linkify( selector ) {
    if( supports3DTransforms && !isMobile() ) {
        
        var nodes = document.querySelectorAll( selector );

        for( var i = 0, len = nodes.length; i < len; i++ ) {
            var node = nodes[i];

            if( !node.className || !node.className.match( /roll/g ) ) {
                node.className += ' roll';
                node.innerHTML = '<span data-title="'+ node.text +'">' + node.innerHTML + '</span>';
            }
        };
    }
}