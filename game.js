import * as THREE from 'https://unpkg.com/three@0.166.1/build/three.module.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x88b8ff);
scene.fog = new THREE.Fog(0x88b8ff, 25, 120);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300);
camera.position.set(0, 14, 18);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x294d1c, 0.9);
scene.add(hemiLight);

const sun = new THREE.DirectionalLight(0xffffff, 0.95);
sun.position.set(10, 25, 14);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80),
  new THREE.MeshStandardMaterial({ color: 0x36a236, roughness: 0.95, metalness: 0.0 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const holePosition = new THREE.Vector3(14, 0, -8);
const holeRadius = 0.95;

const hole = new THREE.Mesh(
  new THREE.CylinderGeometry(holeRadius, holeRadius, 0.14, 36),
  new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.7 })
);
hole.position.copy(holePosition);
hole.position.y = -0.05;
scene.add(hole);

const rim = new THREE.Mesh(
  new THREE.TorusGeometry(holeRadius, 0.06, 14, 50),
  new THREE.MeshStandardMaterial({ color: 0x0f0f0f })
);
rim.rotation.x = Math.PI / 2;
rim.position.copy(holePosition);
rim.position.y = 0.011;
scene.add(rim);

const flagPole = new THREE.Mesh(
  new THREE.CylinderGeometry(0.05, 0.05, 3.5, 14),
  new THREE.MeshStandardMaterial({ color: 0xe9e9e9, metalness: 0.6, roughness: 0.35 })
);
flagPole.position.set(holePosition.x + 0.22, 1.7, holePosition.z + 0.22);
scene.add(flagPole);

const flag = new THREE.Mesh(
  new THREE.PlaneGeometry(1.35, 0.7),
  new THREE.MeshStandardMaterial({ color: 0xcf1f1f, side: THREE.DoubleSide })
);
flag.position.set(flagPole.position.x + 0.68, 2.7, flagPole.position.z);
scene.add(flag);

const ballRadius = 0.55;
const ball = new THREE.Mesh(
  new THREE.SphereGeometry(ballRadius, 36, 36),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.02 })
);
ball.castShadow = true;
ball.position.set(-14, ballRadius, 11);
scene.add(ball);

const shadowDisc = new THREE.Mesh(
  new THREE.CircleGeometry(ballRadius * 1.05, 24),
  new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 })
);
shadowDisc.rotation.x = -Math.PI / 2;
shadowDisc.position.y = 0.01;
scene.add(shadowDisc);

const keys = new Set();
let won = false;
const statusLabel = document.getElementById('status');

const velocity = new THREE.Vector3();
const acceleration = 18;
const drag = 2.8;
const maxSpeed = 11;

window.addEventListener('keydown', (event) => {
  keys.add(event.code);

  if (won && event.code === 'Space') {
    resetBall();
  }
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.code);
});

function inputDirection() {
  const direction = new THREE.Vector3();

  if (keys.has('KeyW') || keys.has('ArrowUp')) direction.z -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) direction.z += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) direction.x -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) direction.x += 1;

  if (direction.lengthSq() > 0) {
    direction.normalize();
  }

  return direction;
}

function resetBall() {
  won = false;
  statusLabel.textContent = 'Get the ball in the hole!';
  statusLabel.classList.remove('win');
  velocity.set(0, 0, 0);
  ball.position.set(-14, ballRadius, 11);
}

const clock = new THREE.Clock();

function animate() {
  const dt = Math.min(clock.getDelta(), 0.033);
  const direction = inputDirection();

  if (!won) {
    velocity.addScaledVector(direction, acceleration * dt);

    if (velocity.length() > maxSpeed) {
      velocity.setLength(maxSpeed);
    }

    const damping = Math.exp(-drag * dt);
    velocity.multiplyScalar(damping);
    ball.position.addScaledVector(velocity, dt);

    ball.position.x = THREE.MathUtils.clamp(ball.position.x, -37.5, 37.5);
    ball.position.z = THREE.MathUtils.clamp(ball.position.z, -37.5, 37.5);

    // Roll visual
    const rollAxis = new THREE.Vector3(velocity.z, 0, -velocity.x);
    if (rollAxis.lengthSq() > 1e-6) {
      const angle = velocity.length() * dt / ballRadius;
      ball.rotateOnWorldAxis(rollAxis.normalize(), angle);
    }

    const distanceToHole = ball.position.distanceTo(holePosition);
    if (distanceToHole < holeRadius * 0.77 && velocity.length() < 3.4) {
      won = true;
      velocity.multiplyScalar(0.2);
      statusLabel.textContent = 'Nice shot! Press Space to reset and play again.';
      statusLabel.classList.add('win');
    }
  } else {
    ball.position.lerp(new THREE.Vector3(holePosition.x, ballRadius * 0.25, holePosition.z), 0.06);
    velocity.multiplyScalar(0.88);
  }

  shadowDisc.position.set(ball.position.x, 0.01, ball.position.z);

  // Follow camera
  const cameraTarget = new THREE.Vector3(ball.position.x, 0.4, ball.position.z);
  const desiredCamPos = new THREE.Vector3(ball.position.x - 8, 14, ball.position.z + 12);
  camera.position.lerp(desiredCamPos, 1 - Math.exp(-3.5 * dt));
  camera.lookAt(cameraTarget);

  // Small breeze animation for the flag
  flag.rotation.y = Math.sin(clock.elapsedTime * 3.5) * 0.17;
  flag.position.y = 2.72 + Math.sin(clock.elapsedTime * 4.2) * 0.03;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
