class MipShader {
    constructor(volume) {
        
        this.vertexProgram = "mip_vert";
        this.fragmentProgram = "mip_frag";

        
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
                u_ballCount: {value: null},
                u_balls: {value: null}

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
                loadShader(`shaders/${this.vertexProgram}.essl`),
                loadShader(`shaders/${this.fragmentProgram}.essl`)
            ]);

            
            this.material.vertexShader = vertText;
            this.material.fragmentShader = fragText;
            
            
            this.material.needsUpdate = true;
            
            
        } catch (error) {
            console.error(error);
        }
    }




}