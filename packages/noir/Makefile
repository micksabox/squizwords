build-circuit:
	nargo build

exec-circuit:
	nargo execute witness

prove-circuit:
	bb prove --scheme ultra_honk --oracle_hash keccak -b ./target/squizword.json -w ./target/witness.gz -o ./target

devnet:
	starknet-devnet --accounts=2 --seed=0 --initial-balance=100000000000000000000000

gen-vk:
	bb write_vk --scheme ultra_honk --oracle_hash keccak -b ./target/squizword.json -o ./target

gen-verifier:
	garaga gen --system ultra_keccak_zk_honk --vk ./target/vk --project-name starknetsquiz

build-verifier:
	cd starknetsquiz && scarb build

accounts-file:
	curl -s http://localhost:5050/predeployed_accounts | jq '{"alpha-sepolia": {"devnet0": {address: .[0].address, private_key: .[0].private_key, public_key: .[0].public_key, class_hash: "0xe2eb8f5672af4e6a4e8a8f1b44989685e668489b0a25437733756c5a34a1d6", deployed: true, legacy: false, salt: "0x14", type: "open_zeppelin"}}}' > ./accounts.json

mv-accounts-file:
	mv ./accounts.json ./starknetsquiz/accounts.json

declare-verifier:
	cd starknetsquiz && sncast declare --contract-name UltraKeccakZKHonkVerifier

deploy-verifier:
	# TODO: use class hash from the result of the `make declare-verifier` step
	cd starknetsquiz && sncast deploy --salt 0x00 --class-hash 0x037d9213b1e3a49cc21cf266d24bc92be3a4c2abbde17301a9ed9d7cb6d7ce35

gen-abi:
	npx abi-wan-kanabi --input ./starknetsquiz/target/release/starknetsquiz_UltraKeccakZKHonkVerifier.contract_class.json --output ./target/abi.ts

artifacts:
	cp ./target/vk ../squizword-vite/utils/starknet/vk.bin
	cp ./target/abi.ts ../squizword-vite/utils/starknet/abi.ts

