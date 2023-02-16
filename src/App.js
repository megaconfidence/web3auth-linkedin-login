import './App.css';
import Web3 from 'web3';
import { useEffect, useState } from 'react';
import { Web3AuthCore } from "@web3auth/core";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { WALLET_ADAPTERS, CHAIN_NAMESPACES } from "@web3auth/base";

function App() {
    const [display, setDisplay] = useState(null);
    const [web3Auth, setWeb3Auth] = useState(null);
    const [provider, setProvider] = useState(null);

    const chainId = "0x1";
    const clientId = process.env.REACT_APP_WEB3AUTH_CLIENT_ID;

    const login = async () => {
        if (!web3Auth) return console.log("web3auth not initialized");
        const authProvider = await web3Auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
            loginProvider: "jwt",
            extraLoginOptions: {
                domain: process.env.REACT_APP_AUTH0_DOMAIN,
                verifierIdField: "sub",
            },
        });
        setProvider(authProvider);
    };

    const logout = async () => {
        if (!web3Auth) return console.log("web3auth not initialized");
        await web3Auth.logout();
        setProvider(null);
    };

    const getProfile = async () => {
        if (!web3Auth) return console.log("web3auth not initialized");
        const user = await web3Auth.getUserInfo();
        setDisplay(user)
    };

    const getAccounts = async () => {
        if (!provider) return console.log("provider not initialized yet");
        const web3 = new Web3(provider);
        const userAccounts = await web3.eth.getAccounts();
        setDisplay(userAccounts);
    }

    const getBalance = async () => {
        if (!provider) return console.log("provider not initialized yet");
        const web3 = new Web3(provider);
        const accounts = await web3.eth.getAccounts();
        const balance = await web3.eth.getBalance(accounts[0]);
        setDisplay(web3.utils.fromWei(balance));
    }

    const signMessage = async () => {
        if (!provider) return console.log("provider not initialized yet");
        const web3 = new Web3(provider);
        const account = (await web3.eth.getAccounts())[0];
        const message = "Hello World!";
        const typedMessage = [
            {
                type: "string",
                name: "message",
                value: message,
            },
        ];
        const params = [JSON.stringify(typedMessage), account];
        const method = "eth_signTypedData";

        const signedMessage = await provider.request({
            method,
            params,
        });
        setDisplay(signedMessage);
    }

    const signTransaction = async () => {
        if (!provider) return console.log("provider not initialized yet");
        const web3 = new Web3(provider);
        const accounts = await web3.eth.getAccounts();

        const txRes = await web3.eth.signTransaction({
            from: accounts[0],
            to: accounts[0],
            value: web3.utils.toWei('0.0001'),
            chainId,
        });
        setDisplay(txRes.transactionHash);
    }

    const sendTransaction = async () => {
        if (!provider) return console.log("provider not initialized yet");
        const web3 = new Web3(provider);
        const accounts = await web3.eth.getAccounts();

        const txRes = await web3.eth.sendTransaction({
            from: accounts[0],
            to: accounts[0],
            value: web3.utils.toWei('0.0001'),
            chainId,
        });
        setDisplay(txRes.transactionHash);
    }

    useEffect(() => {
        const init = async () => {
            try {
                const authCore = new Web3AuthCore({
                    clientId,
                    web3AuthNetwork: "testnet",
                    chainConfig: {
                        chainId,
                        chainNamespace: CHAIN_NAMESPACES.EIP155,
                    },
                });

                const openloginAdapter = new OpenloginAdapter({
                    adapterSettings: {
                        clientId,
                        uxMode: "popup",
                        loginConfig: {
                            jwt: {
                                typeOfLogin: "jwt",
                                verifier: "linkedin-verifier",
                                clientId: process.env.REACT_APP_AUTH0_CLIENT_ID,
                            },
                        },
                    },
                });


                authCore.configureAdapter(openloginAdapter);
                setWeb3Auth(authCore);
                await authCore.init();
                if (authCore.provider) setProvider(authCore.provider);
            } catch (error) {
                console.log({ error });
            }
        };

        init();
    }, [clientId]);

    return (
        <div className="app">
            <div>{process.env.REACT_APP_WEB3AUTH_CLIENT_ID}</div>
            {!provider ?
                <button onClick={login}>Login</button> :
                <>
                    <div className="buttons">
                        <button onClick={getProfile}>Get Profile</button>
                        <button onClick={getBalance}>Get Balance</button>
                        <button onClick={getAccounts}>Get Accounts</button>
                        <button onClick={signMessage}>Sign Message</button>
                        <button onClick={signTransaction}>Sign Transaction</button>
                        <button onClick={sendTransaction}>Send Transaction</button>
                        <button onClick={logout}>Logout</button>
                    </div>
                    <div className="display">
                        <pre>{JSON.stringify(display, null, 4)}</pre>
                    </div>
                </>
            }
        </div >
    );
}

export default App;
