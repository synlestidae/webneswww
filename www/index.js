import * as wasm from "../pkg/webnes";

const CPU_CLOCK_HZ = (2.66 * 1e6)

const CPU_INTERVAL = 20;

const REFRESH_INTERVAL = 1;

const CYCLES_PER_INTERVAL = CPU_CLOCK_HZ / 100;

export class EmulatorContext {
    constructor(canvas) {
        this.cycles = 0;
        this.cpuInterval = CPU_INTERVAL;
        this.msPerInterval = CPU_INTERVAL;
        this.emulator = null;
        this.canvas = canvas;
        this.actualHZ = 0;
        this.lastCheck = performance.now();
    }

    loadROM(fileReader) {
        let array = new Uint8Array(fileReader.result);

        this.emulator = new wasm.JSEmulator(array);

        console.log('this', this);
    }

    startIntervals() {
        this.cpuIntervalId = setInterval(() => this.cycleCPUTargetHZ(CPU_INTERVAL), CPU_INTERVAL);
        this.renderIntervalId = setInterval(() => this.render(), REFRESH_INTERVAL);
    }

    cycleCPUTargetHZ(ms) {
        let n = 1000 / ms;
        this.cycleCPU(CPU_CLOCK_HZ / n)
    }

    cycleCPU(cycles) {
        for (let i = 0; i < cycles; i++) {
            this.emulator.step();
        }
        this.cycles++;
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

        document.getElementById('cpu-hz').innerText = `${this.actualHZ} Hz`;
        document.getElementById('fps').innerText = `${this.emulator.get_fps()} FPS`;
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
