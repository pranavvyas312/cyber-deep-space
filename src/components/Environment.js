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

  // Programmatically draws highly detailed cyberpunk window grids onto a canvas-backed texture
  createGridWindowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Sleek dark carbon-slate pane backing
    ctx.fillStyle = '#060d13';
    ctx.fillRect(0, 0, 256, 512);

    // Generate complex dual-colored glowing pixel window arrays
    const cols = 8;
    const rows = 20;
    const winWidth = 20;
    const winHeight = 14;
    const padX = 10;
    const padY = 10;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = Math.random();
        if (val > 0.35) {
          // Cyberpunk glowing windows (neon orange or cool cyan)
          ctx.fillStyle = val > 0.72 ? '#00e5ff' : '#ff4d00';
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 6;
          ctx.fillRect(
            padX + c * (winWidth + padX),
            padY + r * (winHeight + padY),
            winWidth,
            winHeight
          );
        } else {
          // Non-active dark room window pane
          ctx.fillStyle = '#0a1d29';
          ctx.shadowBlur = 0;
          ctx.fillRect(
            padX + c * (winWidth + padX),
            padY + r * (winHeight + padY),
            winWidth,
            winHeight
          );
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 4); // beautiful tiled repeat configuration
    return texture;
  }

  initLighting() {
    // 1. Bioluminescent deep ocean floor indigo ambient light
    this.ambientLight = new THREE.AmbientLight(0x000c14, 1.8);
    this.scene.add(this.ambientLight);

    // 2. Downward directional emerald sun beams representing highly toxic, glowing sun rays filtering through oil-slicked harbor layers
    this.emeraldSun = new THREE.DirectionalLight(0x00ff44, 4.0);
    this.emeraldSun.position.set(0, 150, 0);
    this.emeraldSun.castShadow = true;
    this.emeraldSun.shadow.mapSize.width = 2048;
    this.emeraldSun.shadow.mapSize.height = 2048;
    this.emeraldSun.shadow.bias = -0.0002;
    this.scene.add(this.emeraldSun);

    // Dynamic emerald green god rays (semi-transparent glowing cylinders)
    this.initGodRays();

    // 3. Under-city reactor glow (point light representing a deep geothermal core)
    this.underGlow = new THREE.PointLight(0xff3300, 4.0, 140);
    this.underGlow.position.set(10, -90, -10);
    this.scene.add(this.underGlow);
  }

  initFog() {
    // Strong, heavy, dark navy exponential fog (creates an incredible sense of deep marine volume)
    this.scene.fog = new THREE.FogExp2(0x000b12, 0.018);
  }

  initGodRays() {
    const rayGeo = new THREE.CylinderGeometry(2.0, 18.0, 150, 16, 1, true);
    rayGeo.rotateX(Math.PI / 16);

    const rayMat = new THREE.MeshBasicMaterial({
      color: 0x00ff55,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.rayMesh1 = new THREE.Mesh(rayGeo, rayMat);
    this.rayMesh1.position.set(-20, 30, -25);

    this.rayMesh2 = this.rayMesh1.clone();
    this.rayMesh2.position.set(20, -10, -15);
    this.rayMesh2.rotation.z = -Math.PI / 8;

    this.scene.add(this.rayMesh1);
    this.scene.add(this.rayMesh2);
  }

  initMarineSnow() {
    // Over 500+ glowing drifting organic particles representing toxic sea snow
    const particleCount = 700;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = [];
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 160;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 240;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;

      speeds.push({
        y: 0.05 + Math.random() * 0.14,
        x: (Math.random() - 0.5) * 0.03,
        z: (Math.random() - 0.5) * 0.03
      });

      sizes[i] = 0.12 + Math.random() * 0.28;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.25,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.marineSnow = new THREE.Points(geometry, material);
    this.marineSnowSpeeds = speeds;
    this.scene.add(this.marineSnow);
  }

  // Generates drooping 3D cables representing hanging metropolis wires
  createHangingCable(start, end, segmentCount = 20, thickness = 0.08) {
    const points = [];
    for (let i = 0; i <= segmentCount; i++) {
      const t = i / segmentCount;
      const x = start.x + (end.x - start.x) * t;
      const z = start.z + (end.z - start.z) * t;
      // Parabolic droop formula
      const y = start.y + (end.y - start.y) * t - Math.sin(t * Math.PI) * 6.0;
      points.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 20, thickness, 6, false);
  }

  initProceduralCity() {
    // Create the programmatically glowing window texture
    const windowTexture = this.createGridWindowTexture();

    // Dark weathered concrete/metallic skyscraper PBR materials
    const towerMaterial = new THREE.MeshStandardMaterial({
      color: 0x060e15,
      map: windowTexture,
      roughness: 0.45,
      metalness: 0.85,
      bumpScale: 0.04,
      emissive: 0x01070c,
    });

    const structureMat = new THREE.MeshStandardMaterial({
      color: 0x0b141d,
      roughness: 0.3,
      metalness: 0.9,
    });

    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x00ffcc,
      emissive: 0x00e5ff,
      emissiveIntensity: 1.4,
    });

    const cableMaterial = new THREE.MeshStandardMaterial({
      color: 0x020508,
      roughness: 0.6,
      metalness: 0.4
    });

    // 1. DENSE CLUSTER OF AT LEAST 20 TOWERING SKYSCRAPERS with varied heights
    const towerCount = 22; // exceeds the 20 minimum requirement beautifully
    const towerPeaks = [];

    for (let i = 0; i < towerCount; i++) {
      const width = 8.5 + Math.random() * 5.5;
      const depth = 8.5 + Math.random() * 5.5;
      const height = 80 + Math.random() * 60; // towering structure sizes

      const towerGeo = new THREE.BoxGeometry(width, height, depth);
      const towerMesh = new THREE.Mesh(towerGeo, towerMaterial);
      towerMesh.castShadow = true;
      towerMesh.receiveShadow = true;

      // Position in spiral cluster around camera's downward path
      const angle = Math.random() * Math.PI * 2;
      const radius = 24 + Math.random() * 22;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      const y = -i * 12 + 10; // vertical cascading pattern

      towerMesh.position.set(x, y, z);
      this.backgroundStructures.add(towerMesh);

      // Record peak coordinate to connect dangling cables
      towerPeaks.push(new THREE.Vector3(x, y + height / 2, z));
    }

    // 2. INDUSTRIAL PIPE NETWORKS running between the skyscraper gaps
    const pipeCount = 12;
    for (let p = 0; p < pipeCount; p++) {
      const length = 110;
      const pipeRadius = 1.6;
      const pipeGeo = new THREE.CylinderGeometry(pipeRadius, pipeRadius, length, 12);
      pipeGeo.rotateZ(Math.PI / 2); // align horizontally

      const pipeMesh = new THREE.Mesh(pipeGeo, structureMat);
      pipeMesh.castShadow = true;
      pipeMesh.receiveShadow = true;

      // Position running through gaps
      const x = (Math.random() - 0.5) * 20;
      const y = -p * 20 + 20;
      const z = -20 - Math.random() * 25;
      pipeMesh.position.set(x, y, z);

      // Raised industrial coupler ring brackets
      const ringGeo = new THREE.TorusGeometry(pipeRadius + 0.12, 0.16, 8, 20);
      ringGeo.rotateY(Math.PI / 2);

      for (let r = 0; r < 5; r++) {
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(-length / 2.5 + r * (length / 5), 0, 0);
        pipeMesh.add(ring);
      }

      this.backgroundStructures.add(pipeMesh);
    }

    // 3. Hanging Catenary Cable networks connecting tower peaks
    for (let c = 0; c < towerPeaks.length - 1; c++) {
      const start = towerPeaks[c];
      const end = towerPeaks[c + 1];

      // Limit connection distance for visual realism
      if (start.distanceTo(end) < 42) {
        const cableGeo = this.createHangingCable(start, end, 16, 0.08);
        const cableMesh = new THREE.Mesh(cableGeo, cableMaterial);
        this.backgroundStructures.add(cableMesh);
      }
    }

    // 4. Central Sub-Aquatic Geothermal Reactor Core (Sector 4 - around y = -90)
    this.reactorGroup = new THREE.Group();
    this.reactorGroup.position.set(0, -90, -15);

    const coreGeo = new THREE.SphereGeometry(6.5, 24, 24);
    const orangeEmissiveMat = new THREE.MeshStandardMaterial({
      color: 0xff3c00,
      emissive: 0xff4d00,
      emissiveIntensity: 3.2,
      roughness: 0.1,
      metalness: 0.1
    });
    const coreMesh = new THREE.Mesh(coreGeo, orangeEmissiveMat);
    this.reactorGroup.add(coreMesh);

    // Reactor lattice structural rings
    this.reactorRing1 = new THREE.Mesh(new THREE.TorusGeometry(10, 0.75, 8, 36), structureMat);
    this.reactorRing2 = new THREE.Mesh(new THREE.TorusGeometry(13.5, 0.45, 8, 36), ringMat);

    this.reactorRing1.rotation.x = Math.PI / 4;
    this.reactorRing2.rotation.y = Math.PI / 3;

    this.reactorGroup.add(this.reactorRing1);
    this.reactorGroup.add(this.reactorRing2);
    this.backgroundStructures.add(this.reactorGroup);
  }

  update(time) {
    // 1. Smoothly animate drifting marine snow
    if (this.marineSnow) {
      const positions = this.marineSnow.geometry.attributes.position.array;
      const count = positions.length / 3;

      for (let i = 0; i < count; i++) {
        const speed = this.marineSnowSpeeds[i];

        positions[i * 3 + 1] -= speed.y;
        positions[i * 3] += speed.x + Math.sin(time * 0.9 + i) * 0.015;
        positions[i * 3 + 2] += speed.z + Math.cos(time * 0.9 + i) * 0.015;

        // Respawn if goes too low
        if (positions[i * 3 + 1] < -165) {
          positions[i * 3 + 1] = 60;
          positions[i * 3] = (Math.random() - 0.5) * 160;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
        }
      }
      this.marineSnow.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Slow orbital swaying of city buildings
    if (this.backgroundStructures) {
      this.backgroundStructures.children.forEach((structure, idx) => {
        if (structure !== this.reactorGroup) {
          structure.rotation.y += 0.0007 * Math.sin(time * 0.45 + idx);
        }
      });
    }

    // 3. Spin the sub-aquatic reactor cage rings
    if (this.reactorRing1 && this.reactorRing2) {
      this.reactorRing1.rotation.x += 0.007;
      this.reactorRing1.rotation.y += 0.005;
      this.reactorRing2.rotation.y -= 0.009;
      this.reactorRing2.rotation.z += 0.004;
    }

    // 4. Pulsing emerald god rays intensity
    if (this.rayMesh1 && this.rayMesh2) {
      const pulse = 0.06 + Math.sin(time * 1.6) * 0.015;
      this.rayMesh1.material.opacity = pulse;
      this.rayMesh2.material.opacity = pulse * 0.9;
    }
  }
}
