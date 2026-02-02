const { ethers } = require('ethers');
const contractABI = require('../blockchain/artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json').abi;

class BlockchainService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.signer = null;
  }

  async initialize() {
    try {
      // Connect to blockchain
      this.provider = new ethers.JsonRpcProvider(
        process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545'
      );

      // Create wallet from private key
      if (process.env.PRIVATE_KEY) {
        this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      }

      // Connect to contract
      if (process.env.CONTRACT_ADDRESS) {
        this.contract = new ethers.Contract(
          process.env.CONTRACT_ADDRESS,
          contractABI,
          this.signer || this.provider
        );
      }

      console.log('Blockchain service initialized');
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error.message);
    }
  }

  /**
   * Issue a new certificate on the blockchain
   */
  async issueCertificate(hash, studentName, degree, issueDate) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Blockchain not initialized or no signer available');
      }

      const tx = await this.contract.issueCertificate(
        hash,
        studentName,
        degree,
        issueDate
      );

      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('Error issuing certificate on blockchain:', error);
      throw error;
    }
  }

  /**
   * Get certificate details from blockchain
   */
  async getCertificate(hash) {
    try {
      if (!this.contract) {
        throw new Error('Blockchain not initialized');
      }

      const cert = await this.contract.getCertificate(hash);
      
      return {
        studentName: cert.studentName,
        degree: cert.degree,
        issueDate: cert.issueDate,
        issuer: cert.issuer,
        isValid: cert.isValid,
        exists: cert.studentName !== '', // Check if certificate exists
      };
    } catch (error) {
      console.error('Error getting certificate from blockchain:', error);
      throw error;
    }
  }

  /**
   * Verify if a certificate is valid on blockchain
   */
  async verifyCertificate(hash) {
    try {
      if (!this.contract) {
        throw new Error('Blockchain not initialized');
      }

      const isValid = await this.contract.verifyCertificate(hash);
      return isValid;
    } catch (error) {
      console.error('Error verifying certificate:', error);
      throw error;
    }
  }

  /**
   * Revoke a certificate on blockchain
   */
  async revokeCertificate(hash) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Blockchain not initialized or no signer available');
      }

      const tx = await this.contract.revokeCertificate(hash);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('Error revoking certificate on blockchain:', error);
      throw error;
    }
  }

  /**
   * Authorize an issuer (admin only)
   */
  async authorizeIssuer(issuerAddress) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Blockchain not initialized or no signer available');
      }

      const tx = await this.contract.authorizeIssuer(issuerAddress);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
      };
    } catch (error) {
      console.error('Error authorizing issuer:', error);
      throw error;
    }
  }

  /**
   * Check if an address is an authorized issuer
   */
  async isAuthorizedIssuer(address) {
    try {
      if (!this.contract) {
        throw new Error('Blockchain not initialized');
      }

      return await this.contract.authorizedIssuer(address);
    } catch (error) {
      console.error('Error checking issuer authorization:', error);
      throw error;
    }
  }

  /**
   * Generate hash for certificate (keccak256)
   */
  generateHash(studentId, studentName, degree, issueDate) {
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
      ['string', 'string', 'string', 'string'],
      [studentId, studentName, degree, issueDate]
    );
    return ethers.keccak256(encoded);
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();

module.exports = blockchainService;
