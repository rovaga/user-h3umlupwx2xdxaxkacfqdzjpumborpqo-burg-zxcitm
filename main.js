import * as THREE from 'three';

// Game state
const gameState = {
    player: {
        position: new THREE.Vector3(0, 2, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        speed: 0.1,
        jumpForce: 0.4,
        onGround: false,
        rotation: 0
    },
    camera: {
        distance: 8,
        height: 4,
        rotationY: 0,
        rotationX: 0.3
    },
    keys: {},
    gravity: -0.015,
    pointerLocked: false
};

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 20, 80);

// Camera setup
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -60;
directionalLight.shadow.camera.right = 60;
directionalLight.shadow.camera.top = 60;
directionalLight.shadow.camera.bottom = -60;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.BoxGeometry(100, 1, 100);
const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a7c59,
    roughness: 0.8
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.position.y = -0.5;
ground.receiveShadow = true;
scene.add(ground);

// Platforms
const platforms = [];

function createPlatform(x, y, z, width, height, depth, color = 0x8b4513) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    const platform = new THREE.Mesh(geometry, material);
    platform.position.set(x, y, z);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);
    platforms.push({
        mesh: platform,
        bounds: {
            minX: x - width / 2,
            maxX: x + width / 2,
            minY: y - height / 2,
            maxY: y + height / 2,
            minZ: z - depth / 2,
            maxZ: z + depth / 2
        }
    });
    return platform;
}

// Create platforms - scattered across a larger map
createPlatform(5, 1, 0, 4, 0.5, 4, 0x8b4513);
createPlatform(10, 2, 5, 4, 0.5, 4, 0xa0522d);
createPlatform(0, 1.5, -8, 6, 0.5, 4, 0x8b4513);
createPlatform(-8, 2.5, -5, 4, 0.5, 4, 0xa0522d);
createPlatform(-5, 1, 8, 5, 0.5, 5, 0x8b4513);
createPlatform(8, 3, -8, 4, 0.5, 4, 0xa0522d);

// Additional platforms for larger map
createPlatform(15, 1.5, -10, 5, 0.5, 5, 0x8b4513);
createPlatform(-15, 2, 10, 4, 0.5, 4, 0xa0522d);
createPlatform(-12, 3, -12, 4, 0.5, 4, 0x8b4513);
createPlatform(18, 2.5, 8, 5, 0.5, 4, 0xa0522d);
createPlatform(20, 1, 15, 4, 0.5, 4, 0x8b4513);
createPlatform(-18, 1.5, -8, 5, 0.5, 5, 0xa0522d);
createPlatform(12, 4, -15, 4, 0.5, 4, 0x8b4513);
createPlatform(-10, 1, 15, 6, 0.5, 4, 0xa0522d);
createPlatform(25, 3, 0, 4, 0.5, 4, 0x8b4513);
createPlatform(-20, 2.5, 5, 5, 0.5, 5, 0xa0522d);
createPlatform(8, 2, 20, 4, 0.5, 4, 0x8b4513);
createPlatform(-8, 3.5, -18, 4, 0.5, 4, 0xa0522d);
createPlatform(0, 2, 22, 5, 0.5, 5, 0x8b4513);
createPlatform(15, 1, -20, 4, 0.5, 4, 0xa0522d);
createPlatform(-25, 1.5, -2, 5, 0.5, 4, 0x8b4513);

// Add ground as a platform
platforms.push({
    mesh: ground,
    bounds: {
        minX: -50,
        maxX: 50,
        minY: -1,
        maxY: 0,
        minZ: -50,
        maxZ: 50
    }
});

// Player
const playerGeometry = new THREE.CapsuleGeometry(0.5, 1, 8, 16);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.castShadow = true;
scene.add(player);

// Player direction indicator
const indicatorGeometry = new THREE.ConeGeometry(0.3, 0.6, 8);
const indicatorMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
indicator.rotation.x = Math.PI / 2;
indicator.position.z = 0.8;
player.add(indicator);

// Input handling
window.addEventListener('keydown', (e) => {
    gameState.keys[e.code] = true;
    if (e.code === 'Space' && gameState.player.onGround) {
        gameState.player.velocity.y = gameState.player.jumpForce;
        gameState.player.onGround = false;
    }
});

window.addEventListener('keyup', (e) => {
    gameState.keys[e.code] = false;
});

// Pointer lock
renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
    gameState.pointerLocked = document.pointerLockElement === renderer.domElement;
});

document.addEventListener('mousemove', (e) => {
    if (gameState.pointerLocked) {
        gameState.camera.rotationY -= e.movementX * 0.002;
        gameState.camera.rotationX -= e.movementY * 0.002;
        gameState.camera.rotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, gameState.camera.rotationX));
    }
});

// Collision detection
function checkCollisions() {
    gameState.player.onGround = false;

    for (const platform of platforms) {
        const playerBottom = gameState.player.position.y - 1;
        const playerTop = gameState.player.position.y + 1;
        const playerRadius = 0.5;

        // Check if player is within platform bounds horizontally
        if (gameState.player.position.x + playerRadius > platform.bounds.minX &&
            gameState.player.position.x - playerRadius < platform.bounds.maxX &&
            gameState.player.position.z + playerRadius > platform.bounds.minZ &&
            gameState.player.position.z - playerRadius < platform.bounds.maxZ) {

            // Check vertical collision
            if (playerBottom <= platform.bounds.maxY &&
                playerBottom >= platform.bounds.minY &&
                gameState.player.velocity.y <= 0) {
                gameState.player.position.y = platform.bounds.maxY + 1;
                gameState.player.velocity.y = 0;
                gameState.player.onGround = true;
            }
        }
    }
}

// Update camera position
function updateCamera() {
    const cameraOffset = new THREE.Vector3();
    const distance = gameState.camera.distance;

    cameraOffset.x = Math.sin(gameState.camera.rotationY) * Math.cos(gameState.camera.rotationX) * distance;
    cameraOffset.y = Math.sin(gameState.camera.rotationX) * distance + gameState.camera.height;
    cameraOffset.z = Math.cos(gameState.camera.rotationY) * Math.cos(gameState.camera.rotationX) * distance;

    camera.position.copy(gameState.player.position).add(cameraOffset);

    // Prevent camera from going below ground level (y = 0)
    const minCameraHeight = 0.5;
    if (camera.position.y < minCameraHeight) {
        camera.position.y = minCameraHeight;
    }

    camera.lookAt(gameState.player.position);
}

// Game loop
function animate() {
    requestAnimationFrame(animate);

    // Movement - relative to camera direction
    const moveDirection = new THREE.Vector3();

    if (gameState.keys['KeyW']) moveDirection.z += 1;  // Forward
    if (gameState.keys['KeyS']) moveDirection.z -= 1;  // Backward
    if (gameState.keys['KeyA']) moveDirection.x -= 1;  // Left
    if (gameState.keys['KeyD']) moveDirection.x += 1;  // Right

    if (moveDirection.length() > 0) {
        moveDirection.normalize();

        // Use camera's Y rotation to determine forward direction
        const angle = gameState.camera.rotationY;

        // Calculate forward and right vectors based on camera rotation
        const forward = new THREE.Vector3(-Math.sin(angle), 0, -Math.cos(angle));
        const right = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle));

        // Calculate movement in world space
        const worldMoveDirection = new THREE.Vector3();
        worldMoveDirection.addScaledVector(forward, moveDirection.z);
        worldMoveDirection.addScaledVector(right, moveDirection.x);
        worldMoveDirection.normalize();

        // Apply movement
        gameState.player.position.x += worldMoveDirection.x * gameState.player.speed;
        gameState.player.position.z += worldMoveDirection.z * gameState.player.speed;

        // Rotate player to face movement direction
        gameState.player.rotation = Math.atan2(worldMoveDirection.x, worldMoveDirection.z);
    }

    // Apply gravity
    gameState.player.velocity.y += gameState.gravity;
    gameState.player.position.y += gameState.player.velocity.y;

    // Check collisions
    checkCollisions();

    // Prevent falling through the world
    if (gameState.player.position.y < -10) {
        gameState.player.position.set(0, 5, 0);
        gameState.player.velocity.set(0, 0, 0);
    }

    // Update player mesh
    player.position.copy(gameState.player.position);
    player.rotation.y = gameState.player.rotation;

    // Update camera
    updateCamera();

    // Render
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start game
animate();
