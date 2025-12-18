// client/src/components/WebGLBackground.tsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface WebGLBackgroundProps {
  intensity?: 'low' | 'medium' | 'high';
  color?: string;
}

const WebGLBackground: React.FC<WebGLBackgroundProps> = ({ 
  intensity = 'medium', 
  color = '#8b5cf6' 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | undefined>(undefined);
  const rendererRef = useRef<THREE.WebGLRenderer | undefined>(undefined);
  const animationIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance"
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    mountRef.current.appendChild(renderer.domElement);

    // Store references
    sceneRef.current = scene;
    rendererRef.current = renderer;

    // Create floating geometric shapes
    const shapes: THREE.Mesh[] = [];
    const shapeCount = intensity === 'low' ? 15 : intensity === 'medium' ? 25 : 40;

    // Color palette
    const colors = [
      new THREE.Color('#8b5cf6'), // Purple
      new THREE.Color('#f59e0b'), // Orange  
      new THREE.Color('#06b6d4'), // Cyan
      new THREE.Color('#10b981'), // Green
      new THREE.Color('#f43f5e'), // Rose
    ];

    for (let i = 0; i < shapeCount; i++) {
      // Random geometry
      const geometries = [
        new THREE.IcosahedronGeometry(Math.random() * 2 + 0.5),
        new THREE.OctahedronGeometry(Math.random() * 1.5 + 0.8),
        new THREE.TetrahedronGeometry(Math.random() * 1.2 + 0.6),
        new THREE.DodecahedronGeometry(Math.random() * 1.8 + 0.4),
      ];
      
      const geometry = geometries[Math.floor(Math.random() * geometries.length)];
      const selectedColor = colors[Math.floor(Math.random() * colors.length)] || new THREE.Color('#8b5cf6');
      const material = new THREE.MeshPhongMaterial({
        color: selectedColor,
        transparent: true,
        opacity: 0.1 + Math.random() * 0.3,
        wireframe: Math.random() > 0.6,
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      
      // Random position
      mesh.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20
      );
      
      // Random rotation
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      // Store animation data
      mesh.userData = {
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.02,
          y: (Math.random() - 0.5) * 0.02,
          z: (Math.random() - 0.5) * 0.02
        },
        floatSpeed: Math.random() * 0.01 + 0.005,
        floatOffset: Math.random() * Math.PI * 2,
        originalPosition: mesh.position.clone()
      };
      
      shapes.push(mesh);
      scene.add(mesh);
    }

    // Add star field background
    const starGeometry = new THREE.BufferGeometry();
    const starCount = intensity === 'high' ? 2000 : intensity === 'medium' ? 1000 : 500;
    const starPositions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 100;     // x
      starPositions[i + 1] = (Math.random() - 0.5) * 100; // y
      starPositions[i + 2] = (Math.random() - 0.5) * 100; // z
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.6
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    // Camera position
    camera.position.z = 30;

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      
      // Animate shapes
      shapes.forEach((mesh) => {
        const userData = mesh.userData;
        
        // Rotation
        mesh.rotation.x += userData.rotationSpeed.x;
        mesh.rotation.y += userData.rotationSpeed.y;
        mesh.rotation.z += userData.rotationSpeed.z;
        
        // Floating motion
        mesh.position.y = userData.originalPosition.y + Math.sin(time * userData.floatSpeed + userData.floatOffset) * 2;
        
        // Scale pulsing
        const scale = 1 + Math.sin(time * userData.floatSpeed + userData.floatOffset) * 0.2;
        mesh.scale.setScalar(scale);
      });
      
      // Rotate star field slowly
      stars.rotation.y += 0.0002;
      stars.rotation.x += 0.0001;
      
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!rendererRef.current || !camera) return;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      window.removeEventListener('resize', handleResize);
      
      // Dispose of geometries and materials
      shapes.forEach((mesh) => {
        mesh.geometry.dispose();
        if (mesh.material instanceof THREE.Material) {
          mesh.material.dispose();
        }
      });
      
      starGeometry.dispose();
      starMaterial.dispose();
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
    };
  }, [intensity, color]);

  return (
    <div 
      ref={mountRef} 
      className="fixed inset-0 pointer-events-none z-0"
      style={{ 
        background: 'transparent',
        overflow: 'hidden'
      }}
    />
  );
};

export default WebGLBackground;