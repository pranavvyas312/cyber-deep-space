import * as THREE from 'three';

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.marineSnow = null;
    this.backgroundStructures = new THREE.Group();
    this.scene.add(this.backgroundStructures);

    this.initLighting();
    this.initFog();
    this.initMarineSnow();
    this.initProceduralCity();
  }

  initLighting() {
    // Bioluminescent ambient fill - moody deep-sea indigo/blue
    this.ambientLight = new THREE.AmbientLight(0x011a2e, 1.2);
    this.scene.add(this.ambientLight);

    // Global directional moonlight filter through deep water layers
    this.oceanDirLight = new THREE.DirectionalLight(0x00ffcc, 1.5);
    this.oceanDirLight.position.set(20, 100, -10);
    this.oceanDirLight.castShadow = true;
    this.oceanDirLight.shadow.mapSize.width = 1024;
    this.oceanDirLight.shadow.mapSize.height = 1024;
    this.oceanDirLight.shadow.bias = -0.001;
    this.scene.add(this.oceanDirLight);

    // Dynamic accent light representing bioluminescent flora or cyber neon glows
    this.neonAccent = new THREE.PointLight(0xff5500, 2.5, 100);
    this.neonAccent.position.set(-25, -40, -15);
    this.scene.add(this.neonAccent);
  }

  initFog() {
    // Intense exponential deep emerald/teal underwater fog
    this.scene.fog = new THREE.FogExp2(0x00131c, 0.018);
  }

  initMarineSnow() {
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = [];
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Scatter in a large volumetric container around camera path
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200; // tall vertical distribution
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

      speeds.push({
        y: 0.05 + Math.random() * 0.1,
        x: (Math.random() - 0.5) * 0.02,
        z: (Math.random() - 0.5) * 0.02
      });

      sizes[i] = 0.08 + Math.random() * 0.15;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader/material for particles to make them glow organically like bioluminescent marine snow
    const material = new THREE.PointsMaterial({
      color: 0x00ffcc,
      size: 0.15,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.marineSnow = new THREE.Points(geometry, material);
    this.marineSnowSpeeds = speeds;
    this.scene.add(this.marineSnow);
  }

  initProceduralCity() {
    // Generate flooded cyberpunk infrastructure: skyscrapers, industrial columns, pipes, reactors

    // 1. Skeletal tower structures (flooded harbor towers) - distributed along vertical path
    const towerGeo = new THREE.BoxGeometry(8, 60, 8);
    const panelGeo = new THREE.BoxGeometry(8.2, 2, 8.2);

    // Cyberpunk structure metallic / reflective material
    const structureMat = new THREE.MeshStandardMaterial({
      color: 0x051d2c,
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0x01131c
    });

    const neonOrangeMat = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      emissive: 0xff3300,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.1
    });

    const neonCyanMat = new THREE.MeshStandardMaterial({
      color: 0x00ffcc,
      emissive: 0x00ffcc,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.1
    });

    // Create 15 tall skyscrapers / industrial columns
    for (let i = 0; i < 15; i++) {
      const towerGroup = new THREE.Group();
      const mesh = new THREE.Mesh(towerGeo, structureMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      towerGroup.add(mesh);

      // Add neon band rings to the skyscrapers
      const bandsCount = 3 + Math.floor(Math.random() * 4);
      for (let j = 0; j < bandsCount; j++) {
        const ringMesh = new THREE.Mesh(panelGeo, Math.random() > 0.5 ? neonOrangeMat : neonCyanMat);
        ringMesh.position.y = -25 + (j * 15);
        towerGroup.add(ringMesh);
      }

      // Scatter structures throughout the depth sectors
      const angle = Math.random() * Math.PI * 2;
      const radius = 25 + Math.random() * 20;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      const y = -i * 18 + 20; // spiral-down coordinate pattern matching camera path

      towerGroup.position.set(x, y, z);
      this.backgroundStructures.add(towerGroup);
    }

    // 2. Giant Industrial Pipes and Cables connecting the sectors
    const pipeCount = 8;
    for (let i = 0; i < pipeCount; i++) {
      const length = 80 + Math.random() * 40;
      const pipeGeo = new THREE.CylinderGeometry(1.2, 1.2, length, 8);
      const pipeMesh = new THREE.Mesh(pipeGeo, structureMat);

      // Orient horizontally or diagonally crossing the scene
      pipeMesh.rotation.x = Math.PI / (1.5 + Math.random());
      pipeMesh.rotation.z = Math.random() * Math.PI;

      const x = (Math.random() - 0.5) * 50;
      const y = -i * 30 + 10;
      const z = -20 - Math.random() * 25;
      pipeMesh.position.set(x, y, z);

      this.backgroundStructures.add(pipeMesh);
    }

    // 3. Central Power Reactor Core (Sunken relic) - located at deep Sector 4
    this.reactorGroup = new THREE.Group();
    this.reactorGroup.position.set(0, -95, -15);

    // Core core
    const coreGeo = new THREE.SphereGeometry(6, 16, 16);
    const coreMesh = new THREE.Mesh(coreGeo, neonOrangeMat);
    this.reactorGroup.add(coreMesh);

    // Rotating structural torus rings around the core
    this.reactorRing1 = new THREE.Mesh(new THREE.TorusGeometry(10, 0.8, 8, 32), structureMat);
    this.reactorRing2 = new THREE.Mesh(new THREE.TorusGeometry(13, 0.5, 8, 32), neonCyanMat);

    this.reactorRing1.rotation.x = Math.PI / 4;
    this.reactorRing2.rotation.y = Math.PI / 3;

    this.reactorGroup.add(this.reactorRing1);
    this.reactorGroup.add(this.reactorRing2);
    this.backgroundStructures.add(this.reactorGroup);
  }

  update(time) {
    // 1. Softly animate the custom marine snow drifting under ocean currents
    if (this.marineSnow) {
      const positions = this.marineSnow.geometry.attributes.position.array;
      const count = positions.length / 3;

      for (let i = 0; i < count; i++) {
        const speed = this.marineSnowSpeeds[i];

        // Drift downwards
        positions[i * 3 + 1] -= speed.y;
        // Float side to side (microcurrents)
        positions[i * 3] += speed.x + Math.sin(time + i) * 0.01;
        positions[i * 3 + 2] += speed.z + Math.cos(time + i) * 0.01;

        // Respawn if goes too low
        if (positions[i * 3 + 1] < -160) {
          positions[i * 3 + 1] = 60;
          positions[i * 3] = (Math.random() - 0.5) * 120;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
        }
      }
      this.marineSnow.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Slow orbital animations for structural background components to breathe life
    if (this.backgroundStructures) {
      this.backgroundStructures.children.forEach((structure, idx) => {
        // Slow sway / ocean current influence
        structure.rotation.y += 0.001 * Math.sin(time * 0.5 + idx);
      });
    }

    // 3. Spin the reactor rings in Sector 4
    if (this.reactorRing1 && this.reactorRing2) {
      this.reactorRing1.rotation.x += 0.005;
      this.reactorRing1.rotation.y += 0.003;
      this.reactorRing2.rotation.y -= 0.007;
      this.reactorRing2.rotation.z += 0.002;
    }
  }
}
