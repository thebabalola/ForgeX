// import { MerkleTree } from 'merkletreejs';
// import keccak256 from 'keccak256';
// import Papa from 'papaparse';
// import { ethers } from 'ethers';

// export interface Recipient {
//   address: string;
//   amount?: string; // Optional amount for custom distributions
// }

// export interface RecipientWithProof extends Recipient {
//   proof: string[];
// }

// export function createMerkleTree(
//   recipients: Recipient[],
//   isCustomDistribution: boolean = false,
//   defaultAmount: string = '0',
// ): {
//   merkleTree: MerkleTree;
//   merkleRoot: string;
//   proofs: { [address: string]: string[] };
//   recipientsWithProof: RecipientWithProof[];
// } {
//   // Normalize and validate addresses
//   const normalizedRecipients = recipients
//     .filter((recipient) => recipient.address && ethers.isAddress(recipient.address))
//     .map((recipient) => ({
//       ...recipient,
//       address: recipient.address.toLowerCase().trim(),
//       amount: isCustomDistribution && recipient.amount ? recipient.amount : defaultAmount,
//     }));

//   if (normalizedRecipients.length === 0) {
//     throw new Error('No valid addresses found in recipient list');
//   }

//   // Hash addresses and amounts consistently with the smart contract
//   // For custom distributions, include the amount in the hash
//   // For equal distributions, use the defaultAmount or omit amount if not needed
//   const leaves = normalizedRecipients.map((recipient) => {
//     if (isCustomDistribution && recipient.amount) {
//       // Parse amount to ensure it's a valid number
//       const amountBN = ethers.parseUnits(recipient.amount, 18); // Assuming 18 decimals for ERC20 tokens
//       return keccak256(
//         ethers.solidityPacked(['address', 'uint256'], [recipient.address, amountBN]),
//       );
//     }
//     return keccak256(recipient.address);
//   });

//   console.log('🔍 Normalized Recipients:');
//   normalizedRecipients.forEach((r, i) => {
//     console.log(`  ${i + 1}. ${r.address}${r.amount ? `, Amount: ${r.amount}` : ''}`);
//   });

//   console.log('🔢 Leaves (hashed):');
//   leaves.forEach((leaf, i) => {
//     console.log(`  Leaf ${i + 1}: ${leaf.toString('hex')}`);
//   });

//   // Create the Merkle tree with sorted pairs for consistent root
//   const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
//   const merkleRoot = merkleTree.getHexRoot();

//   console.log('🌳 Generated Merkle Root:', merkleRoot);

//   const proofs: { [address: string]: string[] } = {};
//   const recipientsWithProof: RecipientWithProof[] = [];

//   // Generate proofs for each recipient
//   normalizedRecipients.forEach((recipient) => {
//     const leaf = isCustomDistribution && recipient.amount
//       ? keccak256(
//           ethers.solidityPacked(['address', 'uint256'], [
//             recipient.address,
//             ethers.parseUnits(recipient.amount, 18),
//           ]),
//         )
//       : keccak256(recipient.address);
//     const proof = merkleTree.getHexProof(leaf);
//     proofs[recipient.address] = proof;

//     console.log(`🧾 Proof for ${recipient.address}:`, proof);

//     // Verify proof is valid against the root
//     const isValid = merkleTree.verify(proof, leaf, merkleRoot);
//     console.log(`✅ Proof valid for ${recipient.address}?`, isValid);

//     if (!isValid) {
//       console.error('❌ WARNING: Invalid proof generated for', recipient.address);
//     }

//     recipientsWithProof.push({
//       ...recipient,
//       proof,
//     });
//   });

//   return {
//     merkleTree,
//     merkleRoot,
//     proofs,
//     recipientsWithProof,
//   };
// }

// /**
//  * Parse a CSV file into a list of recipients
//  * Expected format: CSV with 'address' column (required) and 'amount' column (optional)
//  */
// export async function parseCSV(file: File): Promise<Recipient[]> {
//   return new Promise((resolve, reject) => {
//     Papa.parse(file, {
//       header: true,
//       skipEmptyLines: true,
//       dynamicTyping: false, // Keep everything as strings
//       complete: (result) => {
//         if (result.errors && result.errors.length > 0) {
//           console.error('CSV parsing errors:', result.errors);
//         }

//         const recipients: Recipient[] = [];

//         // Process each row
//         for (const row of result.data as Array<{ address?: string; amount?: string }>) {
//           // Skip rows with no address
//           if (!row.address) continue;

//           const address = String(row.address).trim();

//           // Validate Ethereum address
//           if (!ethers.isAddress(address)) {
//             console.warn(`Invalid address skipped: ${address}`);
//             continue;
//           }

//           recipients.push({
//             address,
//             amount: row.amount ? String(row.amount).trim() : undefined,
//           });
//         }

//         console.log(`Parsed ${recipients.length} valid recipients from CSV`);
//         resolve(recipients);
//       },
//       error: (error) => {
//         console.error('CSV parse error:', error);
//         reject(error);
//       },
//     });
//   });
// }

// /**
//  * Verify if an address is eligible to claim by checking if it's in the merkle tree
//  */
// export function verifyAddressEligibility(
//   address: string,
//   recipientsWithProof: RecipientWithProof[],
//   merkleRoot: string,
//   isCustomDistribution: boolean = false,
// ): { eligible: boolean; proof?: string[] } {
//   // Normalize address
//   const normalizedAddress = address.toLowerCase().trim();

//   // Find recipient
//   const recipient = recipientsWithProof.find((r) => r.address.toLowerCase() === normalizedAddress);

//   if (!recipient) {
//     return { eligible: false };
//   }

//   // Verify proof
//   const leaf = isCustomDistribution && recipient.amount
//     ? keccak256(
//         ethers.solidityPacked(['address', 'uint256'], [
//           normalizedAddress,
//           ethers.parseUnits(recipient.amount, 18),
//         ]),
//       )
//     : keccak256(normalizedAddress);
//   const merkleTree = new MerkleTree([], keccak256, { sortPairs: true });
//   const isValid = merkleTree.verify(recipient.proof, leaf, merkleRoot);

//   return {
//     eligible: isValid,
//     proof: isValid ? recipient.proof : undefined,
//   };
// }
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import Papa from 'papaparse';
import { ethers } from 'ethers';

export interface Recipient {
  address: string;
  amount?: string; // Optional for custom distributions
}

export interface RecipientWithProof extends Recipient {
  proof: string[];
}

export function createMerkleTree(
  recipients: Recipient[],
  isCustomDistribution: boolean = false,
  defaultAmount: string = '0',
): {
  merkleTree: MerkleTree;
  merkleRoot: string;
  proofs: { [address: string]: string[] };
  recipientsWithProof: RecipientWithProof[];
} {
  const normalizedRecipients = recipients
    .filter((r) => r.address && ethers.isAddress(r.address))
    .map((r) => ({
      ...r,
      address: r.address.toLowerCase().trim(),
      amount: isCustomDistribution && r.amount ? r.amount : defaultAmount,
    }));

  if (normalizedRecipients.length === 0) {
    throw new Error('No valid addresses found in recipient list');
  }

  const leaves = normalizedRecipients.map((r) => {
    if (isCustomDistribution && r.amount) {
      const amountBN = ethers.parseUnits(r.amount, 18);
      return keccak256(ethers.solidityPacked(['address', 'uint256'], [r.address, amountBN]));
    }
    return keccak256(r.address);
  });

  const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const merkleRoot = merkleTree.getHexRoot();

  const proofs: { [address: string]: string[] } = {};
  const recipientsWithProof: RecipientWithProof[] = [];

  normalizedRecipients.forEach((r) => {
    const leaf = isCustomDistribution && r.amount
      ? keccak256(ethers.solidityPacked(['address', 'uint256'], [r.address, ethers.parseUnits(r.amount, 18)]))
      : keccak256(r.address);

    const proof = merkleTree.getHexProof(leaf);
    proofs[r.address] = proof;

    recipientsWithProof.push({ ...r, proof });
  });

  return {
    merkleTree,
    merkleRoot,
    proofs,
    recipientsWithProof,
  };
}

/**
 * Parse a CSV file into recipient list
 * CSV format: address, amount (optional)
 */
export async function parseCSV(file: File): Promise<Recipient[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (result) => {
        if (result.errors && result.errors.length > 0) {
          console.error('CSV parsing errors:', result.errors);
        }

        const recipients: Recipient[] = [];

        for (const row of result.data as Array<{ address?: string; amount?: string }>) {
          if (!row.address) continue;
          const address = String(row.address).trim();
          if (!ethers.isAddress(address)) {
            console.warn(`Invalid address skipped: ${address}`);
            continue;
          }

          recipients.push({
            address,
            amount: row.amount ? String(row.amount).trim() : undefined,
          });
        }

        resolve(recipients);
      },
      error: (err) => {
        reject(err);
      },
    });
  });
}

/**
 * Verifies address eligibility by reconstructing the merkle tree
 */
export function verifyAddressEligibility(
  address: string,
  recipientsWithProof: RecipientWithProof[],
  merkleRoot: string,
  isCustomDistribution: boolean = false,
  defaultAmount: string = '0',
): { eligible: boolean; proof?: string[] } {
  const normalizedAddress = address.toLowerCase().trim();

  const recipient = recipientsWithProof.find((r) => r.address.toLowerCase() === normalizedAddress);
  if (!recipient) return { eligible: false };

  const leaves = recipientsWithProof.map((r) => {
    const amount = isCustomDistribution && r.amount ? r.amount : defaultAmount;
    if (isCustomDistribution && amount) {
      const amountBN = ethers.parseUnits(amount, 18);
      return keccak256(
        ethers.solidityPacked(['address', 'uint256'], [r.address.toLowerCase(), amountBN]),
      );
    }
    return keccak256(r.address.toLowerCase());
  });

  const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });

  const leaf = isCustomDistribution && recipient.amount
    ? keccak256(
        ethers.solidityPacked(['address', 'uint256'], [
          normalizedAddress,
          ethers.parseUnits(recipient.amount, 18),
        ]),
      )
    : keccak256(normalizedAddress);

  const isValid = merkleTree.verify(recipient.proof, leaf, merkleRoot);

  return {
    eligible: isValid,
    proof: isValid ? recipient.proof : undefined,
  };
}
