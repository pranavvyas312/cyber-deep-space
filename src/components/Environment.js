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

  // Generate glowing grid window texture programmatically for cyberpunk towers
  createGridWindowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark metallic plate background
    ctx.fillStyle = '#05121b';
    ctx.fillRect(0, 0, 256, 512);

    // Draw grid of glowing cyber windows
    const cols = 6;
    const rows = 16;
    const winWidth = 24;
    const winHeight = 16;
    const padX = 14;
    const padY = 12;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const rand = Math.random();
        if (rand > 0.4) {
          // Window is lit - choose cyan or orange glow
          ctx.fillStyle = rand > 0.7 ? '#00ffcc' : '#ff5500';
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 8;
          ctx.fillRect(
            padX + c * (winWidth + padX),
            padY + r * (winHeight + padY),
            winWidth,
            winHeight
          );
        } else {
          // Unlit dark window with faint outline
          ctx.fillStyle = '#0a2232';
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
    // Repeat texture mapping around skyscraper faces
    texture.repeat.set(2, 4);
    return texture;
  }

  initLighting() {
    // Bioluminescent ambient fill - moody deep-sea navy blue
    this.ambientLight = new THREE.AmbientLight(0x01131e, 1.4);
    this.scene.add(this.ambientLight);

    // Directional light pointing down - tinted intense emerald green representing underwater toxic sun rays / god rays
    this.emeraldSunLight = new THREE.DirectionalLight(0x00ff55, 3.5);
    this.emeraldSunLight.position.set(5, 120, -5);
    this.emeraldSunLight.castShadow = true;
    this.emeraldSunLight.shadow.mapSize.width = 2048;
    this.emeraldSunLight.shadow.mapSize.height = 2048;
    this.emeraldSunLight.shadow.bias = -0.0005;
    this.scene.add(this.emeraldSunLight);

    // Downward toxic sun rays visual representation using subtle semi-transparent emerald planes (god rays effect)
    this.initGodRays();

    // Additional neon orange glowing point light representing underwater volcanic or reactor heat vents
    this.neonAccent = new THREE.PointLight(0xff4d00, 3.5, 120);
    this.neonAccent.position.set(-20, -85, -10);
    this.scene.add(this.neonAccent);
  }

  initFog() {
    // Intense exponential deep teal/navy fog (exactly deep-sea cyberpunk style)
    this.scene.fog = new THREE.FogExp2(0x01131e, 0.016);
  }

  initGodRays() {
    const rayGeo = new THREE.CylinderGeometry(1.0, 15.0, 140, 16, 1, true);
    rayGeo.rotateX(Math.PI / 18); // slight tilt for cinematic effect

    const rayMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff55,
      transparent: true,
      opacity: 0.05,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.godRay1 = new THREE.Mesh(rayGeo, rayMaterial);
    this.godRay1.position.set(-15, 40, -30);

    this.godRay2 = this.godRay1.clone();
    this.godRay2.position.set(25, 10, -20);
    this.godRay2.rotation.z = -Math.PI / 12;

    this.scene.add(this.godRay1);
    this.scene.add(this.godRay2);
  }

  initMarineSnow() {
    // 500+ drifting reflective particles (using 600 particles for extra density)
    const particleCount = 650;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = [];
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 150;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 220;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;

      speeds.push({
        y: 0.06 + Math.random() * 0.12,
        x: (Math.random() - 0.5) * 0.04,
        z: (Math.random() - 0.5) * 0.04
      });

      sizes[i] = 0.1 + Math.random() * 0.25;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      color: 0x00ffcc,
      size: 0.2,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.marineSnow = new THREE.Points(geometry, material);
    this.marineSnowSpeeds = speeds;
    this.scene.add(this.marineSnow);
  }

  // Generates drooping 3D cables representing hanging wires in a flooded metropolis
  createHangingCable(start, end, segmentCount = 20, thickness = 0.08) {
    const points = [];
    for (let i = 0; i <= segmentCount; i++) {
      const t = i / segmentCount;
      const x = start.x + (end.x - start.x) * t;
      const z = start.z + (end.z - start.z) * t;
      // Parabolic droop simulating cable gravity hang
      const y = start.y + (end.y - start.y) * t - Math.sin(t * Math.PI) * 5.0;
      points.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 24, thickness, 6, false);
  }

  initProceduralCity() {
    // Create the programmatically glowing grid texture
    const windowTexture = this.createGridWindowTexture();

    // Dark weathered metal material with procedural glowing windows mapped on top
    const skyscraperMaterial = new THREE.MeshStandardMaterial({
      color: 0x050e14,
      map: windowTexture,
      roughness: 0.45,
      metalness: 0.8,
      bumpScale: 0.05,
      emissive: 0x01080d
    });

    const pipeMaterial = new THREE.MeshStandardMaterial({
      color: 0x0c1a24,
      roughness: 0.25,
      metalness: 0.9,
    });

    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffcc,
      emissive: 0x00ffcc,
      emissiveIntensity: 1.2
    });

    const cableMaterial = new THREE.MeshStandardMaterial({
      color: 0x03080d,
      roughness: 0.6,
      metalness: 0.5
    });

    // 1. Generate towering skyscrapers (Cyberpunk tower blocks)
    const towerCount = 18;
    const towerPoints = []; // To anchor cables between skyscrapers

    for (let i = 0; i < towerCount; i++) {
      const width = 8 + Math.random() * 6;
      const depth = 8 + Math.random() * 6;
      const height = 70 + Math.random() * 50;

      const towerGeo = new THREE.BoxGeometry(width, height, depth);
      const towerMesh = new THREE.Mesh(towerGeo, skyscraperMaterial);
      towerMesh.castShadow = true;
      towerMesh.receiveShadow = true;

      // Position skyscrapers along the deep-sea scroll track
      const angle = Math.random() * Math.PI * 2;
      const radius = 22 + Math.random() * 24;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      const y = -i * 14 + 10; // spiral-down coordinate pattern

      towerMesh.position.set(x, y, z);
      this.backgroundStructures.add(towerMesh);

      // Record tower peak position to hang cables between them
      towerPoints.push(new THREE.Vector3(x, y + height / 2, z));
    }

    // 2. Add Large Horizontal Industrial Pipes with glowing metal connector rings
    const pipeCount = 10;
    for (let i = 0; i < pipeCount; i++) {
      const length = 120;
      const pipeRadius = 1.8;
      const pipeGeo = new THREE.CylinderGeometry(pipeRadius, pipeRadius, length, 12);
      pipeGeo.rotateZ(Math.PI / 2); // Make horizontal along X axis

      const pipeMesh = new THREE.Mesh(pipeGeo, pipeMaterial);
      pipeMesh.castShadow = true;
      pipeMesh.receiveShadow = true;

      const x = (Math.random() - 0.5) * 30;
      const y = -i * 24 + 15;
      const z = -22 - Math.random() * 20;
      pipeMesh.position.set(x, y, z);

      // Add raised metal joint rings around the industrial pipes
      const ringGeo = new THREE.TorusGeometry(pipeRadius + 0.1, 0.18, 8, 24);
      ringGeo.rotateY(Math.PI / 2);

      for (let r = 0; r < 4; r++) {
        const ring = new THREE.Mesh(ringGeo, ringMaterial);
        ring.position.set(-length / 3 + r * (length / 4.5), 0, 0);
        pipeMesh.add(ring);
      }

      this.backgroundStructures.add(pipeMesh);
    }

    // 3. Generate Hanging Cables connecting the cyberpunk tower peaks
    for (let c = 0; c < towerPoints.length - 1; c++) {
      const start = towerPoints[c];
      const end = towerPoints[c + 1];

      // Keep cable distance reasonable to look realistic
      if (start.distanceTo(end) < 45) {
        const cableGeo = this.createHangingCable(start, end, 16, 0.08);
        const cableMesh = new THREE.Mesh(cableGeo, cableMaterial);
        this.backgroundStructures.add(cableMesh);
      }
    }

    // 4. Central Power Reactor Core (Sunken relic in Sector 4 depth - around y = -90)
    this.reactorGroup = new THREE.Group();
    this.reactorGroup.position.set(0, -90, -15);

    const coreGeo = new THREE.SphereGeometry(6, 24, 24);
    const orangeEmissiveMat = new THREE.MeshStandardMaterial({
      color: 0xff4d00,
      emissive: 0xff3c00,
      emissiveIntensity: 2.5,
      roughness: 0.1,
      metalness: 0.1
    });
    const coreMesh = new THREE.Mesh(coreGeo, orangeEmissiveMat);
    this.reactorGroup.add(coreMesh);

    // Rotating metal lattice cages around the reactor core
    this.reactorRing1 = new THREE.Mesh(new THREE.TorusGeometry(9.5, 0.7, 8, 36), pipeMaterial);
    this.reactorRing2 = new THREE.Mesh(new THREE.TorusGeometry(12.5, 0.4, 8, 36), ringMaterial);

    this.reactorRing1.rotation.x = Math.PI / 4;
    this.reactorRing2.rotation.y = Math.PI / 3;

    this.reactorGroup.add(this.reactorRing1);
    this.reactorGroup.add(this.reactorRing2);
    this.backgroundStructures.add(this.reactorGroup);
  }

  update(time) {
    // 1. Smoothly animate the custom marine snow drifting under ocean currents
    if (this.marineSnow) {
      const positions = this.marineSnow.geometry.attributes.position.array;
      const count = positions.length / 3;

      for (let i = 0; i < count; i++) {
        const speed = this.marineSnowSpeeds[i];

        // Drift downwards
        positions[i * 3 + 1] -= speed.y;
        // Float side to side (microcurrents)
        positions[i * 3] += speed.x + Math.sin(time * 0.8 + i) * 0.012;
        positions[i * 3 + 2] += speed.z + Math.cos(time * 0.8 + i) * 0.012;

        // Respawn if goes too low
        if (positions[i * 3 + 1] < -165) {
          positions[i * 3 + 1] = 60;
          positions[i * 3] = (Math.random() - 0.5) * 150;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
        }
      }
      this.marineSnow.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Slow ocean current sway for industrial structures
    if (this.backgroundStructures) {
      this.backgroundStructures.children.forEach((structure, idx) => {
        if (structure !== this.reactorGroup) {
          structure.rotation.y += 0.0006 * Math.sin(time * 0.4 + idx);
        }
      });
    }

    // 3. Spin the reactor lattice rings in Sector 4
    if (this.reactorRing1 && this.reactorRing2) {
      this.reactorRing1.rotation.x += 0.006;
      this.reactorRing1.rotation.y += 0.004;
      this.reactorRing2.rotation.y -= 0.008;
      this.reactorRing2.rotation.z += 0.003;
    }

    // 4. Animate emerald god rays subtle pulsing intensity
    if (this.godRay1 && this.godRay2) {
      const pulse = 0.05 + Math.sin(time * 1.5) * 0.012;
      this.godRay1.material.opacity = pulse;
      this.godRay2.material.opacity = pulse * 0.9;
    }
  }
}
