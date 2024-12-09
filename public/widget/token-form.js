// Token Submission Form Widget
const TokenSubmissionForm = {
    config: {
        apiUrl: '',
        theme: 'light',
        customStyles: {},
        onSubmit: null
    },

    init: function(config) {
        this.config = config;
        this.render();
        this.attachEventListeners();
    },

    render: function() {
        const container = document.getElementById('token-submission-form');
        container.innerHTML = `
            <div class="tier-container">
                <div class="tier-card premium">
                    <h3>Premium Tier</h3>
                    <p class="price">$0.50</p>
                    <p class="duration">48 Hours</p>
                    <ul>
                        <li>Top Placement</li>
                        <li>Priority Visibility</li>
                        <li>Detailed Analytics</li>
                        <li>Verified Badge</li>
                    </ul>
                </div>
                <div class="tier-card standard">
                    <h3>Standard Tier</h3>
                    <p class="price">$0.25</p>
                    <p class="duration">24 Hours</p>
                    <ul>
                        <li>Middle Placement</li>
                        <li>Basic Analytics</li>
                    </ul>
                </div>
                <div class="tier-card free">
                    <h3>Free Tier</h3>
                    <p class="price">$0.00</p>
                    <p class="duration">12 Hours</p>
                    <ul>
                        <li>Basic Listing</li>
                        <li>Limited Features</li>
                    </ul>
                </div>
            </div>

            <div class="notice">
                <p><strong>Note:</strong> Due to high submission volume, paid tiers do not guarantee immediate showcase. 
                However, higher tier submissions receive priority placement and extended visibility. 
                Free tier submissions are limited to one per wallet address every 24 hours.</p>
            </div>

            <form id="submission-form">
                <input type="text" id="token-address" name="token-address" placeholder="Token Address *" required>
                <input type="text" id="token-name" name="token-name" placeholder="Token Name *" required>
                <input type="text" id="token-symbol" name="token-symbol" placeholder="Token Symbol *" required>
                <input type="url" id="website-url" name="website-url" placeholder="Website URL">
                <textarea id="description" name="description" placeholder="Description"></textarea>
                <input type="text" id="wallet-address" name="wallet-address" placeholder="Your Wallet Address *" required>
                
                <div class="tier-selection">
                    <label><input type="radio" name="tier" value="premium"> Premium Tier ($0.50)</label>
                    <label><input type="radio" name="tier" value="standard"> Standard Tier ($0.25)</label>
                    <label><input type="radio" name="tier" value="free" checked> Free Tier</label>
                </div>

                <button type="submit">Submit Token</button>
            </form>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .tier-container {
                display: flex;
                gap: 20px;
                margin-bottom: 30px;
            }
            .tier-card {
                flex: 1;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
            }
            .tier-card.premium {
                background: linear-gradient(145deg, #7f00ff, #e100ff);
                color: white;
            }
            .tier-card.standard {
                background: linear-gradient(145deg, #00b4db, #0083b0);
                color: white;
            }
            .tier-card.free {
                background: linear-gradient(145deg, #56ab2f, #a8e063);
                color: white;
            }
            .price {
                font-size: 24px;
                font-weight: bold;
                margin: 10px 0;
            }
            .duration {
                font-size: 14px;
                opacity: 0.9;
            }
            .notice {
                background-color: #f8f9fa;
                border-left: 4px solid #007bff;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .notice p {
                margin: 0;
                color: #495057;
                line-height: 1.5;
            }
            .notice strong {
                color: #007bff;
            }
            form {
                display: flex;
                flex-direction: column;
                gap: 15px;
                max-width: 500px;
                margin: 0 auto;
            }
            input, textarea {
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
            }
            textarea {
                min-height: 100px;
                resize: vertical;
            }
            .tier-selection {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            button {
                padding: 12px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
            }
            button:hover {
                background: #45a049;
            }
        `;
        document.head.appendChild(style);
    },

    attachEventListeners: function() {
        const form = document.getElementById('submission-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                tokenAddress: form.querySelector('#token-address').value,
                tokenName: form.querySelector('#token-name').value,
                tokenSymbol: form.querySelector('#token-symbol').value,
                websiteUrl: form.querySelector('#website-url').value,
                description: form.querySelector('#description').value,
                submitterAddress: form.querySelector('#wallet-address').value,
                tier: form.querySelector('input[name="tier"]:checked').value
            };

            try {
                const response = await fetch(`${this.config.apiUrl}/api/tokens`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();
                
                if (result.success) {
                    alert('Token submitted successfully!');
                    form.reset();
                    if (this.config.onSubmit) {
                        this.config.onSubmit(result);
                    }
                } else {
                    alert(result.message || 'Failed to submit token');
                }
            } catch (error) {
                console.error('Error submitting token:', error);
                alert('Failed to submit token. Please try again.');
            }
        });
    }
};

// Auto-initialize if config is present
if (window.TokenSubmissionConfig) {
    TokenSubmissionForm.init(window.TokenSubmissionConfig);
} 