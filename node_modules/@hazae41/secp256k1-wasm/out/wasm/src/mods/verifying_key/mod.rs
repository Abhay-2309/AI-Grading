use wasm_bindgen::prelude::*;

use crate::libs::jse::rjse;

use crate::Secp256k1Point;
use crate::Secp256k1SignatureAndRecovery;

use memory_wasm::Memory;

#[wasm_bindgen]
pub struct Secp256k1VerifyingKey {
    pub(crate) inner: k256::ecdsa::VerifyingKey,
}

#[wasm_bindgen]
impl Secp256k1VerifyingKey {
    #[wasm_bindgen]
    pub fn from_point(point: &Secp256k1Point) -> Result<Secp256k1VerifyingKey, JsError> {
        Ok(Secp256k1VerifyingKey { inner: rjse!(k256::ecdsa::VerifyingKey::from_affine(point.inner.to_affine()))? })
    }

    #[wasm_bindgen]
    pub fn from_sec1_bytes(input: &Memory) -> Result<Secp256k1VerifyingKey, JsError> {
        Ok(Self { inner: rjse!(k256::ecdsa::VerifyingKey::from_sec1_bytes(&input.inner))? })
    }

    #[wasm_bindgen]
    pub fn recover_from_prehash(hashed: &Memory, signature: &Secp256k1SignatureAndRecovery) -> Result<Secp256k1VerifyingKey, JsError> {
        Ok(Secp256k1VerifyingKey { inner: rjse!(k256::ecdsa::VerifyingKey::recover_from_prehash(&hashed.inner, &signature.inner, signature.recid))? })
    }

    #[wasm_bindgen]
    pub fn to_point(&self) -> Result<Secp256k1Point, JsError> {
        Ok(Secp256k1Point { inner: k256::ProjectivePoint::from(self.inner.as_affine()) })
    }

    #[wasm_bindgen]
    pub fn to_sec1_compressed_bytes(&self) -> Memory {
        Memory::new(self.inner.to_encoded_point(true).to_bytes().to_vec())
    }

    #[wasm_bindgen]
    pub fn to_sec1_uncompressed_bytes(&self) -> Memory {
        Memory::new(self.inner.to_encoded_point(false).to_bytes().to_vec())
    }
}
