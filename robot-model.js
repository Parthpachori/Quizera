// White Robot Model with Blue Pixel Eyes using Three.js
let scene, camera, renderer, robot;
let clock;

// Check if THREE is available
function initClock() {
    if (typeof THREE !== 'undefined') {
        clock = new THREE.Clock();
    }
}

// Initialize the scene
function init() {
    try {
        console.log('Starting initialization...');

        // Initialize clock
        initClock();

        // Create scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xdcdfe6); // Light gray background like in the screenshot
        console.log('Scene created');

        // Create camera
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;
        camera.position.y = 0;
        console.log('Camera created');

        // Get container element
        const container = document.getElementById('robot-container');
        if (!container) {
            throw new Error('Robot container element not found');
        }

        // Create renderer
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(container.clientWidth || window.innerWidth,
                            container.clientHeight || window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.shadowMap.enabled = true;
            container.appendChild(renderer.domElement);
            console.log('Renderer created and added to container');
        } catch (rendererError) {
            console.error('Error creating renderer:', rendererError);
            // Try a simpler renderer as fallback
            try {
                renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
                renderer.setSize(container.clientWidth || window.innerWidth,
                                container.clientHeight || window.innerHeight);
                container.appendChild(renderer.domElement);
                console.log('Fallback renderer created');
            } catch (fallbackError) {
                console.error('Error creating fallback renderer:', fallbackError);
                throw fallbackError;
            }
        }

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
        pointLight.position.set(0, 3, 2);
        scene.add(pointLight);
        console.log('Lights added');

        // Create robot
        createRobot();
        console.log('Robot created');

        // Handle window resize
        window.addEventListener('resize', onWindowResize, false);
        console.log('Resize handler added');

        // Start animation
        animate();
        console.log('Animation started');

        return true;
    } catch (error) {
        console.error('Error in init function:', error);
        // Try to create a simple fallback
        try {
            createFallbackRobot();
            return true;
        } catch (fallbackError) {
            console.error('Error creating fallback:', fallbackError);
            return false;
        }
    }
}

// Create a simple fallback if the main robot fails
function createFallbackRobot() {
    console.log('Creating fallback robot...');

    // Initialize clock
    initClock();

    // Create simple scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdcdfe6);

    // Simple camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Simple renderer
    const container = document.getElementById('robot-container');
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(container.clientWidth || 200, container.clientHeight || 200);
    container.appendChild(renderer.domElement);

    // Create a very simple robot (just a white cube with blue front)
    robot = new THREE.Group();

    // Body
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    robot.add(body);

    // Face
    const face = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 1),
        new THREE.MeshBasicMaterial({ color: 0x222222 })
    );
    face.position.z = 1.01;
    robot.add(face);

    // Eyes
    const leftEye = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.4, 0.1),
        new THREE.MeshBasicMaterial({ color: 0x00a2ff })
    );
    leftEye.position.set(-0.4, 0.1, 1.1);
    robot.add(leftEye);

    const rightEye = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.4, 0.1),
        new THREE.MeshBasicMaterial({ color: 0x00a2ff })
    );
    rightEye.position.set(0.4, 0.1, 1.1);
    robot.add(rightEye);

    scene.add(robot);

    // Store references for animation
    robot.userData = {
        leftEyeGroup: leftEye,
        rightEyeGroup: rightEye
    };

    // Simple animation
    function simpleAnimate() {
        requestAnimationFrame(simpleAnimate);
        if (robot) {
            robot.rotation.y += 0.01;
        }
        renderer.render(scene, camera);
    }

    simpleAnimate();
    console.log('Fallback robot created');
}

// Create the robot model based on the screenshot
function createRobot() {
    robot = new THREE.Group();

    // Materials
    const whiteMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        shininess: 90,
        specular: 0x111111
    });

    const darkMaterial = new THREE.MeshPhongMaterial({
        color: 0x222222,
        shininess: 100,
        specular: 0x333333
    });

    const bluePixelMaterial = new THREE.MeshPhongMaterial({
        color: 0x00a2ff,
        shininess: 0,
        emissive: 0x00a2ff,
        emissiveIntensity: 0.5
    });

    // Main head (rounded rectangle)
    const headGeometry = new THREE.BoxGeometry(2.2, 1.8, 1.8);
    const head = new THREE.Mesh(headGeometry, whiteMaterial);

    // Round the edges of the head
    const headEdges = new THREE.EdgesGeometry(headGeometry);
    const headLine = new THREE.LineSegments(headEdges, new THREE.LineBasicMaterial({ color: 0xffffff }));
    head.add(headLine);

    // Apply subdivision to make it smoother
    head.geometry.computeVertexNormals();

    head.position.y = 0;
    head.castShadow = true;
    head.receiveShadow = true;
    robot.add(head);

    // Screen face (black rectangle)
    const screenGeometry = new THREE.BoxGeometry(1.6, 0.9, 0.1);
    const screen = new THREE.Mesh(screenGeometry, darkMaterial);
    screen.position.set(0, 0.1, 0.95);
    robot.add(screen);

    // Create pixel eyes (blue squares)
    // Left eye (group of cubes to create a pixelated octagon)
    const leftEyeGroup = createPixelatedEye();
    leftEyeGroup.position.set(-0.5, 0.1, 1);
    robot.add(leftEyeGroup);

    // Right eye (group of cubes to create a pixelated octagon)
    const rightEyeGroup = createPixelatedEye();
    rightEyeGroup.position.set(0.5, 0.1, 1);
    robot.add(rightEyeGroup);

    // Ears/side parts
    const leftEar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.4, 16),
        whiteMaterial
    );
    leftEar.rotation.z = Math.PI / 2;
    leftEar.position.set(-1.3, 0, 0);
    robot.add(leftEar);

    const rightEar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.4, 16),
        whiteMaterial
    );
    rightEar.rotation.z = Math.PI / 2;
    rightEar.position.set(1.3, 0, 0);
    robot.add(rightEar);

    // Bottom part (chin/neck)
    const bottomPart = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 32, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
        whiteMaterial
    );
    bottomPart.position.set(0, -1.1, 0);
    robot.add(bottomPart);

    // Small spheres at the bottom
    const leftSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 32, 32),
        whiteMaterial
    );
    leftSphere.position.set(-0.6, -1.8, 0);
    robot.add(leftSphere);

    const rightSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 32, 32),
        whiteMaterial
    );
    rightSphere.position.set(0.6, -1.8, 0);
    robot.add(rightSphere);

    // Add robot to scene
    scene.add(robot);

    // Store references for animation
    robot.userData.leftEyeGroup = leftEyeGroup;
    robot.userData.rightEyeGroup = rightEyeGroup;
}

// Create a pixelated eye (blue octagon made of cubes)
function createPixelatedEye() {
    try {
        const eyeGroup = new THREE.Group();
        const pixelMaterial = new THREE.MeshBasicMaterial({ color: 0x00a2ff });

        // Create a 4x4 grid of cubes
        const pixelSize = 0.1;
        const pixelPositions = [
            // Top row
            {x: -1, y: 2},
            {x: 0, y: 2},
            {x: 1, y: 2},
            {x: 2, y: 2},
            // Middle top row
            {x: -2, y: 1},
            {x: -1, y: 1},
            {x: 0, y: 1},
            {x: 1, y: 1},
            {x: 2, y: 1},
            {x: 3, y: 1},
            // Middle bottom row
            {x: -2, y: 0},
            {x: -1, y: 0},
            {x: 0, y: 0},
            {x: 1, y: 0},
            {x: 2, y: 0},
            {x: 3, y: 0},
            // Bottom row
            {x: -1, y: -1},
            {x: 0, y: -1},
            {x: 1, y: -1},
            {x: 2, y: -1},
        ];

        // Set the scale once for the entire group
        eyeGroup.scale.set(0.8, 0.8, 0.8);
        eyeGroup.position.z = 0.05; // Move slightly forward

        // Add all pixels to the group
        pixelPositions.forEach(pos => {
            try {
                const pixel = new THREE.Mesh(
                    new THREE.BoxGeometry(pixelSize, pixelSize, pixelSize),
                    pixelMaterial
                );
                pixel.position.set(pos.x * pixelSize, pos.y * pixelSize, 0);
                eyeGroup.add(pixel);
            } catch (pixelError) {
                console.error('Error creating pixel:', pixelError);
            }
        });

        return eyeGroup;
    } catch (error) {
        console.error('Error creating pixelated eye:', error);
        // Return a simple fallback eye if there's an error
        const fallbackGroup = new THREE.Group();
        const fallbackEye = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.4, 0.1),
            new THREE.MeshBasicMaterial({ color: 0x00a2ff })
        );
        fallbackGroup.add(fallbackEye);
        return fallbackGroup;
    }
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    try {
        const time = Date.now() * 0.001; // Convert to seconds

        // Subtle animations for the robot
        if (robot) {
            try {
                // Gentle floating motion
                robot.position.y = Math.sin(time * 0.8) * 0.1;

                // Very subtle rotation
                robot.rotation.y = Math.sin(time * 0.5) * 0.05;

                // Occasionally "blink" the eyes by scaling them
                if (Math.sin(time * 0.7) > 0.97) {
                    if (robot.userData && robot.userData.leftEyeGroup && robot.userData.rightEyeGroup) {
                        robot.userData.leftEyeGroup.scale.y = 0.1;
                        robot.userData.rightEyeGroup.scale.y = 0.1;
                    }
                } else {
                    if (robot.userData && robot.userData.leftEyeGroup && robot.userData.rightEyeGroup) {
                        robot.userData.leftEyeGroup.scale.y = 0.8;
                        robot.userData.rightEyeGroup.scale.y = 0.8;
                    }
                }
            } catch (animationError) {
                console.error('Error in robot animation:', animationError);
            }
        }

        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    } catch (error) {
        console.error('Error in animation loop:', error);
    }
}

// Initialize when the window loads
window.addEventListener('load', function() {
    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
        console.error('Three.js is not loaded. Please include the Three.js library.');
        return;
    }

    // Check if container exists
    if (!document.getElementById('robot-container')) {
        console.error('Robot container not found. Please add a div with id "robot-container".');
        return;
    }

    try {
        console.log('Initializing robot model...');
        init();
        console.log('Robot model initialized successfully!');
    } catch (error) {
        console.error('Error initializing robot model:', error);
    }
});
