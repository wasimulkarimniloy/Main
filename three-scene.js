/* NILOY 3D Backdrop Scene Manager */

class ImprovedNoise {
    constructor() {
        this.p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) {
            this.p[i] = Math.floor(Math.random() * 256);
        }
        this.permutation = new Uint8Array(512);
        for (let i = 0; i < 512; i++) {
            this.permutation[i] = this.p[i & 255];
        }
    }
    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(t, a, b) { return a + t * (b - a); }
    grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
    noise(x, y, z) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;
        
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);
        
        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);
        
        const A = this.permutation[X] + Y;
        const AA = this.permutation[A] + Z;
        const AB = this.permutation[A + 1] + Z;
        const B = this.permutation[X + 1] + Y;
        const BA = this.permutation[B] + Z;
        const BB = this.permutation[B + 1] + Z;
        
        return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.permutation[AA], x, y, z),
                                                      this.grad(this.permutation[BA], x - 1, y, z)),
                                       this.lerp(u, this.grad(this.permutation[AB], x, y - 1, z),
                                                      this.grad(this.permutation[BB], x - 1, y - 1, z))),
                              this.lerp(v, this.lerp(u, this.grad(this.permutation[AA + 1], x, y, z - 1),
                                                      this.grad(this.permutation[BA + 1], x - 1, y, z - 1)),
                                       this.lerp(u, this.grad(this.permutation[AB + 1], x, y - 1, z - 1),
                                                      this.grad(this.permutation[BB + 1], x - 1, y - 1, z - 1))));
    }
}

// Scene Variables
let scene, camera, renderer, container;
let liquidBlob, blobGeometry, originalPositions;
let noiseGenerator;
let bubbles = [];
const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
let scrollY = 0;
let isMobile = false;

// Initialize Scene
function initThree() {
    container = document.getElementById('three-canvas');
    isMobile = window.innerWidth < 768;
    noiseGenerator = new ImprovedNoise();

    // Scene setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030308, 0.05);

    // Camera setup
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = isMobile ? 8 : 6.5;

    // Renderer setup
    renderer = new THREE.WebGLRenderer({
        canvas: container,
        alpha: true,
        antialias: !isMobile,
        powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // Create a dynamic gradient environmental texture for refraction map
    const envTexture = createEnvMap();

    // Lights
    const ambientLight = new THREE.AmbientLight(0x0a0a20, 1.2);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x00f2fe, 5, 20);
    cyanLight.position.set(-5, 4, 3);
    scene.add(cyanLight);

    const magentaLight = new THREE.PointLight(0xff007f, 6, 20);
    magentaLight.position.set(5, -4, 3);
    scene.add(magentaLight);

    const violetLight = new THREE.DirectionalLight(0x8a2be2, 3.5);
    violetLight.position.set(0, 0, 5);
    scene.add(violetLight);

    // Liquid Glass Blob
    const segments = isMobile ? 32 : 80;
    blobGeometry = new THREE.SphereGeometry(1.8, segments, segments);
    
    // Store original positions for deformation
    originalPositions = blobGeometry.attributes.position.clone();

    // Physical Glass Material
    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.08,
        metalness: 0.05,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        transmission: 0.92, // Highly transparent glass
        ior: 1.48, // Refraction index
        thickness: 2.2, // Refraction thickness
        transparent: true,
        opacity: 0.95,
        envMap: envTexture,
        envMapIntensity: 2.5,
        side: THREE.DoubleSide
    });

    liquidBlob = new THREE.Mesh(blobGeometry, glassMaterial);
    scene.add(liquidBlob);

    // Adjust position based on viewport
    if (!isMobile) {
        liquidBlob.position.set(1.5, 0.2, 0); // Position on the right side of hero text
    } else {
        liquidBlob.position.set(0, 1.5, -0.5); // Position on top for mobile layout
    }

    // Add Bubble particles
    createBubbleField();

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('scroll', onScroll);

    // Start Animation Loop
    animate(0);
}

// Generate dynamic gradient environmental map texture
function createEnvMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Draw background gradients
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#020024');
    gradient.addColorStop(0.35, '#090979');
    gradient.addColorStop(0.7, '#ff007f');
    gradient.addColorStop(1, '#00d4ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw hot highlights
    ctx.beginPath();
    ctx.arc(100, 100, 80, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 242, 254, 0.45)';
    ctx.filter = 'blur(30px)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(400, 150, 120, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 0, 127, 0.4)';
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    return texture;
}

// Generate Bubble field
function createBubbleField() {
    const bubbleCount = isMobile ? 35 : 120;
    const bubbleGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const bubbleMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.05,
        transmission: 0.9,
        ior: 1.3,
        transparent: true,
        opacity: 0.6
    });

    for (let i = 0; i < bubbleCount; i++) {
        const mesh = new THREE.Mesh(bubbleGeo, bubbleMat);
        
        // Random placement
        resetBubble(mesh);
        
        // Shift initial positions randomly along y axis
        mesh.position.y = (Math.random() - 0.5) * 8;
        
        scene.add(mesh);
        bubbles.push(mesh);
    }
}

function resetBubble(mesh) {
    mesh.position.x = (Math.random() - 0.5) * (isMobile ? 8 : 12);
    mesh.position.y = -5; // Start below screen
    mesh.position.z = (Math.random() - 0.5) * 5 - 2;
    
    // Scale randomization
    const scale = 0.5 + Math.random() * 2;
    mesh.scale.set(scale, scale, scale);
    
    // Velocity vector
    mesh.userData = {
        speed: 0.015 + Math.random() * 0.035,
        amplitude: 0.1 + Math.random() * 0.3,
        frequency: 0.5 + Math.random() * 1.5,
        offset: Math.random() * 100
    };
}

// Event handlers
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    isMobile = window.innerWidth < 768;
    camera.position.z = isMobile ? 8 : 6.5;
    
    if (liquidBlob) {
        if (!isMobile) {
            liquidBlob.position.set(1.5, 0.2, 0);
        } else {
            liquidBlob.position.set(0, 1.5, -0.5);
        }
    }
}

function onMouseMove(event) {
    mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onScroll() {
    scrollY = window.scrollY;
}

// ===== BACKGROUND COD SOLDIER =====
let bgSoldier = null;
let bgGunGroup = null;
let bgMuzzleFlash = null;
let bgBullets = [];
let bgShells = [];
let bgSparks = [];
let bgFireTimer = 0;

function buildBackgroundSoldier() {
    bgSoldier = new THREE.Group();
    
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0d0d1a, roughness: 0.7 });
    const armorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a35, roughness: 0.5 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, roughness: 0.3, emissive: 0x00f2fe, emissiveIntensity: 0.15 });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, roughness: 0.1, emissive: 0x00f2fe, emissiveIntensity: 0.5, transparent: true, opacity: 0.7 });
    const gunMetalMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.2 });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.35), armorMat);
    torso.position.y = 1.2;
    bgSoldier.add(torso);

    // Tactical vest line
    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.15, 0.38), accentMat);
    vest.position.y = 1.4;
    bgSoldier.add(vest);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), bodyMat);
    head.position.y = 1.8;
    bgSoldier.add(head);

    // Helmet
    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.36), armorMat);
    helmet.position.y = 2.0;
    bgSoldier.add(helmet);

    // Visor
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.09, 0.07), visorMat);
    visor.position.set(0, 1.82, 0.17);
    bgSoldier.add(visor);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.6, 0.25);
    const legL = new THREE.Mesh(legGeo, bodyMat);
    legL.position.set(-0.14, 0.5, 0);
    bgSoldier.add(legL);
    const legR = new THREE.Mesh(legGeo, bodyMat);
    legR.position.set(0.14, 0.5, 0);
    bgSoldier.add(legR);

    // Boots
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x080810 });
    const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.32), bootMat);
    bootL.position.set(-0.14, 0.17, 0.03);
    bgSoldier.add(bootL);
    const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.32), bootMat);
    bootR.position.set(0.14, 0.17, 0.03);
    bgSoldier.add(bootR);

    // Gun group (arms + AK47)
    bgGunGroup = new THREE.Group();

    // Right arm
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), bodyMat);
    armR.position.set(-0.08, -0.08, 0.25);
    armR.rotation.x = -0.6;
    bgGunGroup.add(armR);

    // Left arm
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.42, 0.16), bodyMat);
    armL.position.set(0.1, -0.14, 0.4);
    armL.rotation.x = -0.8;
    bgGunGroup.add(armL);

    // Gun body
    const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.65), gunMetalMat);
    gunBody.position.set(0, -0.03, 0.47);
    bgGunGroup.add(gunBody);

    // Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.018, 0.35, 8), gunMetalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0, 0.97);
    bgGunGroup.add(barrel);

    // Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.06), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    mag.position.set(0, -0.15, 0.36);
    mag.rotation.x = 0.12;
    bgGunGroup.add(mag);

    // Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.09, 0.25), new THREE.MeshStandardMaterial({ color: 0x2a1f14 }));
    stock.position.set(0, -0.01, 0.04);
    bgGunGroup.add(stock);

    // Rail accent
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.2), accentMat);
    rail.position.set(0, 0.05, 0.5);
    bgGunGroup.add(rail);

    bgGunGroup.position.set(0.35, 1.3, 0);
    bgGunGroup.rotation.y = -0.08;
    bgSoldier.add(bgGunGroup);

    // Muzzle flash
    const flashGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0 });
    bgMuzzleFlash = new THREE.Mesh(flashGeo, flashMat);
    bgMuzzleFlash.scale.set(1, 1, 2);
    bgMuzzleFlash.light = new THREE.PointLight(0xff8800, 0, 5);
    bgMuzzleFlash.add(bgMuzzleFlash.light);
    scene.add(bgMuzzleFlash);

    // Position soldier at bottom-right, far back
    if (isMobile) {
        bgSoldier.position.set(2.5, -3.5, -3);
        bgSoldier.scale.set(0.6, 0.6, 0.6);
    } else {
        bgSoldier.position.set(4.5, -3.2, -2);
        bgSoldier.scale.set(0.8, 0.8, 0.8);
    }
    bgSoldier.rotation.y = -0.5;

    scene.add(bgSoldier);
}

function bgFireBullet() {
    if (!bgGunGroup || !bgSoldier) return;

    // Get muzzle tip world position
    const tip = new THREE.Vector3(0, 0, 1.15);
    bgGunGroup.localToWorld(tip);

    // Muzzle flash
    bgMuzzleFlash.position.copy(tip);
    bgMuzzleFlash.material.opacity = 0.9;
    bgMuzzleFlash.light.intensity = 8;
    bgMuzzleFlash.scale.set(0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4, 1.5 + Math.random() * 0.5);

    // Gun recoil
    bgGunGroup.rotation.x = 0.1;

    // Bullet tracer
    const bulletGeo = new THREE.BoxGeometry(0.012, 0.012, 0.2);
    const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.8 });
    const bullet = new THREE.Mesh(bulletGeo, bulletMat);
    bullet.position.copy(tip);

    const dir = new THREE.Vector3(0, 0, 1);
    dir.applyQuaternion(bgSoldier.quaternion);
    dir.y += (Math.random() - 0.5) * 0.04;
    dir.x += (Math.random() - 0.5) * 0.02;
    bullet.userData = { velocity: dir.multiplyScalar(1.2), life: 0 };
    bullet.lookAt(bullet.position.clone().add(bullet.userData.velocity));

    scene.add(bullet);
    bgBullets.push(bullet);

    // Shell casing
    const shellGeo = new THREE.CylinderGeometry(0.01, 0.008, 0.04, 6);
    const shellMat = new THREE.MeshStandardMaterial({ color: 0xccaa44, metalness: 0.9 });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    shell.position.copy(tip);
    shell.position.x += 0.1;
    shell.userData = {
        velocity: new THREE.Vector3(0.06 + Math.random() * 0.04, 0.1 + Math.random() * 0.06, -0.01),
        rotSpeed: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8),
        life: 0
    };
    scene.add(shell);
    bgShells.push(shell);

    // Sparks
    for (let i = 0; i < 3; i++) {
        const sparkGeo = new THREE.SphereGeometry(0.01, 4, 4);
        const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 1 });
        const spark = new THREE.Mesh(sparkGeo, sparkMat);
        spark.position.copy(tip);
        spark.userData = {
            velocity: new THREE.Vector3((Math.random() - 0.5) * 0.2, Math.random() * 0.15, Math.random() * 0.1),
            life: 0
        };
        scene.add(spark);
        bgSparks.push(spark);
    }
}

function updateBackgroundSoldier(delta, seconds) {
    if (!bgSoldier) return;

    // Idle breathing
    bgSoldier.position.y += Math.sin(seconds * 1.2) * 0.0008;

    // Fire every 0.5 seconds (slow continuous fire)
    bgFireTimer += delta;
    if (bgFireTimer > 0.5) {
        bgFireBullet();
        bgFireTimer = 0;
    }

    // Gun recoil recovery
    if (bgGunGroup) {
        bgGunGroup.rotation.x *= 0.88;
    }

    // Muzzle flash fade
    if (bgMuzzleFlash) {
        bgMuzzleFlash.material.opacity *= 0.75;
        bgMuzzleFlash.light.intensity *= 0.75;
    }

    // Update bullets
    for (let i = bgBullets.length - 1; i >= 0; i--) {
        const b = bgBullets[i];
        b.position.add(b.userData.velocity.clone().multiplyScalar(delta * 50));
        b.material.opacity -= delta * 0.5;
        b.userData.life += delta;
        if (b.userData.life > 1.5 || b.material.opacity <= 0) {
            scene.remove(b);
            bgBullets.splice(i, 1);
        }
    }

    // Update shells
    for (let i = bgShells.length - 1; i >= 0; i--) {
        const s = bgShells[i];
        s.position.add(s.userData.velocity.clone().multiplyScalar(delta * 20));
        s.userData.velocity.y -= delta * 0.4;
        s.rotation.x += s.userData.rotSpeed.x * delta;
        s.rotation.z += s.userData.rotSpeed.z * delta;
        s.userData.life += delta;
        if (s.userData.life > 2) {
            scene.remove(s);
            bgShells.splice(i, 1);
        }
    }

    // Update sparks
    for (let i = bgSparks.length - 1; i >= 0; i--) {
        const sp = bgSparks[i];
        sp.position.add(sp.userData.velocity.clone().multiplyScalar(delta * 15));
        sp.userData.velocity.y -= delta * 0.2;
        sp.material.opacity -= delta * 4;
        sp.userData.life += delta;
        if (sp.userData.life > 0.35 || sp.material.opacity <= 0) {
            scene.remove(sp);
            bgSparks.splice(i, 1);
        }
    }
}

// Main Animation Loop
let lastTime = 0;
function animate(time) {
    requestAnimationFrame(animate);

    const seconds = time * 0.001;
    const delta = Math.min((time - lastTime) * 0.001, 0.05);
    lastTime = time;

    // Smooth mouse coordinates interpolation (easing)
    mouse.x += (mouse.targetX - mouse.x) * 0.08;
    mouse.y += (mouse.targetY - mouse.y) * 0.08;

    // 1. Deform Liquid Blob
    if (liquidBlob && blobGeometry) {
        const positionAttribute = blobGeometry.attributes.position;
        const timeFactor = seconds * 0.75;
        const noiseFreq = 0.55;
        const noiseAmp = isMobile ? 0.18 : 0.28;

        for (let i = 0; i < positionAttribute.count; i++) {
            const vx = originalPositions.getX(i);
            const vy = originalPositions.getY(i);
            const vz = originalPositions.getZ(i);

            const nx = vx * noiseFreq + timeFactor + mouse.x * 0.15;
            const ny = vy * noiseFreq + timeFactor + mouse.y * 0.15;
            const nz = vz * noiseFreq + timeFactor;

            const noiseValue = noiseGenerator.noise(nx, ny, nz);
            const ratio = 1.0 + noiseValue * noiseAmp;

            positionAttribute.setXYZ(i, vx * ratio, vy * ratio, vz * ratio);
        }

        positionAttribute.needsUpdate = true;
        blobGeometry.computeVertexNormals();

        liquidBlob.rotation.y = seconds * 0.05;
        liquidBlob.rotation.x = seconds * 0.02;

        const scrollFactor = scrollY * 0.0025;
        
        if (!isMobile) {
            liquidBlob.position.x = 1.5 + mouse.x * 0.45;
            liquidBlob.position.y = 0.2 + mouse.y * 0.45 - scrollFactor * 0.8;
            liquidBlob.position.z = Math.min(scrollFactor * 0.2, 1.5);
            liquidBlob.rotation.z = scrollFactor * 0.2;
        } else {
            liquidBlob.position.x = mouse.x * 0.3;
            liquidBlob.position.y = 1.5 + mouse.y * 0.3 - scrollFactor * 1.2;
            liquidBlob.position.z = -0.5 + Math.min(scrollFactor * 0.1, 0.8);
        }
    }

    // 2. Animate Bubble field
    for (let i = 0; i < bubbles.length; i++) {
        const bubble = bubbles[i];
        const ud = bubble.userData;
        
        bubble.position.y += ud.speed;
        bubble.position.x += Math.sin(seconds * ud.frequency + ud.offset) * 0.002;
        bubble.position.x += mouse.x * 0.005;
        bubble.position.y += mouse.y * 0.005;

        if (bubble.position.y > 6) {
            resetBubble(bubble);
        }
    }

    // 3. Animate Background Soldier
    updateBackgroundSoldier(delta, seconds);

    // Render scene
    renderer.render(scene, camera);
}

// Start WebGL
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initThree();
        buildBackgroundSoldier();
    }, 100);
});
