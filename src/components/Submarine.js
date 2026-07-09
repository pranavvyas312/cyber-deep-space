import * as THREE from 'three';

export class Submarine {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();

    // Assembling components
    this.initStructure();
    this.initSearchlights();

    // Spawn drone near upper surface center
    this.mesh.position.set(0, 15, 0);
    this.scene.add(this.mesh);
  }

  initStructure() {
    // 1. Materials mimicking rugged carbon-fiber graphite hull and highly emissive orange electronics
    const hullMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a2228,
      roughness: 0.35,
      metalness: 0.85,
    });

    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x0e1317,
      roughness: 0.5,
      metalness: 0.95,
    });

    const orangeEmissiveMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4d00,
      emissive: 0xff3c00,
      emissiveIntensity: 2.2,
      roughness: 0.1,
      metalness: 0.1,
    });

    // 2. Main cylindrical drone fuselage
    const mainHullGeo = new THREE.CylinderGeometry(2.2, 2.2, 7.5, 16);
    // Rotate to align horizontally along the Z-axis
    mainHullGeo.rotateX(Math.PI / 2);
    const mainHull = new THREE.Mesh(mainHullGeo, hullMaterial);
    mainHull.castShadow = true;
    mainHull.receiveShadow = true;
    this.mesh.add(mainHull);

    // 3. Side armor panel clusters (rectangular hard-edged shapes)
    const armorGeo = new THREE.BoxGeometry(0.8, 3.2, 5.5);
    const leftArmor = new THREE.Mesh(armorGeo, frameMaterial);
    leftArmor.position.set(-2.4, 0, 0.4);
    leftArmor.castShadow = true;
    const rightArmor = leftArmor.clone();
    rightArmor.position.x = 2.4;
    this.mesh.add(leftArmor);
    this.mesh.add(rightArmor);

    // 4. Large glowing bright orange camera/sensor visor window at the nose
    const noseGeo = new THREE.CylinderGeometry(2.2, 1.4, 1.5, 16);
    noseGeo.rotateX(Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, hullMaterial);
    nose.position.set(0, 0, 4.2);
    nose.castShadow = true;
    this.mesh.add(nose);

    const visorGeo = new THREE.BoxGeometry(2.8, 0.6, 0.3);
    const visor = new THREE.Mesh(visorGeo, orangeEmissiveMaterial);
    // Position visor right on front surface of the nose cone
    visor.position.set(0, 0.4, 4.9);
    this.mesh.add(visor);

    // 5. Twin lateral thruster housings (rotatable rings) on each side
    const thrusterRingGeo = new THREE.TorusGeometry(0.9, 0.3, 8, 16);

    this.leftThruster = new THREE.Group();
    this.leftThruster.position.set(-3.2, 0, -1.2);
    const leftRing = new THREE.Mesh(thrusterRingGeo, frameMaterial);
    leftRing.rotation.y = Math.PI / 2;
    this.leftThruster.add(leftRing);

    // Add propeller blade inside thruster ring
    const bladeGeo = new THREE.BoxGeometry(0.15, 1.4, 0.3);
    this.leftBlade = new THREE.Mesh(bladeGeo, orangeEmissiveMaterial);
    this.leftBlade.position.set(0, 0, 0);
    this.leftThruster.add(this.leftBlade);

    this.rightThruster = new THREE.Group();
    this.rightThruster.position.set(3.2, 0, -1.2);
    const rightRing = new THREE.Mesh(thrusterRingGeo, frameMaterial);
    rightRing.rotation.y = Math.PI / 2;
    this.rightThruster.add(rightRing);

    this.rightBlade = new THREE.Mesh(bladeGeo, orangeEmissiveMaterial);
    this.rightBlade.position.set(0, 0, 0);
    this.rightThruster.add(this.rightBlade);

    this.mesh.add(this.leftThruster);
    this.mesh.add(this.rightThruster);

    // 6. Vertical stabilizer fin at the tail
    const stabilizerGeo = new THREE.BoxGeometry(0.2, 2.5, 2.0);
    const stabilizer = new THREE.Mesh(stabilizerGeo, frameMaterial);
    stabilizer.position.set(0, 2.0, -3.2);
    stabilizer.castShadow = true;
    this.mesh.add(stabilizer);
  }

  initSearchlights() {
    // Twin bright cyan-blue searchlights acting as the vehicle's forward sensors
    const lightColor = 0x00ffff;
    const intensity = 8.5;
    const distance = 45;
    const angle = Math.PI / 5.5; // focused beam cone
    const penumbra = 0.5; // soft edges

    // Left Headlight
    this.leftLight = new THREE.SpotLight(lightColor, intensity, distance, angle, penumbra, 1.0);
    this.leftLight.position.set(-1.4, -0.6, 4.2);
    this.leftLight.castShadow = true;
    this.leftLight.shadow.mapSize.width = 512;
    this.leftLight.shadow.mapSize.height = 512;

    // Right Headlight
    this.rightLight = new THREE.SpotLight(lightColor, intensity, distance, angle, penumbra, 1.0);
    this.rightLight.position.set(1.4, -0.6, 4.2);
    this.rightLight.castShadow = true;
    this.rightLight.shadow.mapSize.width = 512;
    this.rightLight.shadow.mapSize.height = 512;

    // Configure local light targets to point forward relative to submarine nose orientation
    this.leftTarget = new THREE.Object3D();
    this.leftTarget.position.set(-1.4, -1.2, 25);
    this.rightTarget = new THREE.Object3D();
    this.rightTarget.position.set(1.4, -1.2, 25);

    this.mesh.add(this.leftTarget);
    this.mesh.add(this.rightTarget);

    this.leftLight.target = this.leftTarget;
    this.rightLight.target = this.rightTarget;

    this.mesh.add(this.leftLight);
    this.mesh.add(this.rightLight);

    // Add bright volumetric cylinder cones visual helpers to represent scattering light through murky water
    const beamGeo = new THREE.CylinderGeometry(0.1, 4.5, 20, 16, 1, true);
    beamGeo.rotateX(Math.PI / 2);
    beamGeo.translate(0, 0, 10); // Offset geometry forward

    const beamMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const leftBeam = new THREE.Mesh(beamGeo, beamMaterial);
    leftBeam.position.set(-1.4, -0.6, 4.2);
    const rightBeam = leftBeam.clone();
    rightBeam.position.set(1.4, -0.6, 4.2);

    this.mesh.add(leftBeam);
    this.mesh.add(rightBeam);
  }

  update(time, scrollProgress) {
    // 1. Spin the thruster propeller blades over time
    if (this.leftBlade && this.rightBlade) {
      // Blade spin rate ramps up dynamically based on speed / scrolling motion
      this.leftBlade.rotation.x += 0.25;
      this.rightBlade.rotation.x += 0.25;
    }

    // 2. Procedural Buoyancy Animation mimicking actual water dynamics (Sine/Cosine oscillation)
    // We influence height (Y-coordinate offset), and small rotational pitch and yaw swings
    const hoverOffset = Math.sin(time * 1.4) * 0.28;
    const pitchOffset = Math.sin(time * 0.8) * 0.025;
    const yawOffset = Math.cos(time * 0.6) * 0.02;

    // Apply buoyancy offset safely so it interacts with scroll translation paths in main.js
    this.mesh.position.y += hoverOffset * 0.04;
    this.mesh.rotation.x = pitchOffset;
    this.mesh.rotation.y = yawOffset;
    this.mesh.rotation.z = Math.sin(time * 1.2) * 0.012; // Roll sway

    // 3. Modulate headlight spotlights dynamically to simulate water turbidity and bioluminescent jitter
    const flicker = 1.0 + Math.sin(time * 8.0) * 0.08;
    this.leftLight.intensity = 8.5 * flicker;
    this.rightLight.intensity = 8.5 * flicker;
  }
}
