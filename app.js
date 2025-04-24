// Конфигурация
const POSTER_SIZE = { width: 1, height: 1.5 }; // Размер в метрах
const POSTER_IMAGE = "img/img.png"; // Путь к единственному изображению

// Инициализация
let canvas = document.getElementById("renderCanvas");
let engine = new BABYLON.Engine(canvas, true);
let scene = new BABYLON.Scene(engine);
let posterMesh = null;

// Загрузка сцены
async function initScene() {
    // Настройка камеры
    let camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2, 5, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    
    // Настройка света
    new BABYLON.HemisphereLight("light1", new BABYLON.Color3(1, 1, 1), new BABYLON.Color3(0, 0, 0), scene);
    new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(0, -1, 1), scene);
    
    // Создание AR-опыта
    const xr = await scene.createDefaultXRExperienceAsync({
        uiOptions: {
            sessionMode: "immersive-ar",
            referenceSpaceType: "local-floor",
        },
        optionalFeatures: ["plane-detection", "hit-test"],
    });
    
    // Загрузка постера
    loadPoster(POSTER_IMAGE);
    
    // Обработка кликов для размещения
    xr.input.onControllerAddedObservable.add((controller) => {
        controller.onSelectObservable.add(() => {
            if (posterMesh) {
                const hitTest = xr.sessionManager.hitTest(0.5, 0.5); // Центр экрана
                if (hitTest) {
                    posterMesh.parent = hitTest.transformNode;
                    if (document.getElementById("instruction")) {
                        document.getElementById("instruction").textContent = "Постер размещен!";
                    }
                }
            }
        });
    });
    
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
    
    // Создаем материал
    let material = new BABYLON.StandardMaterial("posterMaterial", scene);
    material.diffuseTexture = new BABYLON.Texture(url, scene);
    material.specularColor = new BABYLON.Color3(0, 0, 0);
    
    // Создаем меш
    posterMesh = BABYLON.MeshBuilder.CreatePlane("poster", POSTER_SIZE, scene);
    posterMesh.material = material;
    posterMesh.setEnabled(false);
    
    // Обновляем интерфейс (если есть элемент)
    if (document.getElementById("instruction")) {
        document.getElementById("instruction").textContent = "Наведите камеру на стену и коснитесь экрана";
    }
}

// Запуск сцены
initScene().catch((error) => {
    console.error("Ошибка инициализации AR:", error);
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