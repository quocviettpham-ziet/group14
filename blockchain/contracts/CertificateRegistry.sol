// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CertificateRegistry {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    enum Status {
        VALID,
        REVOKED
    }

    struct Certificate {
        string studentName;
        string degree;
        string issueDate;
        address issuer;
        Status status;
    }

    mapping(address => bool) public authorizedIssuer;
    mapping(bytes32 => Certificate) private certificates;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not system owner");
        _;
    }

    modifier onlyIssuer() {
        require(authorizedIssuer[msg.sender], "Not authorized issuer");
        _;
    }

    // (1) PHÂN QUYỀN TRƯỜNG
    function authorizeIssuer(address issuer) external onlyOwner {
        authorizedIssuer[issuer] = true;
    }

    // CẤP VĂN BẰNG
    function issueCertificate(
        bytes32 hash,
        string calldata studentName,
        string calldata degree,
        string calldata issueDate
    ) external onlyIssuer {
        require(
            certificates[hash].issuer == address(0),
            "Certificate already exists"
        );

        certificates[hash] = Certificate({
            studentName: studentName,
            degree: degree,
            issueDate: issueDate,
            issuer: msg.sender,
            status: Status.VALID
        });
    }

    // (3) THU HỒI VĂN BẰNG
    function revokeCertificate(bytes32 hash) external onlyIssuer {
        require(
            certificates[hash].issuer == msg.sender,
            "Not certificate issuer"
        );

        certificates[hash].status = Status.REVOKED;
    }

    // VERIFY (PUBLIC)
    function verifyCertificate(bytes32 hash)
        external
        view
        returns (
            string memory,
            string memory,
            string memory,
            address,
            Status
        )
    {
        Certificate memory cert = certificates[hash];
        require(cert.issuer != address(0), "Certificate not found");

        return (
            cert.studentName,
            cert.degree,
            cert.issueDate,
            cert.issuer,
            cert.status
        );
    }
}
