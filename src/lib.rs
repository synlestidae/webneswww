extern crate wasm_bindgen;
extern crate nes;

use wasm_bindgen::prelude::*;
use nes::emulator::Emulator;
use nes::input_source::*;
use std::io::Cursor;
use nes::mapper::Mapper;
use nes::rom::Rom;
use nes::gfx::Gfx;
use nes::mem::*;
use nes::apu::*;
use nes::input::*;
use nes::ppu::*;
use nes::mapper;
use nes::audio;
use nes::gfx::Scale;
use std::cell::RefCell;
use std::rc::Rc;


extern crate web_sys;

// A macro to provide `println!(..)`-style syntax for `console.log` logging.
macro_rules! log {
    ( $( $t:tt )* ) => {
        web_sys::console::log_1(&format!( $( $t )* ).into());
    }
}

#[wasm_bindgen]
pub struct JSEmulator {
    emulator: Emulator
}

const NES_PIXELS: usize = 256 * 240;

#[wasm_bindgen]
impl JSEmulator {
    #[wasm_bindgen(constructor)]
    pub fn new(rom_bytes: &[u8]) -> JSEmulator {
        let mut cursor = Cursor::new(rom_bytes);
        let rom = match Rom::load(&mut cursor) {
            Ok(rom) => rom,
            Err(err) => panic!("failed to load rom: {:?}", err)
        };

        let scale = Scale::Scale1x;

        let gfx = Gfx::new(scale);

        let mapper: Box<Mapper+Send> = mapper::create_mapper(Box::new(rom));
        let mapper = Rc::new(RefCell::new(mapper));
        let ppu = Ppu::new(Vram::new(mapper.clone()), Oam::new());

        let apu = Apu::new();
        let memmap = MemMap::new(ppu, Input::new(), mapper, apu);

        JSEmulator {  emulator: Emulator::new(memmap, gfx) }
    }

    pub fn step(&mut self) {
        self.emulator.step()
    }

    pub fn render(&self) -> Vec<u8> {
        self.emulator.bgr_pixels().into_iter().map(|&b| b).collect()
    }

    pub fn input_keycode(&mut self, key: i32, is_down: bool) {
        let event_type: EventType = match key {
            38 => EventType::Up,
            40 => EventType::Down,
            37 => EventType::Left,
            39 => EventType::Right,
            90 => EventType::A,
            88 => EventType::B,
            13 => EventType::Start,
            16 => EventType::Select,
            _ => return
        };

        self.emulator.input(&InputEvent { event_type: event_type, active: is_down });
    }

}
