import * as THREE from 'three';

export function addSky(scene:THREE.Scene,renderer:THREE.WebGLRenderer){
 const mat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{haze:{value:0}},vertexShader:`varying vec3 direction; void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`varying vec3 direction; uniform float haze;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
 float fbm(vec2 p){float n=0.;float a=.5;for(int i=0;i<5;i++){n+=noise(p)*a;p=p*2.03+vec2(13.4,7.8);a*=.5;}return n;}
 void main(){vec3 d=normalize(direction);float h=max(0.,d.y);vec3 c=mix(vec3(.67,.77,.79),vec3(.21,.43,.60),pow(h,.45));
 float sun=max(0.,dot(d,normalize(vec3(-.5,.6,-.7))));c+=vec3(1.,.86,.63)*(pow(sun,650.)*2.+pow(sun,16.)*.14);
 float cloud=fbm(d.xz/(h+.18)*3.);float veil=smoothstep(.02,.2,h);c=mix(c,vec3(.88,.90,.89),smoothstep(.48,.76,cloud)*veil*.62);
 c=mix(c,vec3(.53,.62,.65),haze);gl_FragColor=vec4(c,1.);#include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`.replace(';#include',';\n#include')});
 const sky=new THREE.Mesh(new THREE.SphereGeometry(2400,32,16),mat);scene.add(sky);
 const envScene=new THREE.Scene();envScene.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),mat));
 const pmrem=new THREE.PMREMGenerator(renderer);const environment=pmrem.fromScene(envScene,.08);scene.environment=environment.texture;scene.environmentIntensity=.5;pmrem.dispose();
 return {follow(position:THREE.Vector3){sky.position.copy(position);},setHaze(value:number){mat.uniforms.haze.value=value;},setWeather(weather:string){mat.uniforms.haze.value=weather==='Fog'?.93:weather==='Rain'?.7:0;}};
}

export function addIsland(scene:THREE.Scene,island:{x:number;z:number;r:number},seed:number){
 const geometry=new THREE.BufferGeometry(),points:number[]=[],colors:number[]=[],indices:number[]=[];
 const rings=24,segments=96;
 for(let ring=0;ring<=rings;ring++)for(let j=0;j<=segments;j++){
  const a=j/segments*Math.PI*2,f=ring/rings;
  const shore=1+.055*Math.sin(a*5+seed)+.04*Math.cos(a*9-seed);
  const x=Math.cos(a)*island.r*f*shore,z=Math.sin(a)*island.r*f*shore;
  const profile=Math.pow(Math.max(0,1-f*f),1.8);
  const hill=(37+12*Math.sin(x*.019+seed)+9*Math.cos(z*.024)+7*Math.sin((x+z)*.042))*profile;
  const y=hill-3+Math.sin(a*13+f*32)*1.3*profile;
  points.push(x,y*.25,z);
  const color=new THREE.Color(y<1?'#b4b29b':y<5?'#817e65':y>32?'#7a8290':'#68717c');
  color.multiplyScalar(.87+.13*Math.sin(x*.6+z*.32+seed));colors.push(color.r,color.g,color.b);
 }
 for(let r=0;r<rings;r++)for(let j=0;j<segments;j++){const a=r*(segments+1)+j,b=a+segments+1;indices.push(a,b,a+1,a+1,b,b+1);}
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 const terrain=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}));terrain.position.set(island.x,0,island.z);scene.add(terrain);
 // Rocks cluster around the shoreline, with varied proportions and orientation.
 const rockGeo=new THREE.IcosahedronGeometry(1,1),rockMat=new THREE.MeshStandardMaterial({color:'#828b99',roughness:.95});
 const rocks=new THREE.InstancedMesh(rockGeo,rockMat,38),dummy=new THREE.Object3D();
 for(let i=0;i<38;i++){const a=i*2.399+seed,r=island.r*(.87+.05*Math.sin(i*7));dummy.position.set(island.x+Math.cos(a)*r,.3,island.z+Math.sin(a)*r);dummy.scale.set(3+i%5,2+i%4,3+i%6);dummy.rotation.set(i*.2,i*1.3,i*.13);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);}scene.add(rocks);
}
