import * as THREE from 'three';
export class MipShader {
    constructor(volume) {
        

        
        const texture = new THREE.Data3DTexture(volume.voxels, volume.width, volume.height, volume.depth);
        texture.format = THREE.RedFormat;
        texture.type = THREE.FloatType;            
        texture.internalFormat = "R32F";           
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        
        this.material = new THREE.ShaderMaterial({
            glslVersion: THREE.GLSL3,
            uniforms: {
                u_texture: {value: texture},
                u_scale: {value: volume.scale},
                u_ballCount: {value: 0},
                u_balls: {value: [...Array(5)].map(() => ({ 
                        iso: 0.5, 
                        transparency: 1.0, 
                        color: new THREE.Color("#ffffff") 
                    }))
                }

            },
            defines: { MODE_MIP: true },
            transparent: true,
            depthTest: true,
            depthWrite: false
        });

        
    }

    async load() {
        const loader = new THREE.FileLoader();

        
        const loadShader = (path) => {
            return new Promise((resolve, reject) => {
                loader.load(path, data => resolve(data), null, err => reject(err));
            });
        };

        try {
            
            const [vertText, fragText] = await Promise.all([
                loadShader(`shaders/vert.essl`),
                loadShader(`shaders/frag.essl`)
            ]);

            
            this.material.vertexShader = vertText;
            this.material.fragmentShader = fragText;
            
            
            this.material.needsUpdate = true;
            
            
        } catch (error) {
            console.error(error);
        }
    }




}