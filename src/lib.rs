extern crate wasm_bindgen;
extern crate nes;

use nes::emulator::Emulator;

pub struct JSEmulator {
    emulator: Emulator
}

const NES_PIXELS: u32 = 256 * 240;

impl JSEmulator {
    pub fn render(&self) -> [[(u8, u8, u8); 256]; 240] {
        unimplemented!()
    }
    pub fn input_keycode(&mut self, key: i32) {
        unimplemented!()
    }
}
