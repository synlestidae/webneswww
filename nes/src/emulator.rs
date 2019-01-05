use mem::*;
use cpu::{Cpu};
use gfx::*;
use input_source::*;
use input::*;
use time;

pub struct Emulator {
    pub cpu: Cpu<MemMap>,
    gfx: Gfx,
    last_time: f64,
    frames: usize,
    pub new_frame: bool,
    pub fps: usize
}

impl Emulator {
    pub fn new(mem: MemMap, gfx: Gfx) -> Self {
        let mut cpu = Cpu::new(mem);

        cpu.reset();

        Self {
            cpu: cpu,
            gfx: gfx,
            last_time: 0.0,
            frames: 0,
            fps: 0,
            new_frame: false 
        }
    }

    pub fn step(&mut self) {
        self.cpu.step();

        let ppu_result = self.cpu.mem.ppu.step(self.cpu.cy);
        if ppu_result.vblank_nmi {
            self.cpu.nmi();
        } else if ppu_result.scanline_irq {
            self.cpu.irq();
        }

        self.cpu.mem.apu.step(self.cpu.cy);

        if ppu_result.new_frame {
            self.gfx.tick();
            self.gfx.composite(&mut *self.cpu.mem.ppu.screen);
            self.record_fps();
            self.cpu.mem.apu.play_channels();
            self.new_frame = true;
        }
    }

    fn record_fps(&mut self) {
        let now = time::precise_time_s();
        if now >= self.last_time + 1f64 {
            self.fps = self.frames;
            self.frames = 0;
            self.last_time = now;
        } else {
            self.frames += 1;
        }
    }


    pub fn input(&mut self, ev: &InputEvent) -> InputResult {
        let gamepad = &mut self.cpu.mem.input.gamepad_0;

        match ev.event_type {
            EventType::Right => gamepad.right = ev.active,
            EventType::Down => gamepad.down = ev.active,
            EventType::Left => gamepad.left = ev.active,
            EventType::Up => gamepad.up = ev.active,
            EventType::A => gamepad.a = ev.active,
            EventType::B => gamepad.b = ev.active,
            EventType::Start => gamepad.start = ev.active,
            EventType::Select => gamepad.select = ev.active,
            EventType::Quit => return InputResult::Quit,
            EventType::Save => return InputResult::SaveState,
            EventType::Load => return InputResult::LoadState
        }

        InputResult::Continue
    }

    pub fn get_fps(&self) -> usize {
        self.fps
    }

    pub fn bgr_pixels(&self) -> Box<[u8; 184320]> {
       self.cpu.mem.ppu.screen.clone() 
    }
}

