# Bonk Burn Wallet
BE CAREFUL WITH THIS SERVICE! 

It swaps SOL into an SPL token using the Orca SDK, then burns it. The value of the SOL is completely unrecoverable.

You can deploy this on a server, then point a helius.xyz TRANSFER and NFT_SALE enhanced webhook to the URL. You will need a keypair with a small amount of SOL for transaction fees. Be careful to fund it before turning on the script, because any SOL sent to this account will be swapped and burned.

The webhook endpoint expects a basic authentication header. Add a secret key to the WEBHOOK_AUTH environment variable, then encode webhook:WEBHOOK_AUTH into base64, then add "Basic [your base64 key]" to the Authorization field in your webhook configuration.

You can also use the burnamount endpoint to display a total-burn counter. You need to set up an AWS DynamoDB table with an entry for each wallet you are using, then modify data.ts to match your deployment.

Why would you want to do this? A token was launched on Christmas of 2022 intended to revive the Solana community. The community is working together to burn the token in fun ways. It's for the culture, and it is to decrease the supply of the token. This service is deployed to burn royalties from the [Bubble Burn](https://mintbubble.xyz) NFT collection.
