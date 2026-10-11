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
  return asset.browser_download_url;
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
  const loader=new OBJLoader(); if(materials) loader.setMaterials(materials);
    const model=await loader.loadAsync(await obj);
    if(texture){ const map=await new THREE.TextureLoader().loadAsync(texture); map.colorSpace=THREE.SRGBColorSpace; model.traverse(n=>{if(n.isMesh)n.material=new THREE.MeshStandardMaterial({map,roughness:.57,metalness:0});}); }
    // ZBrush OBJ의 세로 축(Z)을 Three.js의 세로 축(Y)에 맞춘다. 바닥면이 아래를 향하도록 두 개체에 공통 적용한다.
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
  {label:"갈기", title:"두 개체의 갈기를 비교하세요", text:"스캔 데이터를 통해 정수리 부분의 곱슬거리는 털 표현의 미세한 음각 양각을 입체적으로 관찰할 수 있습니다.", measurements:[{label:"정수리 갈기 수",female:"8개",male:"11개"}], male:[0,1.15,-5.2], female:[0,1.15,-5.2]},
  {label:"수염", title:"두 개체의 수염을 비교하세요", text:"마모되어 두드러지지 않던 입과 수염 자국의 굴곡이 스캔 데이터를 통해 뚜렷하게 드러납니다.", measurements:[{label:"수염 수 (한쪽 당)",female:"8개",male:"4개"},{label:"수염 평균 길이",female:"6.5cm",male:"9.5cm"}], male:[2.1,1.9,3.2], female:[-2.1,1.9,3.2]},
  {label:"무늬", title:"두 개체의 무늬를 비교하세요", text:"목 뒤부터 등 전체로 규칙적으로 새겨진 결 형태의 털 무늬와 질감이 스캔 데이터를 통해 더욱 입체적이고 선명하게 확인됩니다.", measurements:[{label:"몸 길이",female:"120.1cm",male:"104.6cm"},{label:"등 줄기 수",female:"16",male:"18"}], male:[-3.1,.9,3.8], female:[3.1,.9,3.8]},
  {label:"이목구비", title:"두 개체의 이목구비를 비교하세요", text:"육안으로 확인하기 힘들었던 얼굴 윤곽과 이목구비 조형 표현이 스캔 데이터로 선명하게 시각화됩니다.", measurements:[{label:"코 길이",female:"15.4cm",male:"10.2cm"},{label:"귀 크기",female:"11.2cm",male:"15.5cm"},{label:"입 크기",female:"21.9cm",male:"15.9cm"},{label:"이빨 크기",female:"1.2cm",male:"1.8cm"},{label:"이빨 수",female:"9개",male:"7개"}], male:[0,1.2,5.2], female:[0,1.2,5.2]},
  {label:"눈매", title:"두 개체의 눈매를 비교하세요", text:"암수사자의 얼굴 크기 차이가 비교되고, 눈매의 차이가 스캔 데이터를 통해 선명하게 확인됩니다.", measurements:[{label:"얼굴 길이",female:"34.1cm",male:"36.8cm"},{label:"얼굴 넓이",female:"34.5cm",male:"37.6cm"},{label:"오른쪽 눈 길이",female:"9.5cm",male:"80.4cm"},{label:"왼쪽 눈 길이",female:"9.4cm",male:"77.1cm"}], male:[5.1,1.1,.2], female:[-5.1,1.1,.2]}
];
pairViews.forEach((view, index) => { view.title = `${String(index + 1).padStart(2, "0")}. ${view.label}`; });
const detail = document.querySelector(".detail-card");
document.querySelector(".wordmark-title").textContent = "봉황동 석사자";
detail.querySelector("h3").textContent = pairViews[0].title;
detail.querySelector(".detail-copy").textContent = pairViews[0].text;
detail.querySelector(".detail-status").textContent = "출처 · 공주대학교 박물관 소장 (디지털 변환: 사자성어 팀)";
const updatePanel = (panel, objectName, sex, point, note) => {
  const { label, measurements } = note;
  panel.querySelector(".panel-kicker").textContent = `OBJECT ${objectName === "숫사자" ? "01" : "02"} · ${point} ${label}`;
  panel.querySelector("h1, h2").textContent = objectName;
  panel.querySelector(".panel-subtitle").textContent = label;
  panel.querySelector("dl").innerHTML = measurements.map(item => `<div><dt>${item.label}</dt><dd>${item[sex]}</dd></div>`).join("");
  panel.querySelector(".panel-note").textContent = "출처 · 공주대학교 박물관 소장 (디지털 변환: 사자성어 팀)";
};
updatePanel(document.querySelector(".left-panel"), "숫사자", "male", "01", pairViews[0]);
updatePanel(document.querySelector(".right-panel"), "암사자", "female", "01", pairViews[0]);
document.querySelectorAll(".hotspot").forEach(button => button.addEventListener("click", () => {
  const pointIndex = Number(button.dataset.point) - 1, note = pairViews[pointIndex];
  const panels = [...document.querySelectorAll(".info-panel")];
  if (button.classList.contains("is-active") && panels.some(panel => panel.classList.contains("is-open"))) {
    panels.forEach(panel => {
      panel.classList.remove("is-open");
      panel.querySelector(".panel-toggle").setAttribute("aria-expanded", "false");
    });
    return;
  }
  document.querySelectorAll(".hotspot").forEach(item => item.classList.toggle("is-active", item === button));
  viewers.male.focus(note.male);
  viewers.female.focus(note.female);
  detail.querySelector("h3").textContent = note.title;
  detail.querySelector(".detail-copy").textContent = note.text;
  updatePanel(document.querySelector(".left-panel"), "숫사자", "male", button.dataset.point, note);
  updatePanel(document.querySelector(".right-panel"), "암사자", "female", button.dataset.point, note);
  panels.forEach(panel => {
    panel.classList.add("is-open");
    panel.querySelector(".panel-toggle").setAttribute("aria-expanded", "true");
  });
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
