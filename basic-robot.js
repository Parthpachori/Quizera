// Basic Three.js Robot
document.addEventListener('DOMContentLoaded', function() {
    // Load Three.js and OrbitControls
    const threeScript = document.createElement('script');
    threeScript.src = 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.min.js';
    document.head.appendChild(threeScript);
    
    threeScript.onload = function() {
        console.log('Three.js loaded');
        
        // Now load OrbitControls
        const orbitScript = document.createElement('script');
        orbitScript.src = 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/js/controls/OrbitControls.js';
        document.head.appendChild(orbitScript);
        
        orbitScript.onload = function() {
            console.log('OrbitControls loaded');
            initScene();
        };
    };
});

function initScene() {
    // Get container
    const container = document.getElementById('robot-container');
    
    // Set up scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Set up camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    
    // Set up renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    
    // Add controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Create robot body (blue sphere)
    const bodyGeometry = new THREE.SphereGeometry(1, 32, 32);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x4285F4 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    scene.add(body);
    
    // Create robot eyes (white spheres)
    const eyeGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.3, 0.3, 0.8);
    scene.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.3, 0.3, 0.8);
    scene.add(rightEye);
    
    // Create robot mouth (red torus)
    const mouthGeometry = new THREE.TorusGeometry(0.3, 0.1, 16, 32, Math.PI);
    const mouthMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, -0.2, 0.8);
    mouth.rotation.x = Math.PI / 2;
    scene.add(mouth);
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Rotate the robot
        body.rotation.y += 0.01;
        leftEye.rotation.y += 0.01;
        rightEye.rotation.y += 0.01;
        mouth.rotation.y += 0.01;
        
        // Make the robot float up and down
        const time = Date.now() * 0.001;
        body.position.y = Math.sin(time) * 0.2;
        leftEye.position.y = 0.3 + Math.sin(time) * 0.2;
        rightEye.position.y = 0.3 + Math.sin(time) * 0.2;
        mouth.position.y = -0.2 + Math.sin(time) * 0.2;
        
        controls.update();
        renderer.render(scene, camera);
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Start animation
    animate();
}
