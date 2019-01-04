import * as wasm from "../pkg/webnes";

const CPU_CLOCK_HZ = (1.78 * 1e6)

const CPU_INTERVAL = 30;

const REFRESH_INTERVAL = 1;

const CYCLES_PER_INTERVAL = CPU_CLOCK_HZ / 100;

export class EmulatorContext {
    constructor(canvas) {
        this.cycles = 0;
        this.cpuInterval = CPU_INTERVAL;
        this.emulator = null;
        this.canvas = canvas;
    }

    loadROM(fileReader) {
        let array = new Uint8Array(fileReader.result);

        this.emulator = new wasm.JSEmulator(array);

        console.log('this', this);
    }

    startIntervals() {
        this.cpuIntervalId = setInterval(() => this.cycleCPUTargetHZ(this.cpuInterval), this.cpuInterval);
        setInterval(() => document.getElementById('cpu-hz').innerText = `${this.actualHZ} Hz`, 3000);
        //this.renderIntervalId = setInterval(() => this.render(), REFRESH_INTERVAL);
    }

    cycleCPUTargetHZ(ms) {
        let n = 1000 / ms;

        if (this.cpuStartedAt == null)
            this.cpuStartedAt = performance.now();

        this.cycleCPU(CPU_CLOCK_HZ / n)
    }

    cycleCPU(cycles) {
        let shouldRender = false;
        for (let i = 0; i < cycles; i++) {
            this.emulator.step();
            this.cycles++;
            shouldRender = this.emulator.check_new_frame();
        }

        this.render();
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

        document.getElementById('fps').innerText = `${this.emulator.get_fps()} FPS`;
    }

    dispose() {
       clearInterval(this.cpuIntervalId);
       clearInterval(this.renderIntervalId);
    }

    get actualHZ() {
        let hz = 1000 * (this.cycles / (performance.now() - this.cpuStartedAt));
        this.cpuStartedAt = null;
        this.cycles = 0;
        return hz;
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
    console.log('Key!', e.keyCode, e);
    emulator && emulator.keyDown(e.keyCode, true);
    emulator && emulator.cycleCPU(1000);
}

function onKeyUp(e) {
    console.log('Bee!', e.keyCode, e);
    if (emulator) {
        emulator.keyUp(e.keyCode, false);
        emulator.cycleCPU(1000);

    }
}

window.onkeydown = onKeyDown;
window.onkeyup = onKeyUp;

init();
