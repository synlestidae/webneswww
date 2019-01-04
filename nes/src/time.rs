#[cfg(not(target_arch = "wasm32"))]
use std::time::SystemTime;

#[cfg(target_arch = "wasm32")]
use js_sys::Date;

#[cfg(not(target_arch = "wasm32"))]
pub fn precise_time_s() -> f64 {
    let time = SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap();
    time.as_secs() as f64 + ((time.subsec_millis() as f64) / 1000.0)
}

#[cfg(target_arch = "wasm32")]
pub fn precise_time_s() -> f64 {
    Date::now() / 1000.0
}
