from transformers import PretrainedConfig


class PhiConfig(PretrainedConfig):
    model_type = "phi"
    keys_to_ignore_at_inference = ["past_key_values"]

    def __init__(
        self,
        vocab_size=51200,
        hidden_size=2048,
        intermediate_size=8192,
        num_hidden_layers=24,
        num_attention_heads=32,
        num_key_value_heads=None,
        resid_pdrop=0.0,
        embd_pdrop=0.0,
        attention_dropout=0.0,
        hidden_act="gelu_new",
        max_position_embeddings=2048,
        initializer_range=0.02,
        layer_norm_eps=1e-5,
        use_cache=True,
        tie_word_embeddings=False,
        rope_theta=10000.0,
        rope_scaling=None,
        partial_rotary_factor=0.5,
        qk_layernorm=False,
        bos_token_id=1,
        eos_token_id=2,
        pad_token_id=2,  # Always set pad_token_id to prevent AttributeError on newer transformers
        **kwargs,
    ):
        self.vocab_size = vocab_size
        self.hidden_size = hidden_size
        self.intermediate_size = intermediate_size
        self.num_hidden_layers = num_hidden_layers
        self.num_attention_heads = num_attention_heads

        if num_key_value_heads is None:
            num_key_value_heads = num_attention_heads

        self.num_key_value_heads = num_key_value_heads
        self.resid_pdrop = resid_pdrop
        self.embd_pdrop = embd_pdrop
        self.attention_dropout = attention_dropout
        self.hidden_act = hidden_act
        self.max_position_embeddings = max_position_embeddings
        self.initializer_range = initializer_range
        self.layer_norm_eps = layer_norm_eps
        self.use_cache = use_cache
        self.rope_theta = rope_theta
        # Normalize rope_scaling: newer transformers injects {"rope_type": "default"}
        # instead of None — treat that as "no scaling" (standard RoPE).
        self.rope_scaling = self._normalize_rope_scaling(rope_scaling)
        self.partial_rotary_factor = partial_rotary_factor
        self.qk_layernorm = qk_layernorm
        self._rope_scaling_validation()

        super().__init__(
            bos_token_id=bos_token_id,
            eos_token_id=eos_token_id,
            pad_token_id=pad_token_id,
            tie_word_embeddings=tie_word_embeddings,
            **kwargs,
        )
        # PretrainedConfig.__init__ (newer transformers) re-derives rope_scaling
        # from rope_theta/partial_rotary_factor as {"rope_type": "default", ...},
        # clobbering the normalization above — re-apply it post-super().__init__().
        self.rope_scaling = self._normalize_rope_scaling(self.rope_scaling)

    @staticmethod
    def _normalize_rope_scaling(rope_scaling):
        """Convert rope_scaling to None if it represents standard RoPE.
        Newer transformers injects {"rope_type": "default"} instead of None.
        """
        if rope_scaling is None:
            return None
        if isinstance(rope_scaling, dict):
            rope_type = rope_scaling.get("rope_type") or rope_scaling.get("type", "default")
            if rope_type in ("default", "", None):
                return None
        return rope_scaling

    # Copied from transformers.models.llama.configuration_llama.LlamaConfig._rope_scaling_validation
    def _rope_scaling_validation(self):
        """Validate rope_scaling — relaxed to accept new transformers formats."""
        if self.rope_scaling is None:
            return
        if not isinstance(self.rope_scaling, dict):
            raise ValueError(f"`rope_scaling` must be a dict, got {type(self.rope_scaling)}")
        rope_type = self.rope_scaling.get("type") or self.rope_scaling.get("rope_type", "default")
        if rope_type in ("default", "", None):
            return
        if rope_type not in ["linear", "dynamic"]:
            raise ValueError(
                f"`rope_scaling`'s type must be one of ['linear', 'dynamic', 'default'], got {rope_type}"
            )
        rope_factor = self.rope_scaling.get("factor", None)
        if rope_factor is None or not isinstance(rope_factor, float) or rope_factor <= 1.0:
            raise ValueError(
                f"`rope_scaling`'s factor must be a float > 1, got {rope_factor}"
            )


class MoondreamConfig(PretrainedConfig):
    model_type = "moondream1"

    def __init__(self, **kwargs):
        self.text_config = PhiConfig(**kwargs.pop("text_config", {}))
        super().__init__(**kwargs)
