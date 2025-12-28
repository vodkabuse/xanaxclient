// ==UserScript==
// @name        xanax menu 
// @name:en     xanax menu
// @description      i had fun making ts
// @namespace    http://tampermonkey.net/
// @version      1.1
// @author       vodkabuse
// @match        *://krunker.io/*
// @match        *://browserfps.com/*
// @exclude      *://krunker.io/social*
// @exclude      *://krunker.io/editor*
// @icon         https://files.catbox.moe/9uwpcr.jpg
// @run-at       document-start
// @require      https://unpkg.com/three@0.150.0/build/three.min.js
// @grant        unsafeWindow
// @grant        GM_info
// @downloadURL https://github.com/vodkabuse/xanaxclient
// @updateURL https://github.com/vodkabuse/xanaxclient
// ==/UserScript==

const latestVersion = '1.4';
if (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version !== latestVersion) {
    alert('outdated but who really cares ? just get good\n\n);
}



const THREE = window.THREE;
delete window.THREE;

const CheatSettings = {
	aimbotEnabled: false,
	aimbotOnRightMouse: true,
	espEnabled: false,
	espLines: false,
	wireframe: false
};

const keyToSetting = {
	KeyV: 'aimbotEnabled',
	KeyB: 'aimbotOnRightMouse',
	KeyN: 'espEnabled',
	KeyM: 'espLines',
	KeyL: 'wireframe'
};

let scene;

const x = {
	window: window,
	document: document,
	querySelector: document.querySelector,
	consoleLog: console.log,
	ReflectApply: Reflect.apply,
	ArrayPrototype: Array.prototype,
	ArrayPush: Array.prototype.push,
	ObjectPrototype: Object.prototype,
	clearInterval: window.clearInterval,
	setTimeout: window.setTimeout,
	reToString: RegExp.prototype.toString,
	indexOf: String.prototype.indexOf,
	requestAnimationFrame: window.requestAnimationFrame
};

x.consoleLog( 'Waiting for loader...' );

const proxied = function ( object ) {

	try {

		if ( typeof object === 'object' &&
			typeof object.parent === 'object' &&
			object.parent.type === 'Scene' &&
			object.parent.name === 'Main' ) {

			x.consoleLog( 'Found loader!' )
			scene = object.parent;
			x.ArrayPrototype.push = x.ArrayPush;

		}

	} catch ( error ) {}

	return x.ArrayPush.apply( this, arguments );

}

const gui = createGUI();

const tempVector = new THREE.Vector3();

const tempObject = new THREE.Object3D();
tempObject.rotation.order = 'YXZ';

const geometry = new THREE.EdgesGeometry( new THREE.BoxGeometry( 5, 15, 5 ).translate( 0, 7.5, 0 ) );

const material = new THREE.RawShaderMaterial( {
	vertexShader: `

	attribute vec3 position;

	uniform mat4 projectionMatrix;
	uniform mat4 modelViewMatrix;

	void main() {

		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		gl_Position.z = 1.0;

	}

	`,
	fragmentShader: `

	void main() {

		gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );

	}

	`
} );

const line = new THREE.LineSegments( new THREE.BufferGeometry(), material );

line.frustumCulled = false;

const linePositions = new THREE.BufferAttribute( new Float32Array( 100 * 2 * 3 ), 3 );
line.geometry.setAttribute( 'position', linePositions );

let injectTimer = null;

function animate() {

	x.requestAnimationFrame.call( x.window, animate );

	if ( ! scene && ! injectTimer ) {

		const el = x.querySelector.call( x.document, '#loadingBg' );

		if ( el && el.style.display === 'none' ) {

			x.consoleLog( 'Inject timer at work...' );

			injectTimer = x.setTimeout.call( x.window, () => {

				x.consoleLog( 'im so in babyy!' );
				x.ArrayPrototype.push = proxied;

			}, 2e3 );

		}

	}


	const players = [];

	let myPlayer;

    if (!scene) return;

	for ( let i = 0; i < scene.children.length; i ++ ) {

		const child = scene.children[ i ];

		if ( child.type === 'Object3D' ) {

			try {

				if ( child.children[ 0 ].children[ 0 ].type === 'PerspectiveCamera' ) {

					myPlayer = child;

				} else {

					players.push( child );

				}

			} catch ( err ) {}

		} else if ( child.material ) {

			child.material.wireframe = CheatSettings.wireframe;

		}

	}

	if ( ! myPlayer ) {

		x.consoleLog( '404, finding new scene.' );
		x.ArrayPrototype.push = proxied;
		return;

	}

	let counter = 0;

	let targetPlayer;
	let minDistance = Infinity;

	tempObject.matrix.copy( myPlayer.matrix ).invert();

	for ( let i = 0; i < players.length; i ++ ) {

		const player = players[ i ];

		if ( ! player.box ) {

			const box = new THREE.LineSegments( geometry, material );
			box.frustumCulled = false;

			player.add( box );

			player.box = box;

		}

		if ( player.position.x === myPlayer.position.x && player.position.z === myPlayer.position.z ) {

			player.box.visible = false;

			if ( line.parent !== player ) {

				player.add( line );

			}

			continue;

		}

		linePositions.setXYZ( counter ++, 0, 10, - 5 );

		tempVector.copy( player.position );
		tempVector.y += 9;
		tempVector.applyMatrix4( tempObject.matrix );

		linePositions.setXYZ(
			counter ++,
			tempVector.x,
			tempVector.y,
			tempVector.z
		);

		player.visible = CheatSettings.espEnabled || player.visible;
		player.box.visible = CheatSettings.espEnabled;

		const distance = player.position.distanceTo( myPlayer.position );

		if ( distance < minDistance ) {

			targetPlayer = player;
			minDistance = distance;

		}

	}

	linePositions.needsUpdate = true;
	line.geometry.setDrawRange( 0, counter );

	line.visible = CheatSettings.espLines;

	if ( CheatSettings.aimbotEnabled === false || ( CheatSettings.aimbotOnRightMouse && ! rightMouseDown ) || targetPlayer === undefined ) {

		return;


	}

	tempVector.setScalar( 0 );

	if (targetPlayer?.children?.[0]?.children?.[0]) {
    targetPlayer.children[0].children[0].localToWorld(tempVector);
} else {
    return;
}


	if (!myPlayer || !myPlayer.position) return;
    tempObject.position.copy(myPlayer.position);

	tempObject.lookAt( tempVector );

	if (myPlayer.children?.[0]?.rotation) {
    myPlayer.children[0].rotation.x = -tempObject.rotation.x;
    myPlayer.rotation.y = tempObject.rotation.y + Math.PI;
}

}


//                   |
// HTML right here   |
//                  \ /

const el = document.createElement( 'div' );

el.innerHTML = `
<style>
:root {
	--bg-dark: #0b0614;
	--bg-darker: #06030d;
	--purple-main: #8f00ff;
	--purple-soft: #6a0dad;
	--purple-dark: #3a005f;
	--text-main: #ffffff;
	--border-soft: rgba(255, 255, 255, 0.08);
}

/* === Glow Animation === */
@keyframes krkUIGlow {
	0%, 100% {
		box-shadow:
			0 0 10px var(--purple-main),
			0 0 20px var(--purple-soft),
			0 0 35px var(--purple-dark);
	}
	50% {
		box-shadow:
			0 0 20px var(--purple-main),
			0 0 35px var(--purple-soft),
			0 0 50px var(--purple-main);
	}
}

/* === Dialog === */
.dialog {
	position: absolute;
	left: 50%;
	top: 50%;
	padding: 20px;
	background: rgba(10, 5, 20, 0.9);
	border: 2px solid var(--purple-dark);
	color: var(--text-main);
	transform: translate(-50%, -50%);
	text-align: center;
	z-index: 999999;
	box-shadow: 0 0 25px rgba(143, 0, 255, 0.4);
}

.dialog * {
	color: var(--text-main);
}

/* === Close Button === */
.close {
	position: absolute;
	right: 6px;
	top: 6px;
	width: 18px;
	height: 18px;
	opacity: 0.6;
	cursor: pointer;
}

.close:before,
.close:after {
	content: '';
	position: absolute;
	left: 50%;
	top: 50%;
	width: 100%;
	height: 2px;
	background: var(--purple-main);
	transform-origin: center;
}

.close:before {
	transform: translate(-50%, -50%) rotate(45deg);
}

.close:after {
	transform: translate(-50%, -50%) rotate(-45deg);
}

.close:hover {
	opacity: 1;
}

/* === Buttons === */
.button {
	cursor: pointer;
	padding: 0.5em 1em;
	background: linear-gradient(135deg, var(--purple-main), var(--purple-soft));
	border: 1px solid var(--purple-dark);
	color: #fff;
	box-shadow: 0 0 12px rgba(143, 0, 255, 0.4);
	transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.button:active {
	transform: scale(0.92);
	box-shadow: 0 0 6px rgba(143, 0, 255, 0.3);
}

/* === Message Popup === */
.msg {
	position: absolute;
	left: 10px;
	bottom: 10px;
	color: #fff;
	background: rgba(15, 5, 30, 0.85);
	font-weight: bold;
	padding: 14px;
	border-left: 3px solid var(--purple-main);
	animation: msg 0.5s forwards, msg 0.5s reverse forwards 3s;
	z-index: 999999;
	pointer-events: none;
	box-shadow: 0 0 15px rgba(143, 0, 255, 0.4);
}

@keyframes msg {
	from {
		transform: translateX(-120%);
	}
	to {
		transform: translateX(0);
	}
}

/* === Main UI === */
.krkUI {
	position: fixed;
	right: 10px;
	top: 10px;
	z-index: 999;
	display: flex;
	flex-direction: column;
	font-family: monospace;
	font-size: 12px;
	color: #fff;
	width: 250px;
	user-select: none;
	border: 1px solid var(--purple-dark);
	background: radial-gradient(circle at top left, #1a0033, var(--bg-darker));
	animation: krkUIGlow 2s infinite ease-in-out;
	border-radius: 10px;
	overflow: hidden;
}

/* === Items === */
.krkUI-item {
	padding: 6px 10px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	background: rgba(255, 255, 255, 0.03);
	cursor: pointer;
	border-bottom: 1px solid var(--border-soft);
	transition: background 0.15s ease;
}

.krkUI-item:hover {
	background: rgba(143, 0, 255, 0.12);
}

.krkUI-item span {
	color: #fff;
	font-size: 12px;
}

/* === Header === */
.krkUI-header {
	background: linear-gradient(90deg, var(--purple-main), var(--purple-soft));
	box-shadow: inset 0 -1px rgba(0, 0, 0, 0.4);
}

.krkUI-header span {
	font-size: 14px;
	font-weight: bold;
}

/* === Text-only Item === */
.krkUI-item.text {
	justify-content: center;
	cursor: default;
	background: rgba(0, 0, 0, 0.4);
	color: #ccc;
}

/* === States === */
.krkUI-on {
	color: #b56cff;
	text-shadow: 0 0 6px rgba(181, 108, 255, 0.8);
}

.krkUI-item-value {
	font-size: 0.8em;
	font-weight: bold;
	color: #d6b3ff;
}
</style>

	`



const msgEl = el.querySelector( '.msg' );
const dialogEl = el.querySelector( '.dialog' );

window.addEventListener( 'DOMContentLoaded', function () {

	while ( el.children.length > 0 ) {

		document.body.appendChild( el.children[ 0 ] );

	}

	document.body.appendChild( gui );

} );


let rightMouseDown = false;

function handleMouse( event ) {

	if ( event.button === 2 ) {

		rightMouseDown = event.type === 'pointerdown' ? true : false;

	}

}

window.addEventListener( 'pointerdown', handleMouse );
window.addEventListener( 'pointerup', handleMouse );

window.addEventListener( 'keyup', function ( event ) {

	if ( x.document.activeElement && x.document.activeElement.value !== undefined ) return;

	if ( keyToSetting[ event.code ] ) {

		toggleSetting( keyToSetting[ event.code ] );

	}

	switch ( event.code ) {

		case 'Slash' :
			toggleElementVisibility( gui );
			break;

		case 'KeyH' :
			toggleElementVisibility( dialogEl );
			break;

	}

} );

function toggleElementVisibility( el ) {

	el.style.display = el.style.display === '' ? 'none' : '';

}

function showMsg( name, bool ) {

	msgEl.innerText = name + ': ' + ( bool ? 'ON' : 'OFF' );

	msgEl.style.display = 'none';
	void msgEl.offsetWidth;
	msgEl.style.display = '';

}

animate();

function createGUI() {

	const guiEl = fromHtml( `<div class="krkUI">
		<div class="krkUI-item krkUI-header">
			<span>[/] Menu</span>
			<span class="krkUI-item-value">[close]</span>
		</div>
		<div class="krkUI-content"></div>
	</div>` );

	const headerEl = guiEl.querySelector( '.krkUI-header' );
	const contentEl = guiEl.querySelector( '.krkUI-content' );
	const headerStatusEl = guiEl.querySelector( '.krkUI-item-value' );

	headerEl.onclick = function () {

		const isHidden = contentEl.style.display === 'none';

		contentEl.style.display = isHidden ? '' : 'none';
		headerStatusEl.innerText = isHidden ? '[close]' : '[open]';

	}

	const settingToKey = {};
	for ( const key in keyToSetting ) {

		settingToKey[ keyToSetting[ key ] ] = key;

	}

	for ( const prop in CheatSettings ) {

		let name = fromCamel( prop );
		let shortKey = settingToKey[ prop ];

		if ( shortKey ) {

			if ( shortKey.startsWith( 'Key' ) ) shortKey = shortKey.slice( 3 );
			name = `[${shortKey}] ${name}`;

		}

		const itemEl = fromHtml( `<div class="krkUI-item">
			<span>${name}</span>
			<span class="krkUI-item-value"></span>
		</div>` );
		const valueEl = itemEl.querySelector( '.krkUI-item-value' );

		function updateValueEl() {

			const value = CheatSettings[ prop ];
			valueEl.innerText = value ? 'ON' : 'OFF';
			valueEl.style.color = value ? 'green' : 'red';

		}
		itemEl.onclick = function() {

			CheatSettings[ prop ] = ! CheatSettings[ prop ];

		}
		updateValueEl();

		contentEl.appendChild( itemEl );

		const p = `__${prop}`;
		CheatSettings[ p ] = CheatSettings[ prop ];
		Object.defineProperty( CheatSettings, prop, {
			get() {

				return this[ p ];

			},
			set( value ) {

				this[ p ] = value;
				updateValueEl();

			}
		} );

	}

	contentEl.appendChild( fromHtml( `<div class="krkUI-item text">
		<span>skidded buy vodkabuse</span>
	</div>` ) );

	return guiEl;

}

function fromCamel( text ) {

	const result = text.replace( /([A-Z])/g, ' $1' );
	return result.charAt( 0 ).toUpperCase() + result.slice( 1 );

}

function fromHtml( html ) {

	const div = document.createElement( 'div' );
	div.innerHTML = html;
	return div.children[ 0 ];

}

function toggleSetting( key ) {

	CheatSettings[ key ] = ! CheatSettings[ key ];
	showMsg( fromCamel( key ), CheatSettings[ key ] );

}
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠁⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
//made by vodkabuse & on school wifi btw
