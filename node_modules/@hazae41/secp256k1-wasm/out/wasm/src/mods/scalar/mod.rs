use wasm_bindgen::prelude::*;

use memory_wasm::Memory;

#[wasm_bindgen]
pub struct Secp256k1Scalar {
    pub(crate) inner: k256::Scalar,
}

#[wasm_bindgen]
impl Secp256k1Scalar {
    #[wasm_bindgen]
    pub fn from_bytes(input: &Memory) -> Secp256k1Scalar {
        use k256::elliptic_curve::scalar::FromUintUnchecked;

        let uint = k256::U256::from_be_slice(&input.inner);

        Self { inner: k256::Scalar::from_uint_unchecked(uint) }
    }

    #[wasm_bindgen]
    pub fn to_bytes(&self) -> Memory {
        Memory::new(self.inner.to_bytes().to_vec())
    }
}
