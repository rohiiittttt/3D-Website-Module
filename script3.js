var scene, camera, renderer, box, clock, mixer, actions = [], mode, isWireframe = false, params, lights;
let loadedModel;
let sound;

init();

function init() {
    const assetPath = './';  // Path to assets

    clock = new THREE.Clock();


// Create the scene
    scene=new THREE.Scene();
    scene.background = new THREE.Color(0x00aaff);

    // Set up the camera
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 2000 );
    camera.position.set(-10, 4, 20);

    const listener = new THREE.AudioListener();
    camera.add(listener);


  // Create a sound and attach it to the listener
    sound = new THREE.Audio(listener); 

  // Load a sound and set it as the buffer for the audio object
    const audioLoader =  new THREE.AudioLoader ();
    audioLoader.load('assets/Toing Sound (3).mp3', function (buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(false);
        sound.setVolume(1.0);
    });

// Add lightning
const ambient = new THREE.HemisphereLight(0xffffbb, 0x080820, 4);
scene.add(ambient);

lights = {};

lights.spot = new THREE.SpotLight();
lights.spot.visible = true;
lights.spot.position.set(0,20,0);
lights.spotHelper = new THREE.SpotLightHelper(lights.spot);
lights.spotHelper.visible = false;
scene.add(lights.spotHelper);
scene.add(lights.spot);

params = {
    spot: {
        enable: false,
        color: 0xffffff,
        distance: 20,
        angle: Math.PI/2,
        penumbra: 0,
        helper: false,
        moving: false
    }
}

const gui = new dat.GUI({ autoPlace: false });
const guiContainer = document.getElementById('gui-container');
guiContainer.appendChild(gui.domElement);

guiContainer.style.position = 'fixed';

const spot = gui.addFolder('Spot');
spot.open();
spot.add(params.spot, 'enable').onChange(value => { lights.spot.visible = value });
spot.addColor(params.spot, 'color').onChange( value => lights.spot.color = new THREE.Color(value));
spot.add(params.spot, 'distance').min(0).max(20).onChange( value => lights.spot.distance = value);
spot.add(params.spot, 'angle').min(0.1).max(6.28).onChange( value => lights.spot.angle = value );
spot.add(params.spot, 'penumbra').min(0).max(1).onChange( value => lights.spot.penumbra = value );
spot.add(params.spot, 'helper').onChange(value => lights.spotHelper.visible = value);
spot.add(params.spot, 'moving');


// Set up the renderer
const canvas = document.getElementById('threeContainer');
renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setPixelRatio( window.devicePixelRatio);
resize();


// Add OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(1, 2, 0);
controls.update();

// Button to control animations
mode = 'open';
const btn = document.getElementById("btn");
btn.addEventListener('click', function() {
if (actions.length === 1){
    if (mode=== "open") {
        actions.forEach(action => {
                action.timeScale = 1;
                action.reset();
                action.play();

                //Play sound when animation starts
                if (sound.isPlaying) sound.stop();
                sound.play();
        });
        }
    }
});

// add wireframe toggle button
const wireframeBtn = document.getElementById("toggleWireframe");
wireframeBtn.addEventListener('click', function () {
    isWireframe = !isWireframe;
    toggleWireframe(isWireframe);
});

// Add rotation button logic
const rotateBtn = document.getElementById("Rotate");
rotateBtn.addEventListener('click', function () {
    if (loadedModel) {
        const axis = new THREE.Vector3 (0, 1, 0);   // Y-axis
        const angle = Math.PI / 8;  // Rotate 22.5 degrees
        loadedModel.rotateOnAxis(axis, angle);
    
    } else {
        console.warn('Model not loaded yet.');
    }
});


// Load the glTF model
const loader = new THREE.GLTFLoader();
loader.load(assetPath + 'assets/cup1.glb', function(gltf){
    const model = gltf.scene;
    scene.add(model);

    loadedModel = model;

    // Set up animations
    mixer = new THREE.AnimationMixer(model);
    const animations = gltf.animations;

    animations.forEach(clip =>{
        const action = mixer.clipAction(clip);
        actions.push(action);
    });

});

    // Handle resizing
    window.addEventListener('resize', resize, false);

    // Start the Animation loop
    animate();
}

function toggleWireframe(enable) {
    scene.traverse(function (object) {
        if (object.isMesh) {
            object.material.wireframe = enable;
        }
    });
}

function animate() {
    requestAnimationFrame(animate);  
    
  // Update animations  
    if (mixer) {
        mixer.update(clock.getDelta());
    }

    renderer.render(scene, camera);

    const time = clock.getElapsedTime();
    const delta = Math.sin(time)*5;
    if (params.spot.moving){
        lights.spot.position.x = delta;
        lights.spotHelper.update();
    }
}

function resize() {
    const canvas = document.getElementById('threeContainer');
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}