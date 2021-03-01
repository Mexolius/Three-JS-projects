import * as THREE from './node_modules/three/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/controls/OrbitControls.js';

import { LSTreeProto } from './LSTreeProto.js'
import { LSTree } from './LSTree.js'

import { LSRulesets } from './LSRulesets.js'

function init() {
    init_env();
    init_LSystem();
}

const renderer = new THREE.WebGLRenderer(
    {antialias: true}
);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
const controls = new OrbitControls(camera, renderer.domElement);
const tl = new THREE.TextureLoader();

const clock = new THREE.Clock();
let customUniforms=
{
    time: {type: 'f', value: 0.0}
};

function animate() {
    requestAnimationFrame(animate);

    controls.update();
    customUniforms.time.value = 0.25*clock.getElapsedTime();

    renderer.render(scene, camera);
}

init();
animate();

function init_env() {
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);

    camera.position.set(0, 500, 500);
    controls.update();

    let light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(0, 250, 0);
    light.target.position.set(0,0,0);
    scene.add(light);

    // FLOOR
    let floorTexture = new tl.load('images/checkerboard.jpg');
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(10, 10);
    let floorMaterial = new THREE.MeshLambertMaterial({ map: floorTexture, side: THREE.DoubleSide });
    let floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
    let floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.recieveShadow=true;
    floor.position.y = -0.5;
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);
    // SKYBOX/FOG
    let skyBoxGeometry = new THREE.CubeGeometry(10000, 10000, 10000);
    let skyBoxMaterial = new THREE.MeshBasicMaterial({ color: 0x9999ff, side: THREE.BackSide });
    let skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
    scene.add(skyBox);

    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });
}

function init_LSystem() {



    const mat = new THREE.ShaderMaterial(
        {
            uniforms: customUniforms,
            vertexShader: document.getElementById('vertexShader').textContent,
            fragmentShader: document.getElementById('fragmentShader').textContent
        });


    //very obscure and old prototype. Also the grammar doesn't work well with it so it grows really big.
    /*let t0 = new LSTreeProto(new THREE.Vector3(-400,0,0),{
        axiom: "ST",
        rules: LSRulesets.oak,
        iterations:7
    });*/

    let t1 = new LSTree(new THREE.Vector3(0,0,0),{
        axiom: "ST",
        rules: LSRulesets.oak,
        radius_by_age_func: (age)=>1/(Math.pow(1.2,age-15)) +0.2 ,
        length_by_age_func: (age)=>1/(Math.pow(1.05,age-79)) +3,
        iterations:7
    });

    let t2 = new LSTree(new THREE.Vector3(400,0,0),{
        axiom: "ST",
        rules: LSRulesets.oak,
        radius_by_age_func: (age)=>1/(Math.pow(1.2,age-15)) +0.2 ,
        length_by_age_func: (age)=>1/(Math.pow(1.05,age-79)) +3,
        iterations:7,
        leaf_material: mat
    });

    const singular_trees = ()=>{
            //Grammar modified to suit final tree. It looks baad
    //console.log("time for proto tree " + t0.add_to_scene(scene) +"ms");
    //Final result, uses point grouping by distance and convex hull
    console.log("time for normal tree " + t1.add_to_scene(scene)+"ms");
    //Tried to add a perlin noise for vertex displacement but i presume merging geometries messes with the result.
    //Also i forgot to add a texture and delete movement
    //I realised it looks really cool so i left it here
    console.log("time for shader tree " + t2.add_to_scene(scene)+"ms");
    }

    const forest = ()=>{
        const trees = new Array(25);
    const positions = new Array(25);

    for(let i=-2;i<3;i++){
        for(let j=-2;j<3;j++){
            positions[5*(i+2)+(j+2)] = new THREE.Vector3(i*200 + Math.random()*40-20,0,j*200+ Math.random()*40-20);
        }
    }

    const times =[];
    for(let pos of positions){
       times.push( new LSTree(pos,{
            axiom: "ST",
            rules: LSRulesets.oak,
            radius_by_age_func: (age)=>1/(Math.pow(1.2,age-15)) +0.2 ,
            length_by_age_func: (age)=>1/(Math.pow(1.05,age-79)) +3,
            iterations:5
        }).add_to_scene(scene));
    }

    const time = times.reduce((a,b)=>a+b,0);
    console.log("overall time: " + time + "ms");
    console.log("average time: " + time/25 + "ms");
    console.log("max time: " + Math.max(...times) + "ms");
    console.log("min time: " + Math.min(...times) + "ms");
    }

    singular_trees();
    //forest();

}