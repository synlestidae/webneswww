import * as wasm from "webnes";

const CPU_CLOCK_HZ = (1.79 * 1e6)

const CPU_INTERVAL = 30;

const REFRESH_INTERVAL = 10;

const CYCLES_PER_INTERVAL = CPU_CLOCK_HZ / 100;

class EmulatorContext {
    constructor(canvas) {
        this.cycles = 0;
        this.cpuInterval = CPU_INTERVAL;
        this.cyclesPerInterval = CYCLES_PER_INTERVAL;
        this.emulator = null;
        this.canvas = canvas;
        this.actualHZ = 0;
    }

    loadROM(fileReader) {
        let array = new Uint8Array(fileReader.result);

        this.emulator = new wasm.JSEmulator(array);
    }

    startIntervals(cpuInterval) {
        clearInterval(this.cpuIntervalId);
        clearInterval(this.renderIntervalId);
        clearInterval(this.cpuHzId);

        this.cpuIntervalId = setInterval(() => this.cycleCPUTargetHZ(cpuInterval), cpuInterval);
        this.renderIntervalId = setInterval(() => this.render(), REFRESH_INTERVAL);

        this.cpuHzId = setInterval(() => document.getElementById('cpu-hz').innerText = `${this.actualHZ} Hz`, REFRESH_INTERVAL * 5);
    }

    cycleCPUTargetHZ(ms) {
        let ms = this.cpuInterval;

        this.cycleCPU(ms);

        let target = CPU_CLOCK_HZ / (1000 / ms);
        let actual = 1000 * (this.cycles / ms);

        if (Math.abs(target / actual) < 0.9 || Math.abs(target / actual) > 1.1) {
            let cycles = () * CPU_CLOCK_HZ;
            startIntervals()
        }

        /*let now = performance.now();

        let diff = now - this.lastCheck;
        let actualHZ = 1000 * (this.cycles / diff);
        let target = CPU_CLOCK_HZ * (ms / 1000);

        this.actualHZ = actualHZ;

        if (Math.abs(actualHZ - CPU_CLOCK_HZ) > (CPU_CLOCK_HZ / 10)) {
            // set the interval based on the target
            //
        }
        */
    }

    cycleCPU(ms) {
        const CYCLES_BEFORE_CHECK = 500;

        let start = performance.now();

        let i = 0;

        while (performance.now() - start < ms) {
            for (; i < CYCLES_BEFORE_CHECK; i++) {
                this.emulator.step();
                this.cycles++;
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
