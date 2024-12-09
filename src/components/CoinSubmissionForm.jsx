import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { SUBMISSION_FEE_HANDLER_ABI } from '../constants/abis';
import { SUBMISSION_FEE_HANDLER_ADDRESS } from '../constants/addresses';

const CoinSubmissionForm = () => {
    const [formData, setFormData] = useState({
        coinAddress: '',
        coinName: '',
        symbol: '',
        image: null
    });
    const [walletAddress, setWalletAddress] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [submissionFee, setSubmissionFee] = useState('0');
    const [transactionFeePercentage, setTransactionFeePercentage] = useState('0');
    const [isRegistered, setIsRegistered] = useState(false);

    useEffect(() => {
        if (walletAddress && formData.coinAddress) {
            checkRegistrationStatus();
            getFees();
        }
    }, [walletAddress, formData.coinAddress]);

    // Connect wallet function
    const connectWallet = async () => {
        try {
            if (window.ethereum) {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                await provider.send("eth_requestAccounts", []);
                const signer = provider.getSigner();
                const address = await signer.getAddress();
                setWalletAddress(address);
            } else {
                alert("Please install MetaMask!");
            }
        } catch (error) {
            console.error("Error connecting wallet:", error);
        }
    };

    // Fetch token metadata if available
    const fetchTokenMetadata = async (address) => {
        setIsLoading(true);
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const tokenContract = new ethers.Contract(
                address,
                [
                    "function name() view returns (string)",
                    "function symbol() view returns (string)"
                ],
                provider
            );

            const name = await tokenContract.name();
            const symbol = await tokenContract.symbol();

            setFormData(prev => ({
                ...prev,
                coinName: name,
                symbol: symbol,
                coinAddress: address
            }));
        } catch (error) {
            console.error("Error fetching metadata:", error);
        }
        setIsLoading(false);
    };

    const getContract = () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        return new ethers.Contract(
            SUBMISSION_FEE_HANDLER_ADDRESS,
            SUBMISSION_FEE_HANDLER_ABI,
            signer
        );
    };

    const getFees = async () => {
        try {
            const contract = getContract();
            const fee = await contract.submissionFee();
            const percentage = await contract.transactionFeePercentage();
            setSubmissionFee(ethers.utils.formatEther(fee));
            setTransactionFeePercentage(percentage.toString());
        } catch (error) {
            console.error("Error fetching fees:", error);
        }
    };

    const checkRegistrationStatus = async () => {
        try {
            const contract = getContract();
            const status = await contract.registeredTokens(formData.coinAddress);
            setIsRegistered(status);
        } catch (error) {
            console.error("Error checking registration:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const contract = getContract();
            
            // If not registered, submit registration fee
            if (!isRegistered) {
                const tx = await contract.registerToken({
                    value: ethers.utils.parseEther(submissionFee)
                });
                await tx.wait();
            }
            
            // Submit form data to your backend
            const formPayload = {
                ...formData,
                walletAddress,
                transactionFeePercentage
            };
            
            // Add your API call here to save the form data
            // await api.submitToken(formPayload);
            
            alert("Token submitted successfully!");
        } catch (error) {
            console.error("Error submitting token:", error);
            alert("Error submitting token. Please try again.");
        }
        
        setIsLoading(false);
    };

    const handleAddressChange = (e) => {
        const address = e.target.value;
        setFormData(prev => ({ ...prev, coinAddress: address }));
        if (ethers.utils.isAddress(address)) {
            fetchTokenMetadata(address);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Submit Your Token</h2>
            
            {!walletAddress && (
                <button 
                    onClick={connectWallet}
                    className="mb-4 bg-blue-500 text-white px-4 py-2 rounded"
                >
                    Connect Wallet
                </button>
            )}

            {walletAddress && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-2">Token Contract Address</label>
                        <input
                            type="text"
                            value={formData.coinAddress}
                            onChange={handleAddressChange}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

                    <div>
                        <label className="block mb-2">Token Name</label>
                        <input
                            type="text"
                            value={formData.coinName}
                            onChange={(e) => setFormData(prev => ({ ...prev, coinName: e.target.value }))}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

                    <div>
                        <label className="block mb-2">Token Symbol</label>
                        <input
                            type="text"
                            value={formData.symbol}
                            onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

                    <div>
                        <label className="block mb-2">Token Logo</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.files[0] }))}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <p className="text-sm text-gray-600">
                            Registration Fee: {submissionFee} ETH
                        </p>
                        <p className="text-sm text-gray-600">
                            Transaction Fee: {Number(transactionFeePercentage) / 100}%
                        </p>
                        {isRegistered && (
                            <p className="text-green-600">Token already registered</p>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        className="bg-green-500 text-white px-4 py-2 rounded"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Loading...' : 'Submit Token'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default CoinSubmissionForm;