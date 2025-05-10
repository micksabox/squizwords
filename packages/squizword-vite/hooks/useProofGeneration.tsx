import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import { getCircuit } from '../../noir/compile.js';
import { UltraHonkBackend } from '@aztec/bb.js';
import { Noir } from '@noir-lang/noir_js';
import { ProofData } from '@noir-lang/types';

export function useProofGeneration(inputs?: { [key: string]: string | string[] }) {
  const [proofData, setProofData] = useState<ProofData | undefined>();
  const [backend, setBackend] = useState<UltraHonkBackend>();
  const [noir, setNoir] = useState<Noir | undefined>();

  const proofGeneration = async () => {
    if (!inputs) return;
    const circuit = await getCircuit();
    const backend = new UltraHonkBackend(circuit.bytecode, {
      threads: navigator.hardwareConcurrency,
    });
    const noir = new Noir(circuit);

    await toast.promise(noir.init, {
      pending: 'Initializing Noir...',
      success: 'Noir initialized!',
      error: 'Error initializing Noir',
    });

    const { witness } = await toast.promise(noir.execute(inputs), {
      pending: 'Generating witness...',
      success: 'Witness generated!',
      error: 'Computing witness failed! Did you finish the puzzle and enter the correct solutions?',
    });

    const data = await toast.promise(backend.generateProof(witness, { keccak: true }), {
      pending: 'Generating proof',
      success: 'Proof generated',
      error: 'Error generating proof',
    });

    setProofData(data);
    setNoir(noir);
    setBackend(backend);
  };

  useEffect(() => {
    if (!inputs) return;
    proofGeneration();
  }, [inputs]);

  return { noir, proofData, backend };
}
