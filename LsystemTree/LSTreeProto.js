import { LSystem } from './L-System.js'
import * as THREE from './node_modules/three/build/three.module.js';

import { BufferGeometryUtils } from './node_modules/three/examples/jsm/utils/BufferGeometryUtils.js'

function prevent_undefined(value, default_val) {
    return value == undefined ? default_val : value;
}

function random_between(from, to) {
    var sign = Math.random() < 0.5 ? 1 : -1;
    return (Math.random() * (to - from) + from) * sign;
}

export default class LSTreeProto {

    #trunk_material;
    #leaf_material;

    leaf_index = 0;
    trunk_index = 0;

    constructor(position, params) {
        //LSystem
        this.system = new LSystem(
            {
                axiom: prevent_undefined(params.axiom, 'F'),
                rules: prevent_undefined(params.rules, new Map()),
            }
        );
        const iterations = prevent_undefined(params.iterations, 2)
        for (var i = 0; i < iterations; i++) this.system.iteration();
        this.build_string = this.system.get_axiom();

        //console.log("Starting LSystem evaluated: " + this.build_string);

        //materials
        this.#trunk_material = prevent_undefined(
            params.trunk_material,
            new THREE.MeshPhongMaterial({
                map: new THREE.TextureLoader().load('images/bark.jpg'),
                normalMap: new THREE.TextureLoader().load('images/bark-normal.jpg')
            })
        );

        this.#leaf_material = prevent_undefined(
            params.leaf_material,
            new THREE.MeshPhongMaterial({
                color: 0x2C783E,
                map: new THREE.TextureLoader().load('images/leaf.jpg'),
                normalMap: new THREE.TextureLoader().load('images/leaf-normal.jpg'),
                transparent: true
            })
        );

        //geometry
        this.position = position;

        this.rotation_min = params.rotation_min || 10;
        this.rotation_max = params.rotation_max || 40;
        this.rotation_change_func = prevent_undefined(params.rotation_change_func, (rotation) => rotation / 2);

        this.length = params.length || 30;
        this.length_change_func = prevent_undefined(params.length_change_func, (length) => length * 0.7 + 5);

        this.trunk_radius = params.trunk_radius || 10;
        this.trunk_radius_change_func = prevent_undefined(params.trunk_radius_change_func, (radius) => radius / 2 + 1);

        this.leaf_size = params.leaf_size || 12;


        //mesh-grouping
        this.trunk_geos = [];
        this.leaf_geos = [];
        this.leaves_mesh = new THREE.Mesh();
        this.trunk_mesh = new THREE.Mesh();


    }

    #create_branch(from, to, width) {
        const curve = new THREE.LineCurve3(from, to);
        const geo = new THREE.TubeBufferGeometry(curve, 20, width, 6, true);
        this.trunk_geos.push(geo);
    }

    #create_leaf(where) {
        const geo = new THREE.SphereBufferGeometry(12, 12, 7);
        geo.applyMatrix4(new THREE.Matrix4().makeScale(2, 1, 2));
        geo.applyMatrix4(new THREE.Matrix4().makeTranslation(where.x, where.y, where.z));
        this.leaf_geos.push(geo);
    }

    add_to_scene(scene) {

        const start = performance.now();
        this.draw();



            const leafmesh = new THREE.Mesh(
                BufferGeometryUtils.mergeBufferGeometries(this.leaf_geos),
                this.#leaf_material
            )

            const spinemesh = new THREE.Mesh(
                BufferGeometryUtils.mergeBufferGeometries(this.trunk_geos),
                this.#trunk_material
            )


        this.leaves_mesh = leafmesh;
        this.trunk_mesh = spinemesh;

        scene.add(leafmesh);
        scene.add(spinemesh);

        return performance.now()-start;
    }

    draw(start_point = this.position, string = this.build_string, start_rot_x = 0, start_rot_z = 0, material = 10, length = this.length) {
        var point = start_point;
        var rotx = start_rot_x, rotz = start_rot_z;

        for (var i = 0; i < string.length; i++) {
            switch (string[i]) {
                case '(': {
                    const end = this.#find_closing_parentheses(string, i + 1);
                    this.draw(point, string.substr(i + 1, end - i - 1), rotx, rotz, material / 1.5 + +0.3, length * 0.6 + 5);
                    i = end;
                    break;
                }
                case 'S': {
                    const end_point = point.clone().add(new THREE.Vector3(rotx, length, rotz).normalize().multiplyScalar(length));
                    const newpoint = end_point.clone().add(new THREE.Vector3(rotx, length, rotz).normalize().multiplyScalar(5));
                    this.#create_branch(point, newpoint, material);
                    point = end_point;
                    rotx = this.rotation_change_func(rotx);
                    rotz = this.rotation_change_func(rotz);
                    break;

                }
                case 'L': {
                    if (string[i - 1] != ')') this.#create_leaf(point);
                    break;
                }
                case 'r': {
                    rotx += random_between(this.rotation_min, this.rotation_max);
                    rotz += random_between(this.rotation_min, this.rotation_max);
                    break;
                }
            }
        }
    }

    #find_closing_parentheses(string, index) {
        var opened = 0;
        for (var i = index + 1; i < string.length; i++) {
            if (string[i] == ')') {
                if (opened == 0) return i;
                else opened--;
            }
            else if (string[i] == '(') {
                opened++;
                i += 1;
            }
        }
    }
}

export { LSTreeProto }