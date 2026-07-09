import * as THREE from 'three';

export class Submarine {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();

    // Assemble all submarine drone parts
    this.initStructure();
    this.initSearchlights();

    // Spawn drone near upper surface center
    this.mesh.position.set(0, 15, 0);
    this.scene.add(this.mesh);
  }

  initStructure() {
    // 1. Core Materials
    // Carbon-gray rugged militaristic hull
    const mainHullMat = new THREE.MeshStandardMaterial({
      color: 0x161c22,
      roughness: 0.4,
      metalness: 0.85,
    });

    // Dark-weathered titanium framework
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0a0e12,
      roughness: 0.5,
      metalness: 0.95,
    });

    // Highly intense glowing orange emissive material for the sensor visor
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0xff3a00,
      emissive: 0xff4d00,
      emissiveIntensity: 3.5,
      roughness: 0.1,
      metalness: 0.1,
    });

    // Cyan accent materials for thruster indicators
    const cyanAccentMat = new THREE.MeshStandardMaterial({
      color: 0x00ffcc,
      emissive: 0x00ffcc,
      emissiveIntensity: 1.5,
    });

    // 2. Main Fuselage (Hard-edged geometric block)
    const hullGroup = new THREE.Group();

    // Main structural box hull
    const coreHullGeo = new THREE.BoxGeometry(3.6, 2.6, 7.0);
    const coreHull = new THREE.Mesh(coreHullGeo, mainHullMat);
    coreHull.castShadow = true;
    coreHull.receiveShadow = true;
    hullGroup.add(coreHull);

    // Hard-edged wedge nose cone
    const noseGeo = new THREE.BoxGeometry(3.0, 2.0, 1.8);
    // Bevel front edge conceptually using a forward offset
    const nose = new THREE.Mesh(noseGeo, mainHullMat);
    nose.position.set(0, -0.1, 4.0); // Offset forward on Z axis
    nose.castShadow = true;
    hullGroup.add(nose);

    // Front Glowing Orange Visor (horizontal panoramic sensor strip)
    const visorGeo = new THREE.BoxGeometry(2.4, 0.5, 0.25);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.4, 4.9); // Flush with front of nose
    hullGroup.add(visor);

    // 3. Side Armor Plates (Rugged angular armor panels)
    const armorPlateGeo = new THREE.BoxGeometry(0.4, 1.8, 5.0);

    // Left Armor Panel
    const leftArmor = new THREE.Mesh(armorPlateGeo, frameMat);
    leftArmor.position.set(-2.0, 0, 0);
    leftArmor.castShadow = true;

    // Add mechanical ribs or decals to armor
    const ribGeo = new THREE.BoxGeometry(0.5, 2.0, 0.3);
    for (let r = 0; r < 3; r++) {
      const rib = new THREE.Mesh(ribGeo, mainHullMat);
      rib.position.set(-0.05, 0, -1.5 + r * 1.5);
      leftArmor.add(rib);
    }
    hullGroup.add(leftArmor);

    // Right Armor Panel (cloned & offset)
    const rightArmor = leftArmor.clone();
    rightArmor.position.x = 2.0;
    // Mirror scale adjust so ribs sit correctly on outer side
    rightArmor.children.forEach(child => child.position.x = 0.05);
    hullGroup.add(rightArmor);

    // 4. Rear Propulsion Systems: Dual Rear Propeller Shrouds (with inside blades)
    this.propellerGroup = new THREE.Group();
    this.propellerGroup.position.set(0, 0, -3.5);

    // Left Propeller Shroud (cylindrical ring duct)
    const shroudGeo = new THREE.CylinderGeometry(1.2, 1.2, 1.4, 12, 1, true); // open-ended cylinder
    shroudGeo.rotateX(Math.PI / 2); // align along Z axis

    this.leftShroud = new THREE.Group();
    this.leftShroud.position.set(-1.4, 0, -1.0);

    const leftShroudMesh = new THREE.Mesh(shroudGeo, frameMat);
    leftShroudMesh.castShadow = true;
    this.leftShroud.add(leftShroudMesh);

    // Inside blades (four bladed propeller)
    const bladeGeo = new THREE.BoxGeometry(0.18, 1.8, 0.3);
    this.leftPropBlades = new THREE.Group();

    const blade1 = new THREE.Mesh(bladeGeo, cyanAccentMat);
    const blade2 = blade1.clone();
    blade2.rotation.z = Math.PI / 2;

    this.leftPropBlades.add(blade1);
    this.leftPropBlades.add(blade2);
    this.leftShroud.add(this.leftPropBlades);

    // Right Propeller Shroud
    this.rightShroud = new THREE.Group();
    this.rightShroud.position.set(1.4, 0, -1.0);

    const rightShroudMesh = leftShroudMesh.clone();
    this.rightShroud.add(rightShroudMesh);

    this.rightPropBlades = new THREE.Group();
    const blade3 = blade1.clone();
    const blade4 = blade2.clone();
    this.rightPropBlades.add(blade3);
    this.rightPropBlades.add(blade4);
    this.rightShroud.add(this.rightPropBlades);

    this.propellerGroup.add(this.leftShroud);
    this.propellerGroup.add(this.rightShroud);
    hullGroup.add(this.propellerGroup);

    // 5. Vertical Stabilizer Fins
    const finGeo = new THREE.BoxGeometry(0.15, 1.6, 1.8);
    finGeo.rotateX(-Math.PI / 12); // swept stabilizer fin
    const upperFin = new THREE.Mesh(finGeo, frameMat);
    upperFin.position.set(0, 1.8, -2.8);
    upperFin.castShadow = true;
    hullGroup.add(upperFin);

    const lowerFin = upperFin.clone();
    lowerFin.position.y = -1.8;
    lowerFin.rotation.x = Math.PI / 6;
    hullGroup.add(lowerFin);

    // Add everything to main mesh group
    this.mesh.add(hullGroup);
  }

  initSearchlights() {
    // Twin highly intense cyan searchlights acting as forward visual sensors
    const lightColor = 0x00ffff;
    const intensity = 12.0;
    const distance = 55;
    const angle = Math.PI / 6.0; // focused narrow beam cone
    const penumbra = 0.45; // slightly soft edge fallback

    // Left Headlight Projector Mesh
    const projectorGeo = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 8);
    projectorGeo.rotateX(Math.PI / 2);
    const projectorMat = new THREE.MeshStandardMaterial({
      color: 0x0f1318,
      roughness: 0.3,
      metalness: 0.9
    });

    const leftProjector = new THREE.Mesh(projectorGeo, projectorMat);
    leftProjector.position.set(-1.2, -0.6, 4.3);
    this.mesh.add(leftProjector);

    // Right Headlight Projector Mesh
    const rightProjector = leftProjector.clone();
    rightProjector.position.x = 1.2;
    this.mesh.add(rightProjector);

    // Left SpotLight
    this.leftLight = new THREE.SpotLight(lightColor, intensity, distance, angle, penumbra, 1.0);
    this.leftLight.position.set(-1.2, -0.6, 4.4);
    this.leftLight.castShadow = true;
    this.leftLight.shadow.mapSize.width = 1024;
    this.leftLight.shadow.mapSize.height = 1024;

    // Right SpotLight
    this.rightLight = new THREE.SpotLight(lightColor, intensity, distance, angle, penumbra, 1.0);
    this.rightLight.position.set(1.2, -0.6, 4.4);
    this.rightLight.castShadow = true;
    this.rightLight.shadow.mapSize.width = 1024;
    this.rightLight.shadow.mapSize.height = 1024;

    // Headlight Targets pointing forward in Z direction
    this.leftTarget = new THREE.Object3D();
    this.leftTarget.position.set(-1.2, -1.0, 30);
    this.rightTarget = new THREE.Object3D();
    this.rightTarget.position.set(1.2, -1.0, 30);

    this.mesh.add(this.leftTarget);
    this.mesh.add(this.rightTarget);

    this.leftLight.target = this.leftTarget;
    this.rightLight.target = this.rightTarget;

    this.mesh.add(this.leftLight);
    this.mesh.add(this.rightLight);

    // Volumetric glowing beams representing volumetric scattering through deep sea water
    const beamGeo = new THREE.CylinderGeometry(0.12, 5.0, 24, 16, 1, true);
    beamGeo.rotateX(Math.PI / 2);
    beamGeo.translate(0, 0, 12); // Offset origin forward so cylinder starts exactly at projector face

    const beamMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      transparent: true,
      opacity: 0.16, // distinct atmospheric beam
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.leftBeam = new THREE.Mesh(beamGeo, beamMaterial);
    this.leftBeam.position.set(-1.2, -0.6, 4.4);

    this.rightBeam = this.leftBeam.clone();
    this.rightBeam.position.set(1.2, -0.6, 4.4);

    this.mesh.add(this.leftBeam);
    this.mesh.add(this.rightBeam);
  }

  update(time, scrollProgress) {
    // 1. Rapidly rotate propeller blades inside the dual shrouds
    if (this.leftPropBlades && this.rightPropBlades) {
      // Rotate dynamically - spinning blades indicate thrusters running
      const spinSpeed = 0.35 + (scrollProgress * 0.15);
      this.leftPropBlades.rotation.z += spinSpeed;
      this.rightPropBlades.rotation.z -= spinSpeed; // counter-rotate for stability
    }

    // 2. Procedural Buoyancy Simulation (sinusoidal underwater physics)
    const hoverOffset = Math.sin(time * 1.5) * 0.25;
    const pitchOffset = Math.sin(time * 0.9) * 0.03;
    const yawOffset = Math.cos(time * 0.7) * 0.02;

    // Add minor position sway & tilt
    this.mesh.position.y += hoverOffset * 0.045;
    this.mesh.rotation.x = pitchOffset;
    this.mesh.rotation.y = yawOffset;
    this.mesh.rotation.z = Math.sin(time * 1.3) * 0.015;

    // 3. Modulate headlights & volumetric beam intensities to match underwater turbidity and jitter
    const flicker = 1.0 + Math.sin(time * 9.0) * 0.06;
    this.leftLight.intensity = 12.0 * flicker;
    this.rightLight.intensity = 12.0 * flicker;

    if (this.leftBeam && this.rightBeam) {
      const beamPulse = 0.16 + Math.sin(time * 4.5) * 0.02;
      this.leftBeam.material.opacity = beamPulse;
      this.rightBeam.material.opacity = beamPulse;
    }
  }
}
