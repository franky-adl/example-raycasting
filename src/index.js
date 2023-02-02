// ThreeJS and Third-party deps
import * as THREE from "three"
import * as dat from 'dat.gui'
import Stats from "three/examples/jsm/libs/stats.module"
import { GPUStatsPanel } from "three/examples/jsm/utils/GPUStatsPanel"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

// Core boilerplate code deps
import { createCamera, createRenderer, runApp, getDefaultUniforms } from "./core-utils"

// Other deps

global.THREE = THREE

/**************************************************
 * 0. Tweakable parameters for the scene
 *************************************************/
const params = {
  // general scene params
}
const amount = parseInt( window.location.search.slice( 1 ) ) || 10;
const count = Math.pow( amount, 3 );

const raycaster = new THREE.Raycaster();

const color = new THREE.Color();
const white = new THREE.Color().setHex( 0xffffff );

/**************************************************
 * 1. Initialize core threejs components
 *************************************************/
// Create the scene
let scene = new THREE.Scene()

// Create the renderer via 'createRenderer',
// 1st param receives additional WebGLRenderer properties
// 2nd param receives a custom callback to further configure the renderer
let renderer = createRenderer({ antialias: true, alpha: true }, (_renderer) => {
  // _renderer.toneMapping = THREE.ACESFilmicToneMapping
  // e.g. uncomment below if you want the output to be in sRGB color space
  // _renderer.outputEncoding = THREE.sRGBEncoding
})

// Create the camera
// Pass in fov, near, far and camera position respectively
let camera = createCamera(60, 0.1, 100, { x: amount, y: amount, z: amount })


/**************************************************
 * 2. Build your scene in this threejs app
 * This app object needs to consist of at least the async initScene() function (it is async so the animate function can wait for initScene() to finish before being called)
 * initScene() is called after a basic threejs environment has been set up, you can add objects/lighting to you scene in initScene()
 * if your app needs to animate things(i.e. not static), include a updateScene(interval, elapsed) function in the app as well
 *************************************************/
let app = {
  async loadTexture(url) {
    this.textureLoader = this.textureLoader || new THREE.TextureLoader()
    return new Promise(resolve => {
      this.textureLoader.load(url, texture => {
        resolve(texture)
      })
    })
  },
  async initScene() {
    // OrbitControls
    this.controls = new OrbitControls(camera, renderer.domElement)
    this.controls.enableDamping = true
    // this.controls.autoRotate = true
    // this.controls.autoRotateSpeed = 0.2

    scene.background = new THREE.Color(0x222222);

    const light = new THREE.HemisphereLight( 0xffffff, 0x888888 );
    light.position.set( 0, 1, 0 );
    scene.add( light );

    const geometry = new THREE.IcosahedronGeometry( 0.5, 3 );
    const material = new THREE.MeshPhongMaterial( { color: 0xffffff } );

    this.mesh = new THREE.InstancedMesh( geometry, material, count );

    let i = 0;
    const offset = ( amount - 1 ) / 2;
    const matrix = new THREE.Matrix4();
    for ( let x = 0; x < amount; x ++ ) {
      for ( let y = 0; y < amount; y ++ ) {
        for ( let z = 0; z < amount; z ++ ) {
          matrix.setPosition( offset - x, offset - y, offset - z );
          this.mesh.setMatrixAt( i, matrix );
          this.mesh.setColorAt( i, color );
          i ++;
        }
      }
    }

    scene.add( this.mesh );

    // GUI controls
    const gui = new dat.GUI()
    gui.add( this.mesh, 'count', 0, count )

    // Stats - click to show different panels
    this.stats1 = new Stats()
    this.gpuPanel = new GPUStatsPanel( renderer.getContext() );
    this.stats1.addPanel( this.gpuPanel );
    this.stats1.showPanel(0) // Panel 0 = fps
    this.stats1.domElement.style.cssText = "position:absolute;top:0px;left:0px;"
    // this.container is the parent DOM element of the threejs canvas element
    this.container.appendChild(this.stats1.domElement)
  },
  // @param {number} interval - time elapsed between 2 frames
  // @param {number} elapsed - total time elapsed since app start
  updateScene(interval, elapsed) {
    this.controls.update()
    this.stats1.update()

    raycaster.setFromCamera( this.mouse, camera );
    const intersection = raycaster.intersectObject( this.mesh );
    if ( intersection.length > 0 ) {
      const instanceId = intersection[ 0 ].instanceId;
      this.mesh.getColorAt( instanceId, color );
      if ( color.equals( white ) ) {
        this.mesh.setColorAt( instanceId, color.setHex( Math.random() * 0xffffff ) );
        this.mesh.instanceColor.needsUpdate = true;
      }
    }
  }
}

/**************************************************
 * 3. Run the app
 * 'runApp' will do most of the boilerplate setup code for you:
 * e.g. HTML container, window resize listener, mouse move/touch listener for shader uniforms, THREE.Clock() for animation
 * Executing this line puts everything together and runs the app
 * ps. if you don't use custom shaders, pass undefined to the 'uniforms'(2nd-last) param
 * ps. if you don't use post-processing, pass undefined to the 'composer'(last) param
 *************************************************/
runApp(app, scene, renderer, camera, true, undefined, undefined)
