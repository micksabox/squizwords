export const ABI = [
  {
    "type": "impl",
    "name": "IUltraKeccakZKHonkVerifier",
    "interface_name": "starknetsquiz::honk_verifier::IUltraKeccakZKHonkVerifier"
  },
  {
    "type": "struct",
    "name": "core::array::Span::<core::felt252>",
    "members": [
      {
        "name": "snapshot",
        "type": "@core::array::Array::<core::felt252>"
      }
    ]
  },
  {
    "type": "struct",
    "name": "core::integer::u256",
    "members": [
      {
        "name": "low",
        "type": "core::integer::u128"
      },
      {
        "name": "high",
        "type": "core::integer::u128"
      }
    ]
  },
  {
    "type": "struct",
    "name": "core::array::Span::<core::integer::u256>",
    "members": [
      {
        "name": "snapshot",
        "type": "@core::array::Array::<core::integer::u256>"
      }
    ]
  },
  {
    "type": "enum",
    "name": "core::option::Option::<core::array::Span::<core::integer::u256>>",
    "variants": [
      {
        "name": "Some",
        "type": "core::array::Span::<core::integer::u256>"
      },
      {
        "name": "None",
        "type": "()"
      }
    ]
  },
  {
    "type": "interface",
    "name": "starknetsquiz::honk_verifier::IUltraKeccakZKHonkVerifier",
    "items": [
      {
        "type": "function",
        "name": "verify_ultra_keccak_zk_honk_proof",
        "inputs": [
          {
            "name": "full_proof_with_hints",
            "type": "core::array::Span::<core::felt252>"
          }
        ],
        "outputs": [
          {
            "type": "core::option::Option::<core::array::Span::<core::integer::u256>>"
          }
        ],
        "state_mutability": "view"
      }
    ]
  },
  {
    "type": "event",
    "name": "starknetsquiz::honk_verifier::UltraKeccakZKHonkVerifier::Event",
    "kind": "enum",
    "variants": []
  }
] as const;
