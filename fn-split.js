(function( $ ){

var ID = 1;

var WORKER_SRC = ["(", (function(){
	var TheFunction = $$$THE_FUNCTION_SRC$$$;

	self.onmessage = function ( event ) {
		var id = event.data.id, returnValue, exception;

		try {
			returnValue = TheFunction.call( this, event.data.arguments );
		}
		catch ( e ) {
			exception = e.toString();
		}

		self.postMessage({ id: id, returnValue: returnValue, exception: exception });
	};
}).toString(), ")();"].join("").split("$$$");

Function.prototype.toWebWorkerURI = function () {
	WORKER_SRC[1] = this.toString();
	return "data:text/javascript;base64," + Base64.encode( WORKER_SRC.join("") );
};

Function.prototype.split = function () {
	var worker = new Worker( this.toWebWorkerURI() );

	var splitted = function () {
		var id = ID++, args = Array.prototype.slice.call( arguments, 0 ),
		    callback, scope,
		    deferred = ($ && $.Deferred());

		for ( var i = args.length - 1; i >= 0; i-- ) {
			if ( typeof args[i] === "function" ) {
				callback = args[i];
				scope = args[i+1] || null;

				args.splice( i, args.length - i );
				i = 0; // stop looking
			}
		}

		worker.addEventListener( "message", function ( event ) {
//			console.debug( "message received: ", event );
//
			if ( event.data.id !== id ) {
				return;
			}

			worker.removeEventListener( "message", arguments.callee );

			if ( callback ) {
				try {
					callback.call( scope || window, event.data.returnValue, event.data.exception );
				}
				catch ( e ) {
					console.log( e );
				}
			}

			if ( deferred ) {
				if ( event.data.exception ) {
					deferred.reject( event.data.exception );
				}
				else {
					deferred.resolve( event.data.returnValue );
				}
			}
		}, false );

		worker.postMessage({ id: id, arguments: args });
//
//		console.log("message sent: ", id, args );

		return deferred;
	};

	return ( arguments.length ? splitted.apply( this, arguments ) : splitted );
};

})( window.jQuery );
