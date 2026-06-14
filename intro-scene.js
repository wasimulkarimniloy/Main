/* NILOY 3D Intro Scene — Soldier with AK47 Firing Animation */

(function() {
    let introScene, introCamera, introRenderer;
    let soldier, ak47Group, muzzleFlash;
    let bullets = [];
    let shells = [];
    let sparks = [];
    let clock;
    let introActive = true;
    let fireTimer = 0;
    let totalFired = 0;
    const maxBullets = 18;
    let introProgress = 0;
    let shakeIntensity = 0;

    function initIntro() {
        const canvas = document.getElementById('intro-canvas');
        if (!canvas) return;

        clock = new THREE.Clock();

        // Scene
        introScene = new THREE.Scene();
        introScene.background = new THREE.Color(0x030308);
        introScene.fog = new THREE.FogExp2(0x030308, 0.035);

        // Camera
        introCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
        introCamera.position.set(3.5, 2.8, 5.5);
        introCamera.lookAt(0, 1.2, 0);

        // Renderer
        introRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        introRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        introRenderer.setSize(window.innerWidth, window.innerHeight);
        introRenderer.shadowMap.enabled = true;

        // Lighting
        const ambient = new THREE.AmbientLight(0x151530, 1.2);
        introScene.add(ambient);

        const spotCyan = new THREE.SpotLight(0x00f2fe, 8, 30, Math.PI / 5, 0.3);
        spotCyan.position.set(-4, 6, 5);
        spotCyan.castShadow = true;
        introScene.add(spotCyan);

        const spotMagenta = new THREE.SpotLight(0xff007f, 6, 25, Math.PI / 4, 0.3);
        spotMagenta.position.set(4, 5, -3);
        introScene.add(spotMagenta);

        const backLight = new THREE.PointLight(0x8a2be2, 4, 20);
        backLight.position.set(0, 4, -5);
        introScene.add(backLight);

        // Ground
        const groundGeo = new THREE.PlaneGeometry(40, 40);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x080812,
            roughness: 0.85,
            metalness: 0.15
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        introScene.add(ground);

        // Grid lines on ground
        const gridHelper = new THREE.GridHelper(40, 40, 0x00f2fe, 0x0a0a20);
        gridHelper.material.opacity = 0.08;
        gridHelper.material.transparent = true;
        introScene.add(gridHelper);

        // Build Character
        soldier = new THREE.Group();
        buildSoldier();
        introScene.add(soldier);

        // Muzzle Flash
        const flashGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const flashMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0 });
        muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
        muzzleFlash.scale.set(1.5, 1.5, 3);
        introScene.add(muzzleFlash);

        // Muzzle point light
        muzzleFlash.light = new THREE.PointLight(0xff8800, 0, 8);
        muzzleFlash.add(muzzleFlash.light);

        // Background floating particles
        createBackgroundParticles();

        window.addEventListener('resize', onIntroResize);
        animateIntro();
    }

    function buildSoldier() {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.6 });
        const skinMat = new THREE.MeshStandardMaterial({ color: 0x2d2d44, roughness: 0.5 });
        const detailMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, roughness: 0.3, emissive: 0x00f2fe, emissiveIntensity: 0.3 });
        const visorMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, roughness: 0.1, emissive: 0x00f2fe, emissiveIntensity: 0.8, transparent: true, opacity: 0.8 });

        // Body / Torso
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.5), bodyMat);
        torso.position.y = 1.8;
        torso.castShadow = true;
        soldier.add(torso);

        // Tactical vest detail
        const vest = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.35, 0.55), detailMat);
        vest.position.set(0, 2.1, 0);
        soldier.add(vest);

        // Head
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), skinMat);
        head.position.set(0, 2.65, 0);
        head.castShadow = true;
        soldier.add(head);

        // Helmet
        const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.5), bodyMat);
        helmet.position.set(0, 2.95, 0);
        soldier.add(helmet);

        // Visor
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.1), visorMat);
        visor.position.set(0, 2.7, 0.23);
        soldier.add(visor);

        // Legs
        const legL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.35), bodyMat);
        legL.position.set(-0.2, 0.75, 0);
        legL.castShadow = true;
        soldier.add(legL);

        const legR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.35), bodyMat);
        legR.position.set(0.2, 0.75, 0);
        legR.castShadow = true;
        soldier.add(legR);

        // Boots
        const bootMat = new THREE.MeshStandardMaterial({ color: 0x111122 });
        const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.45), bootMat);
        bootL.position.set(-0.2, 0.25, 0.05);
        soldier.add(bootL);

        const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.45), bootMat);
        bootR.position.set(0.2, 0.25, 0.05);
        soldier.add(bootR);

        // Arms and AK47
        ak47Group = new THREE.Group();

        // Right Arm (holding gun)
        const armR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, 0.22), skinMat);
        armR.position.set(-0.12, -0.1, 0.35);
        armR.rotation.x = -0.6;
        ak47Group.add(armR);

        // Left Arm (supporting)
        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.6, 0.22), skinMat);
        armL.position.set(0.15, -0.2, 0.55);
        armL.rotation.x = -0.8;
        ak47Group.add(armL);

        // AK47 Body
        const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.9), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4 }));
        gunBody.position.set(0, -0.05, 0.65);
        ak47Group.add(gunBody);

        // AK47 Barrel
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 }));
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0, 1.35);
        ak47Group.add(barrel);

        // AK47 Magazine
        const magazine = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.08), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
        magazine.position.set(0, -0.2, 0.5);
        magazine.rotation.x = 0.15;
        ak47Group.add(magazine);

        // AK47 Stock
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.35), new THREE.MeshStandardMaterial({ color: 0x3d2b1f }));
        stock.position.set(0, -0.02, 0.05);
        ak47Group.add(stock);

        // AK47 Scope rail detail
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.3), detailMat);
        rail.position.set(0, 0.07, 0.7);
        ak47Group.add(rail);

        ak47Group.position.set(0.5, 1.9, 0);
        ak47Group.rotation.y = -0.1;
        soldier.add(ak47Group);

        // Position soldier
        soldier.position.set(-0.5, 0, 0);
        soldier.rotation.y = -0.3;
    }

    function createBackgroundParticles() {
        const geometry = new THREE.BufferGeometry();
        const count = 300;
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 25;
            positions[i + 1] = Math.random() * 15;
            positions[i + 2] = (Math.random() - 0.5) * 25;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            color: 0x00f2fe,
            size: 0.04,
            transparent: true,
            opacity: 0.5
        });
        
        const particles = new THREE.Points(geometry, material);
        introScene.add(particles);
    }

    function fireBullet() {
        // Get barrel tip world position
        const barrelTip = new THREE.Vector3(0, 0, 1.6);
        ak47Group.localToWorld(barrelTip);
        soldier.localToWorld(barrelTip);

        // Muzzle flash
        muzzleFlash.position.copy(barrelTip);
        muzzleFlash.material.opacity = 1;
        muzzleFlash.light.intensity = 15;
        muzzleFlash.scale.set(1 + Math.random() * 0.5, 1 + Math.random() * 0.5, 2 + Math.random());

        // AK47 recoil
        ak47Group.rotation.x = 0.15;

        // Screen shake
        shakeIntensity = 0.08;

        // Create bullet tracer
        const bulletGeo = new THREE.BoxGeometry(0.02, 0.02, 0.3);
        const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
        const bullet = new THREE.Mesh(bulletGeo, bulletMat);
        bullet.position.copy(barrelTip);

        // Compute direction based on soldier rotation
        const direction = new THREE.Vector3(0, 0, 1);
        direction.applyQuaternion(soldier.quaternion);
        direction.y += (Math.random() - 0.5) * 0.05; // slight spread
        direction.x += (Math.random() - 0.5) * 0.03;

        bullet.userData = { velocity: direction.multiplyScalar(1.5), life: 0 };
        bullet.lookAt(bullet.position.clone().add(bullet.userData.velocity));

        introScene.add(bullet);
        bullets.push(bullet);

        // Shell casing ejection
        const shellGeo = new THREE.CylinderGeometry(0.015, 0.012, 0.06, 6);
        const shellMat = new THREE.MeshStandardMaterial({ color: 0xccaa44, metalness: 0.9 });
        const shell = new THREE.Mesh(shellGeo, shellMat);
        shell.position.copy(barrelTip);
        shell.position.x += 0.15;
        shell.userData = {
            velocity: new THREE.Vector3(0.08 + Math.random() * 0.05, 0.12 + Math.random() * 0.08, -0.02),
            rotSpeed: new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
            life: 0
        };
        introScene.add(shell);
        shells.push(shell);

        // Sparks at muzzle
        for (let i = 0; i < 5; i++) {
            const sparkGeo = new THREE.SphereGeometry(0.015, 4, 4);
            const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 1 });
            const spark = new THREE.Mesh(sparkGeo, sparkMat);
            spark.position.copy(barrelTip);
            spark.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.3,
                    Math.random() * 0.2,
                    Math.random() * 0.15
                ),
                life: 0
            };
            introScene.add(spark);
            sparks.push(spark);
        }

        // Flash the overlay element
        const flashEl = document.getElementById('muzzle-flash');
        if (flashEl) {
            flashEl.style.opacity = '0.15';
            setTimeout(() => { flashEl.style.opacity = '0'; }, 50);
        }

        totalFired++;
    }

    function animateIntro() {
        if (!introActive) return;
        requestAnimationFrame(animateIntro);

        const delta = clock.getDelta();
        const elapsed = clock.getElapsedTime();

        // Firing logic — start firing after 0.5s
        if (elapsed > 0.5 && totalFired < maxBullets) {
            fireTimer += delta;
            if (fireTimer > 0.12) { // ~8 rounds per second
                fireBullet();
                fireTimer = 0;
            }
        }

        // Update progress bar
        introProgress = Math.min((totalFired / maxBullets) * 100, 100);
        const progressEl = document.getElementById('intro-progress');
        if (progressEl) {
            progressEl.style.width = introProgress + '%';
        }

        // AK47 recoil recovery
        if (ak47Group) {
            ak47Group.rotation.x *= 0.85;
        }

        // Muzzle flash fade
        if (muzzleFlash) {
            muzzleFlash.material.opacity *= 0.7;
            muzzleFlash.light.intensity *= 0.7;
        }

        // Update bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.position.add(b.userData.velocity.clone().multiplyScalar(delta * 60));
            b.userData.life += delta;
            if (b.userData.life > 1.5) {
                introScene.remove(b);
                bullets.splice(i, 1);
            }
        }

        // Update shells
        for (let i = shells.length - 1; i >= 0; i--) {
            const s = shells[i];
            s.position.add(s.userData.velocity.clone().multiplyScalar(delta * 30));
            s.userData.velocity.y -= delta * 0.5; // gravity
            s.rotation.x += s.userData.rotSpeed.x * delta;
            s.rotation.z += s.userData.rotSpeed.z * delta;
            s.userData.life += delta;
            if (s.userData.life > 2) {
                introScene.remove(s);
                shells.splice(i, 1);
            }
        }

        // Update sparks
        for (let i = sparks.length - 1; i >= 0; i--) {
            const sp = sparks[i];
            sp.position.add(sp.userData.velocity.clone().multiplyScalar(delta * 20));
            sp.userData.velocity.y -= delta * 0.3;
            sp.material.opacity -= delta * 3;
            sp.userData.life += delta;
            if (sp.userData.life > 0.4 || sp.material.opacity <= 0) {
                introScene.remove(sp);
                sparks.splice(i, 1);
            }
        }

        // Camera screen shake
        if (shakeIntensity > 0.001) {
            introCamera.position.x = 3.5 + (Math.random() - 0.5) * shakeIntensity;
            introCamera.position.y = 2.8 + (Math.random() - 0.5) * shakeIntensity;
            shakeIntensity *= 0.88;
        } else {
            introCamera.position.x = 3.5;
            introCamera.position.y = 2.8;
        }

        // Soldier idle breathing
        if (soldier) {
            soldier.position.y = Math.sin(elapsed * 1.5) * 0.02;
        }

        introRenderer.render(introScene, introCamera);

        // Check if intro is complete
        if (totalFired >= maxBullets && bullets.length === 0 && sparks.length === 0) {
            setTimeout(finishIntro, 800);
        }
    }

    function finishIntro() {
        introActive = false;
        
        const overlay = document.getElementById('intro-overlay');
        const mainSite = document.getElementById('main-site');

        if (overlay) {
            overlay.style.transition = 'opacity 1s ease, transform 1s ease';
            overlay.style.opacity = '0';
            overlay.style.transform = 'scale(1.05)';
        }

        if (mainSite) {
            mainSite.classList.remove('main-site-hidden');
            mainSite.classList.add('main-site-visible');
        }

        setTimeout(() => {
            if (overlay) overlay.style.display = 'none';
            // Clean up Three.js resources
            if (introRenderer) introRenderer.dispose();
        }, 1200);
    }

    function onIntroResize() {
        if (!introCamera || !introRenderer) return;
        introCamera.aspect = window.innerWidth / window.innerHeight;
        introCamera.updateProjectionMatrix();
        introRenderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Boot
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initIntro, 100);
    });
})();
