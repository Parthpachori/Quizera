// Simple Three.js Robot
window.onload = function() {
    console.log('Window loaded, initializing simple robot...');
    
    // Load Three.js from CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    
    script.onload = function() {
        console.log('Three.js loaded successfully!');
        initRobot();
    };
    
    script.onerror = function() {
        console.error('Failed to load Three.js library!');
    };
    
    document.head.appendChild(script);
};

function initRobot() {
    try {
        // Get container
        const container = document.getElementById('robot-container');
        if (!container) {
            console.error('Robot container not found!');
            return;
        }
        
        console.log('Container found, initializing Three.js...');
        
        // Create scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        
        // Create camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;
        
        // Create renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);
        
        console.log('Renderer added to container');
        
        // Create a simple robot (just a sphere for now)
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0x4285F4 });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);
        
        // Add light
        const light = new THREE.AmbientLight(0xffffff);
        scene.add(light);
        
        // Animation function
        function animate() {
            requestAnimationFrame(animate);
            
            // Rotate the sphere
            sphere.rotation.x += 0.01;
            sphere.rotation.y += 0.01;
            
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
        console.log('Animation started');
        
    } catch (error) {
        console.error('Error in initRobot:', error);
    }
}
