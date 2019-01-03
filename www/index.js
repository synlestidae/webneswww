import * as wasm from "webnes";

const CPU_CLOCK_HZ = (1.79 * 1e6)

const CPU_INTERVAL = 20;

const REFRESH_INTERVAL = 10;

const CYCLES_PER_INTERVAL = CPU_CLOCK_HZ / 100;

class EmulatorContext {
    constructor(canvas) {
        this.cpuInterval = CPU_INTERVAL;
        this.cyclesPerInterval = CYCLES_PER_INTERVAL;
        this.emulator = null;
        this.canvas = canvas;
    }

    loadROM(fileReader) {
        let array = new Uint8Array(fileReader.result);

        this.emulator = new wasm.JSEmulator(array);
    }

    startIntervals() {
        this.cpuIntervalId = setInterval(() => this.cycleCPU(CPU_INTERVAL), CPU_INTERVAL);
        this.renderIntervalId = setInterval(() => this.render(), REFRESH_INTERVAL);
    }

    cycleCPU(ms) {
        let start = performance.now();

        while (performance.now() - start < ms) {
            for (let i = 0; i < this.cyclesPerInterval; i++) {
                this.emulator.step();
            }
        }
    }

    keyDown(keyCode) {
        this.emulator.input_keycode(keyCode, true);
    }

    keyUp(keyCode) {
        this.emulator.input_keycode(keyCode, false);
    }

    render() {
        const NUM_PIXELS = 184320;

        var bytes = this.emulator.render();
        let canvas = this.canvas;

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

    dispose() {
       clearInterval(this.cpuIntervalId);
       clearInterval(this.renderIntervalId);
    }
}

const emulator = new EmulatorContext(document.getElementById('screen'));

function onFileUpload(event) {
    let fileReader = new FileReader();
    let file = event.target.files[0];

    fileReader.readAsArrayBuffer(event.target.files[0]);

    fileReader.onloadend = function() {
        emulator.loadROM(fileReader);
        emulator.startIntervals();
    };
}

function init() {
    document.getElementById("rom-file").addEventListener("input", onFileUpload)
}

function onKeyDown(e) {
    emulator && emulator.keyDown(e.keyCode, true);
}

function onKeyUp(e) {
    emulator && emulator.keyUp(e.keyCode, false);
}

window.onkeydown = onKeyDown;
window.onkeyup = onKeyUp;

init();
