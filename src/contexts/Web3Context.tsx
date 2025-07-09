
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';

interface Web3ContextType {
  web3: Web3 | null;
  account: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced protection against concurrent requests
  const connectionPromise = useRef<Promise<void> | null>(null);

  const connectWallet = async () => {
    // If there's already a connection in progress, wait for it
    if (connectionPromise.current) {
      console.log('Connection already in progress, waiting for completion...');
      try {
        await connectionPromise.current;
      } catch (error) {
        // Connection failed, we'll try again
        console.log('Previous connection failed, trying again');
      }
      return;
    }

    // If already connected or loading, don't proceed
    if (isConnected || isLoading) {
      console.log('Already connected or loading, ignoring request');
      return;
    }

    // Create a new connection promise
    connectionPromise.current = performConnection();
    
    try {
      await connectionPromise.current;
    } finally {
      // Clear the promise when done (success or failure)
      connectionPromise.current = null;
    }
  };

  const performConnection = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Starting wallet connection...');

      const provider = await detectEthereumProvider();
      
      if (!provider) {
        throw new Error('MetaMask not detected. Please install MetaMask.');
      }

      const web3Instance = new Web3(provider as any);
      
      // Add a longer delay to ensure MetaMask is fully ready
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('Requesting accounts from MetaMask...');
      const accounts = await web3Instance.eth.requestAccounts();
      
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please connect your wallet.');
      }

      setWeb3(web3Instance);
      setAccount(accounts[0]);
      setIsConnected(true);
      
      // Store connection state
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAccount', accounts[0]);

      console.log('Wallet connected successfully:', accounts[0]);

    } catch (err: any) {
      console.error('Connection error:', err);
      
      // Handle the specific MetaMask error
      if (err.message && err.message.includes('Already processing eth_requestAccounts')) {
        setError('MetaMask is busy. Please wait a moment and try again.');
      } else if (err.code === 4001) {
        setError('Connection cancelled by user.');
      } else if (err.code === -32002) {
        setError('MetaMask is already processing a request. Please wait.');
      } else {
        setError(err.message || 'Failed to connect wallet');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setWeb3(null);
    setAccount(null);
    setIsConnected(false);
    setError(null);
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAccount');
    
    // Clear any pending connection attempts
    connectionPromise.current = null;
  };

  // Auto-connect on page load if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      const wasConnected = localStorage.getItem('walletConnected');
      const savedAccount = localStorage.getItem('walletAccount');
      
      if (wasConnected && savedAccount && !isConnected && !connectionPromise.current) {
        console.log('Attempting auto-connect...');
        
        try {
          const provider = await detectEthereumProvider();
          if (provider) {
            const web3Instance = new Web3(provider as any);
            
            // Check if the saved account is still available
            const accounts = await web3Instance.eth.getAccounts();
            
            if (accounts.includes(savedAccount)) {
              setWeb3(web3Instance);
              setAccount(savedAccount);
              setIsConnected(true);
              console.log('Auto-connected to:', savedAccount);
            } else {
              // Clear stale connection data
              localStorage.removeItem('walletConnected');
              localStorage.removeItem('walletAccount');
            }
          }
        } catch (error) {
          console.error('Auto-connect failed:', error);
          // Clear stale connection data on error
          localStorage.removeItem('walletConnected');
          localStorage.removeItem('walletAccount');
        }
      }
    };

    autoConnect();
  }, [isConnected]);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        console.log('Account changed:', accounts);
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
          localStorage.setItem('walletAccount', accounts[0]);
        }
      };

      const handleChainChanged = () => {
        console.log('Chain changed, reloading...');
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [account]);

  const value = {
    web3,
    account,
    isConnected,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
