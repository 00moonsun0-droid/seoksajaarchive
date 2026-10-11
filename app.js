import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";

const releaseAssetUrl = async (filename) => {
  const response = await fetch("https://api.github.com/repos/00moonsun0-droid/seoksajaarchive/releases/tags/models-v1", {
    headers: { Accept: "application/vnd.github+json" }
  });
  if (!response.ok) throw new Error(`Release metadata unavailable (${response.status})`);
  const release = await response.json();
  const asset = release.assets.find((item) => item.name === filename);
  if (!asset) throw new Error(`Release asset not found: ${filename}`);
  return asset.url;
};

function createViewer({ element, loading, obj, mtl, texture, targetSize = 2.72 }) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
  camera.position.set(2.5, 1.1, 5.3);
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  element.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = .06; controls.enablePan = false;
  controls.minDistance = 2.2; controls.maxDistance = 6.5; controls.minPolarAngle = .25; controls.maxPolarAngle = 2.25; controls.target.set(0,-.05,0);
  scene.add(new THREE.HemisphereLight(0xf5fff8,0x456b61,2.8));
  const key = new THREE.DirectionalLight(0xfff4df,3.3); key.position.set(-3,4,4); scene.add(key);
  const rim = new THREE.DirectionalLight(0x7daaa0,2.2); rim.position.set(4,1,-3); scene.add(rim);
  const root = new THREE.Group(); scene.add(root);
  const frame = () => { const r=element.getBoundingClientRect(); camera.aspect=r.width/r.height; camera.updateProjectionMatrix(); renderer.setSize(r.width,r.height,false); };
  addEventListener("resize",frame); frame();
  (async () => {
    let materials;
    if(mtl){ materials=await new MTLLoader().loadAsync(mtl); materials.preload(); }
    const loader=new OBJLoader(); loader.setRequestHeader({Accept:"application/octet-stream"}); if(materials) loader.setMaterials(materials);
    const model=await loader.loadAsync(await obj);
    if(texture){ const map=await new THREE.TextureLoader().loadAsync(texture); map.colorSpace=THREE.SRGBColorSpace; model.traverse(n=>{if(n.isMesh)n.material=new THREE.MeshStandardMaterial({map,roughness:.57,metalness:0});}); }
    model.rotation.x = -Math.PI / 2;
    const box=new THREE.Box3().setFromObject(model), size=box.getSize(new THREE.Vector3()), center=box.getCenter(new THREE.Vector3()), scale=targetSize/Math.max(size.x,size.y,size.z);
    model.scale.setScalar(scale); model.position.sub(center.multiplyScalar(scale)); model.traverse(n=>{if(n.isMesh){n.castShadow=true;n.material.side=THREE.DoubleSide;}}); root.add(model); loading.style.opacity=0;
  })().catch(error=>{console.error(error);loading.textContent="MODEL COULD NOT LOAD";});
  function focus(position, target = [0, 0, 0]) { controls.target.set(...target); camera.position.set(...position); controls.update(); }
  function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)} animate();
  return { focus };
}
const viewers = {
  male: createViewer({element:document.querySelector("#male-scene"),loading:document.querySelector("#male-loading"),obj:releaseAssetUrl("numbered-lion.obj"),targetSize:1.85}),
  female: createViewer({element:document.querySelector("#female-scene"),loading:document.querySelector("#female-loading"),obj:releaseAssetUrl("female-lion.obj"),targetSize:1.55})
};
const pairViews = [
  {title:"두 개체의 등을 비교하세요", text:"두 모델의 등과 후면 윤곽을 함께 살펴보는 시점입니다. 형태 비교에 관한 사실 해설은 공식 조사 기록으로 검증해야 합니다.", male:[0,1.15,-5.2], female:[0,1.15,-5.2]},
  {title:"두 개체의 머리를 비교하세요", text:"두 모델의 머리 부위를 함께 살펴보는 시점입니다. 조각 기법이나 양식에 관한 설명은 소장처의 확정 정보를 넣어야 합니다.", male:[2.1,1.9,3.2], female:[-2.1,1.9,3.2]},
  {title:"두 개체의 몸통을 비교하세요", text:"두 모델의 몸통과 표면 윤곽을 함께 살펴보는 시점입니다. 마모·보존 상태는 보존 기록을 출처로 명시해 주세요.", male:[-3.1,.9,3.8], female:[3.1,.9,3.8]},
  {title:"두 개체의 앞면을 비교하세요", text:"두 모델의 전면 윤곽을 함께 살펴보는 시점입니다. 세부 명칭과 양식 설명은 공식 조사 기록으로 확인해 주세요.", male:[0,1.2,5.2], female:[0,1.2,5.2]},
  {title:"두 개체의 측면을 비교하세요", text:"두 모델의 옆면 실루엣을 함께 살펴보는 시점입니다. 형태와 제작 기법에 관한 해설은 검증된 출처를 함께 제시해 주세요.", male:[5.1,1.1,.2], female:[-5.1,1.1,.2]}
];
const detail = document.querySelector(".detail-card");
document.querySelectorAll(".hotspot").forEach(button => button.addEventListener("click", () => {
  const pointIndex = Number(button.dataset.point) - 1, note = pairViews[pointIndex];
  document.querySelectorAll(".hotspot").forEach(item => item.classList.toggle("is-active", item === button));
  viewers.male.focus(note.male);
  viewers.female.focus(note.female);
  detail.querySelector(".detail-kicker").textContent = `${button.dataset.point} · 두 개체 공통 시점`;
  detail.querySelector("h3").textContent = note.title;
  detail.querySelector(".detail-copy").textContent = note.text;
}));
document.querySelectorAll(".panel-toggle").forEach(button => button.addEventListener("click", () => {
  const panel = button.closest(".info-panel");
  const isOpen = panel.classList.contains("is-open");
  document.querySelectorAll(".info-panel").forEach(item => {
    item.classList.remove("is-open");
    item.querySelector(".panel-toggle").setAttribute("aria-expanded", "false");
  });
  if (!isOpen) {
    panel.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
  }
}));
