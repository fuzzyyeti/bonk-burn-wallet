import { 
    WhirlpoolContext, 
    buildWhirlpoolClient,
    swapQuoteByInputToken,
    ORCA_WHIRLPOOL_PROGRAM_ID, 
    ORCA_WHIRLPOOLS_CONFIG, 
    PDAUtil } from "@orca-so/whirlpools-sdk";
import { TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import { AnchorProvider, web3 } from "@project-serum/anchor";
import BN from "bn.js";
import { incrementBurned } from "./data";
import { Percentage } from "@orca-so/common-sdk";

const BONK = {
    mint: new web3.PublicKey("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"),
    decimals: 5,
  };
  const SOL = {
    mint: new web3.PublicKey("So11111111111111111111111111111111111111112"),
    decimals: 9,
  };

export const tradeSolForBonk = async (amount: BN, provider: AnchorProvider) => {
  const ctx = WhirlpoolContext.withProvider(
    provider,
    ORCA_WHIRLPOOL_PROGRAM_ID
  );
  const client = buildWhirlpoolClient(ctx);
  const whirlpool_pubkey = PDAUtil.getWhirlpool(
    ORCA_WHIRLPOOL_PROGRAM_ID,
    ORCA_WHIRLPOOLS_CONFIG,
    SOL.mint,
    BONK.mint,
    64 
  ).publicKey;
  console.log("whirlpool_key:", whirlpool_pubkey.toBase58());
  const whirlpool = await client.getPool(whirlpool_pubkey);
  const quote = await swapQuoteByInputToken(
    whirlpool,
    SOL.mint,
    amount,
    Percentage.fromFraction(1, 100),
    ORCA_WHIRLPOOL_PROGRAM_ID,
    ctx.fetcher,
    true
  );
  console.log("quote", quote.estimatedAmountOut.toNumber() / Math.pow(10, 5));
  const balance = await provider.connection.getBalance(provider.publicKey);
  console.log("balance", balance);
  console.log("input", quote.estimatedAmountIn.toNumber());
  const tx = await whirlpool.swap(quote);
  const signature = await tx.buildAndExecute();
  const latest_blockhash = await ctx.connection.getLatestBlockhash();
  await ctx.connection.confirmTransaction(
    { signature, ...latest_blockhash },
    "finalized"
  );
};


export const burnBonk = async (provider: AnchorProvider, signer: web3.Keypair) => {
    const bonk = new Token(provider.connection, BONK.mint, TOKEN_PROGRAM_ID, signer);
    let bonkAta = await bonk.getOrCreateAssociatedAccountInfo(provider.publicKey);
    console.log("bonk amount", bonkAta.amount);
    //set counter
    incrementBurned(bonkAta.amount.div(new BN(100000)))
    await bonk.burn(bonkAta.address, signer, [], bonkAta.amount);
    console.log("bonk burned");
  }

