const opensea = require('opensea-js')
const { WyvernSchemaName } = require("opensea-js/lib/types")
const OpenSeaPort = opensea.OpenSeaPort;
const Network = opensea.Network;
const MnemonicWalletSubprovider = require('@0x/subproviders').MnemonicWalletSubprovider
const RPCSubprovider = require('web3-provider-engine/subproviders/rpc')
const Web3ProviderEngine = require('web3-provider-engine')

const MNEMONIC = process.env.MNEMONIC
const INFURA_KEY = process.env.INFURA_KEY
const FACTORY_CONTRACT_ADDRESS = process.env.FACTORY_CONTRACT_ADDRESS
const OWNER_ADDRESS = process.env.OWNER_ADDRESS
const NETWORK = process.env.NETWORK
const API_KEY = process.env.API_KEY || "" // API key is optional but useful if you're doing a high volume of requests.

const FIXED_PRICE_OPTION_IDS = ["0", "1", "2"];
const FIXED_PRICES_ETH = [0.1, 0.2, 0.3];
const NUM_FIXED_PRICE_AUCTIONS = [1000, 1000, 1000]; // [2034, 2103, 2202];

if (!MNEMONIC || !INFURA_KEY || !NETWORK || !OWNER_ADDRESS) {
    console.error("Please set a mnemonic, infura key, owner, network, API key, nft contract, and factory contract address.")
    return
}

if (!FACTORY_CONTRACT_ADDRESS) {
    console.error("Please specify a factory contract address.")
    return
}

const BASE_DERIVATION_PATH = `44'/60'/0'/0`

const mnemonicWalletSubprovider = new MnemonicWalletSubprovider({ mnemonic: MNEMONIC, baseDerivationPath: BASE_DERIVATION_PATH})
const infuraRpcSubprovider = new RPCSubprovider({
    rpcUrl: 'https://' + NETWORK + '.infura.io/v3/' + INFURA_KEY,
})

const providerEngine = new Web3ProviderEngine()
providerEngine.addProvider(mnemonicWalletSubprovider)
providerEngine.addProvider(infuraRpcSubprovider)
providerEngine.start();

const seaport = new OpenSeaPort(providerEngine, {
    networkName: NETWORK === 'mainnet' ? Network.Main : Network.Rinkeby,
    apiKey: API_KEY
}, (arg) => console.log(arg))

async function main() {
    // Example: many fixed price auctions for a factory option.
    for (let i = 0; i < FIXED_PRICE_OPTION_IDS.length; i++) {
        const optionId = FIXED_PRICE_OPTION_IDS[i];
        console.log(`Creating fixed price auctions for ${optionId}...`)
        const numOrders = await seaport.createFactorySellOrders({
            assets: [{
                tokenId: optionId,
                tokenAddress: FACTORY_CONTRACT_ADDRESS,
                // Comment the next line if this is an ERC-721 asset (defaults to ERC721):
                schemaName: WyvernSchemaName.ERC1155
            }],
            // Quantity of each asset to issue
            quantity: 1,
            accountAddress: OWNER_ADDRESS,
            startAmount: FIXED_PRICES_ETH[i],
            // Number of times to repeat creating the same order for each asset. If greater than 5, creates them in batches of 5. Requires an `apiKey` to be set during seaport initialization:
            numberOfOrders: NUM_FIXED_PRICE_AUCTIONS[i]
        })
        console.log(`Successfully made ${numOrders} fixed-price sell orders!\n`)
    }
}

main().catch(e => console.error(e))
