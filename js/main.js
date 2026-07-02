

function init(){

    let viewContainer= document.getElementById("viewContainer");
    ThreeCanvasWidth = window.innerWidth * 0.7;
    ThreeCanvasHeight = window.innerHeight * 0.7;
    
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( ThreeCanvasWidth, ThreeCanvasHeight);
    viewContainer.appendChild( renderer.domElement );

    //readVoxelData
    fileInput = document.getElementById("upload");
    fileInput.addEventListener('change', readFile);

    //histogram init
    histogram = new Histogram({ parentElement: "#histogram" });

    //mode dropdown
    renderMode = document.getElementById("renderMode");
    renderMode.addEventListener('change', changeMode);

}

/**
 * Handles the render mode selection.
 */
function changeMode(event){

    selectedMode = event.target.value;

    if(mipShader == null) return;
    
    mipShader = new MipShader(volume);
    
    if (selectedMode === "MIP") {
        mipShader.material.defines = {
            MODE_MIP: true
        };
    } 
    else if (selectedMode === "ISO") {
        mipShader.material.defines = {
            MODE_ISO: true
        };
    }

    mipShader.material.needsUpdate = true;
    resetVis();

}

function readFile(){
    let reader = new FileReader();
    reader.onloadend = function () {
        console.log("data loaded: ");

        let data = new Uint16Array(reader.result);
        volume = createVolume(data);

        //mip ----------
        mipShader = new MipShader(volume);
        if (selectedMode === "MIP") {
        mipShader.material.defines = {MODE_MIP: true};
        } 
        else if (selectedMode === "ISO") {
        mipShader.material.defines = {MODE_ISO: true};
        }

        mipShader.material.needsUpdate = true;

        histogram.data = volume.voxels;
        histogram.updateVis();
       

        resetVis();
    };
    reader.readAsArrayBuffer(fileInput.files[0]);
}

// Volume class handling simple volume.dat files. 
function createVolume(uint16Array) {
    const width = uint16Array[0];
    const height = uint16Array[1];
    const depth = uint16Array[2];
    const slice = width * height;
    const size = slice * depth;
    const max = Math.max(width, height, depth);
    const scale = new THREE.Vector3(width, height, depth);

    
    const rawVoxels = uint16Array.subarray(3);
    const voxels = new Float32Array(rawVoxels.length);
    for (let i = 0; i < rawVoxels.length; i++) {
        voxels[i] = rawVoxels[i] / 4095.0;
    }

    console.log(voxels.length + " voxels loaded - ["
        + width + ", " + height + ", " + depth + "], max: " + max);


    return {
        width,
        height,
        depth,
        slice,
        size,
        max,
        scale,
        voxels
    };
}


/**
 * Constructs the THREE.js scene and updates histogram when a new volume is loaded 
 */
async function resetVis(){
    
    if(scene != null){
        clean();
    }
    if (animationFrameID) cancelAnimationFrame(animationFrameID);

    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
            75, // FOV 
            THREEinnerWidth / ThreeCanvasHeight , // Aspect Ratio
            0.1, // Near 
            1000 // Far 
        );
    camera.position.set(0, 5, 10);

    controls = new OrbitControls(camera, renderer.domElement);

    controls.target.set(0, 0, 0); 
    controls.enableDamping = true; 
    controls.dampingFactor = 0.05;
    controls.enableZoom = true; 

 

    //set scene -----------
    const mipCube = new THREE.BoxGeometry(1, 1, 1);
    const mipMaterial = mipShader.material;
    await mipShader.load();
    const mipMesh = new THREE.Mesh(mipCube, mipMaterial);
    mipMesh.scale.set(volume.width, volume.height, volume.depth);
    scene.add(mipMesh);

    //center check
    const boundingBox = new THREE.Box3().setFromObject(mipMesh);
    console.log("Mesh diagonal", boundingBox);

    // init paint loop
    animationFrameID = requestAnimationFrame(paint);
}

/**
 * Render the scene and update all necessary shader information.
 */
function paint(){
    if (volume) {
        let balls = histogram.getBalls();
        mipShadder.material.uniforms.u_ballcCount.value = balls.length;
        

        balls = [...Array(5)].map((_, i) => 
            balls[i] ? balls[i] : { iso: .5, transparency: 1.0, color: new THREE.Color("#ffffff") }
            );

        
        mipShadder.material.uniforms.u_balls.value = balls;

        renderer.render(scene, camera);
         



    }

    animationFrameID = requestAnimationFrame(paint);
}

/**
 * Clean GPU memory
 */
function clean() {
    while(scene.children.length > 0){ 
        let child = scene.children[0];
        child.geometry.dispose();

    
        for (const uniformName in child.material.uniforms) {
            const uniform = child.material.uniforms[uniformName];
            if (uniform.value && uniform.value.isTexture) {
                    uniform.value.dispose();
                }
            
        }
            

        child.material.dispose();
        scene.remove(child); 
    }

    
}