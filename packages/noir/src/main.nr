
use std::hash::poseidon2;


// MAX_SOLUTION_WORDS is the maximum number of solution words that can be used in the proof.
global MAX_SOLUTION_WORDS: u32 = 100;

// Proves knowledge of the individual encoded solution words that hash to the public solution_root.
// solution_words: Array of Field elements, each representing a hex-encoded solution word (private witness).
// solution_root: The expected root hash calculated off-chain (public input).
fn main(solution_words: [Field; MAX_SOLUTION_WORDS], solution_root: pub Field) {

    let calculated_root = poseidon2::Poseidon2::hash(solution_words, solution_words.len());

    // 3. Assert that the calculated root hash matches the public input.
    assert(calculated_root == solution_root);
}

#[test]
fn test_main() {
    // 1. Create placeholder encoded solution words (replace with actual encoded Fields)
    // Size 100 must be a compile-time literal.
    let mut test_solution_words = [0; MAX_SOLUTION_WORDS];
    test_solution_words[0] = 0x414445; // Placeholder for encoded "ADE"
    test_solution_words[1] = 0x414243; // Placeholder for encoded "ABC"
    test_solution_words[2] = 0; // Placeholder for encoded "HI"
    // ... remaining elements are 0 (padding)

    // 2. Calculate the *expected* root hash using the *exact* same off-chain logic (TS)
    // Replace this placeholder with the actual pre-calculated hash:
    let expected_root_hash = poseidon2::Poseidon2::hash(test_solution_words, test_solution_words.len()); // <-- REPLACE THIS PLACEHOLDER HASH
    // let expected_root_hash = 0xba8f42264a4cbb52c35ff0cbd298eb7433f411700e1d612a28dfbfe570c999d;
    println(expected_root_hash);

    // 3. Run the main function with the test data.
    main(test_solution_words, expected_root_hash);
}

// #[test]
// fn test_single_word_hash() {
//     // Define a single word as a Field element
//     let onedown = 0x59454c4c4f57;
//     let twodown = 0x4f444453414e44;

//     let mut test_solution_words = [0; MAX_SOLUTION_WORDS];
//     test_solution_words[0] = word;

//     // Calculate the Poseidon2 hash of the single word
//     // Note: poseidon2::hash expects an array and its length.
//     // For a single element, the length is 1.
//     let solution_hash = poseidon2::Poseidon2::hash(test_solution_words, test_solution_words.len());

//     // Print the calculated hash
//     println("Hash of single word:");
//     println(solution_hash);

//     main(test_solution_words, solution_hash);
// }
