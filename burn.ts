import dotenv from "dotenv";
import { TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import { Wallet, AnchorProvider } from "@project-serum/anchor";
import { PublicKey, Connection, Keypair } from "@solana/web3.js";
import {
  WhirlpoolContext,
  ORCA_WHIRLPOOLS_CONFIG,
  ORCA_WHIRLPOOL_PROGRAM_ID,
  swapQuoteByInputToken,
  PDAUtil,
  buildWhirlpoolClient,
} from "@orca-so/whirlpools-sdk";
import { Percentage, DecimalUtil } from "@orca-so/common-sdk";
import BN from "bn.js";
import express from "express";
dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.post("/", (req, res) => {
  const { body } = req;
  const data = body[0];
  if (data.type !== "TRANSFER") {
    res.sendStatus(500).send("wrong event type");
  }
  const amountToSwap = data.nativeTransfers[0].amount;
  const destination = data.nativeTransfers[0].toUserAccount;
  if (destination != process.env.BURN_WALLET) {
    res.send("Outgoing sol, nothing to do");
  }
  console.log("ready to interact with the chain");
  tradeSolForBonk(new BN(amountToSwap));
  res.send("swap and burn kicked off");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const tradeSolForBonk = async (amount: BN) => {
  const connection = new Connection(process.env.RPC!);
  const secretKey = Uint8Array.from(JSON.parse(process.env.KEY!));
  const keypair = Keypair.fromSecretKey(secretKey);
  const anchorWallet = new Wallet(keypair);
  console.log("wallet", anchorWallet.publicKey.toBase58());
  const provider = new AnchorProvider(
    connection,
    anchorWallet,
    AnchorProvider.defaultOptions()
  );
  const ctx = WhirlpoolContext.withProvider(
    provider,
    ORCA_WHIRLPOOL_PROGRAM_ID
  );
  const client = buildWhirlpoolClient(ctx);
  const BONK = {
    mint: new PublicKey("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"),
    decimals: 5,
  };
  const SOL = {
    mint: new PublicKey("So11111111111111111111111111111111111111112"),
    decimals: 9,
  };
  const whirlpool_pubkey = PDAUtil.getWhirlpool(
    ORCA_WHIRLPOOL_PROGRAM_ID,
    ORCA_WHIRLPOOLS_CONFIG,
    SOL.mint,
    BONK.mint,
    128
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
  const balance = await provider.connection.getBalance(anchorWallet.publicKey);
  console.log("balance", balance);
  console.log("input", quote.estimatedAmountIn.toNumber());
  const tx = await whirlpool.swap(quote);
  const signature = await tx.buildAndExecute();
  const latest_blockhash = await ctx.connection.getLatestBlockhash();
  await ctx.connection.confirmTransaction(
    { signature, ...latest_blockhash },
    "finalized"
  );
  const bonk = new Token(ctx.connection, BONK.mint, TOKEN_PROGRAM_ID, keypair);
  let bonkAta = await bonk.getOrCreateAssociatedAccountInfo(keypair.publicKey);
  console.log("bonk amount", bonkAta.amount);
  await bonk.burn(bonkAta.address, keypair, [], bonkAta.amount);
  console.log("bonk burned");
  bonkAta = await bonk.getOrCreateAssociatedAccountInfo(keypair.publicKey);
};
//Uncomment this to test the swap portion without webhook data
//tradeSolForBonk(new BN(100000))
