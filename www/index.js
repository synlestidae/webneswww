import * as wasm from "webnes";

const CPU_CLOCK_HZ = (1.79 * 1e6)
const CPU_INTERVAL = 11;
const REFRESH_INTERVAL = 10;

class EmulatorContext {

}

function onFileUpload(event) {
    console.log('onFileUploaded', event);
    let fileReader = new FileReader();

    fileReader.readAsArrayBuffer(event.target.files[0]);

    fileReader.onloadend = onFileLoaded.bind(fileReader);
}

function onFileLoaded() {
    console.log('onFileLoaded', this.result)
    let array = new Uint8Array(this.result);

    window.emulator = new wasm.JSEmulator(array);

    startPeripherals();

    console.log(window.emulator);
}

function init() {
    console.log('initing');
    document.getElementById("rom-file").addEventListener("input", onFileUpload)
}

function startPeripherals() {
    let canvas = getCanvas();
    setInterval(() => window.emulator && render(), REFRESH_INTERVAL);
    stepCPURec();
}

function stepCPURec() {
    setInterval(() => stepCPU(CPU_INTERVAL), CPU_INTERVAL);
}


function stepCPU(ms) {
    const CYCLES = 5000;

    let start = performance.now();

    let cyclesPerLoop = CYCLES;

    while (performance.now() - start < ms) {
        for (let i = 0; i < cyclesPerLoop; i++) {
            emulator.step();
        }
    }
}

function onKeyDown(e) {
    if (window.emulator)
        window.emulator.input_keycode(e.keyCode, true);
}

function onKeyUp(e) {
    if (window.emulator)
        window.emulator.input_keycode(e.keyCode, false);
}

function getCanvas() {
    return document.getElementById('screen');
}

function render() {
    const NUM_PIXELS = 184320;

    var bytes = window.emulator.render();
    let canvas = getCanvas();
    canvas.width = 256 * 3;
    canvas.height = 240 * 3;
    let context = canvas.getContext('2d');

    for (let p = 0; p < (240 * 256); p++) {
        let i = p * 3;

        let [b, g, r] = [bytes[i], bytes[i + 1], bytes[i + 2]];
        context.fillStyle = `rgb(${r}, ${g}, ${b})`;

        let x = p % 256;
        let y = Math.floor(p / 256);

        context.fillRect(x * 3, y * 3, 3, 3);
    }
}

window.onkeydown = onKeyDown;
window.onkeyup = onKeyUp;

console.log('Running JS module');

init();
