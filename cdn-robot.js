// Using a pre-built 3D model from SketchFab
document.addEventListener('DOMContentLoaded', function() {
    // Create iframe for the 3D model
    const container = document.getElementById('robot-container');
    
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.frameBorder = '0';
    iframe.allowFullscreen = true;
    iframe.allow = 'autoplay; fullscreen; xr-spatial-tracking';
    
    // Use a pre-built robot model from SketchFab
    iframe.src = 'https://sketchfab.com/models/c4658d7a3e9c4d3dbd4fdc5c9d537ef9/embed?autostart=1&ui_infos=0&ui_controls=0&ui_stop=0&ui_watermark=0&ui_watermark_link=0';
    
    // Add iframe to container
    container.appendChild(iframe);
    
    console.log('Robot iframe added to container');
});
