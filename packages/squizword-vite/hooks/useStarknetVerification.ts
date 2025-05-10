import { useEffect, useRef, useState } from 'react';

// import { Contract, Provider } from 'starknet';
import { STARKNET_ADDRESSES } from '../utils/starknet_constants.js';
import vkUrl from '../utils/vk.bin?url';
import { getHonkCallData } from 'garaga';
import { abi } from '@noir-lang/noir_js';
import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@aztec/bb.js';
import { init } from 'garaga';
import { ProofData } from '@noir-lang/types';

import { flattenFieldsAsArray } from '../utils/proof.js';

enum ProofState {
  Initial = 'Initial',
  GeneratingWitness = 'Generating witness',
  GeneratingProof = 'Generating proof',
  PreparingCalldata = 'Preparing calldata',
  ConnectingWallet = 'Connecting wallet',
  SendingTransaction = 'Sending transaction',
  ProofVerified = 'Proof is verified',
}

export interface ProofStateData {
  state: ProofState;
  error?: string;
}

export function useStarknetVerification(proofData?: ProofData) {
  if (!proofData) {
    return {
      proofState: { state: ProofState.Initial },
      startVerification: async () => {},
    };
  }

  const [proofState, setProofState] = useState<ProofStateData>({
    state: ProofState.Initial,
  });

  // Use a ref to reliably track the current state across asynchronous operations
  const currentStateRef = useRef<ProofState>(ProofState.Initial);

  const [vk, setVk] = useState<Uint8Array | null>(null);

  useEffect(function initialLoad() {
    const loadVk = async () => {
      const response = await fetch(vkUrl);
      const arrayBuffer = await response.arrayBuffer();
      const binaryData = new Uint8Array(arrayBuffer);
      setVk(binaryData);
      console.log('Loaded verifying key:', binaryData);
    };
    loadVk();
  }, []);

  const resetState = () => {
    currentStateRef.current = ProofState.Initial;
    setProofState({
      state: ProofState.Initial,
      error: undefined,
    });
  };

  const handleError = (error: unknown) => {
    console.error('Error:', error);
    let errorMessage: string;

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== undefined) {
      // Try to convert any non-Error object to a string
      try {
        errorMessage = String(error);
      } catch {
        errorMessage = 'Unknown error (non-stringifiable object)';
      }
    } else {
      errorMessage = 'Unknown error occurred';
    }

    // Use the ref to get the most recent state
    setProofState({
      state: currentStateRef.current,
      error: errorMessage,
    });
  };

  const updateState = (newState: ProofState) => {
    currentStateRef.current = newState;
    setProofState({ state: newState, error: undefined });
  };

  const startVerification = async () => {
    try {
      // Prepare calldata
      updateState(ProofState.PreparingCalldata);

      await init();
      const callData = getHonkCallData(
        proofData.proof,
        flattenFieldsAsArray(proofData.publicInputs),
        vk as Uint8Array,
        0, // HonkFlavor.KECCAK
      );
      console.log('Starknet contract callData', callData);

      // Connect wallet
      updateState(ProofState.ConnectingWallet);

      // Send transaction
      updateState(ProofState.SendingTransaction);

      //   const provider = new RpcProvider({ nodeUrl: 'http://127.0.0.1:5050/rpc' });
      //   // TODO: use conract address from the result of the `make deploy-verifier` step
      //   const contractAddress = '0x0271da45750fddf2fd3708370d7c361b059e82f5ffe00cd548789973acb58df7';
      //   const verifierContract = new Contract(verifierAbi, contractAddress, provider);

      //   // Check verification
      //   const res = await verifierContract.verify_ultra_keccak_honk_proof(callData.slice(1));
      //   console.log(res);

      updateState(ProofState.ProofVerified);
    } catch (error) {
      handleError(error);
    }
  };

  return { proofState, startVerification };
}
