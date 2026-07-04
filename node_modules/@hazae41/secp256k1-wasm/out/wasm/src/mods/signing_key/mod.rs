use wasm_bindgen::prelude::*;

use crate::libs::jse::rjse;

use crate::Secp256k1SignatureAndRecovery;
use crate::Secp256k1VerifyingKey;

use memory_wasm::Memory;

#[wasm_bindgen]
pub struct Secp256k1SigningKey {
    pub(crate) inner: k256::ecdsa::SigningKey,
}

#[wasm_bindgen]
impl Secp256k1SigningKey {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self { inner: k256::ecdsa::SigningKey::random(&mut rand_core::OsRng {}) }
    }

    #[wasm_bindgen]
    pub fn from_bytes(input: &Memory) -> Result<Secp256k1SigningKey, JsError> {
        Ok(Self { inner: rjse!(k256::ecdsa::SigningKey::from_slice(&input.inner))? })
    }

    #[wasm_bindgen]
    pub fn to_bytes(&self) -> Memory {
        Memory::new(self.inner.to_bytes().to_vec())
    }

    #[wasm_bindgen]
    pub fn publish(&self) -> Secp256k1VerifyingKey {
        Secp256k1VerifyingKey { inner: self.inner.verifying_key().clone() }
    }

    #[wasm_bindgen]
    pub fn sign_prehash_recoverable(&self, hashed: &Memory) -> Result<Secp256k1SignatureAndRecovery, JsError> {
        let (inner, recid) = rjse!(self.inner.sign_prehash_recoverable(&hashed.inner))?;

        Ok(Secp256k1SignatureAndRecovery { inner, recid })
    }
}
