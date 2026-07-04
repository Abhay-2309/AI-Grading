use wasm_bindgen::prelude::*;

use crate::libs::jse::ojse;
use crate::libs::jse::rjse;

use memory_wasm::Memory;

#[wasm_bindgen]
pub struct Secp256k1SignatureAndRecovery {
    pub(crate) inner: k256::ecdsa::Signature,
    pub(crate) recid: k256::ecdsa::RecoveryId,
}

#[wasm_bindgen]
impl Secp256k1SignatureAndRecovery {
    #[wasm_bindgen]
    pub fn from_rsv_bytes(input: &Memory) -> Result<Secp256k1SignatureAndRecovery, JsValue> {
        let inner = rjse!(k256::ecdsa::Signature::from_slice(&input.inner[..64]))?;
        let recid = ojse!(k256::ecdsa::RecoveryId::from_byte(input.inner[64]))?;

        Ok(Self { inner, recid })
    }

    #[wasm_bindgen]
    pub fn to_rsv_bytes(&self) -> Memory {
        let mut bytes = self.inner.to_bytes().to_vec();

        bytes.push(self.recid.to_byte());

        Memory::new(bytes)
    }
}
