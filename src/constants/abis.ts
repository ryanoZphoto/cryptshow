export const TOKEN_ABI = [
    "event Transfer(address indexed from, address indexed to, uint256 amount)",
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)"
];

export const SUBMISSION_FEE_HANDLER_ABI = [
    "function collectFee(address tokenAddress, uint256 amount) external returns (bool)",
    "function withdrawFees(address tokenAddress) external returns (bool)"
];