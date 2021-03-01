import { LSystem } from './L-System.js'
import * as THREE from './node_modules/three/build/three.module.js';

import { BufferGeometryUtils } from './node_modules/three/examples/jsm/utils/BufferGeometryUtils.js'
import { ConvexBufferGeometry } from './node_modules/three/examples/jsm/geometries/ConvexGeometry.js'

function prevent_undefined(value, default_val) {
    return value == undefined ? default_val : value;
}

class BranchCurve extends THREE.LineCurve3 {
    getPoint(t, optionalTarget = new THREE.Vector3()) {
        return this.v1.clone().lerp(this.v2, t * 1.1);
    }
}

export default class LSTree {
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
        const iterations = prevent_undefined(params.iterations, 2);
        for (let i = 0; i < iterations; i++) {
            this.system.iteration();
        }
        this.build_string = this.system.get_axiom();

        //console.log("Starting LSystem evaluated: " + this.build_string);

        //materials
        this.#trunk_material = prevent_undefined(
            params.trunk_material,
            new THREE.MeshPhongMaterial({
                map: new THREE.TextureLoader().load('images/bark.jpg'),
                normalMap: new THREE.TextureLoader().load('images/bark-normal.jpg'),
                side: THREE.DoubleSide
            })
        );

        this.#leaf_material = prevent_undefined(
            params.leaf_material,
            new THREE.MeshPhongMaterial({
                color: 0x2C783E,
            })
        );

        //geometry
        this.position = position;

        this.length_by_age_func = prevent_undefined(params.length_by_age_func, (age) => 3 / Math.log10(age + 2) - age / 16);

        this.radius_by_age_func = prevent_undefined(params.radius_by_age_func, (age) => 3 / Math.log10(age + 2) - age / 16);

        //mesh-grouping
        this.trunk_geos = new Array(this.build_string.match(/[S]/g).length);
        this.leaf_geos = new Array(this.build_string.match(/[^)]L/g).length);
    }

    #create_branch(from, to, width) {
        this.trunk_geos[this.trunk_index++] = new THREE.TubeBufferGeometry(new BranchCurve(from, to), 1, width, 6, false);
    }

    #create_leaf(where) {
        this.leaf_geos[this.leaf_index++] = where;
    }

    #group_leaves(dist = 18) {
        const dstsq = dist * dist;
        let cg = 0;

        const groups = this.leaf_geos.map(x => {
            return {
                point: x,
                group: -1
            }
        });
        let group_merges = [];

        for (let i = 0; i < groups.length; i++) {
            if (groups[i].group == -1) groups[i].group = cg++;
            for (let j = i + 1; j < groups.length; j++) {
                if (groups[i].group != groups[j].group && groups[i].point.distanceToSquared(groups[j].point) < dstsq) {
                    if (groups[j].group == -1) groups[j].group = groups[i].group;
                    else {
                        let added = false;
                        for (let k = 0; k < group_merges.length; k++) {
                            if (group_merges[k].has(groups[i].group)) {
                                group_merges[k].add(groups[j].group);
                                added = true;
                                break;
                            }
                            if (group_merges[k].has(groups[j].group)) {
                                group_merges[k].add(groups[i].group);
                                added = true;
                                break;
                            }
                        }
                        if (!added) {
                            group_merges.push(new Set([groups[i].group, groups[j].group]));
                        }
                    }
                }
            }
        }

        group_merges = group_merges.map(x => [...x.values()]);

        const index = (g) => {
            for (let z = 0; z < group_merges.length; z++) {
                if (group_merges[z].includes(g)) return group_merges[z][0];
            }
            return g;
        }

        groups.forEach(x => x.group = index(x.group));

        const mg = new Map();

        groups.forEach(x => {
            if (mg.has(x.group)) mg.get(x.group).push(x.point);
            else mg.set(x.group, new Array(x.point));
        })

        return [...mg.values()];
    }

    add_to_scene(scene) {
        this.draw();
        const spheres = [];
        const convexes = [];

        const start = performance.now();
        this.#group_leaves().forEach(x => {
            if (x.length > 4) convexes.push(new ConvexBufferGeometry(x));
            else {
                let g = new THREE.SphereBufferGeometry(6, 3, 3);
                g.applyMatrix4(new THREE.Matrix4().makeTranslation(x[0].x, x[0].y, x[0].z));
                spheres.push(g);
            }
        });

        const groups = convexes.concat(spheres).map(x => {
            const att = x.attributes.position;
            const width_seg = 5, rad_seg = 4;
            const points = new Array(att.count * ((width_seg) * (rad_seg - 1) + 2));

            for (let i = 0, index = 0, end = att.count; i < end; i++) {
                const g = new THREE.SphereBufferGeometry(15, width_seg, rad_seg);
                BufferGeometryUtils.mergeVertices(g);
                g.applyMatrix4(new THREE.Matrix4().makeTranslation(att.getX(i), att.getY(i), att.getZ(i)));
                for (let j = width_seg, end2 = g.attributes.position.count - width_seg; j < end2; j++) {
                    if (j % (width_seg + 1) != 1) points[index++] = new THREE.Vector3().fromBufferAttribute(g.attributes.position, j);
                }
            }
            return new ConvexBufferGeometry(points);
        });

        const trunkmesh = new THREE.Mesh(
            BufferGeometryUtils.mergeBufferGeometries(this.trunk_geos, true),
            this.#trunk_material
        );

        const leafmesh = new THREE.Mesh(
            BufferGeometryUtils.mergeBufferGeometries(groups, true),
            this.#leaf_material
        )

        leafmesh.recieveShadow=true;
        leafmesh.castShadow=true;
        trunkmesh.recieveShadow=true;
        trunkmesh.castShadow=true;

        scene.add(leafmesh);
        scene.add(trunkmesh);

        const time = performance.now() - start;

        return time;
    }

    test_performance(interations) {
        let ret = { rotation: 0, normalize: 0 };

        const ran_vec = () => {
            return new THREE.Vector3(
                Math.random() * 200 - 100,
                Math.random() * 200 - 100,
                Math.random() * 200 - 100
            )
        }

        const points = new Array(interations);
        points.fill(ran_vec());

        let rotx = 20, rotz = 20;

        const length = 20;

        const p1 = [], p2 = [];

        let start = performance.now();
        for (let i = 0; i < interations; i++) {
            const end_point = points[i].clone().add(new THREE.Vector3().setFromSphericalCoords(length, rotz, rotx));
            p1.push(end_point);
        }

        ret.normalize = performance.now() - start;
        start = performance.now();

        for (let i = 0; i < interations; i++) {
            const end_point = points[i].clone();
            end_point.x += length * Math.sin(rotz) * Math.cos(rotx);
            end_point.y += length * Math.sin(rotz) * Math.sin(rotx);
            end_point.z += length * Math.cos(rotz);
            p2.push(end_point);
        }
        console.log(p1);
        console.log(p2);

        ret.rotation = performance.now() - start;
        return ret;
    }

    draw(start_point = this.position,
        string = this.build_string,
        phi_start = 0, theta_start = 0,
        age = 0) {
        let point = start_point;
        let theta = theta_start, phi = phi_start;

        for (let i = 0; i < string.length; i++) {
            switch (string[i]) {
                case '(': {
                    const end = this.#find_closing_parentheses(string, i + 1, '(', ')');
                    this.draw(point,
                        string.substr(i + 1, end - i - 1),
                        Math.random() * 6.28, 3.14 / 6 + Math.random() * 3.14 / 4,
                        age + 2);
                    i = end;
                    break;
                }
                case 'S': {
                    const end_point = point.clone().add(new THREE.Vector3().setFromSphericalCoords(this.length_by_age_func(age), theta, phi));
                    this.#create_branch(point, end_point, this.radius_by_age_func(age));
                    point = end_point;
                    age++;
                    break;
                }
                case 'L': {
                    if (string[i - 1] != ')') this.#create_leaf(point);
                    break;
                }
                case 'r': {
                    phi += Math.random() * 3.14 / 3 - 3.14 / 6;
                    theta += Math.random() * 3.14 / 5 - 3.14 / 15;
                    break;
                }
                case '[': {
                    const end = this.#find_closing_parentheses(string, i + 1, '[', ']');
                    this.draw(point,
                        string.substr(i + 1, end - i - 1),
                        phi, theta,
                        age + 2);
                    i = end;
                    break;
                }
            }
        }
    }

    #find_closing_parentheses(string, index, char_open, char_close) {
        let opened = 0;
        for (let i = index + 1; i < string.length; i++) {
            if (string[i] == char_close) {
                if (opened == 0) return i;
                else opened--;
            }
            else if (string[i] == char_open) {
                opened++;
                i += 1;
            }
        }
    }
}

export { LSTree }