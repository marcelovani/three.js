/**
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 *
 * W3C Device Orientation control (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
 */

THREE.DeviceOrientationControls = function( _object ) {

	var _this = this;

	var object = _object;
	object.rotation.reorder( "YXZ" );

	var enabled = true;

	var deviceOrientation = {};
	var screenOrientation = 0;

	var alpha = 0;
	var alphaOffsetAngle = 0;

	_this.events = {};
	_this.addEventListener = function(name, handler) {
		if (_this.events.hasOwnProperty(name))
			_this.events[name].push(handler);
		else
			_this.events[name] = [handler];
	};
	_this.removeEventListener = function(name, handler) {
		if (!_this.events.hasOwnProperty(name))
			return;

		var index = _this.events[name].indexOf(handler);
		if (index != -1)
			_this.events[name].splice(index, 1);
	};
	_this.fireEvent = function(name, args) {
		if (!_this.events.hasOwnProperty(name))
			return;

		if (!args || !args.length)
			args = [];

		var evs = _this.events[name], l = evs.length;
		for (var i = 0; i < l; i++) {
			evs[i].apply(null, args);
		}
	};

	var onDeviceOrientationChangeEvent = function( event ) {

		deviceOrientation = event;
		_this.update();

	};

	var onScreenOrientationChangeEvent = function() {

		screenOrientation = window.orientation || 0;
		_this.update();

	};

	// The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

	var setObjectQuaternion = function() {

		var zee = new THREE.Vector3( 0, 0, 1 );

		var euler = new THREE.Euler();

		var q0 = new THREE.Quaternion();

		var q1 = new THREE.Quaternion( - Math.sqrt( 0.5 ), 0, 0, Math.sqrt( 0.5 ) ); // - PI/2 around the x-axis

		return function( quaternion, alpha, beta, gamma, orient ) {

			euler.set( beta, alpha, - gamma, 'YXZ' ); // 'ZXY' for the device, but 'YXZ' for us

			quaternion.setFromEuler( euler ); // orient the device

			quaternion.multiply( q1 ); // camera looks out the back of the device, not the top

			quaternion.multiply( q0.setFromAxisAngle( zee, - orient ) ); // adjust for screen orientation

		}

	}();

	this.connect = function() {

		onScreenOrientationChangeEvent(); // run once on load

		window.addEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
		window.addEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

		enabled = true;

	};

	this.disconnect = function() {

		window.removeEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
		window.removeEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

		enabled = false;

	};

	this.update = function() {

		if ( enabled === false ) return;

		alpha = deviceOrientation.alpha ? THREE.Math.degToRad( deviceOrientation.alpha ) + alphaOffsetAngle : 0; // Z
		var beta = deviceOrientation.beta ? THREE.Math.degToRad( deviceOrientation.beta ) : 0; // X'
		var gamma = deviceOrientation.gamma ? THREE.Math.degToRad( deviceOrientation.gamma ) : 0; // Y''
		var orient = screenOrientation ? THREE.Math.degToRad( screenOrientation ) : 0; // O

		setObjectQuaternion( object.quaternion, alpha, beta, gamma, orient );

		_this.fireEvent('change', [object]);

	};

	this.updateAlphaOffsetAngle = function( angle ) {

		alphaOffsetAngle = angle;
		_this.update();

	};

	this.dispose = function() {

		_this.disconnect();

	};

	_this.connect();

};
