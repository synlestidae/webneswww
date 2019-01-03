import * as wasm from "webnes";

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

    console.log(window.emulator);
}

function init() {
    console.log('initing');
    document.getElementById("rom-file").addEventListener("input", onFileUpload)
}

//window.onload = init;

console.log('Running JS module');

init();
