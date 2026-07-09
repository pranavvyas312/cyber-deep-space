import * as THREE from 'three';

export class Submarine {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();

    // Assemble the hyper-detailed 15+ part geometric model
    this.initStructure();
    this.initSearchlights();

    // Spawn drone near upper surface center
    this.mesh.position.set(0, 15, 0);
    this.scene.add(this.mesh);
  }

  initStructure() {
    // 1. High-fidelity PBR Weathered Metallic Materials
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x222e38,
      roughness: 0.18, // slick, wet, reflective look
      metalness: 0.9,  // highly metallic
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x0c0f13,
      roughness: 0.5,
      metalness: 0.8,
    });

    const titaniumPlateMat = new THREE.MeshStandardMaterial({
      color: 0x485868,
      roughness: 0.22,
      metalness: 0.95,
    });

    // Intense orange glowing emissive visor
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      emissive: 0xff3c00,
      emissiveIntensity: 5.0,
      roughness: 0.05,
      metalness: 0.1,
    });

    const propellerMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00a1b5,
      emissiveIntensity: 1.8,
      roughness: 0.1,
      metalness: 0.9,
    });

    // Construct the multi-layered assembly (20+ parts)
    const assembly = new THREE.Group();

    // Part 1: Main central cylindrical fuselage pressure hull
    const pressureHullGeo = new THREE.CylinderGeometry(2.3, 2.3, 6.2, 20);
    pressureHullGeo.rotateX(Math.PI / 2);
    const pressureHull = new THREE.Mesh(pressureHullGeo, hullMat);
    pressureHull.castShadow = true;
    pressureHull.receiveShadow = true;
    assembly.add(pressureHull);

    // Part 2: Front beveled nose block (transition to the camera pod)
    const noseGeo = new THREE.CylinderGeometry(2.3, 1.8, 1.4, 20);
    noseGeo.rotateX(Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, darkTrimMat);
    nose.position.set(0, 0, 3.8);
    nose.castShadow = true;
    assembly.add(nose);

    // Part 3: Front camera/lens housing pod
    const cameraPodGeo = new THREE.SphereGeometry(1.5, 20, 20);
    const cameraPod = new THREE.Mesh(cameraPodGeo, titaniumPlateMat);
    cameraPod.position.set(0, 0.15, 4.4);
    cameraPod.castShadow = true;
    assembly.add(cameraPod);

    // Part 4: The orange glowing panoramic visor/sensor lens strip
    const visorGeo = new THREE.BoxGeometry(2.2, 0.45, 0.3);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.2, 5.7);
    assembly.add(visor);

    // Part 5: Visor frame/protective safety bezel
    const visorBezelGeo = new THREE.BoxGeometry(2.4, 0.6, 0.15);
    const visorBezel = new THREE.Mesh(visorBezelGeo, darkTrimMat);
    visorBezel.position.set(0, 0.2, 5.6);
    assembly.add(visorBezel);

    // Part 6 & 7: Dual left and right heavy upper side armor plates
    const upperPlateGeo = new THREE.BoxGeometry(0.35, 1.4, 5.0);

    const leftUpperPlate = new THREE.Mesh(upperPlateGeo, titaniumPlateMat);
    leftUpperPlate.position.set(-2.4, 0.4, 0.2);
    leftUpperPlate.rotation.y = Math.PI / 60;
    leftUpperPlate.castShadow = true;
    assembly.add(leftUpperPlate);

    const rightUpperPlate = leftUpperPlate.clone();
    rightUpperPlate.position.x = 2.4;
    rightUpperPlate.rotation.y = -Math.PI / 60;
    assembly.add(rightUpperPlate);

    // Part 8 & 9: Dual left and right lower armored stabilizing runners (skids)
    const skidGeo = new THREE.BoxGeometry(0.28, 0.28, 5.8);
    const leftSkid = new THREE.Mesh(skidGeo, darkTrimMat);
    leftSkid.position.set(-2.0, -1.5, 0.2);
    leftSkid.castShadow = true;
    assembly.add(leftSkid);

    const rightSkid = leftSkid.clone();
    rightSkid.position.x = 2.0;
    assembly.add(rightSkid);

    // Part 10 & 11: Heavy skid support struts (connecting core hull to skids)
    const strutGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8);

    for (let s = 0; s < 2; s++) {
      const zOffset = -1.5 + s * 3.0;
      const leftStrut = new THREE.Mesh(strutGeo, darkTrimMat);
      leftStrut.position.set(-1.8, -1.0, zOffset);
      leftStrut.rotation.z = Math.PI / 8;
      assembly.add(leftStrut);

      const rightStrut = leftStrut.clone();
      rightStrut.position.x = 1.8;
      rightStrut.rotation.z = -Math.PI / 8;
      assembly.add(rightStrut);
    }

    // Part 12 & 13: Conning tower (dorsal electronics bay / antenna array)
    const towerGeo = new THREE.BoxGeometry(0.8, 1.2, 3.2);
    const conningTower = new THREE.Mesh(towerGeo, darkTrimMat);
    conningTower.position.set(0, 1.8, -0.6);
    conningTower.castShadow = true;
    assembly.add(conningTower);

    const antennaGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8);
    const antenna = new THREE.Mesh(antennaGeo, titaniumPlateMat);
    antenna.position.set(0.2, 1.3, -1.2);
    conningTower.add(antenna);

    // Part 14 & 15: Dual rear propeller shrouds (circular ducts enclosing propellers)
    const shroudGeo = new THREE.CylinderGeometry(1.3, 1.3, 1.4, 16, 1, true); // open-ended cylinders
    shroudGeo.rotateX(Math.PI / 2);

    this.leftShroud = new THREE.Group();
    this.leftShroud.position.set(-1.6, -0.2, -3.9);
    const leftShroudMesh = new THREE.Mesh(shroudGeo, darkTrimMat);
    leftShroudMesh.castShadow = true;
    this.leftShroud.add(leftShroudMesh);

    this.rightShroud = new THREE.Group();
    this.rightShroud.position.set(1.6, -0.2, -3.9);
    const rightShroudMesh = leftShroudMesh.clone();
    this.rightShroud.add(rightShroudMesh);

    // Part 16 & 17: Propulsion shafts (nacelles inside shrouds)
    const shaftGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.1, 8);
    shaftGeo.rotateX(Math.PI / 2);

    const leftShaft = new THREE.Mesh(shaftGeo, titaniumPlateMat);
    leftShaft.position.set(0, 0, 0.1);
    this.leftShroud.add(leftShaft);

    const rightShaft = leftShaft.clone();
    this.rightShroud.add(rightShaft);

    // Part 18 & 19: Dual rotating propeller blades
    const bladeGeo = new THREE.BoxGeometry(0.18, 2.0, 0.4);

    this.leftPropBlades = new THREE.Group();
    const lBlade1 = new THREE.Mesh(bladeGeo, propellerMat);
    const lBlade2 = lBlade1.clone();
    lBlade2.rotation.z = Math.PI / 2;
    this.leftPropBlades.add(lBlade1);
    this.leftPropBlades.add(lBlade2);
    this.leftPropBlades.position.set(0, 0, -0.6); // at rear of shroud
    this.leftShroud.add(this.leftPropBlades);

    this.rightPropBlades = new THREE.Group();
    const rBlade1 = lBlade1.clone();
    const rBlade2 = lBlade2.clone();
    this.rightPropBlades.add(rBlade1);
    this.rightPropBlades.add(rBlade2);
    this.rightPropBlades.position.set(0, 0, -0.6);
    this.rightShroud.add(this.rightPropBlades);

    assembly.add(this.leftShroud);
    assembly.add(this.rightShroud);

    // Part 20, 21 & 22: High-fidelity angled stabilizer fins (dorsal and bilateral)
    const stabilizerGeo = new THREE.BoxGeometry(0.14, 1.8, 1.4);
    stabilizerGeo.rotateX(-Math.PI / 12);

    const dorsalFin = new THREE.Mesh(stabilizerGeo, hullMat);
    dorsalFin.position.set(0, 1.9, -2.8);
    dorsalFin.castShadow = true;
    assembly.add(dorsalFin);

    const leftFinGeo = new THREE.BoxGeometry(1.6, 0.14, 1.2);
    leftFinGeo.rotateY(Math.PI / 12);

    const leftFin = new THREE.Mesh(leftFinGeo, hullMat);
    leftFin.position.set(-2.5, -0.2, -1.8);
    leftFin.castShadow = true;
    assembly.add(leftFin);

    const rightFin = leftFin.clone();
    rightFin.position.x = 2.5;
    rightFin.rotation.y = -Math.PI / 12;
    assembly.add(rightFin);

    // Add full multi-layered model assembly to group
    this.mesh.add(assembly);
  }

  initSearchlights() {
    // Twin high-intensity headlights
    const lightColor = 0x00ffff;
    const intensity = 15.0; // intense projection
    const distance = 60;
    const angle = Math.PI / 5.5; // razor narrow angle
    const penumbra = 0.4;

    // Headlight housing mounts (geometric primitives)
    const mountGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.9, 10);
    mountGeo.rotateX(Math.PI / 2);
    const mountMat = new THREE.MeshStandardMaterial({
      color: 0x0b0e12,
      roughness: 0.25,
      metalness: 0.9,
    });

    const leftMount = new THREE.Mesh(mountGeo, mountMat);
    leftMount.position.set(-1.4, -0.5, 4.2);
    leftMount.castShadow = true;
    this.mesh.add(leftMount);

    const rightMount = leftMount.clone();
    rightMount.position.x = 1.4;
    this.mesh.add(rightMount);

    // SpotLights
    this.leftLight = new THREE.SpotLight(lightColor, intensity, distance, angle, penumbra, 1.0);
    this.leftLight.position.set(-1.4, -0.5, 4.3);
    this.leftLight.castShadow = true;
    this.leftLight.shadow.mapSize.width = 1024;
    this.leftLight.shadow.mapSize.height = 1024;

    this.rightLight = new THREE.SpotLight(lightColor, intensity, distance, angle, penumbra, 1.0);
    this.rightLight.position.set(1.4, -0.5, 4.3);
    this.rightLight.castShadow = true;
    this.rightLight.shadow.mapSize.width = 1024;
    this.rightLight.shadow.mapSize.height = 1024;

    // Forward light targets
    this.leftTarget = new THREE.Object3D();
    this.leftTarget.position.set(-1.4, -0.9, 32);
    this.rightTarget = new THREE.Object3D();
    this.rightTarget.position.set(1.4, -0.9, 32);

    this.mesh.add(this.leftTarget);
    this.mesh.add(this.rightTarget);

    this.leftLight.target = this.leftTarget;
    this.rightLight.target = this.rightTarget;

    this.mesh.add(this.leftLight);
    this.mesh.add(this.rightLight);

    // Realistic volumetric light cones slicing through the water (semi-transparent fading cylinders)
    const beamGeo = new THREE.CylinderGeometry(0.15, 6.2, 28, 20, 1, true);
    beamGeo.rotateX(Math.PI / 2);
    beamGeo.translate(0, 0, 14); // offset forward

    const beamMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      transparent: true,
      opacity: 0.22, // highly noticeable scattering glow
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.leftBeam = new THREE.Mesh(beamGeo, beamMaterial);
    this.leftBeam.position.set(-1.4, -0.5, 4.3);

    this.rightBeam = this.leftBeam.clone();
    this.rightBeam.position.set(1.4, -0.5, 4.3);

    this.mesh.add(this.leftBeam);
    this.mesh.add(this.rightBeam);
  }

  update(time, scrollProgress) {
    // 1. Rapidly rotate the propeller blades inside their shrouds
    if (this.leftPropBlades && this.rightPropBlades) {
      const spinSpeed = 0.42 + (scrollProgress * 0.18);
      this.leftPropBlades.rotation.z += spinSpeed;
      this.rightPropBlades.rotation.z -= spinSpeed; // counter-rotate
    }

    // 2. Animate secondary propeller shroud rotation (steering pivot animation)
    if (this.leftShroud && this.rightShroud) {
      const turnAngle = Math.sin(time * 1.8) * 0.08;
      this.leftShroud.rotation.y = turnAngle;
      this.rightShroud.rotation.y = turnAngle;
    }

    // 3. Immersive buoyancy and hydrodynamic swaying physics
    const hoverOffset = Math.sin(time * 1.6) * 0.26;
    const pitchOffset = Math.sin(time * 1.0) * 0.035;
    const yawOffset = Math.cos(time * 0.8) * 0.024;

    this.mesh.position.y += hoverOffset * 0.042;
    this.mesh.rotation.x = pitchOffset;
    this.mesh.rotation.y = yawOffset;
    this.mesh.rotation.z = Math.sin(time * 1.4) * 0.016;

    // 4. Jitter headlight & beam opacity slightly to match water turbidity
    const flicker = 1.0 + Math.sin(time * 10.0) * 0.05;
    this.leftLight.intensity = 15.0 * flicker;
    this.rightLight.intensity = 15.0 * flicker;

    if (this.leftBeam && this.rightBeam) {
      const opacityPulse = 0.22 + Math.sin(time * 5.0) * 0.03;
      this.leftBeam.material.opacity = opacityPulse;
      this.rightBeam.material.opacity = opacityPulse;
    }
  }
}
