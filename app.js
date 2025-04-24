// Конфигурация
const POSTER_SIZE = { width: 1, height: 1.5 }; // Размер в метрах
const POSTER_IMAGE = "img/img.png"; // Путь к единственному изображению

// Инициализация
let canvas = document.getElementById("renderCanvas");
let engine = new BABYLON.Engine(canvas, true);
let scene = new BABYLON.Scene(engine);
let posterMesh = null;
let xrExperience = null;

// Загрузка сцены
async function initScene() {
    // Настройка камеры
    let camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2, 5, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    
    // Базовое освещение все же нужно для видимости объектов
    let light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    
    try {
        // Создание AR-опыта с более детальной обработкой событий
        xrExperience = await scene.createDefaultXRExperienceAsync({
            uiOptions: {
                sessionMode: "immersive-ar",
                referenceSpaceType: "local-floor",
            },
            optionalFeatures: ["plane-detection", "hit-test"],
        });
        
        // Обработка событий AR сессии
        xrExperience.baseExperience.onStateChangedObservable.add((state) => {
            if (state === BABYLON.WebXRState.IN_XR) {
                console.log("AR session started successfully");
                document.getElementById("instruction").textContent = "AR активирован. Наведите камеру на стену и коснитесь экрана";
                
                // Включаем постер когда сессия началась
                if (posterMesh) {
                    posterMesh.setEnabled(true);
                }
            } else if (state === BABYLON.WebXRState.NOT_IN_XR) {
                console.log("AR session ended or failed to start");
            }
        });
        
        // Обработка ошибок инициализации XR
        xrExperience.baseExperience.onInitialXRPoseSetObservable.add((camera) => {
            console.log("Initial XR camera pose set");
        });
        
        // Загрузка постера
        loadPoster(POSTER_IMAGE);
        
        // Обработка кликов для размещения
        xrExperience.input.onControllerAddedObservable.add((controller) => {
            console.log("AR controller added");
            controller.onSelectObservable.add(() => {
                console.log("Screen tapped in AR mode");
                if (posterMesh) {
                    let hitTest = xrExperience.pointerSelection.hitTest(0.5, 0.5); // Центр экрана
                    if (hitTest && hitTest.length > 0) {
                        console.log("Hit test successful");
                        posterMesh.position = hitTest[0].position;
                        if (document.getElementById("instruction")) {
                            document.getElementById("instruction").textContent = "Постер размещен!";
                        }
                    } else {
                        console.log("No hit test results");
                    }
                }
            });
        });
        
    } catch (error) {
        console.error("XR initialization error:", error);
        if (document.getElementById("instruction")) {
            document.getElementById("instruction").textContent = "Ошибка AR: " + error.message;
        }
    }
    
    // Скрываем загрузочный экран (если есть)
    if (document.getElementById("loadingScreen")) {
        document.getElementById("loadingScreen").style.display = "none";
    }
}

// Загрузка постера
function loadPoster(url) {
    // Удаляем старый постер
    if (posterMesh) {
        posterMesh.dispose();
    }
    
    // Создаем материал с эмиссией для лучшей видимости в AR
    let material = new BABYLON.StandardMaterial("posterMaterial", scene);
    material.diffuseTexture = new BABYLON.Texture(url, scene);
    material.specularColor = new BABYLON.Color3(0, 0, 0);
    material.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5); // Добавляем эмиссию для видимости
    
    // Создаем меш
    posterMesh = BABYLON.MeshBuilder.CreatePlane("poster", POSTER_SIZE, scene);
    posterMesh.material = material;
    posterMesh.setEnabled(false); // По умолчанию отключен
    
    // Обновляем интерфейс
    if (document.getElementById("instruction")) {
        document.getElementById("instruction").textContent = "Нажмите на кнопку AR для запуска";
    }
}

// Запуск сцены
initScene().catch((error) => {
    console.error("Ошибка инициализации:", error);
    if (document.getElementById("loadingScreen")) {
        document.getElementById("loadingScreen").innerHTML = `
            <p style="color: red">Ошибка: ${error.message}</p>
            <p>Попробуйте обновить страницу или использовать другой браузер</p>
        `;
    }
});

// Обработка изменения размера окна
window.addEventListener("resize", () => {
    engine.resize();
});

// Запуск рендеринга
engine.runRenderLoop(() => {
    scene.render();
});
