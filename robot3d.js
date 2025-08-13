// Three.js Happy Flying Robot
class FlyingRobot {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.robot = null;
        this.lights = [];
        this.clock = new THREE.Clock();
        this.mixer = null;
        this.animations = [];

        this.init();
    }

    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0); // Match page background

        // Create camera
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
        this.camera.position.set(0, 0, 10);
        this.camera.lookAt(0, 0, 0);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Add lights
        this.addLights();

        // Create robot
        this.createRobot();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Start animation loop
        this.animate();
    }

    addLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Directional light (sun-like)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);

        // Add a soft light from below
        const bottomLight = new THREE.DirectionalLight(0x8888ff, 0.3);
        bottomLight.position.set(0, -10, 0);
        this.scene.add(bottomLight);
    }

    createRobot() {
        // Robot group
        this.robot = new THREE.Group();

        // Materials
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x4285F4, // Google blue
            shininess: 100
        });

        const eyeMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            shininess: 100
        });

        const pupilMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            shininess: 100
        });

        const accentMaterial = new THREE.MeshPhongMaterial({
            color: 0xEA4335, // Google red
            shininess: 100
        });

        const jointMaterial = new THREE.MeshPhongMaterial({
            color: 0xF9F9F9, // Light gray
            shininess: 50
        });

        // Body
        const bodyGeometry = new THREE.SphereGeometry(1, 32, 32);
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        body.receiveShadow = true;
        this.robot.add(body);

        // Head
        const headGeometry = new THREE.SphereGeometry(0.65, 32, 32);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.y = 1.1;
        head.castShadow = true;
        this.robot.add(head);

        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.2, 32, 32);

        // Left eye
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.25, 1.2, 0.5);
        leftEye.scale.z = 0.5;
        this.robot.add(leftEye);

        // Right eye
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.25, 1.2, 0.5);
        rightEye.scale.z = 0.5;
        this.robot.add(rightEye);

        // Pupils
        const pupilGeometry = new THREE.SphereGeometry(0.08, 32, 32);

        // Left pupil
        const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        leftPupil.position.set(-0.25, 1.2, 0.65);
        this.robot.add(leftPupil);

        // Right pupil
        const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        rightPupil.position.set(0.25, 1.2, 0.65);
        this.robot.add(rightPupil);

        // Mouth (smile)
        const mouthGeometry = new THREE.TorusGeometry(0.3, 0.05, 16, 32, Math.PI);
        const mouth = new THREE.Mesh(mouthGeometry, accentMaterial);
        mouth.position.set(0, 0.9, 0.5);
        mouth.rotation.x = Math.PI / 2;
        mouth.rotation.z = Math.PI;
        this.robot.add(mouth);

        // Arms
        const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 32);

        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
        leftArm.position.set(-1, 0, 0);
        leftArm.rotation.z = -Math.PI / 4;
        this.robot.add(leftArm);

        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
        rightArm.position.set(1, 0, 0);
        rightArm.rotation.z = Math.PI / 4;
        this.robot.add(rightArm);

        // Hands
        const handGeometry = new THREE.SphereGeometry(0.15, 32, 32);

        // Left hand
        const leftHand = new THREE.Mesh(handGeometry, jointMaterial);
        leftHand.position.set(-1.5, -0.5, 0);
        this.robot.add(leftHand);

        // Right hand
        const rightHand = new THREE.Mesh(handGeometry, jointMaterial);
        rightHand.position.set(1.5, -0.5, 0);
        this.robot.add(rightHand);

        // Legs
        const legGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 32);

        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        leftLeg.position.set(-0.5, -1.5, 0);
        this.robot.add(leftLeg);

        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        rightLeg.position.set(0.5, -1.5, 0);
        this.robot.add(rightLeg);

        // Feet
        const footGeometry = new THREE.SphereGeometry(0.2, 32, 32);
        footGeometry.scale(1.5, 1, 1.5);

        // Left foot
        const leftFoot = new THREE.Mesh(footGeometry, jointMaterial);
        leftFoot.position.set(-0.5, -2, 0);
        this.robot.add(leftFoot);

        // Right foot
        const rightFoot = new THREE.Mesh(footGeometry, jointMaterial);
        rightFoot.position.set(0.5, -2, 0);
        this.robot.add(rightFoot);

        // Antenna
        const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 32);
        const antenna = new THREE.Mesh(antennaGeometry, accentMaterial);
        antenna.position.set(0, 1.8, 0);
        this.robot.add(antenna);

        // Antenna ball
        const antennaBallGeometry = new THREE.SphereGeometry(0.08, 32, 32);
        const antennaBall = new THREE.Mesh(antennaBallGeometry, accentMaterial);
        antennaBall.position.set(0, 2, 0);
        this.robot.add(antennaBall);

        // Add robot to scene
        this.scene.add(this.robot);

        // Position robot
        this.robot.position.set(0, 0, 0);
        this.robot.rotation.y = -Math.PI / 6;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = this.clock.getElapsedTime();

        // Floating animation
        this.robot.position.y = Math.sin(time * 1.5) * 0.2;

        // Gentle rotation
        this.robot.rotation.y = Math.sin(time * 0.5) * 0.5 - Math.PI / 6;

        // Arm movement
        if (this.robot) {
            // Find arm meshes (they are the 5th and 6th children)
            const leftArm = this.robot.children[5];
            const rightArm = this.robot.children[6];

            if (leftArm && rightArm) {
                // Animate arms
                leftArm.rotation.z = -Math.PI / 4 + Math.sin(time * 2) * 0.2;
                rightArm.rotation.z = Math.PI / 4 - Math.sin(time * 2) * 0.2;

                // Update hand positions to follow arms
                const leftHand = this.robot.children[7];
                const rightHand = this.robot.children[8];

                if (leftHand && rightHand) {
                    // Calculate hand positions based on arm rotations
                    leftHand.position.x = -1 - Math.cos(leftArm.rotation.z) * 0.6;
                    leftHand.position.y = Math.sin(leftArm.rotation.z) * 0.6;

                    rightHand.position.x = 1 + Math.cos(rightArm.rotation.z) * 0.6;
                    rightHand.position.y = -Math.sin(rightArm.rotation.z) * 0.6;
                }
            }

            // Animate antenna ball
            const antennaBall = this.robot.children[this.robot.children.length - 1];
            if (antennaBall) {
                antennaBall.position.x = Math.sin(time * 3) * 0.1;
                antennaBall.position.y = 2 + Math.sin(time * 6) * 0.05;
            }

            // Animate eyes (blink occasionally)
            const leftEye = this.robot.children[2];
            const rightEye = this.robot.children[3];
            const leftPupil = this.robot.children[4];
            const rightPupil = this.robot.children[5];

            // Blink every 3 seconds
            if (Math.floor(time) % 3 === 0 && time % 1 < 0.1) {
                leftEye.scale.y = 0.1;
                rightEye.scale.y = 0.1;
                leftPupil.scale.y = 0.1;
                rightPupil.scale.y = 0.1;
            } else {
                leftEye.scale.y = 1;
                rightEye.scale.y = 1;
                leftPupil.scale.y = 1;
                rightPupil.scale.y = 1;
            }
        }

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.width, this.height);
    }
}

// Initialize when DOM is loaded
window.onload = function() {
    console.log('Window loaded, initializing robot...');

    // Create robot container if it doesn't exist
    let robotContainer = document.getElementById('robot-container');
    if (!robotContainer) {
        console.log('Creating robot container...');
        robotContainer = document.createElement('div');
        robotContainer.id = 'robot-container';
        robotContainer.className = 'robot-container';
        document.body.appendChild(robotContainer);
    }

    // Load Three.js from CDN
    console.log('Loading Three.js...');
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = function() {
        console.log('Three.js loaded successfully!');
        // Initialize robot after Three.js is loaded
        try {
            console.log('Initializing robot...');
            new FlyingRobot('robot-container');
        } catch (error) {
            console.error('Error initializing robot:', error);
        }
    };
    script.onerror = function() {
        console.error('Failed to load Three.js library!');
    };
    document.head.appendChild(script);
};
