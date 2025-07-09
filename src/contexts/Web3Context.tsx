
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
  
  // Use ref to track if a connection is already in progress
  const isConnecting = useRef(false);

  const connectWallet = async () => {
    // Prevent multiple concurrent connection attempts
    if (isConnecting.current || isLoading) {
      console.log('Connection already in progress, ignoring request');
      return;
    }

    try {
      isConnecting.current = true;
      setIsLoading(true);
      setError(null);

      const provider = await detectEthereumProvider();
      
      if (!provider) {
        throw new Error('MetaMask not detected. Please install MetaMask.');
      }

      const web3Instance = new Web3(provider as any);
      
      // Use a small delay to ensure MetaMask is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
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
      setError(err.message);
    } finally {
      setIsLoading(false);
      isConnecting.current = false;
    }
  };

  const disconnectWallet = () => {
    setWeb3(null);
    setAccount(null);
    setIsConnected(false);
    setError(null);
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAccount');
    isConnecting.current = false;
  };

  // Auto-connect on page load if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      const wasConnected = localStorage.getItem('walletConnected');
      const savedAccount = localStorage.getItem('walletAccount');
      
      if (wasConnected && savedAccount && !isConnected && !isConnecting.current) {
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
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
          localStorage.setItem('walletAccount', accounts[0]);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
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
