import * as THREE from './node_modules/three/build/three.module.js';
import { OrbitControls } from "https://threejs.org/examples/jsm/controls/OrbitControls.js";

const renderer = new THREE.WebGLRenderer();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
const controls = new OrbitControls(camera, renderer.domElement);
const tl = new THREE.TextureLoader();

const clock = new THREE.Clock();

var customUniforms, customAttributes;

init();
animate();

function init() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    camera.position.set(0, 500, 500);
    controls.update();

    var light = new THREE.PointLight(0xffffff);
    light.position.set(0, 250, 0);
    scene.add(light);
    // FLOOR
    var floorTexture = new tl.load('images/checkerboard.jpg');
    floorTexture.wrapS = THREE.RepeatWrapping; 
    floorTexture.wrapT = THREE.RepeatWrapping; 
    floorTexture.repeat.set(10, 10);
    var floorMaterial = new THREE.MeshBasicMaterial({map: floorTexture, side: THREE.DoubleSide});
    var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.5;
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);
    // SKYBOX/FOG
    var skyBoxGeometry = new THREE.CubeGeometry(10000, 10000, 10000);
    var skyBoxMaterial = new THREE.MeshBasicMaterial({ color: 0x9999ff, side: THREE.BackSide });
    var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
    scene.add(skyBox);

    //////////
    //Custom//
    //////////

    init_custom();


}

function init_custom() {

    var ballTexture = new tl.load('images/leaf.jpg');

    var ballBufferGeometry = new THREE.SphereBufferGeometry(60,200,200);

    console.log(ballBufferGeometry.center());

    customUniforms =
    {
        radius: {type: "f", value: ballBufferGeometry.parameters.radius},
        time: {type: 'f', value: 0.0}
    };

    //var nvals = ballBufferGeometry.attributes.noise.array;
    //console.log(values)
    //for (var i = 0; i < ballBufferGeometry.attributes.position.count; i++) {
        //nvals[i]=Math.random();
     //}

    // create custom material from the shader code above
    //   that is within specially labeled script tags
    var customMaterial = new THREE.ShaderMaterial(
        {
            side: THREE.DoubleSide,
            uniforms: customUniforms,
            vertexShader: document.getElementById('vertexShader').textContent,
            fragmentShader: document.getElementById('fragmentShader').textContent
        });

    var ball = new THREE.Mesh(ballBufferGeometry, customMaterial);
    ball.position.set(0, 65, 0);
    scene.add(ball);
}

function animate() {

    requestAnimationFrame(animate);

    controls.update();
    var t = clock.getElapsedTime();
    customUniforms.time.value = 0.25*clock.getElapsedTime();

    renderer.render(scene, camera);
}