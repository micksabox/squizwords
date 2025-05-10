// Generated with
// starkli class-at "0x05c6f1e14f4165e2721f43262c697a8c7d11c11ca2f73b2f21f0c10065f15c60" --network sepolia | npx abi-wan-kanabi --input /dev/stdin --output abi.ts

export const ABI = [
  {
    type: 'impl',
    name: 'IUltraKeccakZKHonkVerifier',
    interface_name: 'squizwords::honk_verifier::IUltraKeccakZKHonkVerifier',
  },
  {
    type: 'struct',
    name: 'core::array::Span::<core::felt252>',
    members: [
      {
        name: 'snapshot',
        type: '@core::array::Array::<core::felt252>',
      },
    ],
  },
  {
    type: 'struct',
    name: 'core::integer::u256',
    members: [
      {
        name: 'low',
        type: 'core::integer::u128',
      },
      {
        name: 'high',
        type: 'core::integer::u128',
      },
    ],
  },
  {
    type: 'struct',
    name: 'core::array::Span::<core::integer::u256>',
    members: [
      {
        name: 'snapshot',
        type: '@core::array::Array::<core::integer::u256>',
      },
    ],
  },
  {
    type: 'enum',
    name: 'core::option::Option::<core::array::Span::<core::integer::u256>>',
    variants: [
      {
        name: 'Some',
        type: 'core::array::Span::<core::integer::u256>',
      },
      {
        name: 'None',
        type: '()',
      },
    ],
  },
  {
    type: 'interface',
    name: 'squizwords::honk_verifier::IUltraKeccakZKHonkVerifier',
    items: [
      {
        type: 'function',
        name: 'verify_ultra_keccak_zk_honk_proof',
        inputs: [
          {
            name: 'full_proof_with_hints',
            type: 'core::array::Span::<core::felt252>',
          },
        ],
        outputs: [
          {
            type: 'core::option::Option::<core::array::Span::<core::integer::u256>>',
          },
        ],
        state_mutability: 'view',
      },
    ],
  },
  {
    type: 'event',
    name: 'squizwords::honk_verifier::UltraKeccakZKHonkVerifier::Event',
    kind: 'enum',
    variants: [],
  },
] as const;
