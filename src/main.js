import * as THREE from 'three';
import { Environment } from './components/Environment.js';
import { Submarine } from './components/Submarine.js';

// Setup Main Orchestrator variables
let scene, camera, renderer, environment, submarine;
let canvas, lastTime = 0;

// Scroll Position progress mapping (0.0 to 1.0)
let scrollProgress = 0;
let targetScrollProgress = 0;

// Configuration for our 6 stages of the underwater journey
const SECTOR_METRICS = [
  {
    title: "SECTOR 1: INDUSTRIAL SURFACE HARBOR",
    desc: "Navigating flooded cyberpunk harbors, monitoring submerged metallic scaffoldings and container cargo ruins under mild ocean currents.",
    depth: "12.4m",
    pressure: "1.01 atm"
  },
  {
    title: "SECTOR 2: FLOODED METROPOLIS CANYON",
    desc: "Descending past towering skyscrapers, skeletal high-rises, and flickering holographic advertisements glowing deep within the aquatic murk.",
    depth: "145.8m",
    pressure: "14.2 atm"
  },
  {
    title: "SECTOR 3: UNDERWATER PIPELINE NETWORKS",
    desc: "Weaving between highly pressurized geothermal piping conduits, steam vents, and industrial pipeline bridges.",
    depth: "348.1m",
    pressure: "34.6 atm"
  },
  {
    title: "SECTOR 4: SUNKEN NUCLEAR CORE REPLICAS",
    desc: "Probing a highly radioactive, deep-sea reactor block housing rotating structural cage rings, casting an active toxic amber warning glow.",
    depth: "612.0m",
    pressure: "61.1 atm"
  },
  {
    title: "SECTOR 5: INDUSTRIAL TRENCH CHASM",
    desc: "Maneuvering through narrow geometric steel crevices. Heavy atmospheric fog and structural ruins enforce highly precise navigation.",
    depth: "895.3m",
    pressure: "89.4 atm"
  },
  {
    title: "SECTOR 6: THE ABYSS DOCKING MATRIX",
    desc: "Safely arriving at the deep-sea motherboard docking ports. Anchored to permanent structural arrays resting on the ocean bed.",
    depth: "1124.7m",
    pressure: "112.3 atm"
  }
];

// Coordinate path waypoints for both Submarine and Camera across 6 Scenes
// To make it super rich and cinematic, we define a continuous spline-like track of positions
const droneWaypoints = [
  { x: 0,   y: 15,   z: 0 },   // Scene 1 (Scroll = 0.0)
  { x: -10, y: -15,  z: -5 },  // Scene 2 (Scroll = 0.2)
  { x: 12,  y: -50,  z: -12 }, // Scene 3 (Scroll = 0.4)
  { x: 0,   y: -90,  z: -12 }, // Scene 4 (Scroll = 0.6)
  { x: -15, y: -120, z: -8 },  // Scene 5 (Scroll = 0.8)
  { x: 0,   y: -148, z: 0 }    // Scene 6 (Scroll = 1.0)
];

const cameraWaypoints = [
  { x: 0,   y: 18,   z: 18 },  // Camera offsets relative to drone positions for dramatic cinematography
  { x: 8,   y: -10,  z: 15 },
  { x: -12, y: -45,  z: 18 },
  { x: 15,  y: -85,  z: 22 },
  { x: -2,  y: -115, z: 20 },
  { x: 0,   y: -140, z: 14 }
];

function init() {
  canvas = document.getElementById('webgl-canvas');

  // 1. Initialize Scene and exponential Teal-Emerald Fog
  scene = new THREE.Scene();

  // 2. Setup camera with responsive FOV configuration
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
  updateCameraFOV();

  // 3. Initialize WebGL Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Set scene background matching exponential deep-sea fog color
  renderer.setClearColor(0x00131c);

  // 4. Load Core Components
  environment = new Environment(scene);
  submarine = new Submarine(scene);

  // Set initial camera position matching Sector 1
  camera.position.set(cameraWaypoints[0].x, cameraWaypoints[0].y, cameraWaypoints[0].z);
  camera.lookAt(submarine.mesh.position);

  // 5. Setup Listeners
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Boot UI update once
  updateHUD(0);

  // Start Animation frame loop
  requestAnimationFrame(animate);
}

// Responsive Camera Adjuster based on Orientation Aspect Ratios
function updateCameraFOV() {
  const aspect = window.innerWidth / window.innerHeight;
  if (aspect < 1) {
    // Vertical Screen (Mobile/Tablet) - widen FOV up to 75-80 degrees
    camera.fov = 76;
  } else {
    // Wide Desktop Screen - Cinematic narrow FOV (50-60 degrees)
    camera.fov = 55;
  }
  camera.updateProjectionMatrix();
}

function onWindowResize() {
  updateCameraFOV();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// Map scrolling window distance into a smooth global scroll float [0.0 - 1.0]
function handleScroll() {
  const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (totalHeight > 0) {
    targetScrollProgress = window.scrollY / totalHeight;
  }
}

// Linear Interpolation helper for beautiful continuous motion paths
function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end;
}

// Multi-point spline / path interpolation
function interpolatePath(waypoints, progress) {
  const segmentCount = waypoints.length - 1;
  const rawIndex = progress * segmentCount;
  const index = Math.min(Math.floor(rawIndex), segmentCount - 1);
  const segmentProgress = rawIndex - index;

  const p0 = waypoints[index];
  const p1 = waypoints[index + 1];

  return {
    x: lerp(p0.x, p1.x, segmentProgress),
    y: lerp(p0.y, p1.y, segmentProgress),
    z: lerp(p0.z, p1.z, segmentProgress)
  };
}

// Dynamic HUD overlay telemetry feed update
let lastLoggedSector = -1;
function updateHUD(progress) {
  // Update Scroll Track Bar
  const fillBar = document.getElementById('hud-scroll-fill');
  const pctText = document.getElementById('hud-scroll-pct');
  const scrollPctStr = `${Math.round(progress * 100)}%`;

  if (fillBar) fillBar.style.width = scrollPctStr;
  if (pctText) pctText.textContent = scrollPctStr; // fallback
  if (pctText) pctText.innerText = scrollPctStr;

  // Determine current active sector (one of the 6 stages)
  const sectorIndex = Math.min(Math.floor(progress * 6), 5);
  const metrics = SECTOR_METRICS[sectorIndex];

  // If newly transition to a different sector, log in console & update text labels with glowing visual effect
  if (sectorIndex !== lastLoggedSector) {
    lastLoggedSector = sectorIndex;
    console.log(`[SYS_COORDINATES] Navigation Transition Completed: ${metrics.title}`);

    const titleEl = document.getElementById('hud-scene-title');
    const descEl = document.getElementById('hud-scene-desc');

    if (titleEl && descEl) {
      // Small cybernetic flicker transition
      titleEl.style.opacity = 0.3;
      descEl.style.opacity = 0.3;
      setTimeout(() => {
        titleEl.innerText = metrics.title;
        descEl.innerText = metrics.desc;
        titleEl.style.opacity = 1.0;
        descEl.style.opacity = 1.0;
      }, 150);
    }
  }

  // Update Telemetry readouts
  const depthEl = document.getElementById('hud-depth');
  const coordsEl = document.getElementById('hud-coords');
  const pressureEl = document.getElementById('hud-pressure');
  const batteryEl = document.getElementById('hud-battery');

  if (submarine) {
    const dronePos = submarine.mesh.position;
    if (coordsEl) {
      coordsEl.innerText = `X: ${dronePos.x.toFixed(1)}, Y: ${dronePos.y.toFixed(1)}, Z: ${dronePos.z.toFixed(1)}`;
    }
  }

  if (depthEl) depthEl.innerText = metrics.depth;
  if (pressureEl) pressureEl.innerText = metrics.pressure;

  // Slowly drain battery based on scroll progress depth
  if (batteryEl) {
    const remainingBattery = (98.4 - (progress * 15.6)).toFixed(1);
    batteryEl.innerText = `${remainingBattery}%`;
  }
}

// Core Animation Render Loop
function animate(time) {
  requestAnimationFrame(animate);

  const delta = (time - lastTime) * 0.001;
  lastTime = time;

  // Smoothly lerp scroll progress value to eliminate sudden scroll leaps (add inertia)
  scrollProgress = lerp(scrollProgress, targetScrollProgress, 0.08);

  // Interpolate Drone and Camera Coordinates across the 6-Scene spline path
  const targetDronePos = interpolatePath(droneWaypoints, scrollProgress);
  const targetCameraPos = interpolatePath(cameraWaypoints, scrollProgress);

  // Directly assign positions before updating components to ensure perfect anchoring
  if (submarine) {
    submarine.mesh.position.set(targetDronePos.x, targetDronePos.y, targetDronePos.z);

    // Update Submarine (including propeller blade rotation & buoyancy offset calculations)
    submarine.update(time * 0.001, scrollProgress);
  }

  // Camera follows drone position beautifully with a small delay for premium cinematography feel
  camera.position.set(targetCameraPos.x, targetCameraPos.y, targetCameraPos.z);
  camera.lookAt(targetDronePos.x, targetDronePos.y - 2, targetDronePos.z);

  // Update environment drifting marine snow & spinning structures
  if (environment) {
    environment.update(time * 0.001);
  }

  // Synchronize interactive UI HUD overlays
  updateHUD(scrollProgress);

  // WebGL Render call
  renderer.render(scene, camera);
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
export { scene, camera, renderer, environment, submarine };
