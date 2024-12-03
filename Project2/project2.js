/**
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 *      @task3: 
 *      @task4: 
 * 		setMesh, draw, setAmbientLight, setSpecularLight and enableLighting functions 
 */


function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	
	var trans1 = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var rotatXCos = Math.cos(rotationX);
	var rotatXSin = Math.sin(rotationX);

	var rotatYCos = Math.cos(rotationY);
	var rotatYSin = Math.sin(rotationY);

	var rotatx = [
		1, 0, 0, 0,
		0, rotatXCos, -rotatXSin, 0,
		0, rotatXSin, rotatXCos, 0,
		0, 0, 0, 1
	]

	var rotaty = [
		rotatYCos, 0, -rotatYSin, 0,
		0, 1, 0, 0,
		rotatYSin, 0, rotatYCos, 0,
		0, 0, 0, 1
	]

	var test1 = MatrixMult(rotaty, rotatx);
	var test2 = MatrixMult(trans1, test1);
	var mvp = MatrixMult(projectionMatrix, test2);

	return mvp;
}


class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');

		this.colorLoc = gl.getUniformLocation(this.prog, 'color');

		this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
		this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');

		this.normalLoc = gl.getAttribLocation(this.prog, 'normal');


		this.vertbuffer = gl.createBuffer();
		this.texbuffer = gl.createBuffer();

		this.ambientLoc = gl.getUniformLocation(this.prog, 'ambient');
		this.lightPosLoc = gl.getUniformLocation(this.prog, 'lightPos');

		// Default values for lighting
		this.ambientIntensity = 0.5; // Varsayılan ambient ışık yoğunluğu
		this.lightPosition = [1.0, 1.0, 1.0]; // Varsayılan ışık pozisyonu

		this.numTriangles = 0;

		/**
		 * @Task2 : You should initialize the required variables for lighting here
		 */
		
	}

	setMesh(vertPos, texCoords, normalCoords) {
		// Bind and upload vertex positions
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
	
		// Bind and upload texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
	
		// Bind and upload normals for lighting calculations
		if (normalCoords) {
			if (!this.normalBuffer) {
				this.normalBuffer = gl.createBuffer(); // Create a buffer for normals if not already created
			}
			gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);
		}
	
		this.numTriangles = vertPos.length / 3;
	
		/**
		 * Task2: Normals for lighting calculations added.
		 */
	}
	

	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans) {
		gl.useProgram(this.prog);
	
		// Set the transformation matrix
		gl.uniformMatrix4fv(this.mvpLoc, false, trans);
	
		// Bind and enable vertex buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.enableVertexAttribArray(this.vertPosLoc);
		gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);
	
		// Bind and enable texture coordinate buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.enableVertexAttribArray(this.texCoordLoc);
		gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);
	
		// Bind and enable normal buffer for lighting calculations
		if (this.normalBuffer) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
			gl.enableVertexAttribArray(this.normalLoc);
			gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);
		}
	
		// Update light position dynamically
		updateLightPos(); // Bu çağrıyı değiştirmiyoruz
		this.lightPosition = [lightX, lightY, 1.0]; // lightX ve lightY'den pozisyon oluşturuyoruz
		gl.uniform3fv(this.lightPosLoc, this.lightPosition); // Shader'a gönderiyoruz
	
		// Draw the triangles
		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}
	
	
	

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img, isSecondary = false) {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
	
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
	
		if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		}
	
		gl.useProgram(this.prog);
		let sampler;
if (isSecondary) {
    sampler = gl.getUniformLocation(this.prog, 'tex2');
    gl.activeTexture(gl.TEXTURE1);
} else {
    sampler = gl.getUniformLocation(this.prog, 'tex');
    gl.activeTexture(gl.TEXTURE0);
}

		gl.bindTexture(gl.TEXTURE_2D, texture);
		if (isSecondary) {
			gl.uniform1i(sampler, 1);
		} else {
			gl.uniform1i(sampler, 0);
		}
		
	}
	
	showTexture(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, show);
	}

	enableLighting(show) {
		// Update the uniform for enabling/disabling lighting
		gl.useProgram(this.prog);
		const enableLightingLocation = gl.getUniformLocation(this.prog, 'enableLighting');

if (show) {
    gl.uniform1i(enableLightingLocation, 1);
} else {
    gl.uniform1i(enableLightingLocation, 0);
}

	}
	
	
	setAmbientLight(ambient) {
		// Update the uniform for ambient light intensity
		this.ambientIntensity = ambient; // Save the ambient value locally
		gl.useProgram(this.prog);
		gl.uniform1f(gl.getUniformLocation(this.prog, 'ambient'), ambient);
	}
	
}


function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
	dst = dst || new Float32Array(3);
	var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	// make sure we don't divide by 0.
	if (length > 0.00001) {
		dst[0] = v[0] / length;
		dst[1] = v[1] / length;
		dst[2] = v[2] / length;
	}
	return dst;
}

// Vertex shader source code
const meshVS = `
			attribute vec3 pos; 
			attribute vec2 texCoord; 
			attribute vec3 normal;

			uniform mat4 mvp; 

			varying vec2 v_texCoord; 
			varying vec3 v_normal; 

			void main()
			{
				v_texCoord = texCoord;
				v_normal = normal;

				gl_Position = mvp * vec4(pos,1);
			}`;

// Fragment shader source code
/**
 * @Task2 : You should update the fragment shader to handle the lighting
 */
const meshFS = `
precision mediump float;

uniform bool showTex;
uniform bool enableLighting;
uniform sampler2D tex;   // Primary texture
uniform sampler2D tex2;  // Secondary texture
uniform vec3 lightPos;
uniform float ambient;

varying vec2 v_texCoord;
varying vec3 v_normal;

void main()
{
    vec4 baseTex = texture2D(tex, v_texCoord);    // First texture
    vec4 overlayTex = texture2D(tex2, v_texCoord); // Second texture

    // Blend the textures (50-50 mix)
    vec4 blendedTex = mix(baseTex, overlayTex, 0.5); // Ensure both are vec4

    if (showTex) {
        if (enableLighting) {
            // Lighting calculations
            vec3 lightDir = normalize(lightPos - v_normal);
            float diff = max(dot(normalize(v_normal), lightDir), 0.0);
            vec4 diffuseLight = diff * blendedTex;
            vec4 ambientLight = ambient * blendedTex;

            gl_FragColor = ambientLight + diffuseLight;
        } else {
            gl_FragColor = blendedTex; // Just show the blended texture
        }
    } else {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Default red color when no texture
    }
}

`;


// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos() {
	const translationSpeed = 1;
	if (keys['ArrowUp']) lightY -= translationSpeed;
	if (keys['ArrowDown']) lightY += translationSpeed;
	if (keys['ArrowRight']) lightX -= translationSpeed;
	if (keys['ArrowLeft']) lightX += translationSpeed;
}
///////////////////////////////////////////////////////////////////////////////////