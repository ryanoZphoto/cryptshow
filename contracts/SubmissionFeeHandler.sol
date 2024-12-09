// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SubmissionFeeHandler is Ownable, ReentrancyGuard {
    uint256 public submissionFee;
    uint256 public transactionFeePercentage; // Base points (1% = 100)
    mapping(address => bool) public registeredTokens;
    
    event TokenRegistered(address indexed tokenAddress, address indexed submitter);
    event FeeCollected(address indexed from, uint256 amount);
    
    constructor(uint256 _submissionFee, uint256 _transactionFeePercentage) {
        submissionFee = _submissionFee;
        transactionFeePercentage = _transactionFeePercentage;
    }
    
    function registerToken() external payable nonReentrant {
        require(msg.value >= submissionFee, "Insufficient submission fee");
        require(!registeredTokens[msg.sender], "Token already registered");
        
        registeredTokens[msg.sender] = true;
        emit TokenRegistered(msg.sender, msg.sender);
    }
    
    function updateFees(uint256 _submissionFee, uint256 _transactionFeePercentage) external onlyOwner {
        submissionFee = _submissionFee;
        transactionFeePercentage = _transactionFeePercentage;
    }
    
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
} 