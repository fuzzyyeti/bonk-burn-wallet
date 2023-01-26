import { Wallet, web3, AnchorProvider } from "@project-serum/anchor";

export const getSigner = () => {
    const connection = new web3.Connection(process.env.RPC!);
    const secretKey = Uint8Array.from(JSON.parse(process.env.KEY!));
    const keypair = web3.Keypair.fromSecretKey(secretKey);
    const anchorWallet = new Wallet(keypair);
    const provider = new AnchorProvider(
      connection,
      anchorWallet,
      AnchorProvider.defaultOptions()
    );
    return { provider, keypair }
}