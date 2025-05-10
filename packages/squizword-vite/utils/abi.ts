// starkli class-at "0x05adac4939dde521a0738e20efe7b3e85b89b98ecb039c1482ddd7bcdc1e1873" --network sepolia | npx abi-wan-kanabi --input /dev/stdin --output abi.ts
export const ABI = [
  {
    type: 'impl',
    name: 'IUltraKeccakHonkVerifier',
    interface_name: 'squizwordstark::honk_verifier::IUltraKeccakHonkVerifier',
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
    name: 'squizwordstark::honk_verifier::IUltraKeccakHonkVerifier',
    items: [
      {
        type: 'function',
        name: 'verify_ultra_keccak_honk_proof',
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
    name: 'squizwordstark::honk_verifier::UltraKeccakHonkVerifier::Event',
    kind: 'enum',
    variants: [],
  },
] as const;
