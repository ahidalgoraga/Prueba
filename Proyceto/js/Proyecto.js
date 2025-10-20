let renderer, scene, camera, clock, controlsOrbit;
let world;
let player, playerBody, mixer;
let collectibles = [];
let buildings = [];
let buildingBodies = []; 
let goal;
let collected = { red: 0, green: 0, blue: 0 };
let total = { red: 3, green: 3, blue: 3 };
let startTime = null; 
let gameCompleted = false;
let finalTime = 0; 


// Movimiento
let angulo = -0.01;
let p_pos = new THREE.Vector3(0, 1, 0);
let velocity = new THREE.Vector3();
let firstPerson = false;

// Controles
const controls = {
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
  speed: 0.3
};

// Animaciones
const A_IDLE = 0;
const A_RUN = 1;
let actions = {};
let animationNames = [];
let currentAnimationIndex = A_IDLE;

// HUD y botones
let hud, camButton, restartPanel;

// Minimapa
let miniScene, miniCamera;
let minimapMarkers = [];
let playerMarker, goalMarker;
let minimapSizePx = 200;
let minimapMargin = 15;
let minimapWorldSize = 200;
let stats;

let startPanel;

function showStartMessage() {
  startPanel = document.createElement("div");
  Object.assign(startPanel.style, {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "rgba(0,0,0,0.8)",
    color: "white",
    padding: "25px 40px",
    borderRadius: "15px",
    textAlign: "center",
    fontFamily: "sans-serif",
    zIndex: "30",
    boxShadow: "0px 6px 15px rgba(0,0,0,0.4)"
  });
  startPanel.innerHTML = `
    <h2>🎮 Instrucciones</h2>
    <p>Usa las <b>flechas del teclado</b> o las teclas <b>WASD</b><br>
    para mover al personaje, recoger los objetos<br>
    y llevarlos a la <b>meta 🏁</b>.</p>
    <button id="startBtn">🚀 Empezar</button>
  `;
  document.body.appendChild(startPanel);

  const startBtn = startPanel.querySelector("#startBtn");
  Object.assign(startBtn.style, {
    padding: "10px 25px",
    fontSize: "18px",
    fontWeight: "bold",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(135deg, #2196f3, #1976d2)",
    color: "white"
  });

  startBtn.onclick = () => {
    startPanel.style.display = "none";
    startTime = null; 
  };
}

// -------------------------------------------------------------
init();
showStartMessage();
render();
// -------------------------------------------------------------

function init() {
  clock = new THREE.Clock();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  document.getElementById('container').appendChild(renderer.domElement);

  scene = new THREE.Scene();
  const loader = new THREE.CubeTextureLoader();
  const skybox = loader.load([
    'images/px.png',
    'images/nx.png', 
    'images/py.png', 
    'images/ny.png', 
    'images/pz.png', 
    'images/nz.png'  
  ]);
  scene.background = skybox;

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(40, 30, 40);
  camera.lookAt(0, 0, 0);

  stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);
  Object.assign(stats.dom.style, {
    position: 'absolute',
    right: '10px',
    top: '10px',
    left: '',
    zIndex: '100'
  });

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x666666, 0.4);
  hemiLight.position.set(0, 200, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xfff0e0, 0.9);
  dirLight.position.set(30, 50, 30);
  dirLight.castShadow = true;

  const spotLight = new THREE.SpotLight(0xffffff, 1.5);
  spotLight.position.set(30, 40, 30);
  spotLight.angle = Math.PI / 6;
  spotLight.penumbra = 0.4;
  spotLight.decay = 2;
  spotLight.distance = 150;

  spotLight.castShadow = true;
  spotLight.shadow.mapSize.width = 2048;
  spotLight.shadow.mapSize.height = 2048;
  spotLight.shadow.bias = -0.0005;
  spotLight.shadow.radius = 3;

  spotLight.target.position.set(0, 0, 0);
  scene.add(spotLight.target);
  scene.add(spotLight);

  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 200;
  dirLight.shadow.camera.left = -100;
  dirLight.shadow.camera.right = 100;
  dirLight.shadow.camera.top = 100;
  dirLight.shadow.camera.bottom = -100;
  dirLight.shadow.bias = -0.0005;
  dirLight.shadow.radius = 4;

  scene.add(dirLight);

  const ambient = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambient);

  hud = document.createElement("div");
  hud.style.position = "absolute";
  hud.style.top = "10px";
  hud.style.right = "10px";
  hud.style.padding = "10px";
  hud.style.background = "rgba(0,0,0,0.5)";
  hud.style.color = "white";
  hud.style.fontFamily = "sans-serif";
  hud.style.fontSize = "14px";
  hud.style.borderRadius = "8px";
  hud.style.zIndex = "10";
  document.body.appendChild(hud);

  camButton = document.createElement("button");
  camButton.innerText = "🎥 Cambiar cámara";
  Object.assign(camButton.style, {
    position: "absolute", top: "20px", left: "20px",
    padding: "12px 20px", fontSize: "16px", fontWeight: "bold",
    background: "linear-gradient(135deg, #00bcd4, #3f51b5)",
    color: "white", border: "none", borderRadius: "10px",
    cursor: "pointer", boxShadow: "0px 4px 10px rgba(0,0,0,0.3)",
    transition: "all 0.3s ease", zIndex: "10"
  });
  camButton.onmouseenter = ()=> camButton.style.transform = "scale(1.05)";
  camButton.onmouseleave = ()=> camButton.style.transform = "scale(1)";
  camButton.onclick = ()=>{ 
    firstPerson = !firstPerson; 
  };
  document.body.appendChild(camButton);

  restartPanel = document.createElement("div");
  Object.assign(restartPanel.style, {
    position: "absolute", top: "50%", left: "50%",
    transform: "translate(-50%, -50%)",
    padding: "25px 40px", textAlign: "center",
    background: "rgba(0,0,0,0.8)", color: "white",
    fontFamily: "sans-serif", borderRadius: "15px",
    boxShadow: "0px 6px 15px rgba(0,0,0,0.4)",
    display: "none", zIndex: "20"
  });
  restartPanel.innerHTML = `
    <h2>🏆 ¡Juego completado!</h2>
    <p id="timeText">⏱️ Tiempo total: 0s</p>
    <button id="restartBtn">🔄 Reiniciar</button>
  `;
  document.body.appendChild(restartPanel);
  const restartBtn = restartPanel.querySelector("#restartBtn");
  Object.assign(restartBtn.style, {
    padding: "10px 25px", fontSize: "18px", fontWeight: "bold",
    borderRadius: "10px", border: "none", cursor: "pointer",
    background: "linear-gradient(135deg, #4caf50, #2e7d32)", color: "white"
  });
  restartBtn.onclick = resetGame;

  // Mundo físico
  world = new CANNON.World();
  world.gravity.set(0, -9.82, 0);
  world.broadphase = new CANNON.NaiveBroadphase();

  // Suelo con textura
  const textureLoader = new THREE.TextureLoader();
  const grassTexture = textureLoader.load('images/cesped-verde.jpg');
  grassTexture.wrapS = THREE.RepeatWrapping;
  grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(20, 20);

  const groundMat = new THREE.MeshStandardMaterial({ map: grassTexture });
  const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  const shadowPlane = new THREE.ShadowMaterial({ opacity: 0.4 });
  const shadowReceiver = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), shadowPlane);
  shadowReceiver.rotation.x = -Math.PI / 2;
  shadowReceiver.receiveShadow = true;


  // Físicas del suelo
  const groundBody = new CANNON.Body({ mass: 0 });
  groundBody.addShape(new CANNON.Plane());
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(groundBody);

  // Crear elementos del mundo
  createBuildings();
  createCollectibles();
  createGoal();

  const spawnGeo = new THREE.SphereGeometry(3, 64, 64);

  const envMap = scene.background;

  const spawnMat = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    envMap: envMap,
    reflectivity: 0.8,
    shininess: 120,
    specular: 0xffffff
  });

  const spawnSphere = new THREE.Mesh(spawnGeo, spawnMat);
  spawnSphere.position.set(0, 3, 0);
  spawnSphere.castShadow = true;
  spawnSphere.receiveShadow = true;
  scene.add(spawnSphere);

  const spawnShape = new CANNON.Sphere(3);
  const spawnBody = new CANNON.Body({ mass: 0 });
  spawnBody.addShape(spawnShape);
  spawnBody.position.set(0, 3, 0);
  world.addBody(spawnBody);

  // Jugador físico
  const playerShape = new CANNON.Sphere(0.6);
  playerBody = new CANNON.Body({ mass: 5 });
  playerBody.addShape(playerShape);
  playerBody.position.set(0, 1, 0);
  playerBody.linearDamping = 0.9;
  world.addBody(playerBody);

  // Jugador visual
  loadPlayerModel();

  // Minimapa
  createMinimap();

  // Eventos
  window.addEventListener('resize', onWindowResize);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
}


// -------------------------------------------------------------
// EVENTOS
// -------------------------------------------------------------
function onKeyDown(e) {
  switch (e.code) {
    case 'ArrowUp': case 'KeyW': controls.moveForward = true; break;
    case 'ArrowDown': case 'KeyS': controls.moveBackward = true; break;
    case 'ArrowLeft': case 'KeyA': controls.moveLeft = true; break;
    case 'ArrowRight': case 'KeyD': controls.moveRight = true; break;
  }
}
function onKeyUp(e) {
  switch (e.code) {
    case 'ArrowUp': case 'KeyW': controls.moveForward = false; break;
    case 'ArrowDown': case 'KeyS': controls.moveBackward = false; break;
    case 'ArrowLeft': case 'KeyA': controls.moveLeft = false; break;
    case 'ArrowRight': case 'KeyD': controls.moveRight = false; break;
  }
}

// -------------------------------------------------------------
function loadPlayerModel() {
  const loader = new THREE.FBXLoader();
  loader.load('models/Ch38_nonPBR.fbx', function (object) {
    player = object;
    scene.add(object);
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3(); box.getSize(size);
    const s = 2.0 / size.y;
    object.scale.set(s,s,s);
    mixer = new THREE.AnimationMixer(object);
    object.traverse(c=>{ if(c.isMesh) c.castShadow = true; });

    const animations = ['models/Standing Idle.fbx', 'models/Fast Run.fbx'];
    animations.forEach((animFile, index)=>{
      loader.load(animFile, animData=>{
        const name = animFile.split('/').pop().split('.')[0];
        const action = mixer.clipAction(animData.animations[0]);
        actions[name] = action;
        animationNames[index] = name;
        if(index===0) action.play();
      });
    });
  });
}

// -------------------------------------------------------------
function createBuildings() {
  const textureLoader = new THREE.TextureLoader();
  const buildingTexture = textureLoader.load('images/edificios.jpg');
  buildingTexture.wrapS = THREE.RepeatWrapping;
  buildingTexture.wrapT = THREE.RepeatWrapping;
  buildingTexture.repeat.set(1, 1);

  const mat = new THREE.MeshStandardMaterial({
    map: buildingTexture
  });

  buildings = [];
  buildingBodies = []; 

  for (let i = 0; i < 25; i++) {
    const w = 5 + Math.random() * 8;
    const h = 5 + Math.random() * 20;
    const d = 5 + Math.random() * 8;
    let x, z;
    let valid = false;
    while (!valid) {
      x = (Math.random() - 0.5) * 180;
      z = (Math.random() - 0.5) * 180;
      const distToCenter = Math.sqrt(x * x + z * z);
      valid = distToCenter > 12; 
    }

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true;
    scene.add(mesh);
    buildings.push(mesh);

    // Física
    const shape = new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2));
    const body = new CANNON.Body({ mass: 0 });
    body.addShape(shape);
    body.position.set(x, h / 2, z);
    world.addBody(body);
    buildingBodies.push(body); 
  }
}

// -------------------------------------------------------------
function createCollectibles() {
  collectibles = [];
  const types = [
    { name:'red', color:0xff0000, count: total.red },
    { name:'green', color:0x00ff00, count: total.green },
    { name:'blue', color:0x0000ff, count: total.blue }
  ];
  types.forEach(t=>{
    for(let i=0;i<t.count;i++){
      let pos, safe = false;
      while(!safe){
        pos = new THREE.Vector3((Math.random()-0.5)*180,0.5,(Math.random()-0.5)*180);
        safe = buildings.every(b=>{
          const box = new THREE.Box3().setFromObject(b);
          return !box.expandByScalar(2).containsPoint(pos); 
        });
      }
      const geo = new THREE.SphereGeometry(0.5,16,16);
      let mat;
      if (t.name === 'red') {
      
        mat = new THREE.MeshPhongMaterial({
          color: t.color,
          shininess: 100,
          specular: 0xffffff,
          emissive: t.color,
          emissiveIntensity: 0.3
        });
      } else if (t.name === 'green') {
      
        mat = new THREE.MeshLambertMaterial({
          color: t.color,
          emissive: t.color,
          emissiveIntensity: 0.2
        });
      } else {
      
        mat = new THREE.MeshStandardMaterial({
          color: t.color,
          emissive: t.color,
          emissiveIntensity: 0.4
        });
      }

      const obj = new THREE.Mesh(geo,mat);
      obj.position.copy(pos);
      obj.userData.type = t.name;
      obj.castShadow = true;
      scene.add(obj);
      collectibles.push(obj);
    }
  });
}
// -------------------------------------------------
function createGoal() {
  const size = 6;
  const divisions = 6; 
  const tileSize = size / divisions;

  const group = new THREE.Group();

  for (let x = 0; x < divisions; x++) {
    for (let z = 0; z < divisions; z++) {
      const color = (x + z) % 2 === 0 ? 0xffffff : 0x000000;
      const geo = new THREE.PlaneGeometry(tileSize, tileSize);
      const mat = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide });
      const tile = new THREE.Mesh(geo, mat);
      tile.rotation.x = -Math.PI / 2;
      tile.position.set(
        (x - divisions / 2 + 0.5) * tileSize,
        0.01, 
        (z - divisions / 2 + 0.5) * tileSize
      );
      tile.receiveShadow = true;
      group.add(tile);
    }
  }

  group.position.set(0, 0, -80); 
  scene.add(group);
  goal = group;
}


// -------------------------------------------------------------
function createMinimap() {
  miniScene = new THREE.Scene();
  miniScene.background = new THREE.Color(0x228b22);
  const half = minimapWorldSize / 2;
  miniCamera = new THREE.OrthographicCamera(-half, half, half, -half, 0.1, 500);
  miniCamera.position.set(0, 200, 0);
  miniCamera.lookAt(0, 0, 0);

  const pGeo = new THREE.ConeGeometry(2, 5, 3);
  const pMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  playerMarker = new THREE.Mesh(pGeo, pMat);
  playerMarker.rotation.x = Math.PI / 2;
  miniScene.add(playerMarker);

  const goalGroup = new THREE.Group();
  const goalSize = 6;
  const goalDiv = 6;
  const tileSize = goalSize / goalDiv;
  for (let x = 0; x < goalDiv; x++) {
    for (let z = 0; z < goalDiv; z++) {
      const color = (x + z) % 2 === 0 ? 0xffffff : 0x000000;
      const geo = new THREE.PlaneGeometry(tileSize, tileSize);
      const mat = new THREE.MeshBasicMaterial({ color });
      const tile = new THREE.Mesh(geo, mat);
      tile.rotation.x = -Math.PI / 2;
      tile.position.set(
        (x - goalDiv / 2 + 0.5) * tileSize,
        0.1,
        (z - goalDiv / 2 + 0.5) * tileSize
      );
      goalGroup.add(tile);
    }
  }

  goalGroup.position.set(0, 0, -80);
  goalMarker = goalGroup;
  miniScene.add(goalGroup);


  buildings.forEach(b=>{
    const size = new THREE.Vector3();
    new THREE.Box3().setFromObject(b).getSize(size);
    const bGeo = new THREE.BoxGeometry(size.x, 2, size.z);
    const bMat = new THREE.MeshBasicMaterial({ color: 0x666666 });
    const bMarker = new THREE.Mesh(bGeo, bMat);
    bMarker.position.set(b.position.x, 0, b.position.z);
    miniScene.add(bMarker);
  });

  collectibles.forEach(obj=>{
    const cGeo = new THREE.SphereGeometry(1.2, 8, 8);
    const cMat = new THREE.MeshBasicMaterial({ color: obj.material.color });
    const marker = new THREE.Mesh(cGeo, cMat);
    miniScene.add(marker);
    minimapMarkers.push(marker);
  });
}

// -------------------------------------------------------------
function updateMinimap() {
  if (!player) return;
  playerMarker.position.set(p_pos.x, 0, p_pos.z);
  playerMarker.rotation.z = -angulo;
  goalMarker.position.set(goal.position.x, 0, goal.position.z);
  collectibles.forEach((obj, i)=>{
    if (minimapMarkers[i]){
      minimapMarkers[i].visible = obj.visible;
      minimapMarkers[i].position.set(obj.position.x, 0, obj.position.z);
    }
  });
  const insetWidth = minimapSizePx, insetHeight = minimapSizePx;
  renderer.clearDepth();
  renderer.setScissorTest(true);
  renderer.setScissor(minimapMargin, minimapMargin, insetWidth, insetHeight);
  renderer.setViewport(minimapMargin, minimapMargin, insetWidth, insetHeight);
  renderer.render(miniScene, miniCamera);
  renderer.setScissorTest(false);
}

// -------------------------------------------------------------
function updateHUD() {
  let elapsed = 0;

  if (gameCompleted) {
    elapsed = finalTime; 
  } else if (startTime) {
    elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
  }

  hud.innerHTML = `
    <b>🕒 ${elapsed}s</b><br>
    🔴 ${collected.red}/${total.red}<br>
    🟢 ${collected.green}/${total.green}<br>
    🔵 ${collected.blue}/${total.blue}<br>
    🎯 Lleva todos los objetos a la meta
  `;
}


// -------------------------------------------------------------
function updatePlayer(delta) {
  
  if (!startTime && (controls.moveForward || controls.moveBackward || controls.moveLeft || controls.moveRight)) {
    startTime = performance.now();
  }
  if (!player) return;
  velocity.set(Math.sin(angulo), 0, Math.cos(angulo));
  if (controls.moveLeft) angulo += 0.05;
  if (controls.moveRight) angulo -= 0.05;
  const moveVec = new CANNON.Vec3();
  if (controls.moveForward) { moveVec.x += Math.sin(angulo) * controls.speed; moveVec.z += Math.cos(angulo) * controls.speed; }
  if (controls.moveBackward) { moveVec.x -= Math.sin(angulo) * controls.speed; moveVec.z -= Math.cos(angulo) * controls.speed; }
  playerBody.position.x += moveVec.x;
  playerBody.position.z += moveVec.z;

  // Límites del mapa
  playerBody.position.x = THREE.MathUtils.clamp(playerBody.position.x, -90, 90);
  playerBody.position.z = THREE.MathUtils.clamp(playerBody.position.z, -90, 90);

  p_pos.copy(playerBody.position);
  player.position.copy(p_pos);
  player.rotation.y = angulo;
  (controls.moveForward || controls.moveBackward) ? changeAnimation(A_RUN) : changeAnimation(A_IDLE);

  updateCamera();
  checkCollectibles();
  checkGoal();
}

// -------------------------------------------------------------
function updateCamera() {
  const offset = new THREE.Vector3();
  const head = p_pos.clone().add(new THREE.Vector3(0, 1.8, 0));

  if (firstPerson) {
    const head = p_pos.clone().add(new THREE.Vector3(0, 2.1, 0));
    const lookAtPoint = new THREE.Vector3().addVectors(head, velocity.clone().multiplyScalar(25));
    camera.position.copy(head);
    camera.lookAt(lookAtPoint);
  } else {
    const desiredOffset = new THREE.Vector3(
      -Math.sin(angulo) * 10, 
      6,                        
      -Math.cos(angulo) * 10
    );
    const targetPosition = head.clone().add(desiredOffset);
    camera.position.lerp(targetPosition, 0.1);
    const lookAtPoint = head.clone().add(new THREE.Vector3(0, 1, 0));
    camera.lookAt(lookAtPoint);
  }
}


// -------------------------------------------------------------
function checkCollectibles() {
  collectibles.forEach(obj=>{
    if(!obj.visible) return;
    if(obj.position.distanceTo(p_pos)<1.2){
      collected[obj.userData.type]++;
      obj.visible=false;
    }
  });
}

// -------------------------------------------------------------
function checkGoal() {
  if (gameCompleted) return;

  const dist = goal.position.distanceTo(p_pos);
  const allCollected = Object.keys(collected).every(c => collected[c] >= total[c]);

  if (dist < 3 && allCollected) {
    gameCompleted = true;
    finalTime = ((performance.now() - startTime) / 1000).toFixed(1);
    restartPanel.querySelector("#timeText").innerText = `⏱️ Tiempo total: ${finalTime}s`;
    restartPanel.style.display = "block";
    startTime = null;
  }
}

// -------------------------------------------------------------
function resetGame() {
  restartPanel.style.display="none";
  gameCompleted=false;
  collected={red:0,green:0,blue:0};
  startTime=performance.now();

  buildings.forEach(b=>{
    scene.remove(b);
    if (b.geometry) b.geometry.dispose();
    if (Array.isArray(b.material)) {
      b.material.forEach(m=> m.dispose && m.dispose());
    } else {
      b.material && b.material.dispose && b.material.dispose();
    }
  });
  buildings = [];

  if (buildingBodies && buildingBodies.length) {
    buildingBodies.forEach(bb=>{
      try { world.removeBody(bb); } catch(e){ /* ignore si ya fue eliminado */ }
    });
    buildingBodies = [];
  }

  // Eliminar collectibles (meshes)
  collectibles.forEach(c=>{
    scene.remove(c);
    if (c.geometry) c.geometry.dispose();
    if (c.material && c.material.dispose) c.material.dispose();
  });
  collectibles = [];
  minimapMarkers = [];

  while (miniScene.children.length) {
    const child = miniScene.children[0];
    miniScene.remove(child);
    if (child.geometry) child.geometry.dispose();
    if (child.material && child.material.dispose) child.material.dispose();
  }

  // Crear nuevo mapa
  createBuildings();
  createCollectibles();
  createGoal();
  createMinimap();

  // Reset jugador
  playerBody.position.set(0,1,0);
  playerBody.velocity.set(0,0,0);
  playerBody.angularVelocity.set(0,0,0);
  p_pos.set(0,1,0);
  angulo=-0.01;
}


// -------------------------------------------------------------
function changeAnimation(index){
  if(!animationNames[index] || currentAnimationIndex===index) return;
  const prev=animationNames[currentAnimationIndex];
  const next=animationNames[index];
  const fade=0.3;
  if(actions[prev]) actions[prev].fadeOut(fade);
  if(actions[next]) actions[next].reset().fadeIn(fade).play();
  currentAnimationIndex=index;
}

// -------------------------------------------------------------
function update(delta) {
  world.step(1/60);
  if(mixer) mixer.update(delta);
  updatePlayer(delta);
  collectibles.forEach(obj=>{
    obj.rotation.y+=delta;
    obj.position.y=0.5+Math.sin(performance.now()*0.002+obj.position.x)*0.2;
  });
  updateHUD();
}

// -------------------------------------------------------------
function render() {
  requestAnimationFrame(render);
  stats.begin(); 

  const delta = clock.getDelta();
  update(delta);

  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
  renderer.setScissorTest(false);
  renderer.render(scene, camera);
  updateMinimap();

  stats.end(); 
}

// -------------------------------------------------------------
function onWindowResize(){
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
}
